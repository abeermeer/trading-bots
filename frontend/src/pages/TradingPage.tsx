import { useEffect, useState } from 'react';
import type { BotStatus, TradeHistory, TradeExecution } from '../types';
import { useApi } from '../hooks/useApi';
import { Play, Square, Activity, Clock, CheckCircle, XCircle } from 'lucide-react';

interface TradingPageProps {
  status: BotStatus | null;
  onRefresh: () => void;
}

export function TradingPage({ status, onRefresh }: TradingPageProps) {
  const api = useApi();
  const [tradeHistory, setTradeHistory] = useState<TradeHistory | null>(null);
  const [openTrades, setOpenTrades] = useState<TradeExecution[]>([]);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);

  const fetchTrades = async () => {
    try {
      const [history, open] = await Promise.all([
        api.getTradeHistory(),
        api.getOpenTrades(),
      ]);
      setTradeHistory(history);
      setOpenTrades(open);
    } catch {}
  };

  useEffect(() => {
    fetchTrades();
    const interval = setInterval(fetchTrades, 10000);
    return () => clearInterval(interval);
  }, [status?.traderRunning]);

  const handleStart = async () => {
    setStarting(true);
    try {
      await api.startTrader();
      onRefresh();
      fetchTrades();
    } catch {}
    setStarting(false);
  };

  const handleStop = async () => {
    setStopping(true);
    try {
      await api.stopTrader();
      onRefresh();
    } catch {}
    setStopping(false);
  };

  const statusIcon = (s: string) => {
    switch (s) {
      case 'executed': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Trading Bot Control</h2>
          <p className="text-sm text-gray-400">Professional automated trading execution</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg border border-gray-700">
            <div className={`w-2 h-2 rounded-full ${status?.traderRunning ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-sm text-gray-300">{status?.traderRunning ? 'Running' : 'Stopped'}</span>
          </div>

          {!status?.traderRunning ? (
            <button
              onClick={handleStart}
              disabled={starting || !status?.initialized}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-all"
            >
              <Play className="w-4 h-4" />
              {starting ? 'Starting...' : 'Start Bot'}
            </button>
          ) : (
            <button
              onClick={handleStop}
              disabled={stopping}
              className="flex items-center gap-2 px-5 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-700 text-white rounded-lg text-sm font-medium transition-all"
            >
              <Square className="w-4 h-4" />
              {stopping ? 'Stopping...' : 'Stop Bot'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <p className="text-sm text-gray-400">Total Trades</p>
          <p className="text-2xl font-bold text-white">{tradeHistory?.totalTrades || 0}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <p className="text-sm text-gray-400">Successful</p>
          <p className="text-2xl font-bold text-emerald-400">{tradeHistory?.successfulTrades || 0}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <p className="text-sm text-gray-400">Failed</p>
          <p className="text-2xl font-bold text-red-400">{tradeHistory?.failedTrades || 0}</p>
        </div>
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <p className="text-sm text-gray-400">Total PnL</p>
          <p className={`text-2xl font-bold ${(tradeHistory?.totalPnL || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            ${(tradeHistory?.totalPnL || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {openTrades.length > 0 && (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Open Trades ({openTrades.length})
          </h3>
          <div className="space-y-2">
            {openTrades.map((trade) => (
              <div key={trade.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                <div className="flex items-center gap-3">
                  {statusIcon(trade.status)}
                  <div>
                    <p className="text-sm font-medium text-white">{trade.symbol}</p>
                    <p className="text-xs text-gray-400">{trade.side.toUpperCase()} · {trade.amount.toFixed(4)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white">${trade.price.toFixed(2)}</p>
                  <p className="text-xs text-gray-400">{new Date(trade.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Trade History</h3>
        {tradeHistory && tradeHistory.trades.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-3">Status</th>
                  <th className="text-left py-3">Symbol</th>
                  <th className="text-left py-3">Side</th>
                  <th className="text-right py-3">Amount</th>
                  <th className="text-right py-3">Price</th>
                  <th className="text-right py-3">Time</th>
                  <th className="text-left py-3">Reason</th>
                </tr>
              </thead>
              <tbody>
                {tradeHistory.trades.slice().reverse().slice(0, 20).map((trade) => (
                  <tr key={trade.id} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                    <td className="py-3">{statusIcon(trade.status)}</td>
                    <td className="py-3 text-white font-medium">{trade.symbol}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        trade.side === 'buy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {trade.side}
                      </span>
                    </td>
                    <td className="py-3 text-right text-white">{trade.amount.toFixed(4)}</td>
                    <td className="py-3 text-right text-white">${trade.price.toFixed(2)}</td>
                    <td className="py-3 text-right text-gray-400">{new Date(trade.timestamp).toLocaleTimeString()}</td>
                    <td className="py-3 text-gray-400 text-xs max-w-xs truncate">{trade.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No trades executed yet</p>
            <p className="text-xs mt-1">Start the bot to begin automated trading</p>
          </div>
        )}
      </div>
    </div>
  );
}
