const { AppError } = require("../errors/app-error");

function createErrorMiddleware(logger) {
  return function errorMiddleware(error, req, res, next) {
    if (res.headersSent) {
      next(error);
      return;
    }

    if (error?.type === "entity.parse.failed") {
      res.status(400).json({
        error: "validation failed",
        fields: { body: "invalid JSON" },
      });
      return;
    }

    if (error instanceof AppError) {
      const payload = { error: error.message };
      if (error.fields) {
        payload.fields = error.fields;
      }

      res.status(error.statusCode).json(payload);
      return;
    }

    const requestLogger = req.log || logger;
    requestLogger.error(
      { err: error, method: req.method, path: req.path },
      "unhandled request error",
    );
    res.status(500).json({ error: "internal error" });
  };
}

module.exports = {
  createErrorMiddleware,
};
