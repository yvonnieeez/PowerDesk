const assert = require('node:assert');
const { describe, it, before, after } = require('node:test');
const http = require('node:http');

const PORT = 5002;
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
  const devicesRouter = require('../src/routes/devices');
  const errorHandler = require('../src/middleware/errorHandler');

  const simulator = new Simulator();

  const app = express();
  app.locals.startTime = Date.now();
  app.locals.simulator = simulator;
  app.use(cors());
  app.use(express.json());
  app.use('/api/devices', devicesRouter);

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

describe('Devices API', () => {
  const expectedSchemaFields = ['id', 'type', 'name', 'room', 'status', 'powerDraw', 'lastChanged'];

  it('GET /api/devices returns all 15 devices nested by room', async () => {
    const { status, body } = await fetchJSON('/devices');
    assert.strictEqual(status, 200);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.error, null);
    assert.ok(body.timestamp);

    const data = body.data;
    const rooms = Object.keys(data);
    assert.deepStrictEqual(rooms.sort(), ['drawing-room', 'work-room-1', 'work-room-2']);

    let totalDevices = 0;
    for (const room of rooms) {
      const devices = data[room];
      assert.strictEqual(devices.length, 5, `${room} should have 5 devices`);
      totalDevices += devices.length;

      for (const device of devices) {
        for (const field of expectedSchemaFields) {
          assert.ok(field in device, `Device missing field: ${field}`);
        }
        assert.strictEqual(device.room, room);
        assert.ok(['fan', 'light'].includes(device.type));
        assert.strictEqual(typeof device.status, 'boolean');
        assert.strictEqual(typeof device.powerDraw, 'number');
      }
    }
    assert.strictEqual(totalDevices, 15);
  });

  it('GET /api/devices/drawing-room returns 5 devices for that room', async () => {
    const { status, body } = await fetchJSON('/devices/drawing-room');
    assert.strictEqual(status, 200);
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.error, null);
    assert.strictEqual(body.data.room, 'drawing-room');
    assert.strictEqual(body.data.devices.length, 5);

    for (const device of body.data.devices) {
      assert.strictEqual(device.room, 'drawing-room');
      for (const field of expectedSchemaFields) {
        assert.ok(field in device);
      }
    }
  });

  it('GET /api/devices/not-a-room returns 404 with ROOM_NOT_FOUND', async () => {
    const { status, body } = await fetchJSON('/devices/not-a-room');
    assert.strictEqual(status, 404);
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.data, null);
    assert.strictEqual(body.error.code, 'ROOM_NOT_FOUND');
    assert.ok(body.error.message.includes('not-a-room'));
    assert.ok(body.timestamp);
  });
});
