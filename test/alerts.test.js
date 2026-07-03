const assert = require('node:assert');
const { describe, it, before, after } = require('node:test');
const http = require('node:http');

const PORT = 5004;
const BASE_URL = `http://localhost:${PORT}/api`;

let server;
let alertEngine;

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
  const Simulator = require('../src/simulator');
  const AlertEngine = require('../src/alertEngine');
  const alertsRouter = require('../src/routes/alerts');
  const errorHandler = require('../src/middleware/errorHandler');

  const simulator = new Simulator();
  alertEngine = new AlertEngine(simulator);

  const app = express();
  app.locals.alertEngine = alertEngine;
  app.use(cors());
  app.use(express.json());
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

describe('Alerts API', () => {
  it('GET /api/alerts returns empty state with zero counts', async () => {
    const { status, body } = await fetchJSON('/alerts');
    assert.strictEqual(status, 200);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.error, null);

    const data = body.data;
    assert.deepStrictEqual(data.alerts, []);
    assert.strictEqual(data.activeCount, 0);
    assert.strictEqual(data.resolvedCount, 0);
  });

  it('GET /api/alerts?since=invalid returns 400', async () => {
    const { status, body } = await fetchJSON('/alerts?since=not-a-date');
    assert.strictEqual(status, 400);
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'INVALID_TIMESTAMP');
  });

  it('GET /api/alerts filters by ?since and returns most recent', async () => {
    alertEngine.alerts.push({
      id: 'alert-old',
      type: 'after-hours',
      severity: 'warning',
      room: 'drawing-room',
      message: 'old alert',
      devices: [],
      triggeredAt: '2024-01-01T10:00:00.000Z',
      resolvedAt: '2024-01-01T11:00:00.000Z',
    });
    alertEngine.alerts.push({
      id: 'alert-new',
      type: 'continuous-runtime',
      severity: 'info',
      room: 'work-room-1',
      message: 'new alert',
      devices: [],
      triggeredAt: new Date().toISOString(),
      resolvedAt: null,
    });

    const { body } = await fetchJSON('/alerts?since=2024-06-01T00:00:00.000Z');
    assert.strictEqual(body.data.alerts.length, 1);
    assert.strictEqual(body.data.alerts[0].id, 'alert-new');
    assert.strictEqual(body.data.activeCount, 1);
    assert.strictEqual(body.data.resolvedCount, 0);
  });

  it('GET /api/alerts?limit=1 returns at most 1 alert', async () => {
    const { body } = await fetchJSON('/alerts?limit=1');
    assert.ok(body.data.alerts.length <= 1);
  });
});
