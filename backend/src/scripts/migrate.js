const config = require("../config");
const logger = require("../logger");
const { createPool, waitForDatabase } = require("../lib/db");
const { migrateDown, migrateUp } = require("../lib/migrations");

async function main() {
  const direction = process.argv[2] || "up";
  const steps = Number(process.argv[3] || 1);
  const pool = createPool(config.databaseUrl);

  try {
    await waitForDatabase(pool, logger, {
      retries: config.dbConnectRetries,
      delayMs: config.dbRetryDelayMs,
    });

    if (direction === "up") {
      await migrateUp(pool, logger);
      return;
    }

    if (direction === "down") {
      await migrateDown(pool, logger, steps);
      return;
    }

    throw new Error("Usage: npm run migrate OR npm run migrate:down -- <steps>");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  logger.error({ err: error }, "migration command failed");
  process.exit(1);
});
