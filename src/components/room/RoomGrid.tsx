import type { Device } from '../../types/device';
import { RoomCard } from './RoomCard';
import { groupByRoom } from '../../utils/deviceHelpers';
import { useAlertStore } from '../../store/alertStore';
import { SkeletonDeviceCard } from '../device/DeviceCard';

interface RoomGridProps {
  devices: Device[];
  isLoading?: boolean;
}

const ROOM_ORDER = ['drawing-room', 'work-room-1', 'work-room-2'];

export function RoomGrid({ devices, isLoading }: RoomGridProps) {
  const alerts = useAlertStore((state) => state.alerts);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {ROOM_ORDER.map((room) => (
          <div key={room} className="p-4 bg-surface rounded-xl border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-32 bg-border rounded animate-pulse" />
              <div className="h-4 w-16 bg-border rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonDeviceCard key={i} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const groupedDevices = groupByRoom(devices);
  const alertRooms = new Set(alerts.map((a) => a.room));

  return (
    <div className="space-y-4">
      {ROOM_ORDER.map((room) => (
        <RoomCard
          key={room}
          room={room}
          devices={groupedDevices[room] || []}
          hasAlert={alertRooms.has(room)}
        />
      ))}
    </div>
  );
}
