const express = require("express");
const cors = require("cors");
const { authenticate } = require("./common/middleware/authenticate");
const { createErrorMiddleware } = require("./common/http/error-middleware");
const { createRequestLogger } = require("./common/http/request-logger");
const { asyncHandler } = require("./common/http/async-handler");
const { createAuthRepository } = require("./modules/auth/auth.repository");
const { createAuthService } = require("./modules/auth/auth.service");
const { createAuthRouter } = require("./modules/auth/auth.routes");
const { createUsersRepository } = require("./modules/users/users.repository");
const { createUsersService } = require("./modules/users/users.service");
const { createUsersRouter } = require("./modules/users/users.routes");
const { createProjectsRepository } = require("./modules/projects/projects.repository");
const { createProjectsService } = require("./modules/projects/projects.service");
const { createProjectsRouter } = require("./modules/projects/projects.routes");

function buildCorsOptions(corsOrigin) {
  if (corsOrigin === "*") {
    return { origin: true };
  }

  return {
    origin: corsOrigin
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  };
}

function registerHealthRoute(app, pool) {
  app.get(
    "/health",
    asyncHandler(async (req, res) => {
      await pool.query("SELECT 1");
      res.json({ status: "ok" });
    }),
  );
}

function createApp({ pool, logger, config }) {
  const authRepository = createAuthRepository({ pool });
  const usersRepository = createUsersRepository({ pool });
  const projectsRepository = createProjectsRepository({ pool });

  const authService = createAuthService({
    authRepository,
    jwtSecret: config.jwtSecret,
  });
  const usersService = createUsersService({ usersRepository });
  const projectsService = createProjectsService({
    projectsRepository,
    usersRepository,
  });

  const app = express();
  const protectedRouter = express.Router();

  app.disable("x-powered-by");
  app.use(createRequestLogger(logger));
  app.use(cors(buildCorsOptions(config.corsOrigin)));
  app.use(express.json({ limit: "1mb" }));

  registerHealthRoute(app, pool);

  app.use("/auth", createAuthRouter({ authService }));

  protectedRouter.use(authenticate(config.jwtSecret));
  protectedRouter.use("/users", createUsersRouter({ usersService }));
  protectedRouter.use(createProjectsRouter({ projectsService }));

  app.use(protectedRouter);

  app.use((req, res) => {
    res.status(404).json({ error: "not found" });
  });
  app.use(createErrorMiddleware(logger));

  return app;
}

module.exports = {
  createApp,
};
