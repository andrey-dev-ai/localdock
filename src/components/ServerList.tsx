import type { Server } from "../types";
import { ServerCard } from "./ServerCard";

interface ServerListProps {
  servers: Server[];
  loading: boolean;
  error: string | null;
  onKill: (pid: number) => void;
  onOpen: (port: number) => void;
}

const categoryLabel: Record<string, string> = {
  dev: "Dev Servers",
  app: "Applications",
  system: "System",
};

const categoryColor: Record<string, string> = {
  dev: "text-dock-green",
  app: "text-dock-blue",
  system: "text-dock-muted",
};

const categoryOrder = ["dev", "app", "system"];

export function ServerList({
  servers,
  loading,
  error,
  onKill,
  onOpen,
}: ServerListProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-dock-muted text-sm">
        Сканирование портов...
      </div>
    );
  }

  if (error && servers.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-red-400 px-8">
        <span className="text-2xl mb-3">!</span>
        <p className="text-sm text-center">Ошибка сканирования</p>
        <p className="text-xs text-center mt-1 opacity-60">{error}</p>
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-dock-muted px-8">
        <span className="text-3xl mb-3 opacity-50">⚓</span>
        <p className="text-sm text-center">Нет запущенных серверов</p>
        <p className="text-xs text-center mt-1 opacity-60">
          Запустите dev-сервер и он появится здесь
        </p>
      </div>
    );
  }

  // Группируем по категориям
  const grouped = categoryOrder
    .map((cat) => ({
      category: cat,
      label: categoryLabel[cat] ?? cat,
      items: servers.filter((s) => s.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="flex-1 overflow-y-auto py-2">
      {grouped.map((group) => (
        <div key={group.category}>
          <div className={`px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider ${categoryColor[group.category] ?? "text-dock-muted"}`}>
            {group.label}
            <span className="ml-1.5 opacity-60">{group.items.length}</span>
          </div>
          {group.items.map((server) => (
            <ServerCard
              key={`${server.pid}-${server.port}`}
              server={server}
              onKill={onKill}
              onOpen={onOpen}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
