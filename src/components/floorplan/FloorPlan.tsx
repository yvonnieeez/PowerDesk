/* Hallmark · FloorPlan · v1 · layout: full-spec · devices: 15 · furniture: spec-match */

import { useMemo, memo } from 'react';
import { useDeviceStore } from '../../store/deviceStore';
import { useAlertStore } from '../../store/alertStore';
import { isDeviceOn } from '../../types/device';
import { RoomOverlay } from './RoomOverlay';
import { FanMarker } from './FanMarker';
import { LightMarker } from './LightMarker';
import { FanIcon } from '../device/FanIcon';
import { formatRoomName } from '../../utils/formatters';

const ROOM_CONFIG = [
  { id: 'drawing-room', x: 10, y: 10, width: 295, height: 420 },
  { id: 'work-room-1', x: 305, y: 10, width: 295, height: 420 },
  { id: 'work-room-2', x: 600, y: 10, width: 280, height: 420 },
];

const DEVICE_POSITIONS = {
  'drawing-room': {
    fans: [
      { x: 155, y: 80, label: 'F1' },
      { x: 155, y: 310, label: 'F2' },
    ],
    lights: [
      { x: 60, y: 60, label: 'L1' },
      { x: 255, y: 60, label: 'L2' },
      { x: 157, y: 190, label: 'L3' },
    ],
  },
  'work-room-1': {
    fans: [
      { x: 452, y: 80, label: 'F1' },
      { x: 452, y: 310, label: 'F2' },
    ],
    lights: [
      { x: 355, y: 60, label: 'L1' },
      { x: 550, y: 60, label: 'L2' },
      { x: 452, y: 390, label: 'L3' },
    ],
  },
  'work-room-2': {
    fans: [
      { x: 740, y: 80, label: 'F1' },
      { x: 740, y: 310, label: 'F2' },
    ],
    lights: [
      { x: 640, y: 60, label: 'L1' },
      { x: 835, y: 60, label: 'L2' },
      { x: 740, y: 390, label: 'L3' },
    ],
  },
};

