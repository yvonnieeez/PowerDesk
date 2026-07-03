const EventEmitter = require('events');
const { ROOMS, DEVICES_PER_ROOM } = require('./utils/constants');
const { createDevice } = require('./models/device');
const { isAfterHours, hoursSince } = require('./utils/timings');
const config = require('./config');
const logger = require('./utils/logger');

class Simulator extends EventEmitter {
  constructor() {
    super();
    this.devices = {};
    this.running = false;
    this.timer = null;
    this._initialiseDevices();
    this._seedInitialState();
  }

  _initialiseDevices() {
    for (const room of ROOMS) {
      this.devices[room] = [];
      for (let i = 1; i <= DEVICES_PER_ROOM.fans; i++) {
        this.devices[room].push(createDevice(room, 'fan', i));
      }
      for (let i = 1; i <= DEVICES_PER_ROOM.lights; i++) {
        this.devices[room].push(createDevice(room, 'light', i));
      }
    }
  }

  _seedInitialState() {
    const allDevices = this._getAllDevicesFlat();
    for (const device of allDevices) {
      if (Math.random() < 0.6) {
        device.status = true;
        device.lastChanged = new Date().toISOString();
      }
    }
  }

  _getAllDevicesFlat() {
    const all = [];
    for (const room of ROOMS) {
      for (const device of this.devices[room]) {
        all.push(device);
      }
    }
    return all;
  }

  getAllDevices() {
    return this.devices;
  }

  getDevicesByRoom(room) {
    return this.devices[room] || null;
  }

  getDeviceById(id) {
    for (const room of ROOMS) {
      const device = this.devices[room].find((d) => d.id === id);
      if (device) return device;
    }
    return null;
  }

  getLastUpdateTime() {
    let latest = null;
    for (const room of ROOMS) {
      for (const device of this.devices[room]) {
        if (!latest || device.lastChanged > latest) {
          latest = device.lastChanged;
        }
      }
    }
    return latest;
  }

  start() {
    if (this.running) return;
    this.running = true;
    logger.info('Simulator started with 15 devices');
    this._scheduleTick();
  }

  stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.running = false;
    logger.info('Simulator stopped');
  }

  _scheduleTick() {
    const delay = this._randomInterval();
    this.timer = setTimeout(() => {
      this._tick();
      if (this.running) {
        this._scheduleTick();
      }
    }, delay);
  }

  _randomInterval() {
    const min = config.simulatorInterval.min;
    const max = config.simulatorInterval.max;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  _tick() {
    const allDevices = this._getAllDevicesFlat();
    const candidates = this._pickRandomDevices(allDevices, 1, 2);
    const afterHours = isAfterHours();
    const changed = [];

    for (const device of candidates) {
      if (!this._shouldToggle(device, afterHours)) continue;

      device.status = !device.status;
      device.lastChanged = new Date().toISOString();
      changed.push(device);
      this.emit('deviceChanged', device);
    }

    if (changed.length > 0) {
      logger.debug(`Simulator tick: toggled ${changed.length} device(s)`);
    }
  }

  _pickRandomDevices(allDevices, min, max) {
    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    const shuffled = [...allDevices].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  _shouldToggle(device, afterHours) {
    if (device.status) {
      if (device.type === 'fan' && hoursSince(device.lastChanged) < this._randomFanMinHours()) {
        return false;
      }
      if (afterHours && Math.random() < 0.3) {
        return false;
      }
    }
    return true;
  }

  _randomFanMinHours() {
    const minutes = 5 + Math.random() * 25;
    return minutes / 60;
  }
}

module.exports = Simulator;
