import type { ReactNode } from 'react';

interface DashboardLayoutProps {
  topBar: ReactNode;
  roomGrid: ReactNode;
  powerMeter: ReactNode;
  roomPowerBars: ReactNode;
  powerChart: ReactNode;
  alertPanel: ReactNode;
  floorPlan?: ReactNode;
}

export function DashboardLayout({
  topBar,
  roomGrid,
  powerMeter,
  roomPowerBars,
  powerChart,
  alertPanel,
  floorPlan,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {topBar}

      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
          {/* Left Column - Room Grid */}
          <div>{roomGrid}</div>

          {/* Right Column - Power & Alerts */}
          <div className="space-y-6">
            {powerMeter}
            <div className="space-y-3">{roomPowerBars}</div>
            {powerChart}
            {alertPanel}
          </div>
        </div>

        {/* Floor Plan Placeholder */}
        {floorPlan && (
          <div className="mt-6">
            {floorPlan}
          </div>
        )}
      </div>
    </div>
  );
}
