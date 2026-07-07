import pg from "pg";
import { loadEnv } from "../config/env.js";

const { Pool } = pg;
const env = loadEnv();

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = {
  async query<T extends pg.QueryResultRow = any>(
    text: string,
    params?: any[],
  ): Promise<pg.QueryResult<T>> {
    return pool.query<T>(text, params);
  },

  async getClient(): Promise<pg.PoolClient> {
    return pool.connect();
  },
};
