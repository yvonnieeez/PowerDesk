import { useDeviceStore } from '../../store/deviceStore';
import { useAlertStore } from '../../store/alertStore';
import { RoomOverlay } from './RoomOverlay';
import { FanMarker } from './FanMarker';
import { LightMarker } from './LightMarker';
import { FanIcon } from '../device/FanIcon';
import { formatRoomName } from '../../utils/formatters';

const ROOM_CONFIG = [
  { id: 'drawing-room', x: 10, y: 10, width: 220, height: 320, fanSpeed: 'slow' as const },
  { id: 'work-room-1', x: 240, y: 10, width: 220, height: 320, fanSpeed: 'normal' as const },
  { id: 'work-room-2', x: 470, y: 10, width: 220, height: 320, fanSpeed: 'fast' as const },
];

const DEVICE_POSITIONS: Record<string, { fans: { x: number; y: number; label: string }[]; lights: { x: number; y: number; label: string }[] }> = {
  'drawing-room': {
    fans: [
      { x: 80, y: 90, label: 'F1' },
      { x: 80, y: 230, label: 'F2' },
    ],
    lights: [
      { x: 50, y: 50, label: 'L1' },
      { x: 170, y: 50, label: 'L2' },
      { x: 120, y: 170, label: 'L3' },
    ],
  },
  'work-room-1': {
    fans: [
      { x: 310, y: 90, label: 'F1' },
      { x: 310, y: 230, label: 'F2' },
    ],
    lights: [
      { x: 280, y: 50, label: 'L1' },
      { x: 400, y: 50, label: 'L2' },
      { x: 350, y: 170, label: 'L3' },
    ],
  },
  'work-room-2': {
    fans: [
      { x: 540, y: 90, label: 'F1' },
      { x: 540, y: 230, label: 'F2' },
    ],
    lights: [
      { x: 510, y: 50, label: 'L1' },
      { x: 630, y: 50, label: 'L2' },
      { x: 580, y: 170, label: 'L3' },
    ],
  },
};

