function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    data: null,
    timestamp: new Date().toISOString(),
    error: { code: 'INTERNAL_ERROR', message: err.message || 'Internal Server Error' },
  });
}

module.exports = errorHandler;
