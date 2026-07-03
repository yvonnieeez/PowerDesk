const logger = require('../utils/logger');
const { wrapError } = require('../utils/response');

function errorHandler(err, req, res, next) {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json(wrapError('INVALID_JSON', 'Malformed JSON in request body'));
  }

  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.expose ? err.message : 'Internal Server Error';

  if (status >= 500) {
    logger.error(`${req.method} ${req.path} -> ${status}: ${err.message}`);
  }

  res.status(status).json(wrapError(code, message));
}

module.exports = errorHandler;
