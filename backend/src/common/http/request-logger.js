const pinoHttp = require("pino-http");

function createRequestLogger(logger) {
  return pinoHttp({
    logger,
    serializers: {
      req(request) {
        return {
          method: request.method,
          url: request.url,
        };
      },
      res(response) {
        return {
          statusCode: response.statusCode,
        };
      },
    },
  });
}

module.exports = {
  createRequestLogger,
};
