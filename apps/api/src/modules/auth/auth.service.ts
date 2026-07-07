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
  async login(email: string, password: string): Promise<AuthSession | null> {
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
          return this.issueTokens(user);
        }
      }
    }

    // 2. Fallback to Local SQL User authenticate check
    const res = await db.query(
      `SELECT user_id, display_name, email, role_code, is_active, password_hash 
       FROM users 
       WHERE email = $1`,
      [email],
    );

    if (res.rows.length === 0) {
      return null;
    }

    const user = res.rows[0];

    if (!user.is_active || !user.password_hash) {
      return null;
    }

    // Verify Password using PBKDF2
    const isMatch = this.verifyPassword(password, user.password_hash);
    if (!isMatch) {
      return null;
    }

    return this.issueTokens(user);
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
