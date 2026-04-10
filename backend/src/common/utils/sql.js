function buildUpdateStatement(payload, columnMap, { includeUpdatedAt = false } = {}) {
  const assignments = [];
  const values = [];

  for (const [key, column] of Object.entries(columnMap)) {
    if (payload[key] === undefined) {
      continue;
    }

    values.push(payload[key]);
    assignments.push(`${column} = $${values.length}`);
  }

  if (includeUpdatedAt) {
    assignments.push("updated_at = NOW()");
  }

  return {
    assignments,
    values,
  };
}

module.exports = {
  buildUpdateStatement,
};
