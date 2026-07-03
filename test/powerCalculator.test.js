const assert = require('node:assert');
const { describe, it, before } = require('node:test');

const Simulator = require('../src/simulator');
const PowerCalculator = require('../src/powerCalculator');

describe('PowerCalculator', () => {
  let sim;
  let pc;

  function allOff() {
    const devices = Object.values(sim.getAllDevices()).flat();
    for (const d of devices) {
      d.status = false;
    }
  }

  function setState(config) {
    for (const [id, status] of Object.entries(config)) {
      const device = sim.getDeviceById(id);
      if (device) device.status = status;
    }
  }

  before(() => {
    sim = new Simulator();
    pc = new PowerCalculator(sim);
  });

  it('getTotalPower returns 0 when all devices are off', () => {
    allOff();
    assert.strictEqual(pc.getTotalPower(), 0);
  });

  it('getTotalPower equals sum of active device wattages', () => {
    allOff();
    setState({
      'drawing-room-fan-1': true,
      'drawing-room-light-1': true,
      'work-room-1-fan-1': true,
    });
    const expected = 60 + 15 + 60;
    assert.strictEqual(pc.getTotalPower(), expected);
  });

  it('getPowerByRoom returns correct per-room power and activeDevices', () => {
    allOff();
    setState({
      'drawing-room-fan-1': true,
      'drawing-room-light-1': true,
      'drawing-room-light-2': true,
      'work-room-1-fan-1': true,
      'work-room-2-light-1': true,
    });

    const byRoom = pc.getPowerByRoom();
    assert.strictEqual(byRoom['drawing-room'].power, 60 + 15 + 15);
    assert.strictEqual(byRoom['drawing-room'].activeDevices, 3);
    assert.strictEqual(byRoom['work-room-1'].power, 60);
    assert.strictEqual(byRoom['work-room-1'].activeDevices, 1);
    assert.strictEqual(byRoom['work-room-2'].power, 15);
    assert.strictEqual(byRoom['work-room-2'].activeDevices, 1);
  });

  it('getPowerByRoom with room name returns correct data', () => {
    allOff();
    setState({
      'drawing-room-fan-1': true,
      'drawing-room-light-1': true,
    });

    const result = pc.getPowerByRoom('drawing-room');
    assert.strictEqual(result.room, 'drawing-room');
    assert.strictEqual(result.power, 60 + 15);
    assert.strictEqual(result.activeDevices, 2);
    assert.strictEqual(result.devices.length, 5);
    assert.ok(result.devices.every((d) => d.id && d.name && 'status' in d && 'powerDraw' in d));
  });

  it('getPowerByRoom with invalid room returns null', () => {
    assert.strictEqual(pc.getPowerByRoom('invalid-room'), null);
  });

  it('getPowerByRoom without room returns full byRoom object', () => {
    const byRoom = pc.getPowerByRoom();
    assert.ok(typeof byRoom['drawing-room'] === 'object');
    assert.ok(typeof byRoom['work-room-1'] === 'object');
    assert.ok(typeof byRoom['work-room-2'] === 'object');
  });

  it('byRoom power values sum to totalPower', () => {
    const total = pc.getTotalPower();
    const byRoom = pc.getPowerByRoom();
    const sum = Object.values(byRoom).reduce((s, r) => s + r.power, 0);
    assert.strictEqual(sum, total);
  });

  it('getPowerBreakdown returns correct fan/light aggregation', () => {
    const breakdown = pc.getPowerBreakdown();
    assert.ok(typeof breakdown.fans.count === 'number');
    assert.ok(typeof breakdown.fans.power === 'number');
    assert.ok(typeof breakdown.lights.count === 'number');
    assert.ok(typeof breakdown.lights.power === 'number');

    const total = pc.getTotalPower();
    assert.strictEqual(breakdown.fans.power + breakdown.lights.power, total);
  });

  it('getDailyEstimate returns kWh number and period string', () => {
    const est = pc.getDailyEstimate();
    assert.strictEqual(typeof est.kWh, 'number');
    assert.ok(est.kWh >= 0);
    assert.ok(typeof est.period, 'string');
    assert.ok(est.period.includes('AM'));
    assert.ok(est.period.includes('hours'));
  });
});
