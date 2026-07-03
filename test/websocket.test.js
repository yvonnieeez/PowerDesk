const assert = require('node:assert');
const { describe, it, before, after } = require('node:test');
const WebSocket = require('ws');

const Simulator = require('../src/simulator');
const AlertEngine = require('../src/alertEngine');
const PowerCalculator = require('../src/powerCalculator');
const { startWebSocketServer } = require('../src/websocket');

const WS_PORT = 5005;

function connect() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${WS_PORT}`);
    ws.on('open', () => resolve(ws));
    ws.on('error', reject);
  });
}

function waitForMessage(ws) {
  return new Promise((resolve) => {
    ws.on('message', (data) => {
      resolve(JSON.parse(data.toString()));
    });
  });
}

describe('WebSocket Server', () => {
  let simulator;
  let alertEngine;
  let powerCalculator;
  let wsServer;

  before(() => {
    simulator = new Simulator();
    powerCalculator = new PowerCalculator(simulator);
    alertEngine = new AlertEngine(simulator);
    simulator.stop();

    wsServer = startWebSocketServer(simulator, alertEngine, powerCalculator, { port: WS_PORT });
  });

  after(() => {
    wsServer.close();
    simulator.stop();
  });

  it('should accept a client connection', async () => {
    const ws = await connect();
    assert.ok(ws.readyState === WebSocket.OPEN);
    ws.close();
  });

  it('should broadcast device-update when a device changes', async () => {
    const ws = await connect();
    const msgPromise = waitForMessage(ws);

    const device = simulator.getDeviceById('drawing-room-fan-1');
    device.status = true;
    device.lastChanged = new Date().toISOString();
    simulator.emit('deviceChanged', device);

    const msg = await msgPromise;
    assert.strictEqual(msg.type, 'device-update');
    assert.strictEqual(msg.device.id, 'drawing-room-fan-1');
    ws.close();
  });

  it('should broadcast alert-triggered when alertEngine emits alert', async () => {
    const ws = await connect();
    const msgPromise = waitForMessage(ws);

    alertEngine.emit('alert', {
      id: 'test-001',
      type: 'after-hours',
      severity: 'warning',
      room: 'drawing-room',
      message: 'test alert',
      devices: [{ id: 'test-device', name: 'Test' }],
      triggeredAt: new Date().toISOString(),
    });

    const msg = await msgPromise;
    assert.strictEqual(msg.type, 'alert-triggered');
    assert.strictEqual(msg.alert.id, 'test-001');
    ws.close();
  });

  it('should broadcast alert-triggered when check() creates alerts', async () => {
    const devices = simulator.getAllDevices();
    for (const room of Object.values(devices)) {
      for (const d of room) {
        d.status = true;
        d.lastChanged = new Date(Date.now() - 3 * 3600000).toISOString();
      }
    }

    const ws = await connect();
    const msgPromise = waitForMessage(ws);

    alertEngine.check();

    const created = alertEngine.getAlerts();
    assert.ok(created.length > 0, `check() created ${created.length} alerts`);

    const msg = await msgPromise;
    assert.strictEqual(msg.type, 'alert-triggered');
    ws.close();
  });

  it('should not crash when a client disconnects', async () => {
    const ws = await connect();
    ws.close();

    await new Promise((r) => setTimeout(r, 100));

    const ws2 = await connect();
    assert.ok(ws2.readyState === WebSocket.OPEN);
    ws2.close();
  });
});
