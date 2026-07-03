import { AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import type { Alert } from '../../types/alert';
import { AlertItem } from './AlertItem';

interface AlertPanelProps {
  alerts: Alert[];
  onDismiss: (id: string) => void;
  alertCount: number;
}

export function AlertPanel({ alerts, onDismiss, alertCount }: AlertPanelProps) {
  return (
    <div className="bg-surface rounded-xl border border-border">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-alert" />
          <h2 className="text-sm font-medium text-text-primary">
            Active Alerts
          </h2>
          {alertCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-alert/20 text-alert rounded-full">
              {alertCount}
            </span>
          )}
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto scrollbar-thin">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <CheckCircle className="w-8 h-8 text-success mb-2" />
            <p className="text-sm text-text-muted text-center">
              No active alerts — All clear!
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            <AnimatePresence mode="popLayout">
              {alerts.map((alert) => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  onDismiss={onDismiss}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
