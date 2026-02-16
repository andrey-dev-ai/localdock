interface HeaderProps {
  serverCount: number;
}

export function Header({ serverCount }: HeaderProps) {
  return (
    <div className="px-4 py-3 border-b border-dock-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚓</span>
          <h1 className="text-base font-semibold tracking-tight">LocalDock</h1>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-dock-muted">
          <span
            className={`w-2 h-2 rounded-full ${serverCount > 0 ? "bg-dock-green" : "bg-dock-red"}`}
          />
          {serverCount} {serverWord(serverCount)}
        </div>
      </div>
    </div>
  );
}

function serverWord(count: number): string {
  if (count === 0) return "серверов";
  if (count === 1) return "сервер";
  if (count >= 2 && count <= 4) return "сервера";
  return "серверов";
}
