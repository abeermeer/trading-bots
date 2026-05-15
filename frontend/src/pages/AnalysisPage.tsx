import { useEffect, useState } from 'react';
import type { AnalysisSignal } from '../types';
import { useApi } from '../hooks/useApi';
import { AnalysisCard } from '../components/AnalysisCard';
import { Search, RefreshCw } from 'lucide-react';

const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'LINKUSDT'];

export function AnalysisPage() {
  const api = useApi();
  const [signals, setSignals] = useState<AnalysisSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('1h');
  const [search, setSearch] = useState('');

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const results = await api.analyzeMultiple(SYMBOLS, timeframe);
      setSignals(results.map((r: any) => r.signals[0]));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
    const interval = setInterval(fetchAnalysis, 60000);
    return () => clearInterval(interval);
  }, [timeframe]);

  const filtered = signals.filter(s =>
    s.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const buyCount = signals.filter(s => s.action === 'BUY').length;
  const sellCount = signals.filter(s => s.action === 'SELL').length;
  const holdCount = signals.filter(s => s.action === 'HOLD').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Market Analysis</h2>
          <p className="text-sm text-gray-400">Real-time technical analysis powered by AI</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search symbol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
          >
            <option value="15m">15m</option>
            <option value="1h">1h</option>
            <option value="4h">4h</option>
            <option value="1d">1d</option>
          </select>

          <button
            onClick={fetchAnalysis}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:border-gray-600 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{buyCount}</p>
          <p className="text-xs text-gray-400">BUY Signals</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{sellCount}</p>
          <p className="text-xs text-gray-400">SELL Signals</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{holdCount}</p>
          <p className="text-xs text-gray-400">HOLD Signals</p>
        </div>
      </div>

      {loading && signals.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((signal) => (
            <AnalysisCard key={signal.symbol} signal={signal} />
          ))}
        </div>
      )}
    </div>
  );
}
