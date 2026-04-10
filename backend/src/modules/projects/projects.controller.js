function createProjectsController({ projectsService }) {
  async function listProjects(req, res) {
    const projects = await projectsService.listProjects(req.user.id);
    res.json({ projects });
  }

  async function createProject(req, res) {
    const project = await projectsService.createProject(req.user.id, req.body || {});
    res.status(201).json(project);
  }

  async function getProjectDetail(req, res) {
    const project = await projectsService.getProjectDetail(req.params.id, req.user.id);
    res.json(project);
  }

  async function updateProject(req, res) {
    const project = await projectsService.updateProject(req.params.id, req.user.id, req.body || {});
    res.json(project);
  }

  async function deleteProject(req, res) {
    await projectsService.deleteProject(req.params.id, req.user.id);
    res.status(204).end();
  }

  async function listProjectTasks(req, res) {
    const result = await projectsService.listProjectTasks(req.params.id, req.user.id, req.query);
    res.json(result);
  }

  async function createTask(req, res) {
    const task = await projectsService.createTask(req.params.id, req.user.id, req.body || {});
    res.status(201).json(task);
  }

  async function getProjectStats(req, res) {
    const stats = await projectsService.getProjectStats(req.params.id, req.user.id);
    res.json(stats);
  }

  async function updateTask(req, res) {
    const task = await projectsService.updateTask(req.params.id, req.user.id, req.body || {});
    res.json(task);
  }

  async function deleteTask(req, res) {
    await projectsService.deleteTask(req.params.id, req.user.id);
    res.status(204).end();
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
  createProjectsController,
};
