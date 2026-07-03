const assert = require('node:assert');
const { describe, it, before, after } = require('node:test');
const http = require('node:http');

const PORT = 5001;
const BASE_URL = `http://localhost:${PORT}/api`;

let server;

function fetchJSON(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

before(() => {
  const express = require('express');
  const cors = require('cors');
  const statusRouter = require('../src/routes/status');
  const devicesRouter = require('../src/routes/devices');
  const powerRouter = require('../src/routes/power');
  const alertsRouter = require('../src/routes/alerts');
  const errorHandler = require('../src/middleware/errorHandler');

  const app = express();
  app.locals.startTime = Date.now();
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

  return new Promise((resolve) => {
    server = app.listen(PORT, resolve);
  });
});

after(() => {
  if (server) server.close();
});

describe('API Smoke Tests', () => {
  it('GET /api/status returns 200 with healthy status', async () => {
    const { status, body } = await fetchJSON('/status');
    assert.strictEqual(status, 200);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'healthy');
    assert.strictEqual(body.data.backend.version, '1.0.0');
    assert.ok(body.timestamp);
    assert.strictEqual(body.error, null);
  });

  it('GET /api/nonexistent returns 404', async () => {
    const { status, body } = await fetchJSON('/nonexistent');
    assert.strictEqual(status, 404);
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'NOT_FOUND');
  });
});
