const { ROOMS } = require('../utils/constants');

function validateRoom(room) {
  if (!ROOMS.includes(room)) {
    return `Room '${room}' does not exist`;
  }
  return null;
}

function validateTimestamp(timestamp) {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    return `'since' parameter must be a valid ISO timestamp`;
  }
  return null;
}

function validateLimit(limit) {
  const num = parseInt(limit, 10);
  if (isNaN(num) || num < 1 || num > 100) {
    return 'Limit must be between 1 and 100';
  }
  return null;
}

module.exports = { validateRoom, validateTimestamp, validateLimit };
