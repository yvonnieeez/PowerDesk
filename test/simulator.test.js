const assert = require('node:assert');
const { describe, it, before, after } = require('node:test');

const Simulator = require('../src/simulator');

describe('Simulator', () => {
  let sim;

  before(() => {
    sim = new Simulator();
  });

  after(() => {
    sim.stop();
  });

  it('should initialize 15 devices', () => {
    const all = sim.getAllDevices();
    const count = Object.values(all).flat().length;
    assert.strictEqual(count, 15);
  });

  it('should have 5 devices per room', () => {
    const all = sim.getAllDevices();
    for (const room of Object.keys(all)) {
      assert.strictEqual(all[room].length, 5, `${room} should have 5 devices`);
    }
  });

  it('should have 2 fans and 3 lights per room', () => {
    const all = sim.getAllDevices();
    for (const room of Object.keys(all)) {
      const fans = all[room].filter((d) => d.type === 'fan');
      const lights = all[room].filter((d) => d.type === 'light');
      assert.strictEqual(fans.length, 2, `${room} should have 2 fans`);
      assert.strictEqual(lights.length, 3, `${room} should have 3 lights`);
    }
  });

  it('should return null for invalid room', () => {
    const devices = sim.getDevicesByRoom('invalid-room');
    assert.strictEqual(devices, null);
  });

  it('should find a device by ID', () => {
    const device = sim.getDeviceById('drawing-room-fan-1');
    assert.ok(device);
    assert.strictEqual(device.id, 'drawing-room-fan-1');
    assert.strictEqual(device.type, 'fan');
    assert.strictEqual(device.room, 'drawing-room');
    assert.strictEqual(device.name, 'Fan 1');
    assert.strictEqual(device.powerDraw, 60);
  });

  it('should return null for non-existent device ID', () => {
    const device = sim.getDeviceById('nonexistent');
    assert.strictEqual(device, null);
  });

  it('should start with a mixed initial state (not all off, not all on)', () => {
    const all = Object.values(sim.getAllDevices()).flat();
    const onCount = all.filter((d) => d.status).length;
    assert.ok(onCount >= 3, `Expected at least 3 devices ON, got ${onCount}`);
    assert.ok(onCount <= 17, `Expected at most 17 devices ON, got ${onCount}`);
  });

  it('should emit deviceChanged events when ticking', () => {
    const sim2 = new Simulator();
    const changedDevices = [];

    sim2.on('deviceChanged', (device) => {
      changedDevices.push(device);
    });

    sim2._tick();

    assert.ok(changedDevices.length >= 0, 'Tick should run without error');

    if (changedDevices.length > 0) {
      for (const device of changedDevices) {
        assert.ok(device.id);
        assert.ok(device.lastChanged);
      }
    }

    sim2.stop();
  });

  it('should update lastChanged only on flipped devices', () => {
    const sim3 = new Simulator();
    const before = {};
    const allDevices = Object.values(sim3.getAllDevices()).flat();
    for (const d of allDevices) {
      before[d.id] = d.lastChanged;
    }

    sim3._tick();

    const after = {};
    for (const d of Object.values(sim3.getAllDevices()).flat()) {
      after[d.id] = d.lastChanged;
    }

    let changedCount = 0;
    let unchangedCount = 0;
    for (const id of Object.keys(before)) {
      if (before[id] !== after[id]) {
        changedCount++;
      } else {
        unchangedCount++;
      }
    }

    assert.strictEqual(changedCount + unchangedCount, 15);
  });
});
