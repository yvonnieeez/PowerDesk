import { motion } from 'framer-motion';
import { Moon, Timer, Zap, X } from 'lucide-react';
import type { Alert } from '../../types/alert';
import { formatRelativeTime, formatRoomName } from '../../utils/formatters';
import clsx from 'clsx';

interface AlertItemProps {
  alert: Alert;
  onDismiss: (id: string) => void;
}

const alertConfig = {
  'after-hours': {
    icon: Moon,
    color: 'border-alert',
    bgColor: 'bg-alert/5',
    iconColor: 'text-alert',
  },
  'extended-on': {
    icon: Timer,
    color: 'border-alert',
    bgColor: 'bg-alert/5',
    iconColor: 'text-alert',
  },
  'high-power': {
    icon: Zap,
    color: 'border-critical',
    bgColor: 'bg-critical/5',
    iconColor: 'text-critical',
  },
};

export function AlertItem({ alert, onDismiss }: AlertItemProps) {
  const config = alertConfig[alert.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={clsx(
        'flex items-start gap-3 p-3 rounded-lg border-l-4 transition-all',
        config.color,
        config.bgColor
      )}
    >
      <Icon className={clsx('w-5 h-5 mt-0.5 flex-shrink-0', config.iconColor)} />

      <div className="flex-1 min-w-0">
        <p className="text-sm text-text-primary">{alert.message}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-text-muted">
            {formatRoomName(alert.room)}
          </span>
          <span className="text-xs text-text-muted">•</span>
          <span className="text-xs text-text-muted">
            {formatRelativeTime(alert.triggeredAt)}
          </span>
        </div>
      </div>

      <button
        onClick={() => onDismiss(alert.id)}
        className="p-1 hover:bg-border rounded transition-colors"
        aria-label="Dismiss alert"
      >
        <X className="w-4 h-4 text-text-muted hover:text-text-primary" />
      </button>
    </motion.div>
  );
}
