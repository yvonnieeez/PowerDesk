import type { Device } from '../types/device';

export function groupByRoom(devices: Device[]): Record<string, Device[]> {
  return devices.reduce((acc, device) => {
    const room = device.room;
    if (!acc[room]) {
      acc[room] = [];
    }
    acc[room].push(device);
    return acc;
  }, {} as Record<string, Device[]>);
}

export function countOn(devices: Device[]): number {
  return devices.filter((device) => device.status === 'on').length;
}

export function totalWatts(devices: Device[]): number {
  return devices
    .filter((device) => device.status === 'on')
    .reduce((sum, device) => sum + device.powerDraw, 0);
}

export function getRoomWatts(devices: Device[], room: string): number {
  return totalWatts(devices.filter((device) => device.room === room));
}