function scrollToRoom(roomId: string) {
  const element = document.getElementById(`room-${roomId}`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

export function FloorPlan() {
  const devices = useDeviceStore((state) => state.devices);
  const alerts = useAlertStore((state) => state.alerts);
  const alertRooms = new Set(alerts.map((a) => a.room));

  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-text-primary">
          Office Floor Plan — Live View
        </h2>
      </div>

      <div className="w-full overflow-hidden">
        <svg
          viewBox="0 0 760 340"
          width="100%"
          className="block"
          style={{ minWidth: '320px' }}
        >
          {/* Background */}
          <rect x="0" y="0" width="760" height="340" fill="#0f1117" rx="8" />

          {/* Rooms */}
          {ROOM_CONFIG.map((room) => (
            <g key={room.id}>
              {/* Room rectangle */}
              <rect
                x={room.x}
                y={room.y}
                width={room.width}
                height={room.height}
                fill="#1a1d27"
                stroke="#2d3147"
                strokeWidth="2"
                rx="4"
              />

              {/* Room name label */}
              <text
                x={room.x + room.width / 2}
                y={room.y + 25}
                textAnchor="middle"
                fill="#f1f5f9"
                fontSize="12"
                fontFamily="Inter, sans-serif"
                fontWeight="500"
              >
                {formatRoomName(room.id)}
              </text>

              {/* Door indicator (gap in bottom wall) */}
              <rect
                x={room.x + room.width / 2 - 20}
                y={room.y + room.height - 2}
                width="40"
                height="4"
                fill="#1a1d27"
              />
              <rect
                x={room.x + room.width / 2 - 18}
                y={room.y + room.height - 1}
                width="36"
                height="2"
                fill="#6366f1"
                opacity="0.5"
              />

              {/* Window indicators (top wall) */}
              <rect
                x={room.x + 25}
                y={room.y - 1}
                width="30"
                height="4"
                fill="#64748b"
                rx="1"
              />
              <rect
                x={room.x + room.width - 55}
                y={room.y - 1}
                width="30"
                height="4"
                fill="#64748b"
                rx="1"
              />

              {/* Furniture - Drawing Room */}
              {room.id === 'drawing-room' && (
                <g>
                  {/* Sofa */}
                  <rect x="25" y="250" width="80" height="35" fill="#374151" rx="6" />
                  <rect x="28" y="253" width="74" height="20" fill="#4b5563" rx="4" />
                  {/* Coffee table */}
                  <rect x="40" y="200" width="40" height="25" fill="#374151" rx="3" />
                  {/* Plant */}
                  <circle cx="190" cy="280" r="15" fill="#22c55e" opacity="0.4" />
                  <circle cx="190" cy="280" r="8" fill="#22c55e" opacity="0.6" />
                </g>
              )}

              {/* Furniture - Work Room 1 & 2 */}
              {(room.id === 'work-room-1' || room.id === 'work-room-2') && (
                <g>
                  {/* Desk 1 */}
                  <rect x={room.x + 15} y={room.y + 70} width="60" height="40" fill="#374151" rx="3" />
                  <rect x={room.x + 30} y={room.y + 75} width="30" height="20" fill="#1f2937" rx="2" />
                  {/* Chair 1 */}
                  <rect x={room.x + 30} y={room.y + 115} width="25" height="25" fill="#4b5563" rx="4" />

                  {/* Desk 2 */}
                  <rect x={room.x + 145} y={room.y + 70} width="60" height="40" fill="#374151" rx="3" />
                  <rect x={room.x + 160} y={room.y + 75} width="30" height="20" fill="#1f2937" rx="2" />
                  {/* Chair 2 */}
                  <rect x={room.x + 160} y={room.y + 115} width="25" height="25" fill="#4b5563" rx="4" />
                </g>
              )}

              {/* Room overlay for interaction */}
              <RoomOverlay
                x={room.x}
                y={room.y}
                width={room.width}
                height={room.height}
                room={room.id}
                hasAlert={alertRooms.has(room.id)}
                onClick={() => scrollToRoom(room.id)}
              />
            </g>
          ))}

          {/* Entry area */}
          <rect x="330" y="295" width="100" height="35" fill="#1a1d27" stroke="#2d3147" strokeWidth="2" rx="4" />
          <text x="380" y="318" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="Inter, sans-serif">
            Entry
          </text>

          {/* Device Markers */}
          {ROOM_CONFIG.map((room) => {
            const positions = DEVICE_POSITIONS[room.id];
            const roomDevices = devices.filter((d) => d.room === room.id);

            return (
              <g key={`markers-${room.id}`}>
                {/* Fans */}
                {positions.fans.map((pos, index) => {
                  const device = roomDevices.find(
                    (d) => d.type === 'fan' && d.name === `Fan ${index + 1}`
                  );
                  return device ? (
                    <FanMarker
                      key={`fan-${room.id}-${index}`}
                      x={pos.x}
                      y={pos.y}
                      isOn={device.status === 'on'}
                      label={pos.label}
                      deviceName={device.name}
                      watts={device.powerDraw}
                      speed={room.fanSpeed}
                    />
                  ) : null;
                })}

                {/* Lights */}
                {positions.lights.map((pos, index) => {
                  const device = roomDevices.find(
                    (d) => d.type === 'light' && d.name === `Light ${index + 1}`
                  );
                  return device ? (
                    <LightMarker
                      key={`light-${room.id}-${index}`}
                      x={pos.x}
                      y={pos.y}
                      isOn={device.status === 'on'}
                      label={pos.label}
                      deviceName={device.name}
                      watts={device.powerDraw}
                    />
                  ) : null;
                })}
              </g>
            );
          })}

          {/* Legend */}
          <g transform="translate(650, 290)">
            <text x="0" y="0" fill="#64748b" fontSize="10" fontFamily="Inter, sans-serif">
              Legend
            </text>

            {/* Fan legend */}
            <g transform="translate(0, 15)">
              <FanIcon isOn={true} size={16} />
              <text x="22" y="12" fill="#64748b" fontSize="9" fontFamily="Inter, sans-serif">
                Fan (ON)
              </text>
            </g>

            <g transform="translate(0, 35)">
              <FanIcon isOn={false} size={16} />
              <text x="22" y="12" fill="#64748b" fontSize="9" fontFamily="Inter, sans-serif">
                Fan (OFF)
              </text>
            </g>

            {/* Light legend */}
            <g transform="translate(0, 55)">
              <circle cx="8" cy="8" r="8" fill="#fbbf24" />
              <text x="22" y="12" fill="#64748b" fontSize="9" fontFamily="Inter, sans-serif">
                Light (ON)
              </text>
            </g>

            <g transform="translate(0, 75)">
              <circle cx="8" cy="8" r="8" fill="#374151" opacity="0.4" />
              <text x="22" y="12" fill="#64748b" fontSize="9" fontFamily="Inter, sans-serif">
                Light (OFF)
              </text>
            </g>
          </g>
        </svg>
      </div>

      {/* Mobile message */}
      <div className="md:hidden mt-4 text-center">
        <p className="text-sm text-text-muted">
          Floor plan available on desktop
        </p>
      </div>
    </div>
  );
}
