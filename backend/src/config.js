const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "..", ".env"), override: false });

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function numberValue(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }

  return parsed;
}

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const host = process.env.POSTGRES_HOST || "postgres";
  const port = process.env.POSTGRES_PORT || "5432";
  const user = required("POSTGRES_USER");
  const password = required("POSTGRES_PASSWORD");
  const database = required("POSTGRES_DB");

  return `postgres://${user}:${password}@${host}:${port}/${database}?sslmode=disable`;
}

module.exports = Object.freeze({
  nodeEnv: process.env.NODE_ENV || "development",
  port: numberValue("PORT", 4000),
  jwtSecret: required("JWT_SECRET"),
  databaseUrl: getDatabaseUrl(),
  corsOrigin: process.env.CORS_ORIGIN || "*",
  dbConnectRetries: numberValue("DB_CONNECT_RETRIES", 30),
  dbRetryDelayMs: numberValue("DB_RETRY_DELAY_MS", 2000),
});
