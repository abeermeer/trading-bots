import { useEffect, useState } from 'react';
import type { BotStatus } from './types';
import { useApi } from './hooks/useApi';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { TradingPage } from './pages/TradingPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  const api = useApi();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  const fetchStatus = async () => {
    try {
      const s = await api.getStatus();
      setStatus(s);
      setConnectionStatus('connected');
    } catch {
      setConnectionStatus('disconnected');
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} status={connectionStatus} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!status?.initialized && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-sm text-yellow-400">
            Binance API not configured. Go to Settings to enter your API keys, or set
            <code className="mx-1 px-2 py-0.5 bg-gray-800 rounded text-xs">BINANCE_API_KEY</code>
            and
            <code className="mx-1 px-2 py-0.5 bg-gray-800 rounded text-xs">BINANCE_SECRET_KEY</code>
            environment variables on Render.
          </div>
        )}

        {activeTab === 'dashboard' && <DashboardPage status={status} />}
        {activeTab === 'analysis' && <AnalysisPage />}
        {activeTab === 'trading' && <TradingPage status={status} onRefresh={fetchStatus} />}
        {activeTab === 'settings' && <SettingsPage status={status} onRefresh={fetchStatus} />}
      </main>
    </div>
  );
}

export default App;
