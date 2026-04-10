const express = require("express");
const { asyncHandler } = require("../../common/http/async-handler");
const { createProjectsController } = require("./projects.controller");

function createProjectsRouter({ projectsService }) {
  const router = express.Router();
  const controller = createProjectsController({ projectsService });

  router.get("/projects", asyncHandler(controller.listProjects));
  router.post("/projects", asyncHandler(controller.createProject));
  router.get("/projects/:id", asyncHandler(controller.getProjectDetail));
  router.patch("/projects/:id", asyncHandler(controller.updateProject));
  router.delete("/projects/:id", asyncHandler(controller.deleteProject));
  router.get("/projects/:id/tasks", asyncHandler(controller.listProjectTasks));
  router.post("/projects/:id/tasks", asyncHandler(controller.createTask));
  router.get("/projects/:id/stats", asyncHandler(controller.getProjectStats));
  router.patch("/tasks/:id", asyncHandler(controller.updateTask));
  router.delete("/tasks/:id", asyncHandler(controller.deleteTask));

  return router;
}

module.exports = {
  createProjectsRouter,
};
