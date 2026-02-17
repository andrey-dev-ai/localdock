import { useState } from "react";
import { ChevronRight } from "lucide-react";
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
  app: "text-dock-accent",
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
        <div className="flex flex-col items-center gap-2 animate-fade-in">
          <div className="w-5 h-5 border-2 border-dock-accent/30 border-t-dock-accent rounded-full animate-spin" />
          <span>Сканування портів...</span>
        </div>
      </div>
    );
  }

  if (error && servers.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-dock-red px-8 animate-fade-in">
        <span className="text-2xl mb-3">!</span>
        <p className="text-sm text-center">Помілка сканування</p>
        <p className="text-xs text-center mt-1 opacity-60">{error}</p>
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-dock-muted px-8 animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mb-3">
          <span className="text-2xl opacity-40">⚓</span>
        </div>
        <p className="text-sm text-center">Немає запущених серверів</p>
        <p className="text-xs text-center mt-1 opacity-50">
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
          <div key={group.category} className="animate-fade-in">
            <button
              onClick={() => toggleGroup(group.category)}
              className={`w-full flex items-center gap-1.5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider cursor-pointer hover:bg-white/[0.03] transition-colors ${categoryColor[group.category] ?? "text-dock-muted"}`}
            >
              <ChevronRight
                size={12}
                className={`transition-transform duration-200 ${isCollapsed ? "" : "rotate-90"}`}
              />
              {group.label}
              <span className="opacity-50 ml-1 font-normal">{group.items.length}</span>
            </button>
            {!isCollapsed && (
              <div className="py-0.5">
                {group.items.map((server) => (
                  <ServerCard
                    key={`${server.pid}-${server.port}`}
                    server={server}
                    onKill={onKill}
                    onOpen={onOpen}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
