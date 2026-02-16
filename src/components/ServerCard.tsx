import type { Server } from "../types";

interface ServerCardProps {
  server: Server;
  onKill: (pid: number) => void;
  onOpen: (port: number) => void;
}

const dotColor: Record<string, string> = {
  dev: "bg-dock-green",
  app: "bg-dock-blue",
  system: "bg-dock-muted",
};

export function ServerCard({ server, onKill, onOpen }: ServerCardProps) {
  return (
    <div className="mx-3 mb-2 p-3 bg-dock-card rounded-lg border border-dock-border hover:border-dock-blue/30 transition-colors">
      {/* Row 1: name + port */}
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${dotColor[server.category] ?? "bg-dock-muted"}`}
          />
          <span className="text-sm font-medium truncate">
            {server.project_name}
          </span>
        </div>
        <span className="text-sm font-mono text-dock-blue shrink-0 ml-2">
          :{server.port}
        </span>
      </div>

      {/* Row 2: description or unknown badge */}
      <div className="ml-4 mb-1.5">
        {server.description ? (
          <p className="text-[11px] text-dock-muted">{server.description}</p>
        ) : (
          <p className="text-[11px] text-amber-500/70">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="inline-block mr-1 -mt-px"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Невідомий процес
          </p>
        )}
      </div>

      {/* Row 3: uptime + action buttons */}
      <div className="flex items-center justify-between ml-4">
        <span className="text-[11px] text-dock-muted">
          {server.framework ? `${server.framework} · ` : ""}
          {formatUptime(server.uptime_seconds)}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onOpen(server.port)}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-dock-green/70 hover:text-dock-green hover:bg-dock-green/10 cursor-pointer transition-colors duration-200"
            aria-label="Відкрити в браузері"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Відкрити
          </button>
          <button
            onClick={() => onKill(server.pid)}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-dock-muted hover:text-dock-red hover:bg-dock-red/10 cursor-pointer transition-colors duration-200"
            aria-label="Зупинити процес"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
            Стоп
          </button>
        </div>
      </div>
    </div>
  );
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}с`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}хв`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}г ${mins}хв`;
}
