function wrapResponse(data) {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    error: null,
  };
}

function wrapError(code, message) {
  return {
    success: false,
    data: null,
    timestamp: new Date().toISOString(),
    error: { code, message },
  };
}

module.exports = { wrapResponse, wrapError };
