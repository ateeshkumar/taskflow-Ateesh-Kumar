const http = require("node:http");
const config = require("./config");
const logger = require("./logger");
const { createApp } = require("./app");
const { createPool, waitForDatabase } = require("./lib/db");
const { migrateUp } = require("./lib/migrations");

function createShutdownHandler({ server, pool, logger, timeoutMs = 10000 }) {
  let shuttingDown = false;

  return async function shutdown(signal) {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;
    logger.info({ signal }, "shutdown requested");

    const closeTimeout = setTimeout(() => {
      logger.error({ timeoutMs }, "forcing shutdown after timeout");
      process.exit(1);
    }, timeoutMs);
    closeTimeout.unref();

    server.close(async (serverError) => {
      try {
        await pool.end();
      } finally {
        clearTimeout(closeTimeout);
      }

      if (serverError) {
        logger.error({ err: serverError }, "server shutdown failed");
        process.exit(1);
        return;
      }

      logger.info("shutdown complete");
      process.exit(0);
    });
  };
}

function registerProcessHandlers({ logger, shutdown }) {
  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });

  process.on("unhandledRejection", (error) => {
    logger.error({ err: error }, "unhandled promise rejection");
  });

  process.on("uncaughtException", (error) => {
    logger.error({ err: error }, "uncaught exception");
    void shutdown("uncaughtException");
  });
}

async function createServer() {
  const pool = createPool(config.databaseUrl);

  await waitForDatabase(pool, logger, {
    retries: config.dbConnectRetries,
    delayMs: config.dbRetryDelayMs,
  });
  await migrateUp(pool, logger);

  const app = createApp({ pool, logger, config });
  const server = http.createServer(app);

  return {
    pool,
    server,
  };
}

async function start() {
  const { pool, server } = await createServer();
  const shutdown = createShutdownHandler({ server, pool, logger });

  registerProcessHandlers({ logger, shutdown });

  server.listen(config.port, () => {
    logger.info({ port: config.port }, "taskflow backend listening");
  });
}

start().catch((error) => {
  logger.error({ err: error }, "failed to start backend");
  process.exit(1);
});
