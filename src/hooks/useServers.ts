import { useState, useEffect, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Server } from "../types";

const POLL_INTERVAL = 3000;
const RETRY_DELAY = 1000;
const MAX_RETRIES = 3;

export function useServers() {
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const retriesRef = useRef(0);
  const retryTimeoutRef = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const result = await invoke<Server[]>("get_servers");
      setServers(result);
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
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(() => {
      if (retriesRef.current === 0) {
        refresh();
      }
    }, POLL_INTERVAL);
    return () => {
      clearInterval(interval);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [refresh]);

  const killServer = useCallback(
    async (pid: number) => {
      try {
        await invoke<boolean>("kill_server", { pid });
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
    error,
    lastUpdate,
    refresh,
    killServer,
    openInBrowser,
  };
}
