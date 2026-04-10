const test = require("node:test");
const assert = require("node:assert/strict");
const { createTestHarness, apiRequest, loginAsSeedUser } = require("./helpers/test-harness");

test("POST /auth/register creates a user and stores a hashed password", async (t) => {
  const harness = await createTestHarness();
  t.after(async () => {
    await harness.cleanup();
  });

  const response = await apiRequest(harness.baseUrl, "/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Test Reviewer",
      email: "reviewer@example.com",
      password: "secret123",
    }),
  });

  assert.equal(response.status, 201);
  assert.equal(response.json.user.email, "reviewer@example.com");
  assert.ok(response.json.token);

  const userResult = await harness.pool.query(
    "SELECT password_hash FROM users WHERE email = $1",
    ["reviewer@example.com"],
  );

  assert.equal(userResult.rows.length, 1);
  assert.notEqual(userResult.rows[0].password_hash, "secret123");
  assert.match(userResult.rows[0].password_hash, /^\$2[aby]\$/);
});

test("GET /projects rejects unauthenticated requests with 401", async (t) => {
  const harness = await createTestHarness();
  t.after(async () => {
    await harness.cleanup();
  });

  const response = await apiRequest(harness.baseUrl, "/projects");

  assert.equal(response.status, 401);
  assert.deepEqual(response.json, { error: "unauthorized" });
});

test("task endpoints accept and return due_date as a date-only string", async (t) => {
  const harness = await createTestHarness();
  t.after(async () => {
    await harness.cleanup();
  });

  const token = await loginAsSeedUser(harness.baseUrl);
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const createResponse = await apiRequest(
    harness.baseUrl,
    "/projects/00000000-0000-0000-0000-000000000010/tasks",
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: "Date-only task",
        priority: "high",
        status: "todo",
        due_date: "2026-06-15",
      }),
    },
  );

  assert.equal(createResponse.status, 201);
  assert.equal(createResponse.json.due_date, "2026-06-15");

  const updateResponse = await apiRequest(
    harness.baseUrl,
    `/tasks/${createResponse.json.id}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        due_date: "2026-06-20",
      }),
    },
  );

  assert.equal(updateResponse.status, 200);
  assert.equal(updateResponse.json.due_date, "2026-06-20");

  const listResponse = await apiRequest(
    harness.baseUrl,
    "/projects/00000000-0000-0000-0000-000000000010/tasks?status=todo",
    {
      headers,
    },
  );

  assert.equal(listResponse.status, 200);
  const createdTask = listResponse.json.tasks.find((task) => task.id === createResponse.json.id);
  assert.ok(createdTask);
  assert.equal(createdTask.due_date, "2026-06-20");
});

test("DELETE /tasks/:id is forbidden for a user who did not create the task", async (t) => {
  const harness = await createTestHarness();
  t.after(async () => {
    await harness.cleanup();
  });

  const ownerToken = await loginAsSeedUser(harness.baseUrl);
  const ownerHeaders = {
    Authorization: `Bearer ${ownerToken}`,
  };

  const createTaskResponse = await apiRequest(
    harness.baseUrl,
    "/projects/00000000-0000-0000-0000-000000000010/tasks",
    {
      method: "POST",
      headers: ownerHeaders,
      body: JSON.stringify({
        title: "Protected task",
        priority: "medium",
        status: "todo",
      }),
    },
  );

  assert.equal(createTaskResponse.status, 201);

  const registerResponse = await apiRequest(harness.baseUrl, "/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Unrelated User",
      email: "outsider@example.com",
      password: "secret123",
    }),
  });

  assert.equal(registerResponse.status, 201);

  const outsiderHeaders = {
    Authorization: `Bearer ${registerResponse.json.token}`,
  };

  const deleteResponse = await apiRequest(
    harness.baseUrl,
    `/tasks/${createTaskResponse.json.id}`,
    {
      method: "DELETE",
      headers: outsiderHeaders,
    },
  );

  assert.equal(deleteResponse.status, 403);
  assert.deepEqual(deleteResponse.json, { error: "forbidden" });
});
