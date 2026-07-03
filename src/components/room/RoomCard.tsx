import clsx from 'clsx';
import type { Device } from '../../types/device';
import { DeviceCard } from '../device/DeviceCard';
import { totalWatts, countOn } from '../../utils/deviceHelpers';
import { formatRoomName, formatWatts } from '../../utils/formatters';
import { AlertTriangle, Power } from 'lucide-react';

interface RoomCardProps {
  room: string;
  devices: Device[];
  hasAlert?: boolean;
}

export function RoomCard({ room, devices, hasAlert = false }: RoomCardProps) {
  const roomWatts = totalWatts(devices);
  const devicesOn = countOn(devices);
  const totalDevices = devices.length;

  return (
    <div
      id={`room-${room}`}
      className={clsx(
        'p-4 bg-surface rounded-xl border border-border transition-all duration-300',
        hasAlert && 'border-alert/50 bg-alert/5'
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-text-primary">
            {formatRoomName(room)}
          </h3>
          {hasAlert && (
            <AlertTriangle className="w-4 h-4 text-alert animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Power className="w-4 h-4 text-text-muted" />
          <span className="font-mono text-sm text-text-muted">
            {formatWatts(roomWatts)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-text-muted">
          {devicesOn}/{totalDevices} devices on
        </span>
        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{
              width: `${(devicesOn / totalDevices) * 100}%`,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {devices.map((device) => (
          <DeviceCard key={device.id} device={device} />
        ))}
      </div>
    </div>
  );
}
