import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { db } from "../../core/db.js";
import { redis } from "../../core/redis.js";
import { loadEnv } from "../../config/env.js";
import { authenticateAD } from "../../security/ldap.js";
import type { RoleCode } from "@procura/shared";

const env = loadEnv();

export type AuthSession = {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    displayName: string;
    role: RoleCode;
    email: string;
  };
};

export class AuthService {
  /**
   * Authenticate a user locally via PostgreSQL or LDAP and issue tokens
   */
  async login(
    email: string,
    password: string,
    ctx?: { ip: string; log: any },
  ): Promise<AuthSession | null> {
    const lockoutKey = `lockout:${email}`;
    const isLocked = await redis.get(lockoutKey);
    if (isLocked) {
      const ttl = await redis.ttl(lockoutKey);
      const minutes = Math.max(1, Math.ceil(ttl / 60));
      if (ctx?.log) {
        ctx.log.error(
          { email, ip: ctx.ip, ttlSeconds: ttl },
          "Brute-force lockout active for user",
        );
      }
      const error = new Error(
        `Compte verrouillé. Veuillez réessayer dans ${minutes} minute(s).`,
      );
      (error as any).statusCode = 423;
      error.name = "LOCKED";
      throw error;
    }

    let session: AuthSession | null = null;

    // 1. LDAP Active Directory authentication logic for corporate accounts
    if (email.endsWith("@procura.dz") || email.endsWith("@procura.local")) {
      const adUser = await authenticateAD(email, password);
      if (adUser) {
        // Dynamic synchronization with local PostgreSQL database
        const dbUserRes = await db.query(
          `SELECT user_id, display_name, email, role_code, is_active FROM users WHERE email = $1`,
          [email],
        );

        let user;
        if (dbUserRes.rows.length === 0) {
          // Resolve department_id
          let departmentId: string | null = null;
          const deptRes = await db.query(
            `SELECT department_id FROM departments WHERE name = $1`,
            [adUser.department],
          );
          if (deptRes.rows.length > 0) {
            departmentId = deptRes.rows[0].department_id;
          } else {
            const newDept = await db.query(
              `INSERT INTO departments (name, code)
               VALUES ($1, $2)
               RETURNING department_id`,
              [
                adUser.department,
                adUser.department.substring(0, 3).toUpperCase(),
              ],
            );
            departmentId = newDept.rows[0].department_id;
          }

          const insertRes = await db.query(
            `INSERT INTO users (display_name, email, role_code, department_id, is_active)
             VALUES ($1, $2, $3, $4, true)
             RETURNING user_id, display_name, email, role_code, is_active`,
            [adUser.displayName, email, adUser.role, departmentId],
          );
          user = insertRes.rows[0];
        } else {
          user = dbUserRes.rows[0];
        }

        if (user.is_active) {
          session = await this.issueTokens(user);
        }
      }
    }

    // 2. Fallback to Local SQL User authenticate check (if LDAP didn't authenticate)
    if (!session) {
      const res = await db.query(
        `SELECT user_id, display_name, email, role_code, is_active, password_hash 
         FROM users 
         WHERE email = $1`,
        [email],
      );

      if (res.rows.length > 0) {
        const user = res.rows[0];
        if (user.is_active && user.password_hash) {
          // Verify Password using PBKDF2
          const isMatch = this.verifyPassword(password, user.password_hash);
          if (isMatch) {
            session = await this.issueTokens(user);
          }
        }
      }
    }

    if (session) {
      // Clear attempts on success
      await redis.del(`login_attempts:${email}`);
      return session;
    }

    // Increment failed attempts on failure
    const attemptsKey = `login_attempts:${email}`;
    const attempts = await redis.incr(attemptsKey);
    if (attempts === 1) {
      await redis.expire(attemptsKey, 900); // 15 mins sliding window
    }

    if (attempts >= 5) {
      await redis.set(lockoutKey, "locked", "EX", 900); // 15 mins lockout
      await redis.del(attemptsKey);

      if (ctx?.log) {
        ctx.log.error(
          { email, ip: ctx.ip },
          "Brute-force lockout triggered for user",
        );
      }

      const error = new Error(
        "Compte verrouillé pour 15 minutes suite à 5 tentatives échouées.",
      );
      (error as any).statusCode = 423;
      error.name = "LOCKED";
      throw error;
    }

    if (ctx?.log) {
      ctx.log.warn(
        { email, ip: ctx.ip, attempt: attempts },
        "Failed login attempt",
      );
    }

    return null;
  }

  /**
   * Helper to issue access and refresh tokens, caching the session in Redis.
   */
  private async issueTokens(user: any): Promise<AuthSession> {
    // Generate JWT Access Token
    const payload = {
      sub: user.user_id || user.id,
      email: user.email,
      role: user.role_code || user.role,
      name: user.display_name || user.displayName,
    };

    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: "1h" });

    // Generate Refresh Token
    const refreshToken = crypto.randomUUID();

    // Store Session in Redis (Expires in 7 days)
    const sessionKey = `session:${payload.sub}:${refreshToken}`;
    await redis.set(
      sessionKey,
      JSON.stringify({
        userId: payload.sub,
        role: payload.role,
        displayName: payload.name,
        createdAt: new Date().toISOString(),
      }),
      "EX",
      7 * 24 * 60 * 60,
    );

    return {
      token,
      refreshToken,
      user: {
        id: payload.sub,
        displayName: payload.name,
        role: payload.role as RoleCode,
        email: user.email,
      },
    };
  }

  /**
   * Invalidate a session (logout)
   */
  async logout(userId: string, refreshToken: string): Promise<void> {
    const sessionKey = `session:${userId}:${refreshToken}`;
    await redis.del(sessionKey);
  }

  /**
   * Helper to verify hashed passwords formatted as:
   * pbkdf2:iterations:salt:hash
   */
  private verifyPassword(password: string, storedHash: string): boolean {
    const parts = storedHash.split(":");
    if (parts.length !== 4 || parts[0] !== "pbkdf2") {
      return false;
    }

    const iterations = parseInt(parts[1]!, 10);
    const salt = parts[2]!;
    const hash = parts[3]!;

    const computed = crypto
      .pbkdf2Sync(password, salt, iterations, 64, "sha512")
      .toString("hex");

    return computed === hash;
  }
}
