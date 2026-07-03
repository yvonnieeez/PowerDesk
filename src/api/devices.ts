import { apiClient } from './client';
import type { Device } from '../types/device';
import { DevicesArraySchema } from '../types/device';

export async function getDevices(): Promise<Device[]> {
  const response = await apiClient.get('/api/devices');
  return DevicesArraySchema.parse(response.data);
}

export async function getDevicesByRoom(room: string): Promise<Device[]> {
  const response = await apiClient.get(`/api/devices/room/${room}`);
  return DevicesArraySchema.parse(response.data);
}
