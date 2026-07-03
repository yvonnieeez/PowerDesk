const express = require('express');
const cors = require('cors');
const config = require('./config');
const Simulator = require('./simulator');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

const statusRouter = require('./routes/status');

const app = express();
const simulator = new Simulator();

app.locals.startTime = Date.now();
app.locals.simulator = simulator;

simulator.start();

app.use(cors());
app.use(express.json());

app.use('/api/status', statusRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    timestamp: new Date().toISOString(),
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` },
  });
});

app.use(errorHandler);

const server = app.listen(config.port, () => {
  logger.info(`Backend running on http://${config.host}:${config.port}`);
});

module.exports = { app, server };
