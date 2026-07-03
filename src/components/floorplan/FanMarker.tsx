import { useState } from 'react';
import { FanIcon } from '../device/FanIcon';

interface FanMarkerProps {
  x: number;
  y: number;
  isOn: boolean;
  label: string;
  deviceName: string;
  watts: number;
  speed?: 'slow' | 'normal' | 'fast';
}

export function FanMarker({ x, y, isOn, label, deviceName, watts, speed = 'normal' }: FanMarkerProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <g
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{ cursor: 'pointer' }}
    >
      <g transform={`translate(${x - 14}, ${y - 14})`}>
        <FanIcon isOn={isOn} size={28} speed={speed} />
      </g>
      <text
        x={x}
        y={y + 22}
        textAnchor="middle"
        fill="#64748b"
        fontSize="10"
        fontFamily="ui-monospace, monospace"
      >
        {label}
      </text>

      {showTooltip && (
        <g>
          <rect
            x={x - 50}
            y={y - 45}
            width="100"
            height="35"
            rx="4"
            fill="#1a1d27"
            stroke="#2d3147"
            strokeWidth="1"
          />
          <text
            x={x}
            y={y - 32}
            textAnchor="middle"
            fill="#f1f5f9"
            fontSize="10"
            fontFamily="Inter, sans-serif"
            fontWeight="500"
          >
            {deviceName}
          </text>
          <text
            x={x}
            y={y - 20}
            textAnchor="middle"
            fill={isOn ? '#22c55e' : '#64748b'}
            fontSize="9"
            fontFamily="ui-monospace, monospace"
          >
            {isOn ? `${watts}W • ON` : 'OFF'}
          </text>
        </g>
      )}
    </g>
  );
}
