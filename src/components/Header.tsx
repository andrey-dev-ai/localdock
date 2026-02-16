interface HeaderProps {
  serverCount: number;
}

export function Header({ serverCount }: HeaderProps) {
  return (
    <div className="px-4 py-3 border-b border-dock-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-dock-blue"
          >
            <circle cx="12" cy="5" r="3" />
            <line x1="12" y1="8" x2="12" y2="22" />
            <path d="M5 12H2a10 10 0 0 0 20 0h-3" />
          </svg>
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
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) return "серверов";
  if (mod10 === 1) return "сервер";
  if (mod10 >= 2 && mod10 <= 4) return "сервера";
  return "серверов";
}
