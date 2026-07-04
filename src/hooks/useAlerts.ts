import { useMemo } from 'react';
import { useAlertStore } from '../store/alertStore';

export function useAlerts() {
  const alerts = useAlertStore((state) => state.alerts);
  const dismissAlert = useAlertStore((state) => state.dismissAlert);

  const sortedAlerts = useMemo(
    () => [...alerts].sort(
      (a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
    ),
    [alerts]
  );

  return {
    alerts: sortedAlerts,
    dismissAlert,
    hasAlerts: alerts.length > 0,
    alertCount: alerts.length,
  };
}
