const { buildUpdateStatement } = require("../../common/utils/sql");

const TASK_SELECT_FIELDS = `
  t.id,
  t.title,
  t.description,
  t.status,
  t.priority,
  t.project_id,
  t.assignee_id,
  t.creator_id,
  t.due_date,
  t.created_at,
  t.updated_at,
  assignee.name AS assignee_name,
  creator.name AS creator_name
`;

const PROJECT_UPDATE_COLUMNS = {
  name: "name",
  description: "description",
};

const TASK_UPDATE_COLUMNS = {
  title: "title",
  description: "description",
  status: "status",
  priority: "priority",
  assignee_id: "assignee_id",
  due_date: "due_date",
};

function stripTaskOwner(task) {
  if (!task) {
    return null;
  }

  const { owner_id, ...publicTask } = task;
  return publicTask;
}

function createProjectsRepository({ pool }) {
  async function listAccessibleProjects(userId) {
    const result = await pool.query(
      `
        SELECT DISTINCT p.id, p.name, p.description, p.owner_id, p.created_at
        FROM projects p
        LEFT JOIN tasks t ON t.project_id = p.id
        WHERE p.owner_id = $1
           OR t.assignee_id = $1
           OR t.creator_id = $1
        ORDER BY p.created_at DESC
      `,
      [userId],
    );

    return result.rows;
  }

  async function findProjectById(projectId) {
    const result = await pool.query(
      `
        SELECT id, name, description, owner_id, created_at
        FROM projects
        WHERE id = $1
      `,
      [projectId],
    );

    return result.rows[0] || null;
  }

  async function userHasProjectAccess(projectId, userId) {
    const result = await pool.query(
      `
        SELECT EXISTS (
          SELECT 1
          FROM tasks
          WHERE project_id = $1
            AND (assignee_id = $2 OR creator_id = $2)
        ) AS allowed
      `,
      [projectId, userId],
    );

    return result.rows[0].allowed;
  }

  async function createProject({ name, description, ownerId }) {
    const result = await pool.query(
      `
        INSERT INTO projects (name, description, owner_id)
        VALUES ($1, $2, $3)
        RETURNING id, name, description, owner_id, created_at
      `,
      [name, description, ownerId],
    );

    return result.rows[0];
  }

  async function updateProject(projectId, updates) {
    const { assignments, values } = buildUpdateStatement(updates, PROJECT_UPDATE_COLUMNS);

    values.push(projectId);
    const result = await pool.query(
      `
        UPDATE projects
        SET ${assignments.join(", ")}
        WHERE id = $${values.length}
        RETURNING id, name, description, owner_id, created_at
      `,
      values,
    );

    return result.rows[0] || null;
  }

  async function deleteProject(projectId) {
    await pool.query("DELETE FROM projects WHERE id = $1", [projectId]);
  }

  async function listTasks(projectId, filters = {}) {
    const clauses = ["t.project_id = $1"];
    const values = [projectId];

    if (filters.status) {
      values.push(filters.status);
      clauses.push(`t.status = $${values.length}`);
    }

    if (filters.assignee === "unassigned") {
      clauses.push("t.assignee_id IS NULL");
    } else if (filters.assignee) {
      values.push(filters.assignee);
      clauses.push(`t.assignee_id = $${values.length}`);
    }

    const result = await pool.query(
      `
        SELECT ${TASK_SELECT_FIELDS}
        FROM tasks t
        LEFT JOIN users assignee ON assignee.id = t.assignee_id
        JOIN users creator ON creator.id = t.creator_id
        WHERE ${clauses.join(" AND ")}
        ORDER BY t.created_at ASC
      `,
      values,
    );

    return result.rows;
  }

  async function findTaskById(taskId) {
    const result = await pool.query(
      `
        SELECT
          ${TASK_SELECT_FIELDS},
          p.owner_id
        FROM tasks t
        LEFT JOIN users assignee ON assignee.id = t.assignee_id
        JOIN users creator ON creator.id = t.creator_id
        JOIN projects p ON p.id = t.project_id
        WHERE t.id = $1
      `,
      [taskId],
    );

    return result.rows[0] || null;
  }

  async function createTask(task) {
    const result = await pool.query(
      `
        INSERT INTO tasks (
          title,
          description,
          status,
          priority,
          project_id,
          assignee_id,
          creator_id,
          due_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `,
      [
        task.title,
        task.description,
        task.status,
        task.priority,
        task.projectId,
        task.assignee_id,
        task.creatorId,
        task.due_date,
      ],
    );

    return result.rows[0].id;
  }

  async function updateTask(taskId, updates) {
    const { assignments, values } = buildUpdateStatement(updates, TASK_UPDATE_COLUMNS, {
      includeUpdatedAt: true,
    });

    values.push(taskId);
    await pool.query(
      `
        UPDATE tasks
        SET ${assignments.join(", ")}
        WHERE id = $${values.length}
      `,
      values,
    );
  }

  async function deleteTask(taskId) {
    await pool.query("DELETE FROM tasks WHERE id = $1", [taskId]);
  }

  async function getProjectStats(projectId) {
    const [statusResult, assigneeResult] = await Promise.all([
      pool.query(
        `
          SELECT status, COUNT(*)::int AS count
          FROM tasks
          WHERE project_id = $1
          GROUP BY status
          ORDER BY status
        `,
        [projectId],
      ),
      pool.query(
        `
          SELECT COALESCE(u.name, 'Unassigned') AS assignee, COUNT(*)::int AS count
          FROM tasks t
          LEFT JOIN users u ON u.id = t.assignee_id
          WHERE t.project_id = $1
          GROUP BY COALESCE(u.name, 'Unassigned')
          ORDER BY assignee
        `,
        [projectId],
      ),
    ]);

    return {
      by_status: statusResult.rows,
      by_assignee: assigneeResult.rows,
    };
  }

  return {
    listAccessibleProjects,
    findProjectById,
    userHasProjectAccess,
    createProject,
    updateProject,
    deleteProject,
    listTasks,
    findTaskById,
    createTask,
    updateTask,
    deleteTask,
    getProjectStats,
    stripTaskOwner,
  };
}

module.exports = {
  createProjectsRepository,
};
