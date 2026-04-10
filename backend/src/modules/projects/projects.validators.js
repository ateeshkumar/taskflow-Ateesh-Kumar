const { validationError } = require("../../common/errors/app-error");
const {
  TASK_PRIORITIES,
  TASK_STATUSES,
  hasOwn,
  isNonEmptyString,
  isUuid,
  normalizeDate,
  normalizeNullableString,
} = require("../../common/validation");

function validateProjectPayload(body = {}, { partial = false } = {}) {
  const fields = {};
  const payload = {};

  if (!partial || hasOwn(body, "name")) {
    if (!isNonEmptyString(body.name)) {
      fields.name = "is required";
    } else {
      payload.name = body.name.trim();
    }
  }

  if (hasOwn(body, "description")) {
    try {
      payload.description = normalizeNullableString(body.description, "description");
    } catch (error) {
      if (error.fields) {
        Object.assign(fields, error.fields);
      } else {
        throw error;
      }
    }
  } else if (!partial) {
    payload.description = null;
  }

  if (Object.keys(fields).length > 0) {
    throw validationError(fields);
  }

  if (partial && Object.keys(payload).length === 0) {
    throw validationError({ body: "nothing to update" });
  }

  return payload;
}

function validateTaskPayload(body = {}, { partial = false } = {}) {
  const fields = {};
  const payload = {};

  if (!partial || hasOwn(body, "title")) {
    if (!isNonEmptyString(body.title)) {
      fields.title = "is required";
    } else {
      payload.title = body.title.trim();
    }
  }

  if (hasOwn(body, "description")) {
    if (body.description !== null && typeof body.description !== "string") {
      fields.description = "must be a string or null";
    } else {
      payload.description = body.description;
    }
  } else if (!partial) {
    payload.description = null;
  }

  if (!partial || hasOwn(body, "status")) {
    const status = body.status || "todo";
    if (!TASK_STATUSES.includes(status)) {
      fields.status = `must be one of ${TASK_STATUSES.join(", ")}`;
    } else {
      payload.status = status;
    }
  }

  if (!partial || hasOwn(body, "priority")) {
    const priority = body.priority || "medium";
    if (!TASK_PRIORITIES.includes(priority)) {
      fields.priority = `must be one of ${TASK_PRIORITIES.join(", ")}`;
    } else {
      payload.priority = priority;
    }
  }

  if (hasOwn(body, "assignee_id")) {
    if (body.assignee_id !== null && !isUuid(body.assignee_id)) {
      fields.assignee_id = "must be a valid UUID or null";
    } else {
      payload.assignee_id = body.assignee_id;
    }
  } else if (!partial) {
    payload.assignee_id = null;
  }

  if (hasOwn(body, "due_date")) {
    if (body.due_date === null) {
      payload.due_date = null;
    } else {
      const dueDate = normalizeDate(body.due_date);
      if (!dueDate) {
        fields.due_date = "must be a valid date (YYYY-MM-DD) or null";
      } else {
        payload.due_date = dueDate;
      }
    }
  } else if (!partial) {
    payload.due_date = null;
  }

  if (Object.keys(fields).length > 0) {
    throw validationError(fields);
  }

  if (partial && Object.keys(payload).length === 0) {
    throw validationError({ body: "nothing to update" });
  }

  return payload;
}

function validateTaskFilters(query = {}) {
  const fields = {};
  const filters = {
    status: typeof query.status === "string" ? query.status : "",
    assignee: typeof query.assignee === "string" ? query.assignee : "",
  };

  if (filters.status && !TASK_STATUSES.includes(filters.status)) {
    fields.status = `must be one of ${TASK_STATUSES.join(", ")}`;
  }

  if (filters.assignee && filters.assignee !== "unassigned" && !isUuid(filters.assignee)) {
    fields.assignee = "must be a valid UUID or 'unassigned'";
  }

  if (Object.keys(fields).length > 0) {
    throw validationError(fields);
  }

  return filters;
}

module.exports = {
  validateProjectPayload,
  validateTaskPayload,
  validateTaskFilters,
};
