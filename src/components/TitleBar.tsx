import { getCurrentWindow } from "@tauri-apps/api/window";
import { Anchor, Minus, X } from "lucide-react";

interface TitleBarProps {
  serverCount: number;
}

export function TitleBar({ serverCount }: TitleBarProps) {
  const appWindow = getCurrentWindow();

  return (
    <div
      data-tauri-drag-region
      className="flex items-center justify-between px-3 py-2 select-none"
    >
      {/* Left: logo + name */}
      <div className="flex items-center gap-2" data-tauri-drag-region>
        <Anchor size={16} className="text-dock-accent" />
        <h1 className="text-sm font-semibold text-gradient tracking-tight">
          LocalDock
        </h1>
        {serverCount > 0 && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-dock-accent/10 text-dock-accent">
            {serverCount}
          </span>
        )}
      </div>

      {/* Right: window controls */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => appWindow.minimize()}
          className="p-1.5 rounded-md hover:bg-white/[0.08] text-dock-muted hover:text-dock-text transition-colors"
          aria-label="Згорнути"
        >
          <Minus size={14} />
        </button>
        <button
          onClick={() => appWindow.close()}
          className="p-1.5 rounded-md hover:bg-dock-red/20 text-dock-muted hover:text-dock-red transition-colors"
          aria-label="Закрити"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
