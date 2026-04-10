function createUsersRepository({ pool }) {
  async function listUsers() {
    const result = await pool.query(
      `
        SELECT id, name, email, created_at
        FROM users
        ORDER BY created_at ASC
      `,
    );

    return result.rows;
  }

  async function existsById(userId) {
    const result = await pool.query("SELECT 1 FROM users WHERE id = $1", [userId]);
    return Boolean(result.rows[0]);
  }

  return {
    listUsers,
    existsById,
  };
}

module.exports = {
  createUsersRepository,
};
