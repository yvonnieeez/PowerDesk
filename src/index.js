const http = require('http');
const express = require('express');
const cors = require('cors');
const config = require('./config');
const Simulator = require('./simulator');
const PowerCalculator = require('./powerCalculator');
const AlertEngine = require('./alertEngine');
const logger = require('./utils/logger');
const { startWebSocketServer } = require('./websocket');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');

const statusRouter = require('./routes/status');
const devicesRouter = require('./routes/devices');
const powerRouter = require('./routes/power');
const alertsRouter = require('./routes/alerts');

const app = express();
const simulator = new Simulator();
const powerCalculator = new PowerCalculator(simulator);
const alertEngine = new AlertEngine(simulator);

app.locals.startTime = Date.now();
app.locals.simulator = simulator;
app.locals.powerCalculator = powerCalculator;
app.locals.alertEngine = alertEngine;

simulator.on('deviceChanged', () => alertEngine.check());
simulator.start();

// Demo alert generator: fires every 30s using real simulator device data
// so the Discord bot receives alerts during demos. Disable with DEMO_ALERTS=false.
let demoAlertInterval = null;
if (process.env.DEMO_ALERTS !== 'false') {
  demoAlertInterval = setInterval(() => {
    const allDevices = simulator.getAllDevices();
    const rooms = Object.keys(allDevices).filter((r) =>
      allDevices[r].some((d) => d.status)
    );
    if (rooms.length === 0) return;

    const room = rooms[Math.floor(Math.random() * rooms.length)];
    const onDevices = allDevices[room].filter((d) => d.status);
    const roomName = room
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    const message = `${roomName}: ${onDevices.length} device(s) ON (${onDevices.map((d) => d.name).join(', ')})`;

    alertEngine._addAlert({
      type: 'demo',
      severity: 'info',
      room,
      message,
      devices: onDevices.map((d) => ({ id: d.id, name: d.name })),
    });
  }, 30000);
}

process.on('SIGTERM', () => {
  if (demoAlertInterval) clearInterval(demoAlertInterval);
  server.close();
  process.exit(0);
});
process.on('SIGINT', () => {
  if (demoAlertInterval) clearInterval(demoAlertInterval);
  server.close();
  process.exit(0);
});

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.use('/api/status', statusRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/power', powerRouter);
app.use('/api/alerts', alertsRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    timestamp: new Date().toISOString(),
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
});

app.use(errorHandler);

const server = http.createServer(app);
startWebSocketServer(simulator, alertEngine, powerCalculator, { server });

server.listen(config.port, () => {
  logger.info(`Backend running on http://${config.host}:${config.port}`);
});

module.exports = { app, server };
