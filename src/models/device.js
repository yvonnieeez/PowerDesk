const { FAN_POWER_WATTS, LIGHT_POWER_WATTS } = require('../utils/constants');

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function createDevice(room, type, index) {
  return {
    id: `${room}-${type}-${index}`,
    type,
    name: `${capitalize(type)} ${index}`,
    room,
    status: false,
    powerDraw: type === 'fan' ? FAN_POWER_WATTS : LIGHT_POWER_WATTS,
    lastChanged: new Date().toISOString(),
  };
}

module.exports = { createDevice };
