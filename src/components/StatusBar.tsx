import { useState, useEffect } from "react";

interface StatusBarProps {
  lastUpdate: Date;
  onRefresh: () => void;
}

export function StatusBar({ lastUpdate, onRefresh }: StatusBarProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  return (
    <div className="px-4 py-2 border-t border-dock-border flex items-center justify-between">
      <span className="text-[11px] text-dock-muted">
        {formatTime(lastUpdate, now)}
      </span>
      <button
        onClick={onRefresh}
        className="p-1 rounded hover:bg-dock-hover text-dock-muted hover:text-dock-text transition-colors cursor-pointer"
        title="Обновить"
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
  );
}

function formatTime(date: Date, now: Date): string {
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 5) return "Только что";
  if (diff < 60) return `${diff} сек назад`;
  return `${Math.floor(diff / 60)} мин назад`;
}
