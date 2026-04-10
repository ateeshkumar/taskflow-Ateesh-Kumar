const { validationError } = require("../errors/app-error");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const TASK_STATUSES = ["todo", "in_progress", "done"];
const TASK_PRIORITIES = ["low", "medium", "high"];

function hasOwn(source, key) {
  return Object.prototype.hasOwnProperty.call(source, key);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isEmail(value) {
  return typeof value === "string" && EMAIL_RE.test(value.trim());
}

function isUuid(value) {
  return typeof value === "string" && UUID_RE.test(value);
}

function assertUuid(value, fieldName) {
  if (!isUuid(value)) {
    throw validationError({ [fieldName]: "must be a valid UUID" });
  }

  return value;
}

function normalizeNullableString(value, fieldName) {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw validationError({ [fieldName]: "must be a string or null" });
  }

  return value;
}

function normalizeDate(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (!DATE_RE.test(trimmed)) {
    return null;
  }

  const parsed = new Date(`${trimmed}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return trimmed;
}

module.exports = {
  TASK_STATUSES,
  TASK_PRIORITIES,
  hasOwn,
  isNonEmptyString,
  isEmail,
  isUuid,
  assertUuid,
  normalizeNullableString,
  normalizeDate,
};
