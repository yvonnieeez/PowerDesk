import { useState } from 'react';
import { motion } from 'framer-motion';

interface LightMarkerProps {
  x: number;
  y: number;
  isOn: boolean;
  label: string;
  deviceName: string;
  watts: number;
}

export function LightMarker({ x, y, isOn, label, deviceName, watts }: LightMarkerProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <g
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      style={{ cursor: 'pointer' }}
    >
      <motion.circle
        cx={x}
        cy={y}
        r={10}
        fill={isOn ? '#fbbf24' : '#374151'}
        style={{
          filter: isOn
            ? 'drop-shadow(0 0 6px #fbbf24) drop-shadow(0 0 12px #f59e0b)'
            : undefined,
          opacity: isOn ? 1 : 0.4,
        }}
        animate={isOn ? { scale: [1, 1.1, 1] } : { scale: 1 }}
        transition={{ duration: 2.5, repeat: isOn ? Infinity : 0, ease: 'easeInOut' }}
      />
      {isOn && (
        <circle
          cx={x}
          cy={y}
          r={5}
          fill="#fcd34d"
          opacity="0.8"
        />
      )}
      <text
        x={x}
        y={y + 20}
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
