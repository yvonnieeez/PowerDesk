import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
} from 'recharts';
import type { PowerReading } from '../../types/power';
import { formatTime } from '../../utils/formatters';

interface PowerChartProps {
  data: PowerReading[];
}

export function PowerChart({ data }: PowerChartProps) {
  const chartData = useMemo(() => {
    return data.map((reading) => ({
      time: formatTime(reading.time),
      watts: reading.watts,
    }));
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="p-4 bg-surface rounded-xl border border-border h-40 flex items-center justify-center">
        <p className="text-sm text-text-muted">No power data yet</p>
      </div>
    );
  }

  const maxWatts = Math.max(...data.map((d) => d.watts), 100);

  return (
    <div className="p-4 bg-surface rounded-xl border border-border">
      <h2 className="text-sm font-medium text-text-muted mb-4">
        Power History
      </h2>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#2d3147"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
              domain={[0, Math.ceil(maxWatts / 50) * 50]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1d27',
                border: '1px solid #2d3147',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
              labelStyle={{ color: '#f1f5f9' }}
              itemStyle={{ color: '#6366f1' }}
              formatter={(value: number) => [`${value}W`, 'Power']}
            />
            <defs>
              <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="watts"
              stroke="none"
              fill="url(#powerGradient)"
              fillOpacity={1}
            />
            <Line
              type="monotone"
              dataKey="watts"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#6366f1' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
