const EventEmitter = require('events');
const { ROOMS } = require('./utils/constants');
const { isAfterHours, hoursSince } = require('./utils/timings');
const config = require('./config');
const logger = require('./utils/logger');

class AlertEngine extends EventEmitter {
  constructor(simulator) {
    super();
    this.simulator = simulator;
    this.alerts = [];
    this._map = new Map();
    this._idCounter = 0;
  }

  check(now) {
    const allDevices = this.simulator.getAllDevices();
    this.checkAfterHours(allDevices, now);
    this.checkContinuousRuntime(allDevices, now);
    this.resolveStaleAlerts(allDevices, now);
  }

  checkAfterHours(allDevices, now) {
    if (!config.enableAfterHoursAlerts) return;

    for (const room of ROOMS) {
      const devices = allDevices[room];
      const activeDevices = devices.filter((d) => d.status);

      if (activeDevices.length > 0 && isAfterHours(now)) {
        const key = `after-hours:${room}`;
        if (this._map.has(key)) continue;

        const fans = activeDevices.filter((d) => d.type === 'fan').length;
        const lights = activeDevices.filter((d) => d.type === 'light').length;

        const parts = [];
        if (fans > 0) parts.push(`${fans} ${fans === 1 ? 'fan' : 'fans'}`);
        if (lights > 0) parts.push(`${lights} ${lights === 1 ? 'light' : 'lights'}`);

        const roomName = this._formatRoomName(room);
        const timeStr = this._formatTime(now || new Date());
        const message = `${roomName} has ${parts.join(' and ')} ON at ${timeStr} (after office hours)`;

        this._addAlert({
          type: 'after-hours',
          severity: 'warning',
          room,
          message,
          devices: activeDevices.map((d) => ({ id: d.id, name: d.name })),
        });
      }
    }
  }

  checkContinuousRuntime(allDevices, now) {
    if (!config.enableRuntimeAlerts) return;

    for (const room of ROOMS) {
      const devices = allDevices[room];
      const longRunning = devices.filter((d) => {
        if (!d.status) return false;
        const hours = now
          ? (now.getTime() - new Date(d.lastChanged).getTime()) / (1000 * 60 * 60)
          : hoursSince(d.lastChanged);
        return hours >= config.continuousRuntimeThreshold;
      });

      if (longRunning.length === 0) continue;

      const key = `continuous-runtime:${room}`;
      if (this._map.has(key)) continue;

      const roomName = this._formatRoomName(room);
      const message = `${roomName}: All devices have been running for over ${config.continuousRuntimeThreshold} hours continuously`;

      this._addAlert({
        type: 'continuous-runtime',
        severity: 'info',
        room,
        message,
        devices: longRunning.map((d) => ({ id: d.id, name: d.name })),
        _key: key,
      });
    }
  }

  resolveStaleAlerts(allDevices, now) {
    for (const [key, alert] of this._map) {
      let shouldResolve = false;

      if (alert.type === 'after-hours') {
        const devices = allDevices[alert.room];
        const activeDevices = devices.filter((d) => d.status);
        if (activeDevices.length === 0 || !isAfterHours(now)) {
          shouldResolve = true;
        }
      } else if (alert.type === 'continuous-runtime') {
        const deviceId = alert.devices[0].id;
        const device = this.simulator.getDeviceById(deviceId);
        if (!device || !device.status) {
          shouldResolve = true;
        }
      }

      if (shouldResolve) {
        alert.resolvedAt = new Date().toISOString();
        this._map.delete(key);
      }
    }
  }

  _addAlert(data) {
    this._idCounter++;
    const id = `alert-${String(this._idCounter).padStart(3, '0')}`;
    const alert = {
      id,
      type: data.type,
      severity: data.severity,
      room: data.room,
      message: data.message,
      devices: data.devices,
      triggeredAt: new Date().toISOString(),
      resolvedAt: null,
    };
    this.alerts.push(alert);
    if (this.alerts.length > 200) {
      this.alerts = this.alerts.slice(-200);
    }
    const mapKey = data._key || `${data.type}:${data.room}`;
    this._map.set(mapKey, alert);
    logger.info(`Alert #${id} [${data.severity}] ${data.room}: ${data.message}`);
    this.emit('alert', alert);
  }

  getAlerts() {
    return this.alerts;
  }

  getActiveAlerts() {
    return this.alerts.filter((a) => !a.resolvedAt);
  }

  _formatRoomName(room) {
    return room.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  _formatTime(date) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
}

module.exports = AlertEngine;
