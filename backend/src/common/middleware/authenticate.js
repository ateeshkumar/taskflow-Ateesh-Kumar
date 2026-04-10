const jwt = require("jsonwebtoken");
const { unauthorized } = require("../errors/app-error");

function authenticate(jwtSecret) {
  return function authenticationMiddleware(req, res, next) {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next(unauthorized());
      return;
    }

    const token = authHeader.slice("Bearer ".length);

    try {
      const payload = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] });
      req.user = {
        id: payload.user_id,
        email: payload.email,
      };
      next();
    } catch {
      next(unauthorized());
    }
  };
}

module.exports = {
  authenticate,
};
