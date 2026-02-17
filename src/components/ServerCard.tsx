import { useState } from "react";
import { ExternalLink, Square, Loader2, AlertTriangle } from "lucide-react";
import type { Server } from "../types";

interface ServerCardProps {
  server: Server;
  onKill: (pid: number) => Promise<boolean>;
  onOpen: (port: number) => void;
}

const dotColor: Record<string, string> = {
  dev: "bg-dock-green",
  app: "bg-dock-accent",
  system: "bg-dock-muted",
};

export function ServerCard({ server, onKill, onOpen }: ServerCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [killing, setKilling] = useState(false);
  const [killError, setKillError] = useState<string | null>(null);

  const handleKill = async () => {
    if (server.category === "system") {
      setConfirming(true);
      return;
    }
    await doKill();
  };

  const doKill = async () => {
    setKilling(true);
    setKillError(null);
    try {
      await onKill(server.pid);
    } catch {
      setKillError("Не вдалося зупинити");
      setKilling(false);
    }
  };

  return (
    <div className="mx-3 mb-2 p-3 glass-card rounded-xl transition-all duration-200 hover:scale-[1.01] relative animate-fade-in">
      {confirming && (
        <div className="absolute inset-0 bg-dock-bg/90 backdrop-blur-sm rounded-xl flex items-center justify-center z-10 animate-fade-in-scale">
          <div className="text-center px-4">
            <p className="text-[11px] text-dock-text mb-2">
              Зупинити <span className="font-medium">{server.process_name}</span>?
            </p>
            <p className="text-[10px] text-dock-muted mb-3">Це системний процес</p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setConfirming(false)}
                className="px-3 py-1 rounded-lg text-[11px] text-dock-muted hover:text-dock-text hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                Ні
              </button>
              <button
                onClick={() => {
                  setConfirming(false);
                  doKill();
                }}
                className="px-3 py-1 rounded-lg text-[11px] text-dock-red bg-dock-red/10 hover:bg-dock-red/20 transition-colors cursor-pointer"
              >
                Зупинити
              </button>
            </div>
          </div>
        </div>
      )}

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
        <span className="text-sm font-mono text-dock-accent shrink-0 ml-2" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
          :{server.port}
        </span>
      </div>

      {/* Row 2: description or unknown badge */}
      <div className="ml-4 mb-1.5">
        {killError ? (
          <p className="text-[11px] text-dock-red">{killError}</p>
        ) : server.description ? (
          <p className="text-[11px] text-dock-muted">{server.description}</p>
        ) : (
          <p className="text-[11px] text-amber-500/70 flex items-center gap-1">
            <AlertTriangle size={11} />
            Невідомий процес
          </p>
        )}
      </div>

      {/* Row 3: uptime + action buttons */}
      <div className="flex items-center justify-between ml-4">
        <span className="text-[11px] text-dock-muted" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
          {server.framework ? `${server.framework} · ` : ""}
          {formatUptime(server.uptime_seconds)}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onOpen(server.port)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-dock-green/70 hover:text-dock-green hover:bg-dock-green/10 cursor-pointer transition-all duration-150"
            aria-label="Відкрити в браузері"
          >
            <ExternalLink size={12} />
            Відкрити
          </button>
          <button
            onClick={handleKill}
            disabled={killing}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] cursor-pointer transition-all duration-150 ${
              killing
                ? "text-dock-muted opacity-60 cursor-wait"
                : "text-dock-muted hover:text-dock-red hover:bg-dock-red/10"
            }`}
            aria-label="Зупинити процес"
          >
            {killing ? (
              <Loader2 size={10} className="animate-spin" />
            ) : (
              <Square size={10} />
            )}
            {killing ? "Зупиняю..." : "Стоп"}
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
