import { create } from 'zustand';
import type { PowerSummary, PowerReading } from '../types/power';

interface PowerStore {
  powerSummary: PowerSummary | null;
  powerHistory: PowerReading[];
  setPowerSummary: (summary: PowerSummary) => void;
  addPowerReading: (reading: PowerReading) => void;
}

const MAX_HISTORY = 20;

export const usePowerStore = create<PowerStore>((set, get) => ({
  powerSummary: null,
  powerHistory: [],
  setPowerSummary: (summary) => {
    const newReading: PowerReading = {
      time: new Date().toISOString(),
      watts: summary.totalWatts,
    };
    set({
      powerSummary: summary,
      powerHistory: [...get().powerHistory, newReading].slice(-MAX_HISTORY),
    });
  },
  addPowerReading: (reading) =>
    set((state) => ({
      powerHistory: [...state.powerHistory, reading].slice(-MAX_HISTORY),
    })),
}));
