import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

export const logger = pino({
  level: isProd ? "info" : "debug",
  redact: [
    "req.headers.authorization",
    "req.headers.cookie",
    "password",
    "bindPassword",
  ],
  formatters: {
    level: (label: string) => {
      return { level: label.toUpperCase() };
    },
  },
});
