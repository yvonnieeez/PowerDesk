import { motion } from 'framer-motion';

interface RoomOverlayProps {
  x: number;
  y: number;
  width: number;
  height: number;
  room: string;
  hasAlert: boolean;
  onClick?: () => void;
}

export function RoomOverlay({ x, y, width, height, room, hasAlert, onClick }: RoomOverlayProps) {
  return (
    <motion.rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={hasAlert ? '#f59e0b' : '#6366f1'}
      fillOpacity={hasAlert ? 0.15 : 0}
      initial={{ fillOpacity: 0 }}
      animate={hasAlert ? { fillOpacity: [0.1, 0.2, 0.1] } : { fillOpacity: 0 }}
      transition={{ duration: 2, repeat: hasAlert ? Infinity : 0 }}
      whileHover={{ fillOpacity: 0.1 }}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
      data-room={room}
    />
  );
}
