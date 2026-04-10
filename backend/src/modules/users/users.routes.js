const express = require("express");
const { asyncHandler } = require("../../common/http/async-handler");
const { createUsersController } = require("./users.controller");

function createUsersRouter({ usersService }) {
  const router = express.Router();
  const controller = createUsersController({ usersService });

  router.get("/", asyncHandler(controller.listUsers));

  return router;
}

module.exports = {
  createUsersRouter,
};
