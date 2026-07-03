const assert = require('node:assert');
const { describe, it, before, after } = require('node:test');
const http = require('node:http');

const PORT = 5003;
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
  const Simulator = require('../src/simulator');
  const PowerCalculator = require('../src/powerCalculator');
  const powerRouter = require('../src/routes/power');
  const errorHandler = require('../src/middleware/errorHandler');

  const simulator = new Simulator();
  const powerCalculator = new PowerCalculator(simulator);

  const app = express();
  app.locals.startTime = Date.now();
  app.locals.simulator = simulator;
  app.locals.powerCalculator = powerCalculator;
  app.use(cors());
  app.use(express.json());
  app.use('/api/power', powerRouter);

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

describe('Power API', () => {
  it('GET /api/power returns full power payload with all fields', async () => {
    const { status, body } = await fetchJSON('/power');
    assert.strictEqual(status, 200);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.error, null);

    const data = body.data;
    assert.strictEqual(typeof data.totalPower, 'number');
    assert.strictEqual(data.unit, 'Watts');
    assert.ok(typeof data.dailyEstimate.kWh === 'number');
    assert.ok(typeof data.dailyEstimate.period === 'string');
    assert.ok(data.dailyEstimate.period.includes('hours'));

    const rooms = Object.keys(data.byRoom);
    assert.deepStrictEqual(rooms.sort(), ['drawing-room', 'work-room-1', 'work-room-2']);

    for (const room of rooms) {
      assert.strictEqual(typeof data.byRoom[room].power, 'number');
      assert.strictEqual(typeof data.byRoom[room].activeDevices, 'number');
    }

    assert.strictEqual(typeof data.breakdown.fans.count, 'number');
    assert.strictEqual(typeof data.breakdown.fans.power, 'number');
    assert.strictEqual(typeof data.breakdown.lights.count, 'number');
    assert.strictEqual(typeof data.breakdown.lights.power, 'number');
  });

  it('byRoom power values sum to totalPower', async () => {
    const { body } = await fetchJSON('/power');
    const byRoom = body.data.byRoom;
    const sum = Object.values(byRoom).reduce((s, r) => s + r.power, 0);
    assert.strictEqual(sum, body.data.totalPower);
  });

  it('GET /api/power/summary returns bot-friendly shape', async () => {
    const { status, body } = await fetchJSON('/power/summary');
    assert.strictEqual(status, 200);
    assert.strictEqual(body.success, true);

    const data = body.data;
    assert.strictEqual(typeof data.totalWatts, 'number');
    assert.strictEqual(typeof data.estimatedKwhToday, 'number');

    const rooms = Object.keys(data.perRoom);
    assert.deepStrictEqual(rooms.sort(), ['drawing-room', 'work-room-1', 'work-room-2']);

    for (const room of rooms) {
      assert.strictEqual(typeof data.perRoom[room], 'number');
    }
  });

  it('GET /api/power/:room returns room-specific power data', async () => {
    const { status, body } = await fetchJSON('/power/drawing-room');
    assert.strictEqual(status, 200);
    assert.strictEqual(body.success, true);

    const data = body.data;
    assert.strictEqual(data.room, 'drawing-room');
    assert.strictEqual(typeof data.power, 'number');
    assert.strictEqual(typeof data.activeDevices, 'number');
    assert.ok(Array.isArray(data.devices));
    assert.strictEqual(data.devices.length, 5);
    assert.ok(data.devices.every((d) => d.id && d.name && 'status' in d && 'powerDraw' in d));
  });

  it('GET /api/power/:room with invalid room returns 404', async () => {
    const { status, body } = await fetchJSON('/power/invalid-room');
    assert.strictEqual(status, 404);
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'ROOM_NOT_FOUND');
  });

  it('summary.totalWatts matches power.totalPower', async () => {
    const [powerRes, summaryRes] = await Promise.all([
      fetchJSON('/power'),
      fetchJSON('/power/summary'),
    ]);
    assert.strictEqual(powerRes.body.data.totalPower, summaryRes.body.data.totalWatts);
  });
});
