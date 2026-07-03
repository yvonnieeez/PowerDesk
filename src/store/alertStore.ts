import { create } from 'zustand';
import type { Alert } from '../types/alert';

interface AlertStore {
  alerts: Alert[];
  addAlert: (alert: Alert) => void;
  dismissAlert: (id: string) => void;
}

const MAX_ALERTS = 20;

export const useAlertStore = create<AlertStore>((set) => ({
  alerts: [],
  addAlert: (alert) =>
    set((state) => {
      const newAlerts = [alert, ...state.alerts].slice(0, MAX_ALERTS);
      return { alerts: newAlerts };
    }),
  dismissAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.filter((alert) => alert.id !== id),
    })),
}));
