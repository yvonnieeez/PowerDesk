import { useAlertStore } from '../store/alertStore';

export function useAlerts() {
  const alerts = useAlertStore((state) => state.alerts);
  const dismissAlert = useAlertStore((state) => state.dismissAlert);

  const sortedAlerts = [...alerts].sort(
    (a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
  );

  return {
    alerts: sortedAlerts,
    dismissAlert,
    hasAlerts: alerts.length > 0,
    alertCount: alerts.length,
  };
}
