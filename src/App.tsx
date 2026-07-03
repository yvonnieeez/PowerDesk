import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { TopBar } from './components/layout/TopBar';
import { RoomGrid } from './components/room/RoomGrid';
import { PowerMeter } from './components/power/PowerMeter';
import { RoomPowerBar } from './components/power/RoomPowerBar';
import { PowerChart } from './components/power/PowerChart';
import { AlertPanel } from './components/alerts/AlertPanel';
import { FloorPlan } from './components/floorplan/FloorPlan';
import { useDevices } from './hooks/useDevices';
import { useAlerts } from './hooks/useAlerts';
import { usePowerStore } from './store/powerStore';
import { useOfficeSocket } from './ws/useOfficeSocket';
import { startMockSimulation } from './mock/mockData';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const ROOM_ORDER = ['drawing-room', 'work-room-1', 'work-room-2'];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Dashboard() {
  const { devices, isLoading, error, refetch } = useDevices();
  const { alerts, dismissAlert, alertCount } = useAlerts();
  const powerSummary = usePowerStore((state) => state.powerSummary);
  const powerHistory = usePowerStore((state) => state.powerHistory);
  const { status: connectionStatus } = useOfficeSocket();

  // Start mock simulation to provide data when backend is not available
  useEffect(() => {
    const cleanup = startMockSimulation();
    return cleanup;
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface p-8 rounded-xl border border-border max-w-md text-center"
        >
          <AlertCircle className="w-12 h-12 text-critical mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            Couldn't load office data
          </h2>
          <p className="text-text-muted mb-6">
            Is the backend running? Check your connection settings.
          </p>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </motion.div>
      </div>
    );
  }

  const totalWatts = powerSummary?.totalWatts ?? 0;
  const estimatedKwh = powerSummary?.estimatedKwhToday ?? 0;
  const perRoom = powerSummary?.perRoom ?? {};

  return (
    <DashboardLayout
      topBar={<TopBar connectionStatus={connectionStatus} />}
      roomGrid={<RoomGrid devices={devices} isLoading={isLoading} />}
      powerMeter={
        <PowerMeter totalWatts={totalWatts} estimatedKwh={estimatedKwh} />
      }
      roomPowerBars={
        <>
          {ROOM_ORDER.map((room) => (
            <RoomPowerBar
              key={room}
              room={room}
              watts={perRoom[room] ?? 0}
              totalWatts={totalWatts}
            />
          ))}
        </>
      }
      powerChart={<PowerChart data={powerHistory} />}
      alertPanel={
        <AlertPanel
          alerts={alerts}
          onDismiss={dismissAlert}
          alertCount={alertCount}
        />
      }
      floorPlan={
        <div className="hidden md:block">
          <FloorPlan />
        </div>
      }
    />
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}

export default App;
