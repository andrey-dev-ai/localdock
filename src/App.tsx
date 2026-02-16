import { Header } from "./components/Header";
import { ServerList } from "./components/ServerList";
import { StatusBar } from "./components/StatusBar";
import { useServers } from "./hooks/useServers";

export default function App() {
  const { servers, loading, lastUpdate, refresh, killServer, openInBrowser } =
    useServers();

  return (
    <div className="h-screen flex flex-col bg-dock-bg">
      <Header serverCount={servers.length} />
      <ServerList
        servers={servers}
        loading={loading}
        onKill={killServer}
        onOpen={openInBrowser}
      />
      <StatusBar lastUpdate={lastUpdate} onRefresh={refresh} />
    </div>
  );
}
