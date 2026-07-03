const config = require('./config');

class PowerCalculator {
  constructor(simulator) {
    this.simulator = simulator;
  }

  getTotalPower() {
    const allDevices = this._getAllDevicesFlat();
    return allDevices.reduce((sum, d) => sum + (d.status ? d.powerDraw : 0), 0);
  }

  getPowerByRoom(room) {
    if (room) {
      const devices = this.simulator.getDevicesByRoom(room);
      if (!devices) return null;
      return {
        room,
        power: devices.reduce((sum, d) => sum + (d.status ? d.powerDraw : 0), 0),
        activeDevices: devices.filter((d) => d.status).length,
        devices: devices.map((d) => ({ id: d.id, name: d.name, status: d.status, powerDraw: d.powerDraw })),
      };
    }

    const result = {};
    const allDevices = this.simulator.getAllDevices();
    for (const [r, devices] of Object.entries(allDevices)) {
      result[r] = {
        power: devices.reduce((sum, d) => sum + (d.status ? d.powerDraw : 0), 0),
        activeDevices: devices.filter((d) => d.status).length,
      };
    }
    return result;
  }

  getPowerBreakdown() {
    const allDevices = this._getAllDevicesFlat();
    const fans = allDevices.filter((d) => d.type === 'fan');
    const lights = allDevices.filter((d) => d.type === 'light');

    return {
      fans: {
        count: fans.filter((d) => d.status).length,
        power: fans.reduce((sum, d) => sum + (d.status ? d.powerDraw : 0), 0),
      },
      lights: {
        count: lights.filter((d) => d.status).length,
        power: lights.reduce((sum, d) => sum + (d.status ? d.powerDraw : 0), 0),
      },
    };
  }

  getDailyEstimate() {
    const totalPower = this.getTotalPower();
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    const startHour = config.officeHours.start;
    const endHour = config.officeHours.end;
    const officeWindow = endHour - startHour;

    let hoursElapsed;
    if (currentHour < startHour) {
      hoursElapsed = 0;
    } else if (currentHour >= endHour) {
      hoursElapsed = officeWindow;
    } else {
      hoursElapsed = currentHour - startHour;
    }

    hoursElapsed = Math.max(0, Math.min(hoursElapsed, officeWindow));

    const kWh = parseFloat(((totalPower / 1000) * hoursElapsed).toFixed(1));

    const formatPeriod = () => {
      const fmt = (h) => (h >= 12 ? `${h - 12 || 12} PM` : `${h} AM`);
      return `${fmt(startHour)} - ${fmt(endHour)} (${officeWindow} hours)`;
    };

    return { kWh, period: formatPeriod() };
  }

  _getAllDevicesFlat() {
    const all = [];
    for (const devices of Object.values(this.simulator.getAllDevices())) {
      for (const device of devices) {
        all.push(device);
      }
    }
    return all;
  }
}

module.exports = PowerCalculator;
