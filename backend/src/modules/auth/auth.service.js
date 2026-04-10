const bcrypt = require("bcryptjs");
const { validationError, unauthorized } = require("../../common/errors/app-error");
const { buildAccessToken } = require("../../common/auth/jwt");
const { validateLoginPayload, validateRegisterPayload } = require("./auth.validators");

function createAuthService({ authRepository, jwtSecret }) {
  async function register(body) {
    const input = validateRegisterPayload(body);
    const passwordHash = await bcrypt.hash(input.password, 12);

    try {
      const user = await authRepository.createUser({
        name: input.name,
        email: input.email,
        passwordHash,
      });

      return {
        user,
        token: buildAccessToken(user, jwtSecret),
      };
    } catch (error) {
      if (error.code === "23505") {
        throw validationError({ email: "already in use" });
      }

      throw error;
    }
  }

  async function login(body) {
    const input = validateLoginPayload(body);
    const userRow = await authRepository.findUserWithPasswordByEmail(input.email);

    if (!userRow) {
      throw unauthorized();
    }

    const matches = await bcrypt.compare(input.password, userRow.password_hash);
    if (!matches) {
      throw unauthorized();
    }

    const user = authRepository.mapUser(userRow);
    return {
      user,
      token: buildAccessToken(user, jwtSecret),
    };
  }

  return {
    register,
    login,
  };
}

module.exports = {
  createAuthService,
};
