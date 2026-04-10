const { validationError } = require("../../common/errors/app-error");
const { isEmail, isNonEmptyString } = require("../../common/validation");

function validateRegisterPayload(body = {}) {
  const fields = {};

  if (!isNonEmptyString(body.name)) {
    fields.name = "is required";
  }

  if (!isNonEmptyString(body.email)) {
    fields.email = "is required";
  } else if (!isEmail(body.email)) {
    fields.email = "must be a valid email";
  }

  if (!isNonEmptyString(body.password)) {
    fields.password = "is required";
  } else if (body.password.trim().length < 8) {
    fields.password = "must be at least 8 characters";
  }

  if (Object.keys(fields).length > 0) {
    throw validationError(fields);
  }

  return {
    name: body.name.trim(),
    email: body.email.trim().toLowerCase(),
    password: body.password,
  };
}

function validateLoginPayload(body = {}) {
  const fields = {};

  if (!isNonEmptyString(body.email)) {
    fields.email = "is required";
  }

  if (!isNonEmptyString(body.password)) {
    fields.password = "is required";
  }

  if (Object.keys(fields).length > 0) {
    throw validationError(fields);
  }

  return {
    email: body.email.trim().toLowerCase(),
    password: body.password,
  };
}

module.exports = {
  validateRegisterPayload,
  validateLoginPayload,
};
