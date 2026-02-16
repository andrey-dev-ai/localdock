import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Server } from "../types";

const POLL_INTERVAL = 3000;

export function useServers() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const refresh = useCallback(async () => {
    try {
      const result = await invoke<Server[]>("get_servers");
      setServers(result);
      setLastUpdate(new Date());
    } catch (err) {
      console.error("Failed to get servers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  const killServer = useCallback(
    async (pid: number) => {
      try {
        await invoke<boolean>("kill_server", { pid });
        // Обновить список после kill
        setTimeout(refresh, 500);
      } catch (err) {
        console.error("Failed to kill server:", err);
      }
    },
    [refresh]
  );

  const openInBrowser = useCallback(async (port: number) => {
    try {
      await invoke("open_in_browser", { port });
    } catch (err) {
      console.error("Failed to open browser:", err);
    }
  }, []);

  return {
    servers,
    loading,
    lastUpdate,
    refresh,
    killServer,
    openInBrowser,
  };
}
