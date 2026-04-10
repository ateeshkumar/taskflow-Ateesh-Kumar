class AppError extends Error {
  constructor({ statusCode, message, fields }) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.fields = fields;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

function validationError(fields) {
  return new AppError({
    statusCode: 400,
    message: "validation failed",
    fields,
  });
}

function unauthorized(message = "unauthorized") {
  return new AppError({ statusCode: 401, message });
}

function forbidden(message = "forbidden") {
  return new AppError({ statusCode: 403, message });
}

function notFound(message = "not found") {
  return new AppError({ statusCode: 404, message });
}

module.exports = {
  AppError,
  validationError,
  unauthorized,
  forbidden,
  notFound,
};
