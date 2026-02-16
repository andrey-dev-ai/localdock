import type { Server } from "../types";

interface ServerCardProps {
  server: Server;
  onKill: (pid: number) => void;
  onOpen: (port: number) => void;
}

export function ServerCard({ server, onKill, onOpen }: ServerCardProps) {
  return (
    <div className="mx-3 mb-2 p-3 bg-dock-card rounded-lg border border-dock-border hover:border-dock-blue/30 transition-colors">
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-dock-green shrink-0" />
          <span className="text-sm font-medium truncate">
            {server.project_name}
          </span>
        </div>
        <span className="text-sm font-mono text-dock-blue shrink-0 ml-2">
          :{server.port}
        </span>
      </div>

      <div className="flex items-center justify-between ml-4">
        <span className="text-xs text-dock-muted">
          {server.framework} · {formatUptime(server.uptime_seconds)}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onOpen(server.port)}
            className="p-1.5 rounded hover:bg-dock-hover text-dock-muted hover:text-dock-text transition-colors"
            title="Открыть в браузере"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </button>
          <button
            onClick={() => onKill(server.pid)}
            className="p-1.5 rounded hover:bg-red-500/20 text-dock-muted hover:text-dock-red transition-colors"
            title="Остановить"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}с`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}мин`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}ч ${mins}мин`;
}
