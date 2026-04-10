const http = require("node:http");
const { randomUUID } = require("node:crypto");
const pino = require("pino");
const { createApp } = require("../../../src/app");
const { createPool } = require("../../../src/lib/db");
const { migrateUp } = require("../../../src/lib/migrations");

const logger = pino({ level: "silent" });

function buildBaseConnectionConfig() {
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    return {
      protocol: url.protocol,
      username: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      hostname: url.hostname,
      port: url.port || "5432",
      search: url.search,
      baseDatabase: url.pathname.slice(1),
    };
  }

  return {
    protocol: "postgres:",
    username: process.env.POSTGRES_USER || "taskflow",
    password: process.env.POSTGRES_PASSWORD || "taskflow",
    hostname: process.env.POSTGRES_HOST || "postgres",
    port: process.env.POSTGRES_PORT || "5432",
    search: "?sslmode=disable",
    baseDatabase: process.env.POSTGRES_DB || "taskflow",
  };
}

function buildDatabaseUrl(databaseName) {
  const config = buildBaseConnectionConfig();
  const auth =
    config.password !== ""
      ? `${encodeURIComponent(config.username)}:${encodeURIComponent(config.password)}`
      : encodeURIComponent(config.username);

  return `${config.protocol}//${auth}@${config.hostname}:${config.port}/${databaseName}${config.search || ""}`;
}

function assertSafeDatabaseName(databaseName) {
  if (!/^[a-z0-9_]+$/i.test(databaseName)) {
    throw new Error(`Unsafe database name: ${databaseName}`);
  }
}

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", (error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}

async function closeServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function createTestHarness() {
  const config = buildBaseConnectionConfig();
  const adminPool = createPool(buildDatabaseUrl(config.baseDatabase));
  const databaseName = `taskflow_test_${randomUUID().replace(/-/g, "_")}`;

  assertSafeDatabaseName(databaseName);
  await adminPool.query(`CREATE DATABASE ${databaseName}`);

  const pool = createPool(buildDatabaseUrl(databaseName));
  await migrateUp(pool, logger);

  const app = createApp({
    pool,
    logger,
    config: {
      jwtSecret: process.env.JWT_SECRET || "test-secret",
      corsOrigin: "*",
    },
  });

  const server = http.createServer(app);
  const baseUrl = await listen(server);

  async function cleanup() {
    await closeServer(server);
    await pool.end();
    await adminPool.query(
      `
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = $1
          AND pid <> pg_backend_pid()
      `,
      [databaseName],
    );
    await adminPool.query(`DROP DATABASE IF EXISTS ${databaseName}`);
    await adminPool.end();
  }

  return {
    adminPool,
    pool,
    baseUrl,
    cleanup,
  };
}

async function apiRequest(baseUrl, path, init = {}) {
  const headers = {
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...(init.headers || {}),
  };

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) : null;

  return {
    status: response.status,
    json,
  };
}

async function loginAsSeedUser(baseUrl) {
  const response = await apiRequest(baseUrl, "/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: "test@example.com",
      password: "password123",
    }),
  });

  if (response.status !== 200) {
    throw new Error(`Seed login failed with status ${response.status}`);
  }

  return response.json.token;
}

module.exports = {
  createTestHarness,
  apiRequest,
  loginAsSeedUser,
};
