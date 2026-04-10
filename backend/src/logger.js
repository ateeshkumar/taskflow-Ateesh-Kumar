const pino = require("pino");

module.exports = pino({
  level: process.env.LOG_LEVEL || "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "headers.authorization",
      "password",
      "*.password",
      "*.password_hash",
    ],
    censor: "[Redacted]",
  },
});
