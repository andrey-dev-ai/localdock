import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { TitleBar } from "./components/TitleBar";
import { ServerList } from "./components/ServerList";
import { StatusBar } from "./components/StatusBar";
import { useServers } from "./hooks/useServers";

export default function App() {
  const { servers, loading, error, lastUpdate, refresh, killServer, openInBrowser } =
    useServers();
  const [filter, setFilter] = useState("");

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
    <div className="h-screen flex flex-col bg-dock-bg rounded-lg overflow-hidden">
      <TitleBar serverCount={servers.length} />

      {servers.length > 0 && (
        <div className="px-3 pb-1">
          <div className="relative">
            <Search
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dock-muted"
            />
            <input
              id="server-filter"
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Фільтр (Ctrl+K)"
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg pl-8 pr-2 py-1.5 text-[11px] text-dock-text placeholder:text-dock-muted/40 focus:outline-none focus:border-dock-accent/40 transition-colors"
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
