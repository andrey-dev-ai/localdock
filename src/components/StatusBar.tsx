import { useState, useEffect } from "react";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";

interface StatusBarProps {
  lastUpdate: Date;
  onRefresh: () => void;
}

export function StatusBar({ lastUpdate, onRefresh }: StatusBarProps) {
  const [now, setNow] = useState(new Date());
  const [autostart, setAutostart] = useState(false);

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    isEnabled().then(setAutostart).catch(() => {});
  }, []);

  const toggleAutostart = async () => {
    try {
      if (autostart) {
        await disable();
        setAutostart(false);
      } else {
        await enable();
        setAutostart(true);
      }
    } catch (err) {
      console.error("Autostart toggle failed:", err);
    }
  };

  return (
    <div className="px-4 py-2 border-t border-dock-border flex items-center justify-between">
      <span className="text-[11px] text-dock-muted">
        {formatTime(lastUpdate, now)}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={toggleAutostart}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${
            autostart
              ? "text-dock-green bg-dock-green/10"
              : "text-dock-muted hover:text-dock-text hover:bg-dock-hover"
          }`}
          title={autostart ? "Автозапуск увімкнено" : "Автозапуск вимкнено"}
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
            <path d="M12 2v4" />
            <path d="m16.2 7.8 2.9-2.9" />
            <path d="M18 12h4" />
            <path d="m16.2 16.2 2.9 2.9" />
            <path d="M12 18v4" />
            <path d="m4.9 19.1 2.9-2.9" />
            <path d="M2 12h4" />
            <path d="m4.9 4.9 2.9 2.9" />
          </svg>
          Авто
        </button>
        <button
          onClick={onRefresh}
          className="p-1 rounded hover:bg-dock-hover text-dock-muted hover:text-dock-text transition-colors cursor-pointer"
          title="Оновити"
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
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 16h5v5" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function formatTime(date: Date, now: Date): string {
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 5) return "Щойно";
  if (diff < 60) return `${diff} сек тому`;
  return `${Math.floor(diff / 60)} хв тому`;
}
