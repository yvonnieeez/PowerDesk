import { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';
import { Zap } from 'lucide-react';
import { formatKwh } from '../../utils/formatters';

interface PowerMeterProps {
  totalWatts: number;
  estimatedKwh: number;
}

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const spring = useSpring(value, { stiffness: 100, damping: 30, mass: 1 });

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (latest) => {
      setDisplayValue(Math.round(latest));
    });
    return unsubscribe;
  }, [spring]);

  return <span>{displayValue}</span>;
}

export function PowerMeter({ totalWatts, estimatedKwh }: PowerMeterProps) {
  return (
    <div className="p-6 bg-surface rounded-xl border border-border">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-primary" />
        <h2 className="text-sm font-medium text-text-muted">
          Live Office Power Draw
        </h2>
      </div>

      <div className="flex items-baseline gap-3">
        <span className="font-mono text-5xl font-bold text-text-primary tracking-tight">
          <AnimatedNumber value={totalWatts} />
        </span>
        <span className="text-2xl text-text-muted font-light">W</span>
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="ml-2"
        >
          <Zap className="w-6 h-6 text-primary" />
        </motion.div>
      </div>

      <p className="mt-4 text-sm text-text-muted">
        Today's estimated usage:{' '}
        <span className="font-mono text-text-primary">
          {formatKwh(estimatedKwh)}
        </span>
      </p>
    </div>
  );
}
