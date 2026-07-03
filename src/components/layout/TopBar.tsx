import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';

type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

interface TopBarProps {
  connectionStatus: ConnectionStatus;
}

const statusConfig = {
  connected: {
    color: 'bg-success',
    glowColor: '#22c55e',
    text: 'Live',
  },
  reconnecting: {
    color: 'bg-alert',
    glowColor: '#f59e0b',
    text: 'Reconnecting...',
  },
  disconnected: {
    color: 'bg-critical',
    glowColor: '#ef4444',
    text: 'Disconnected',
  },
};

export function TopBar({ connectionStatus }: TopBarProps) {
  const config = statusConfig[connectionStatus];

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-surface border-b border-border">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold text-text-primary">
          Lights, Fans, Discord
        </h1>
        <span className="px-2 py-1 text-xs font-medium bg-primary/20 text-primary rounded">
          Hackathon 2024
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-text-muted">{config.text}</span>
        {connectionStatus === 'connected' ? (
          <Wifi className="w-4 h-4 text-success" />
        ) : (
          <WifiOff className="w-4 h-4 text-critical" />
        )}
        <div className="relative flex items-center justify-center">
          <motion.div
            className={clsx('w-2.5 h-2.5 rounded-full', config.color)}
            animate={
              connectionStatus === 'connected'
                ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }
                : connectionStatus === 'reconnecting'
                ? { scale: [1, 1.5, 1] }
                : {}
            }
            transition={{
              duration: connectionStatus === 'reconnecting' ? 1 : 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              boxShadow:
                connectionStatus === 'connected'
                  ? `0 0 8px ${config.glowColor}`
                  : undefined,
            }}
          />
          {connectionStatus === 'reconnecting' && (
            <motion.div
              className={clsx('absolute w-2.5 h-2.5 rounded-full', config.color)}
              animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
              transition={{ duration: 1, repeat: Infinity, ease: 'easeOut' }}
            />
          )}
        </div>
      </div>
    </header>
  );
}
