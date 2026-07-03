import { memo } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import type { Device } from '../../types/device';
import { formatWatts } from '../../utils/formatters';
import { FanIcon } from './FanIcon';
import { LightIcon } from './LightIcon';

interface DeviceCardProps {
  device: Device;
}

function getFanSpeed(room: string): 'slow' | 'normal' | 'fast' {
  if (room === 'drawing-room') return 'slow';
  if (room === 'work-room-2') return 'fast';
  return 'normal';
}

export const DeviceCard = memo(function DeviceCard({ device }: DeviceCardProps) {
  const isOn = device.status === 'on';
  const fanSpeed = device.type === 'fan' ? getFanSpeed(device.room) : 'normal';

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={clsx(
        'p-2 bg-background rounded-lg border border-border transition-opacity',
        !isOn && 'opacity-60'
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-text-primary truncate">
          {device.name}
        </span>
        <span
          className={clsx(
            'px-1.5 py-0.5 text-[10px] font-medium rounded',
            isOn ? 'bg-success/20 text-success' : 'bg-border text-text-muted'
          )}
        >
          {device.status.toUpperCase()}
        </span>
      </div>

      <div className="flex justify-center mb-1">
        {device.type === 'fan' ? (
          <FanIcon isOn={isOn} size={24} speed={fanSpeed} />
        ) : (
          <LightIcon isOn={isOn} size={24} />
        )}
      </div>

      <div className="text-center">
        <span className="font-mono text-xs text-text-muted">
          {isOn ? formatWatts(device.powerDraw) : '—'}
        </span>
      </div>
    </motion.div>
  );
});

export function SkeletonDeviceCard() {
  return (
    <div className="p-2 bg-background rounded-lg border border-border animate-pulse">
      <div className="flex items-center justify-between mb-1">
        <div className="h-3 w-12 bg-border rounded" />
        <div className="h-3 w-6 bg-border rounded" />
      </div>
      <div className="flex justify-center mb-1">
        <div className="w-6 h-6 bg-border rounded" />
      </div>
      <div className="flex justify-center">
        <div className="h-3 w-8 bg-border rounded" />
      </div>
    </div>
  );
}
