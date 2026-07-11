import { Redis } from "ioredis";
import { loadEnv } from "../config/env.js";
import { logger } from "./logger.js";

const env = loadEnv();

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true, // Prevent blocking app boot if Redis is starting up
});

redis.on("error", (err: any) => {
  logger.error(err, "Redis connection error");
});
