const logger = require('../utils/logger');

function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;

    if (status >= 500) {
      logger.error(`${req.method} ${req.originalUrl} -> ${status} (${duration}ms)`);
    } else if (status >= 400) {
      logger.warn(`${req.method} ${req.originalUrl} -> ${status} (${duration}ms)`);
    }
  });

  next();
}

module.exports = requestLogger;
