const dotenv = require('dotenv');
dotenv.config();

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  host: process.env.HOST || 'localhost',
  wsPort: parseInt(process.env.WS_PORT, 10) || 8080,
  officeHours: {
    start: parseInt(process.env.OFFICE_START_HOUR, 10) || 9,
    end: parseInt(process.env.OFFICE_END_HOUR, 10) || 17,
  },
  simulatorInterval: {
    min: parseInt(process.env.SIMULATOR_INTERVAL_MIN, 10) || 30000,
    max: parseInt(process.env.SIMULATOR_INTERVAL_MAX, 10) || 60000,
  },
  enableAfterHoursAlerts: process.env.ENABLE_AFTER_HOURS_ALERTS !== 'false',
  enableRuntimeAlerts: process.env.ENABLE_RUNTIME_ALERTS !== 'false',
  continuousRuntimeThreshold: parseFloat(process.env.CONTINUOUS_RUNTIME_THRESHOLD_HOURS || 2),
};

module.exports = config;
