import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Server } from "../types";

const POLL_INTERVAL = 3000;
const RETRY_DELAY = 1000;
const MAX_RETRIES = 3;

/** Быстрое сравнение списка серверов по ключевым полям */
function serversKey(list: Server[]): string {
  return list
    .map((s) => `${s.pid}:${s.port}:${s.uptime_seconds}`)
    .join("|");
}

export function useServers() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const retriesRef = useRef(0);
  const retryTimeoutRef = useRef<number | null>(null);
  const isRefreshingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    try {
      const result = await invoke<Server[]>("get_servers");
      // Обновляем стейт только если данные реально изменились
      setServers((prev) => {
        if (serversKey(prev) === serversKey(result)) return prev;
        return result;
      });
      setLastUpdate(new Date());
      setError(null);
      retriesRef.current = 0;
      setLoading(false);
    } catch (err) {
      console.error("Failed to get servers:", err);
      if (retriesRef.current < MAX_RETRIES) {
        retriesRef.current++;
        retryTimeoutRef.current = window.setTimeout(refresh, RETRY_DELAY);
        return;
      }
      setError(String(err));
      setLoading(false);
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  // Пауза polling при скрытом окне
  useEffect(() => {
    refresh();

    let interval: number | null = null;

    const startPolling = () => {
      if (interval) return;
      interval = window.setInterval(() => {
        if (retriesRef.current === 0) {
          refresh();
        }
      }, POLL_INTERVAL);
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        refresh(); // сразу обновить при возврате
        startPolling();
      }
    };

    startPolling();
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibility);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [refresh]);

  const killServer = useCallback(
    async (pid: number): Promise<boolean> => {
      try {
        const result = await invoke<boolean>("kill_server", { pid });
        setTimeout(refresh, 500);
        return result;
      } catch (err) {
        console.error("Failed to kill server:", err);
        throw err;
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
    error,
    lastUpdate,
    refresh,
    killServer,
    openInBrowser,
  };
}
