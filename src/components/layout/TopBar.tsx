import clsx from 'clsx';

type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

interface TopBarProps {
  connectionStatus: ConnectionStatus;
}

const statusConfig = {
  connected: { color: 'bg-success', text: 'Live' },
  reconnecting: { color: 'bg-alert', text: 'Reconnecting' },
  disconnected: { color: 'bg-critical', text: 'Offline' },
};

export function TopBar({ connectionStatus }: TopBarProps) {
  const config = statusConfig[connectionStatus];

  return (
    <header className="sticky top-0 z-50 w-full bg-surface/90 backdrop-blur-md border-b border-border">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-bold text-text-primary tracking-tight">
            PowerDesk
          </h1>
          <span className="w-px h-4 bg-border" />
          <div className="flex flex-col leading-none">
            <span className="text-[10px] font-semibold text-primary tracking-widest uppercase">
              Techathon Nationals & Rover Summit Hackathon &apos;26
            </span>
            <span className="text-[10px] text-text-muted mt-0.5">
              by <span className="font-semibold text-text-primary">CLI</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 pl-4 border-l border-border">
          <div className={clsx('w-1.5 h-1.5 rounded-full', config.color)} />
          <span className="text-[11px] font-medium text-text-muted">{config.text}</span>
        </div>
      </div>
    </header>
  );
}
