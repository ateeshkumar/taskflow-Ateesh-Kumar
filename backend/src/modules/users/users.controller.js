function createUsersController({ usersService }) {
  async function listUsers(req, res) {
    const users = await usersService.listUsers();
    res.json({ users });
  }

  return {
    listUsers,
  };
}

module.exports = {
  createUsersController,
};
