const jwt = require("jsonwebtoken");

function buildAccessToken(user, jwtSecret) {
  return jwt.sign(
    {
      user_id: user.id,
      email: user.email,
    },
    jwtSecret,
    {
      algorithm: "HS256",
      expiresIn: "24h",
    },
  );
}

module.exports = {
  buildAccessToken,
};
