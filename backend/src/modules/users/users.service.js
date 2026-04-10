function createUsersService({ usersRepository }) {
  async function listUsers() {
    return usersRepository.listUsers();
  }

  return {
    listUsers,
  };
}

module.exports = {
  createUsersService,
};
