const fs = require("node:fs/promises");
const path = require("node:path");

const MIGRATIONS_DIR = path.resolve(__dirname, "..", "..", "db", "migrations");

async function ensureMigrationsTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedVersions(pool) {
  const result = await pool.query("SELECT version FROM schema_migrations");
  return new Set(result.rows.map((row) => row.version));
}

async function listMigrationFiles(suffix) {
  const entries = await fs.readdir(MIGRATIONS_DIR);
  return entries.filter((entry) => entry.endsWith(suffix)).sort();
}

async function runMigration(pool, logger, version, fileName, sql, markApplied) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    if (markApplied) {
      await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [version]);
    } else {
      await client.query("DELETE FROM schema_migrations WHERE version = $1", [version]);
    }
    await client.query("COMMIT");
    logger.info({ version, fileName }, markApplied ? "migration applied" : "migration reverted");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function migrateUp(pool, logger) {
  await ensureMigrationsTable(pool);
  const applied = await getAppliedVersions(pool);
  const files = await listMigrationFiles(".up.sql");

  for (const fileName of files) {
    const version = fileName.replace(/\.up\.sql$/, "");
    if (applied.has(version)) {
      continue;
    }

    const sql = await fs.readFile(path.join(MIGRATIONS_DIR, fileName), "utf8");
    await runMigration(pool, logger, version, fileName, sql, true);
  }
}

async function migrateDown(pool, logger, steps = 1) {
  await ensureMigrationsTable(pool);
  const result = await pool.query(
    "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT $1",
    [steps],
  );

  for (const row of result.rows) {
    const fileName = `${row.version}.down.sql`;
    const sql = await fs.readFile(path.join(MIGRATIONS_DIR, fileName), "utf8");
    await runMigration(pool, logger, row.version, fileName, sql, false);
  }
}

module.exports = {
  migrateUp,
  migrateDown,
};
