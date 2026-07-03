import { motion } from 'framer-motion';

interface FanIconProps {
  isOn: boolean;
  size?: number;
  speed?: 'slow' | 'normal' | 'fast';
}

const speedDurations = {
  slow: 1.5,
  normal: 1,
  fast: 0.6,
};

export function FanIcon({ isOn, size = 24, speed = 'normal' }: FanIconProps) {
  const duration = speedDurations[speed];
  const bladeColor = isOn ? '#38bdf8' : '#64748b';
  const hubColor = isOn ? '#0ea5e9' : '#475569';
  const opacity = isOn ? 1 : 0.4;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{
        filter: isOn ? 'drop-shadow(0 2px 4px rgba(56, 189, 248, 0.3))' : undefined,
        opacity
      }}
    >
      <defs>
        <filter id="fanGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#38bdf8" floodOpacity="0.5" />
        </filter>
        <linearGradient id="bladeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={bladeColor} stopOpacity="1" />
          <stop offset="100%" stopColor={bladeColor} stopOpacity="0.7" />
        </linearGradient>
      </defs>

      <motion.g
        animate={isOn ? { rotate: 360 } : { rotate: 0 }}
        transition={{
          duration,
          repeat: isOn ? Infinity : 0,
          ease: 'linear',
        }}
        style={{ transformOrigin: '12px 12px' }}
        filter={isOn ? 'url(#fanGlow)' : undefined}
      >
        {/* Blade 1 - Top */}
        <path
          d="M12 12
             C12 10.5, 11.5 6, 12 3
             C12.5 6, 13 10.5, 12 12"
          fill="url(#bladeGradient)"
        />

        {/* Blade 2 - Right */}
        <path
          d="M12 12
             C13.5 12, 18 11.5, 21 12
             C18 12.5, 13.5 13, 12 12"
          fill="url(#bladeGradient)"
        />

        {/* Blade 3 - Bottom */}
        <path
          d="M12 12
             C12 13.5, 11.5 18, 12 21
             C12.5 18, 13 13.5, 12 12"
          fill="url(#bladeGradient)"
        />

        {/* Blade 4 - Left */}
        <path
          d="M12 12
             C10.5 12, 6 11.5, 3 12
             C6 12.5, 10.5 13, 12 12"
          fill="url(#bladeGradient)"
        />
      </motion.g>

      {/* Center Hub */}
      <circle cx="12" cy="12" r="3" fill={hubColor} />
      <circle cx="12" cy="12" r="1.5" fill={isOn ? '#bae6fd' : '#64748b'} />
    </svg>
  );
}
