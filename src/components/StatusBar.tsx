import { useState, useEffect } from "react";
import { enable, disable, isEnabled } from "@tauri-apps/plugin-autostart";
import { Sun, RefreshCw } from "lucide-react";

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
    <div className="px-4 py-2 border-t border-white/[0.04] flex items-center justify-between">
      <span className="text-[11px] text-dock-muted" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
        {formatTime(lastUpdate, now)}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={toggleAutostart}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] transition-all duration-150 cursor-pointer ${
            autostart
              ? "text-dock-green bg-dock-green/10"
              : "text-dock-muted hover:text-dock-text hover:bg-white/[0.06]"
          }`}
          title={autostart ? "Автозапуск увімкнено" : "Автозапуск вимкнено"}
        >
          <Sun size={10} />
          Авто
        </button>
        <button
          onClick={onRefresh}
          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-dock-muted hover:text-dock-text transition-all duration-150 cursor-pointer"
          title="Оновити"
        >
          <RefreshCw size={12} />
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
