const express = require('express');
const cors = require('cors');
const config = require('./config');
const Simulator = require('./simulator');
const PowerCalculator = require('./powerCalculator');
const AlertEngine = require('./alertEngine');
const logger = require('./utils/logger');
const { startWebSocketServer } = require('./websocket');
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

app.use(cors());
app.use(express.json());

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

startWebSocketServer(simulator, alertEngine, powerCalculator);

const server = app.listen(config.port, () => {
  logger.info(`Backend running on http://${config.host}:${config.port}`);
});

module.exports = { app, server };
