import { motion } from 'framer-motion';

interface LightIconProps {
  isOn: boolean;
  size?: number;
}

export function LightIcon({ isOn, size = 24 }: LightIconProps) {
  const fillColor = isOn ? '#fbbf24' : '#374151';
  const filamentColor = isOn ? '#fcd34d' : '#4b5563';
  const opacity = isOn ? 1 : 0.3;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{
        filter: isOn
          ? 'drop-shadow(0 0 4px #fbbf24) drop-shadow(0 0 8px #f59e0b)'
          : undefined,
        opacity,
      }}
    >
      <defs>
        <filter id="lightGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#fbbf24" floodOpacity="0.8" />
        </filter>
      </defs>

      {/* Rays when ON */}
      {isOn && (
        <motion.g
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <line x1="12" y1="1" x2="12" y2="4" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          <line x1="4" y1="4" x2="6" y2="6" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <line x1="20" y1="4" x2="18" y2="6" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <line x1="1" y1="12" x2="4" y2="12" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          <line x1="20" y1="12" x2="23" y2="12" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
        </motion.g>
      )}

      {/* Bulb body */}
      <motion.path
        d="M12 3
           C7 3, 4 7, 4 11
           C4 14, 5.5 16.5, 8 18
           L8 20
           C8 21, 9 22, 10 22
           L14 22
           C15 22, 16 21, 16 20
           L16 18
           C18.5 16.5, 20 14, 20 11
           C20 7, 17 3, 12 3
           Z"
        fill={fillColor}
        filter={isOn ? 'url(#lightGlow)' : undefined}
        animate={isOn ? { opacity: [0.85, 1, 0.85] } : { opacity: 0.3 }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Bulb base */}
      <rect x="9" y="18" width="6" height="1.5" fill={isOn ? '#d97706' : '#4b5563'} rx="0.5" />
      <rect x="9.5" y="19.5" width="5" height="1" fill={isOn ? '#b45309' : '#374151'} rx="0.5" />
      <rect x="10" y="20.5" width="4" height="1" fill={isOn ? '#92400e' : '#1f2937'} rx="0.5" />

      {/* Filament */}
      {isOn && (
        <g>
          <motion.path
            d="M10 10 Q11 12, 10 14"
            stroke={filamentColor}
            strokeWidth="1"
            fill="none"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.path
            d="M14 10 Q13 12, 14 14"
            stroke={filamentColor}
            strokeWidth="1"
            fill="none"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
          />
          <line x1="10" y1="10" x2="14" y2="10" stroke={filamentColor} strokeWidth="1" />
        </g>
      )}
    </svg>
  );
}
