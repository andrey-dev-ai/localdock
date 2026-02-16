import type { Server } from "../types";
import { ServerCard } from "./ServerCard";

interface ServerListProps {
  servers: Server[];
  loading: boolean;
  onKill: (pid: number) => void;
  onOpen: (port: number) => void;
}

export function ServerList({ servers, loading, onKill, onOpen }: ServerListProps) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-dock-muted text-sm">
        Сканирование портов...
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

  return (
    <div className="flex-1 overflow-y-auto py-2">
      {servers.map((server) => (
        <ServerCard
          key={`${server.pid}-${server.port}`}
          server={server}
          onKill={onKill}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
