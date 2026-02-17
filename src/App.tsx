import { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { ServerList } from "./components/ServerList";
import { StatusBar } from "./components/StatusBar";
import { useServers } from "./hooks/useServers";

export default function App() {
  const { servers, loading, error, lastUpdate, refresh, killServer, openInBrowser } =
    useServers();
  const [filter, setFilter] = useState("");

  // Ctrl+K для фокуса на поиск
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
      e.preventDefault();
      document.getElementById("server-filter")?.focus();
    }
    if (e.key === "Escape") {
      setFilter("");
      (document.activeElement as HTMLElement)?.blur();
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const filtered = filter
    ? servers.filter(
        (s) =>
          s.project_name.toLowerCase().includes(filter.toLowerCase()) ||
          s.process_name.toLowerCase().includes(filter.toLowerCase()) ||
          String(s.port).includes(filter)
      )
    : servers;

  return (
    <div className="h-screen flex flex-col bg-dock-bg">
      <Header serverCount={servers.length} />
      {servers.length > 0 && (
        <div className="px-3 pb-1">
          <div className="relative">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dock-muted"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              id="server-filter"
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Фільтр (Ctrl+K)"
              className="w-full bg-dock-card border border-dock-border rounded pl-8 pr-2 py-1.5 text-[11px] text-dock-text placeholder:text-dock-muted/50 focus:outline-none focus:border-dock-blue/40"
            />
          </div>
        </div>
      )}
      <ServerList
        servers={filtered}
        loading={loading}
        error={error}
        onKill={killServer}
        onOpen={openInBrowser}
      />
      <StatusBar lastUpdate={lastUpdate} onRefresh={refresh} />
    </div>
  );
}
