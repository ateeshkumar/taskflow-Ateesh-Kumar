const express = require("express");
const { asyncHandler } = require("../../common/http/async-handler");
const { createAuthController } = require("./auth.controller");

function createAuthRouter({ authService }) {
  const router = express.Router();
  const controller = createAuthController({ authService });

  router.post("/register", asyncHandler(controller.register));
  router.post("/login", asyncHandler(controller.login));

  return router;
}

module.exports = {
  createAuthRouter,
};
