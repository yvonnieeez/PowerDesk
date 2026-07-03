import { create } from 'zustand';
import type { Device } from '../types/device';

interface DeviceStore {
  devices: Device[];
  lastUpdated: string | null;
  setDevices: (devices: Device[]) => void;
  updateDevice: (id: string, updates: Partial<Device>) => void;
}

export const useDeviceStore = create<DeviceStore>((set) => ({
  devices: [],
  lastUpdated: null,
  setDevices: (devices) =>
    set({
      devices,
      lastUpdated: new Date().toISOString(),
    }),
  updateDevice: (id, updates) =>
    set((state) => ({
      devices: state.devices.map((device) =>
        device.id === id ? { ...device, ...updates } : device
      ),
      lastUpdated: new Date().toISOString(),
    })),
}));
