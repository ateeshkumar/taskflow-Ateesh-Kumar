const { forbidden, notFound, validationError } = require("../../common/errors/app-error");
const { assertUuid } = require("../../common/validation");
const {
  validateProjectPayload,
  validateTaskFilters,
  validateTaskPayload,
} = require("./projects.validators");

function createProjectsService({ projectsRepository, usersRepository }) {
  async function requireProject(projectId) {
    assertUuid(projectId, "project_id");

    const project = await projectsRepository.findProjectById(projectId);
    if (!project) {
      throw notFound();
    }

    return project;
  }

  async function requireProjectAccess(projectId, userId) {
    const project = await requireProject(projectId);
    if (project.owner_id === userId) {
      return project;
    }

    const hasAccess = await projectsRepository.userHasProjectAccess(projectId, userId);
    if (!hasAccess) {
      throw forbidden();
    }

    return project;
  }

  async function requireProjectOwner(projectId, userId) {
    const project = await requireProject(projectId);
    if (project.owner_id !== userId) {
      throw forbidden();
    }

    return project;
  }

  async function requireTask(taskId) {
    assertUuid(taskId, "task_id");

    const task = await projectsRepository.findTaskById(taskId);
    if (!task) {
      throw notFound();
    }

    return task;
  }

  async function ensureAssigneeExists(assigneeId) {
    if (!assigneeId) {
      return;
    }

    const exists = await usersRepository.existsById(assigneeId);
    if (!exists) {
      throw validationError({ assignee_id: "must reference an existing user" });
    }
  }

  async function listProjects(userId) {
    return projectsRepository.listAccessibleProjects(userId);
  }

  async function createProject(userId, body) {
    const payload = validateProjectPayload(body);
    return projectsRepository.createProject({
      ...payload,
      ownerId: userId,
    });
  }

  async function getProjectDetail(projectId, userId) {
    const project = await requireProjectAccess(projectId, userId);
    const tasks = await projectsRepository.listTasks(projectId);

    return {
      ...project,
      tasks,
    };
  }

  async function updateProject(projectId, userId, body) {
    await requireProjectOwner(projectId, userId);
    const payload = validateProjectPayload(body, { partial: true });
    return projectsRepository.updateProject(projectId, payload);
  }

  async function deleteProject(projectId, userId) {
    await requireProjectOwner(projectId, userId);
    await projectsRepository.deleteProject(projectId);
  }

  async function listProjectTasks(projectId, userId, query) {
    await requireProjectAccess(projectId, userId);
    const filters = validateTaskFilters(query);
    const tasks = await projectsRepository.listTasks(projectId, filters);

    return { tasks };
  }

  async function createTask(projectId, userId, body) {
    await requireProjectAccess(projectId, userId);
    const payload = validateTaskPayload(body);
    await ensureAssigneeExists(payload.assignee_id);

    const taskId = await projectsRepository.createTask({
      ...payload,
      projectId,
      creatorId: userId,
    });

    const createdTask = await projectsRepository.findTaskById(taskId);
    return projectsRepository.stripTaskOwner(createdTask);
  }

  async function getProjectStats(projectId, userId) {
    await requireProjectAccess(projectId, userId);
    return projectsRepository.getProjectStats(projectId);
  }

  async function updateTask(taskId, userId, body) {
    const task = await requireTask(taskId);
    const canEdit =
      task.owner_id === userId ||
      task.creator_id === userId ||
      task.assignee_id === userId;

    if (!canEdit) {
      throw forbidden();
    }

    const payload = validateTaskPayload(body, { partial: true });
    await ensureAssigneeExists(payload.assignee_id);
    await projectsRepository.updateTask(taskId, payload);

    const updatedTask = await projectsRepository.findTaskById(taskId);
    return projectsRepository.stripTaskOwner(updatedTask);
  }

  async function deleteTask(taskId, userId) {
    const task = await requireTask(taskId);
    const canDelete = task.owner_id === userId || task.creator_id === userId;

    if (!canDelete) {
      throw forbidden();
    }

    await projectsRepository.deleteTask(taskId);
  }

  return {
    listProjects,
    createProject,
    getProjectDetail,
    updateProject,
    deleteProject,
    listProjectTasks,
    createTask,
    getProjectStats,
    updateTask,
    deleteTask,
  };
}

module.exports = {
  createProjectsService,
};
