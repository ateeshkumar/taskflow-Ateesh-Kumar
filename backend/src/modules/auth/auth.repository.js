function mapUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    created_at: row.created_at,
  };
}

function createAuthRepository({ pool }) {
  async function createUser({ name, email, passwordHash }) {
    const result = await pool.query(
      `
        INSERT INTO users (name, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, name, email, created_at
      `,
      [name, email, passwordHash],
    );

    return mapUser(result.rows[0]);
  }

  async function findUserWithPasswordByEmail(email) {
    const result = await pool.query(
      `
        SELECT id, name, email, password_hash, created_at
        FROM users
        WHERE email = $1
      `,
      [email],
    );

    return result.rows[0] || null;
  }

  return {
    createUser,
    findUserWithPasswordByEmail,
    mapUser,
  };
}

module.exports = {
  createAuthRepository,
};
