const config = require('../config');

function isAfterHours(date) {
  const d = date || new Date();
  const hour = d.getHours();
  return hour < config.officeHours.start || hour >= config.officeHours.end;
}

function hoursSince(isoTimestamp) {
  const then = new Date(isoTimestamp).getTime();
  const now = Date.now();
  return (now - then) / (1000 * 60 * 60);
}

module.exports = { isAfterHours, hoursSince };