function scrollToRoom(roomId: string) {
  const element = document.getElementById(`room-${roomId}`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function Desk({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width={80} height={55} fill="var(--color-text-muted)" opacity="0.12" rx="2" />
      <rect x={x + 5} y={y + 5} width={70} height={20} fill="var(--color-bg)" opacity="0.6" rx="1" />
      <rect x={x + 30} y={y - 2} width={20} height={7} fill="var(--color-text-muted)" opacity="0.25" rx="1" />
      <rect x={x + 30} y={y + 60} width={20} height={15} fill="var(--color-text-muted)" opacity="0.15" rx="3" />
    </g>
  );
}

export const FloorPlan = memo(function FloorPlan() {
  const devices = useDeviceStore((state) => state.devices);
  const alerts = useAlertStore((state) => state.alerts);

  const alertRooms = useMemo(() => new Set(alerts.map((a) => a.room)), [alerts]);

  const devicesByRoom = useMemo(() => {
    const grouped: Record<string, typeof devices> = {};
    for (const d of devices) {
      if (!grouped[d.room]) grouped[d.room] = [];
      grouped[d.room].push(d);
    }
    return grouped;
  }, [devices]);

  return (
    <div className="bg-surface rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-medium text-text-primary uppercase tracking-wide">
          Floor Plan — Live View
        </h2>
      </div>

      <div className="flex gap-4">
      <div className="flex-1 min-w-0 overflow-hidden">
          <svg
            viewBox="0 0 900 520"
            width="100%"
            className="block"
            style={{ minWidth: '320px' }}
          >

            {/* Background / Building */}
            <rect x="0" y="0" width="900" height="520" fill="var(--color-bg)" rx="6" />
            <rect x="10" y="10" width="870" height="470" fill="none" stroke="var(--color-border)" strokeWidth="2" rx="4" />

          {/* Room dividers */}
          <line x1="305" y1="10" x2="305" y2="430" stroke="var(--color-border)" strokeWidth="1.5" />
          <line x1="600" y1="10" x2="600" y2="430" stroke="var(--color-border)" strokeWidth="1.5" />

          {/* Corridor floor line */}
          <line x1="10" y1="430" x2="880" y2="430" stroke="var(--color-border)" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Rooms */}
          {ROOM_CONFIG.map((room) => (
            <g key={room.id}>
              <rect
                x={room.x}
                y={room.y}
                width={room.width}
                height={room.height}
                fill="var(--color-surface)"
                rx="0"
              />

              <text
                x={room.x + room.width / 2}
                y={200}
                textAnchor="middle"
                fill="var(--color-text-primary)"
                fontSize="11"
                fontFamily="'Geist Sans', system-ui, sans-serif"
                fontWeight="500"
              >
                {formatRoomName(room.id)}
              </text>

              {/* Door arcs — one per room, centered at spec coordinates */}
              {room.id === 'drawing-room' && (
                <path d="M 120 430 A 30 30 0 0 0 90 400" fill="none" stroke="var(--color-border)" strokeWidth="1.5" />
              )}
              {room.id === 'work-room-1' && (
                <path d="M 410 430 A 30 30 0 0 0 380 400" fill="none" stroke="var(--color-border)" strokeWidth="1.5" />
              )}
              {room.id === 'work-room-2' && (
                <path d="M 705 430 A 30 30 0 0 0 675 400" fill="none" stroke="var(--color-border)" strokeWidth="1.5" />
              )}

              {/* Furniture - Drawing Room */}
              {room.id === 'drawing-room' && (
                <g>
                  {/* Sofa */}
                  <rect x="20" y="270" width="110" height="50" rx="4" fill="var(--color-text-muted)" opacity="0.15" />
                  {/* Coffee table */}
                  <rect x="50" y="330" width="60" height="35" rx="2" fill="var(--color-text-muted)" opacity="0.12" />
                  {/* Armchair */}
                  <rect x="20" y="350" width="55" height="45" rx="4" fill="var(--color-text-muted)" opacity="0.15" />
                  {/* Plant TL */}
                  <circle cx="35" cy="35" r="10" fill="var(--color-success)" opacity="0.25" />
                  <line x1="35" y1="35" x2="35" y2="48" stroke="var(--color-success)" strokeWidth="2" opacity="0.3" />
                  {/* Plant BL */}
                  <circle cx="35" cy="415" r="10" fill="var(--color-success)" opacity="0.25" />
                  <line x1="35" y1="415" x2="35" y2="428" stroke="var(--color-success)" strokeWidth="2" opacity="0.3" />
                </g>
              )}

              {/* Furniture - Work Room 1 */}
              {room.id === 'work-room-1' && (
                <g>
                  <Desk x={room.x + 20} y={145} />
                  <Desk x={room.x + 165} y={145} />
                  <Desk x={room.x + 20} y={275} />
                  <Desk x={room.x + 165} y={275} />
                  {/* Plant BC */}
                  <circle cx={room.x + 147} cy={415} r="10" fill="var(--color-success)" opacity="0.25" />
                  <line x1={room.x + 147} y1={415} x2={room.x + 147} y2={428} stroke="var(--color-success)" strokeWidth="2" opacity="0.3" />
                </g>
              )}

              {/* Furniture - Work Room 2 */}
              {room.id === 'work-room-2' && (
                <g>
                  <Desk x={room.x + 20} y={145} />
                  <Desk x={room.x + 165} y={145} />
                  <Desk x={room.x + 20} y={275} />
                  <Desk x={room.x + 165} y={275} />
                  {/* Water cooler */}
                  <rect x="838" y="401" width="24" height="18" rx="2" fill="var(--color-text-muted)" opacity="0.15" />
                  <circle cx="850" cy="395" r="6" fill="var(--color-border)" opacity="0.5" />
                  {/* Plant BR */}
                  <circle cx="860" cy="415" r="10" fill="var(--color-success)" opacity="0.25" />
                  <line x1="860" y1="415" x2="860" y2="428" stroke="var(--color-success)" strokeWidth="2" opacity="0.3" />
                </g>
              )}

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

          {/* Windows */}
          <rect x="10" y="80" width="6" height="80" fill="var(--color-border)" rx="1" />
          <rect x="760" y="474" width="80" height="6" fill="var(--color-border)" rx="1" />

          {/* Device Markers */}
          {ROOM_CONFIG.map((room) => {
            const positions = DEVICE_POSITIONS[room.id];
            const roomDevices = devicesByRoom[room.id] || [];

            return (
              <g key={`markers-${room.id}`}>
                {positions.fans.map((pos, index) => {
                  const device = roomDevices.find(
                    (d) => d.type === 'fan' && d.name === `Fan ${index + 1}`
                  );
                  return device ? (
                    <FanMarker
                      key={`fan-${room.id}-${index}`}
                      x={pos.x}
                      y={pos.y}
                      isOn={isDeviceOn(device.status)}
                      label={pos.label}
                      deviceName={device.name}
                      watts={device.powerDraw}
                      lastChanged={device.lastChanged}
                    />
                  ) : null;
                })}

                {positions.lights.map((pos, index) => {
                  const device = roomDevices.find(
                    (d) => d.type === 'light' && d.name === `Light ${index + 1}`
                  );
                  return device ? (
                    <LightMarker
                      key={`light-${room.id}-${index}`}
                      x={pos.x}
                      y={pos.y}
                      isOn={isDeviceOn(device.status)}
                      label={pos.label}
                      deviceName={device.name}
                      watts={device.powerDraw}
                      lastChanged={device.lastChanged}
                    />
                  ) : null;
                })}
              </g>
            );
          })}

          {/* Entry label */}
          <text
            x="450"
            y="510"
            textAnchor="middle"
            fill="var(--color-text-muted)"
            fontSize="10"
            fontFamily="'JetBrains Mono', monospace"
            letterSpacing="0.2em"
          >
            ↑ ENTRY
          </text>

          {/* Bottom panel — Room Summary */}
          <g transform="translate(0, 490)">
            <rect x="10" y="0" width="870" height="30" fill="var(--color-bg)" rx="4" />
            {ROOM_CONFIG.map((room, i) => {
              const roomDevices = devicesByRoom[room.id] || [];
              const fansTotal = roomDevices.filter((d) => d.type === 'fan').length;
              const fansOn = roomDevices.filter((d) => d.type === 'fan' && isDeviceOn(d.status)).length;
              const lightsTotal = roomDevices.filter((d) => d.type === 'light').length;
              const lightsOn = roomDevices.filter((d) => d.type === 'light' && isDeviceOn(d.status)).length;
              const cellX = room.x + room.width / 2 + 10;
              return (
                <g key={`summary-${room.id}`}>
                  <text
                    x={cellX}
                    y="12"
                    textAnchor="middle"
                    fill="var(--color-text-primary)"
                    fontSize="8"
                    fontFamily="'Geist Sans', system-ui, sans-serif"
                    fontWeight="500"
                  >
                    {formatRoomName(room.id)}
                  </text>
                  <text
                    x={cellX}
                    y="22"
                    textAnchor="middle"
                    fill="var(--color-text-muted)"
                    fontSize="7"
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    Fans {fansOn}/{fansTotal} · Lights {lightsOn}/{lightsTotal}
                  </text>
                  {i < ROOM_CONFIG.length - 1 && (
                    <line x1={room.x + room.width + 10} y1="4" x2={room.x + room.width + 10} y2="24" stroke="var(--color-border)" strokeWidth="1" />
                  )}
                </g>
              );
            })}
          </g>

        </svg>

        <div className="md:hidden mt-4 text-center">
          <p className="text-xs text-text-muted">
            Floor plan available on desktop
          </p>
        </div>
      </div>

      {/* Legend — HTML panel beside SVG */}
      <div className="hidden md:block w-28 shrink-0">
        <div className="bg-surface rounded-lg border border-border p-3 space-y-2">
          <p className="text-xs font-medium text-text-primary">Legend</p>

          <div className="flex items-center gap-2">
            <FanIcon isOn={true} size={12} />
            <span className="text-xs text-text-muted">Fan</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="6" fill="var(--color-light-on)" /></svg>
            <span className="text-xs text-text-muted">Light</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M4 12 A 8 8 0 0 0 4 4" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" /></svg>
            <span className="text-xs text-text-muted">Door</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 12 12"><rect x="2" y="2" width="3" height="8" rx="0.5" fill="var(--color-text-muted)" /></svg>
            <span className="text-xs text-text-muted">Window</span>
          </div>

          <hr className="border-border" />

          <p className="text-xs font-medium text-text-muted">Devices</p>
          <div className="text-[11px] text-text-muted font-mono">
            <p>3 Rooms</p>
            <p>6 Fans / 9 Lights</p>
            <p className="font-medium text-text-primary">Total: 15</p>
          </div>

          <hr className="border-border" />

          <p className="text-xs font-medium text-text-muted">Room Usage</p>
          <div className="text-[11px] text-text-muted">
            <p>Drawing – Waiting</p>
            <p>Work 1 – Employees</p>
            <p>Work 2 – Employees</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
});
