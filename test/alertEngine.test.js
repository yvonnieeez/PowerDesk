const assert = require('node:assert');
const { describe, it, before, after, beforeEach, afterEach } = require('node:test');

const Simulator = require('../src/simulator');
const AlertEngine = require('../src/alertEngine');

function makeAfterHours() {
  const d = new Date();
  d.setHours(3, 0, 0, 0);
  return d;
}

function threeHoursAgo() {
  return new Date(Date.now() - 3 * 3600000).toISOString();
}

describe('AlertEngine', () => {
  describe('after-hours alerts', () => {
    let sim;
    let ae;

    before(() => {
      sim = new Simulator();
      ae = new AlertEngine(sim);
    });

    after(() => {
      sim.stop();
    });

    it('creates alert for room with active device during after-hours', () => {
      const devices = sim.getAllDevices();
      for (const room of Object.values(devices)) {
        for (const d of room) {
          d.status = false;
        }
      }
      devices['drawing-room'][0].status = true;

      ae.check(makeAfterHours());

      assert.strictEqual(ae.getAlerts().length, 1);
      const alert = ae.getAlerts()[0];
      assert.strictEqual(alert.type, 'after-hours');
      assert.strictEqual(alert.severity, 'warning');
      assert.strictEqual(alert.room, 'drawing-room');
      assert.ok(alert.message.includes('after office hours'));
      assert.ok(alert.devices.length >= 1);
      assert.strictEqual(alert.resolvedAt, null);
    });

    it('does not create duplicate after-hours alerts on re-check', () => {
      ae.check(makeAfterHours());
      ae.check(makeAfterHours());

      const afterHours = ae.getAlerts().filter((a) => a.type === 'after-hours');
      assert.strictEqual(afterHours.length, 1);
    });

    it('resolves after-hours alert when devices turn off', () => {
      const devices = sim.getAllDevices();
      for (const room of Object.values(devices)) {
        for (const d of room) {
          d.status = false;
        }
      }

      ae.check(makeAfterHours());

      const alert = ae.getAlerts()[0];
      assert.ok(alert.resolvedAt !== null);
    });
  });

  describe('continuous-runtime alerts', () => {
    let sim;
    let ae;

    beforeEach(() => {
      sim = new Simulator();
      ae = new AlertEngine(sim);
    });

    afterEach(() => {
      sim.stop();
    });

    it('creates alert when a device has been ON for >= 2h', () => {
      const devices = sim.getAllDevices();
      for (const room of Object.values(devices)) {
        for (const d of room) {
          d.status = false;
        }
      }
      devices['drawing-room'][0].status = true;
      devices['drawing-room'][0].lastChanged = threeHoursAgo();

      ae.check();

      const runtimeAlerts = ae.getAlerts().filter((a) => a.type === 'continuous-runtime');
      assert.strictEqual(runtimeAlerts.length, 1);
      assert.strictEqual(runtimeAlerts[0].severity, 'info');
      assert.strictEqual(runtimeAlerts[0].room, 'drawing-room');
      assert.ok(runtimeAlerts[0].message.includes('has been ON for'));
      assert.strictEqual(runtimeAlerts[0].devices.length, 1);
    });

    it('creates per-device alerts for multiple devices in the same room', () => {
      const devices = sim.getAllDevices();
      for (const room of Object.values(devices)) {
        for (const d of room) {
          d.status = false;
        }
      }
      devices['drawing-room'][0].status = true;
      devices['drawing-room'][0].lastChanged = threeHoursAgo();
      devices['drawing-room'][1].status = true;
      devices['drawing-room'][1].lastChanged = threeHoursAgo();

      ae.check();

      const runtimeAlerts = ae.getAlerts().filter((a) => a.type === 'continuous-runtime');
      assert.strictEqual(runtimeAlerts.length, 2);
    });

    it('does NOT create alert if device is not old enough', () => {
      const devices = sim.getAllDevices();
      for (const room of Object.values(devices)) {
        for (const d of room) {
          d.status = false;
        }
      }
      devices['drawing-room'][0].status = true;
      devices['drawing-room'][0].lastChanged = new Date().toISOString();

      ae.check();

      const runtimeAlerts = ae.getAlerts().filter((a) => a.type === 'continuous-runtime');
      assert.strictEqual(runtimeAlerts.length, 0);
    });
  });

  describe('alert query methods', () => {
    let sim;
    let ae;

    before(() => {
      sim = new Simulator();
      ae = new AlertEngine(sim);
    });

    after(() => {
      sim.stop();
    });

    it('getAlerts returns all, getActiveAlerts returns only unresolved', () => {
      const devices = sim.getAllDevices();
      for (const room of Object.values(devices)) {
        for (const d of room) {
          d.status = false;
        }
      }
      devices['drawing-room'][0].status = true;

      ae.check(makeAfterHours());
      assert.strictEqual(ae.getAlerts().length, 1);
      assert.strictEqual(ae.getActiveAlerts().length, 1);

      devices['drawing-room'][0].status = false;
      ae.check(makeAfterHours());

      assert.strictEqual(ae.getAlerts().length, 1);
      assert.strictEqual(ae.getActiveAlerts().length, 0);
    });
  });
});
