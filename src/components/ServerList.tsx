import { useState } from "react";
import type { Server } from "../types";
import { ServerCard } from "./ServerCard";

interface ServerListProps {
  servers: Server[];
  loading: boolean;
  error: string | null;
  onKill: (pid: number) => Promise<boolean>;
  onOpen: (port: number) => void;
}

const categoryLabel: Record<string, string> = {
  dev: "Dev-сервери",
  app: "Додатки",
  system: "Системні",
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
  // system свёрнута по умолчанию
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set(["system"]));

  const toggleGroup = (cat: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-dock-muted text-sm">
        Сканування портів...
      </div>
    );
  }

  if (error && servers.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-red-400 px-8">
        <span className="text-2xl mb-3">!</span>
        <p className="text-sm text-center">Помилка сканування</p>
        <p className="text-xs text-center mt-1 opacity-60">{error}</p>
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-dock-muted px-8">
        <span className="text-3xl mb-3 opacity-50">⚓</span>
        <p className="text-sm text-center">Немає запущених серверів</p>
        <p className="text-xs text-center mt-1 opacity-60">
          Запустіть dev-сервер і він з'явиться тут
        </p>
      </div>
    );
  }

  const grouped = categoryOrder
    .map((cat) => ({
      category: cat,
      label: categoryLabel[cat] ?? cat,
      items: servers.filter((s) => s.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="flex-1 overflow-y-auto py-2">
      {grouped.map((group) => {
        const isCollapsed = collapsed.has(group.category);
        return (
          <div key={group.category}>
            <button
              onClick={() => toggleGroup(group.category)}
              className={`w-full flex items-center gap-1 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-dock-hover/30 transition-colors ${categoryColor[group.category] ?? "text-dock-muted"}`}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-transform ${isCollapsed ? "" : "rotate-90"}`}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              {group.label}
              <span className="opacity-60 ml-1">{group.items.length}</span>
            </button>
            {!isCollapsed &&
              group.items.map((server) => (
                <ServerCard
                  key={`${server.pid}-${server.port}`}
                  server={server}
                  onKill={onKill}
                  onOpen={onOpen}
                />
              ))}
          </div>
        );
      })}
    </div>
  );
}
