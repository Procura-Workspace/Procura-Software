import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { db } from "../../core/db.js";
import { redis } from "../../core/redis.js";
import { loadEnv } from "../../config/env.js";
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
   * Authenticate a user locally via PostgreSQL and issue tokens
   */
  async login(email: string, password: string): Promise<AuthSession | null> {
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

    // Generate JWT Access Token
    const payload = {
      sub: user.user_id,
      email: user.email,
      role: user.role_code,
      name: user.display_name,
    };

    const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: "1h" });

    // Generate Refresh Token
    const refreshToken = crypto.randomUUID();

    // Store Session in Redis (Expires in 7 days)
    const sessionKey = `session:${user.user_id}:${refreshToken}`;
    await redis.set(
      sessionKey,
      JSON.stringify({
        userId: user.user_id,
        role: user.role_code,
        displayName: user.display_name,
        createdAt: new Date().toISOString(),
      }),
      "EX",
      7 * 24 * 60 * 60,
    );

    return {
      token,
      refreshToken,
      user: {
        id: user.user_id,
        displayName: user.display_name,
        role: user.role_code as RoleCode,
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
