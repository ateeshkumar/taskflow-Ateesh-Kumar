const { Pool } = require("pg");

function createPool(databaseUrl) {
  return new Pool({
    connectionString: databaseUrl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

async function waitForDatabase(pool, logger, { retries = 30, delayMs = 2000 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await pool.query("SELECT 1");
      logger.info({ attempt }, "database connection established");
      return;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }

      logger.warn(
        { attempt, retries, error: error.message },
        "database not ready yet, retrying",
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

module.exports = {
  createPool,
  waitForDatabase,
};
