import type { Device } from '../types/device';
import type { Alert } from '../types/alert';
import type { PowerSummary } from '../types/power';
import { useDeviceStore } from '../store/deviceStore';
import { useAlertStore } from '../store/alertStore';
import { usePowerStore } from '../store/powerStore';

const ROOMS = ['drawing-room', 'work-room-1', 'work-room-2'];

function createMockDevices(): Device[] {
  const devices: Device[] = [];
  const now = new Date().toISOString();

  ROOMS.forEach((room) => {
    // 2 Fans per room (60W each)
    devices.push({
      id: `${room}-fan-1`,
      name: 'Fan 1',
      type: 'fan',
      status: Math.random() > 0.5 ? 'on' : 'off',
      powerDraw: 60,
      room,
      lastChanged: now,
    });
    devices.push({
      id: `${room}-fan-2`,
      name: 'Fan 2',
      type: 'fan',
      status: Math.random() > 0.5 ? 'on' : 'off',
      powerDraw: 60,
      room,
      lastChanged: now,
    });

    // 3 Lights per room (15W each)
    for (let i = 1; i <= 3; i++) {
      devices.push({
        id: `${room}-light-${i}`,
        name: `Light ${i}`,
        type: 'light',
        status: Math.random() > 0.5 ? 'on' : 'off',
        powerDraw: 15,
        room,
        lastChanged: now,
      });
    }
  });

  return devices;
}

function calculateTotalWatts(devices: Device[]): number {
  return devices
    .filter((d) => d.status === 'on')
    .reduce((sum, d) => sum + d.powerDraw, 0);
}

function calculatePerRoomWatts(devices: Device[]): Record<string, number> {
  const perRoom: Record<string, number> = {};
  ROOMS.forEach((room) => {
    perRoom[room] = devices
      .filter((d) => d.room === room && d.status === 'on')
      .reduce((sum, d) => sum + d.powerDraw, 0);
  });
  return perRoom;
}

function generatePowerSummary(devices: Device[]): PowerSummary {
  const totalWatts = calculateTotalWatts(devices);
  const perRoom = calculatePerRoomWatts(devices);

  return {
    totalWatts,
    estimatedKwhToday: totalWatts * (Math.random() * 0.1 + 0.05),
    perRoom,
  };
}

const alertMessages: Record<string, Record<string, string>> = {
  'after-hours': {
    'drawing-room': 'Device still running after hours in Drawing Room',
    'work-room-1': 'Device still running after hours in Work Room 1',
    'work-room-2': 'Device still running after hours in Work Room 2',
  },
  'extended-on': {
    'drawing-room': 'Device running for extended period in Drawing Room',
    'work-room-1': 'Device running for extended period in Work Room 1',
    'work-room-2': 'Device running for extended period in Work Room 2',
  },
  'high-power': {
    'drawing-room': 'High power consumption detected in Drawing Room',
    'work-room-1': 'High power consumption detected in Work Room 1',
    'work-room-2': 'High power consumption detected in Work Room 2',
  },
};

function generateRandomAlert(): Alert {
  const types = ['after-hours', 'extended-on', 'high-power'] as const;
  const type = types[Math.floor(Math.random() * types.length)];
  const room = ROOMS[Math.floor(Math.random() * ROOMS.length)];

  return {
    id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    room,
    message: alertMessages[type][room],
    triggeredAt: new Date().toISOString(),
  };
}

export function startMockSimulation() {
  const deviceStore = useDeviceStore.getState();
  const alertStore = useAlertStore.getState();
  const powerStore = usePowerStore.getState();

  // Initialize devices
  const initialDevices = createMockDevices();
  deviceStore.setDevices(initialDevices);

  // Initial power summary
  powerStore.setPowerSummary(generatePowerSummary(initialDevices));

  // Device toggle simulation - every 3 seconds
  const deviceInterval = setInterval(() => {
    const currentDevices = useDeviceStore.getState().devices;
    const numToggles = Math.floor(Math.random() * 2) + 1;

    for (let i = 0; i < numToggles; i++) {
      const randomIndex = Math.floor(Math.random() * currentDevices.length);
      const device = currentDevices[randomIndex];
      const newStatus = device.status === 'on' ? 'off' : 'on';

      deviceStore.updateDevice(device.id, {
        status: newStatus,
        lastChanged: new Date().toISOString(),
      });
    }

    // Update power after device changes
    const updatedDevices = useDeviceStore.getState().devices;
    powerStore.setPowerSummary(generatePowerSummary(updatedDevices));
  }, 3000);

  // Alert simulation - every 30 seconds
  const alertInterval = setInterval(() => {
    const alert = generateRandomAlert();
    alertStore.addAlert(alert);
  }, 30000);

  // Power update simulation - every 5 seconds
  const powerInterval = setInterval(() => {
    const currentDevices = useDeviceStore.getState().devices;
    const summary = generatePowerSummary(currentDevices);
    powerStore.setPowerSummary(summary);
  }, 5000);

  return () => {
    clearInterval(deviceInterval);
    clearInterval(alertInterval);
    clearInterval(powerInterval);
  };
}
