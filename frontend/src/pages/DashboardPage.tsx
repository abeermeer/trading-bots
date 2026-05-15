import { useEffect, useState } from 'react';
import type { BotStatus, AccountBalance, Position } from '../types';
import { useApi, useWebSocket } from '../hooks/useApi';
import { StatCard } from '../components/StatCard';
import { PriceChart } from '../components/PriceChart';
import { Wallet, Activity, TrendingUp, DollarSign, Target, Zap } from 'lucide-react';

interface DashboardPageProps {
  status: BotStatus | null;
}

export function DashboardPage({ status }: DashboardPageProps) {
  const api = useApi();
  const { marketData } = useWebSocket();
  const [balances, setBalances] = useState<AccountBalance[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [b, p] = await Promise.all([
          api.getBalances(),
          api.getPositions(),
        ]);
        setBalances(b);
        setPositions(p);
      } catch {}
    };
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const totalEquity = balances.reduce((sum, b) => sum + b.total, 0);
  const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0);
  const btcPrice = marketData['BTCUSDT']?.last || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Portfolio Value"
          value={`$${totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={Wallet}
          color="emerald"
        />
        <StatCard
          title="Open Positions"
          value={positions.length}
          subtitle={status?.openTrades ? `${status.openTrades} active trades` : 'No active trades'}
          icon={Activity}
          color="blue"
        />
        <StatCard
          title="BTC Price"
          value={`$${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          color="purple"
          trend={btcPrice > 0 ? 'up' : 'neutral'}
        />
        <StatCard
          title="Unrealized PnL"
          value={`$${totalPnl.toFixed(2)}`}
          subtitle={positions.length > 0 ? `${(totalPnl / (totalEquity || 1) * 100).toFixed(2)}%` : '—'}
          icon={DollarSign}
          color={totalPnl >= 0 ? 'emerald' : 'red'}
          trend={totalPnl > 0 ? 'up' : totalPnl < 0 ? 'down' : 'neutral'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PriceChart symbol="BTCUSDT" timeframe="1h" />
        <PriceChart symbol="ETHUSDT" timeframe="1h" />
      </div>

      {positions.length > 0 && (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            Active Positions
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-3">Symbol</th>
                  <th className="text-left py-3">Side</th>
                  <th className="text-right py-3">Size</th>
                  <th className="text-right py-3">Entry</th>
                  <th className="text-right py-3">Mark</th>
                  <th className="text-right py-3">PnL</th>
                  <th className="text-right py-3">Leverage</th>
                  <th className="text-right py-3">Liq. Price</th>
                </tr>
              </thead>
              <tbody>
                {positions.map((pos, i) => (
                  <tr key={i} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                    <td className="py-3 text-white font-medium">{pos.symbol}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        pos.side === 'long' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                      }`}>
                        {pos.side}
                      </span>
                    </td>
                    <td className="py-3 text-right text-white">{pos.size.toFixed(4)}</td>
                    <td className="py-3 text-right text-white">${pos.entryPrice.toFixed(2)}</td>
                    <td className="py-3 text-right text-white">${pos.markPrice.toFixed(2)}</td>
                    <td className={`py-3 text-right ${pos.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      ${pos.pnl.toFixed(2)}
                    </td>
                    <td className="py-3 text-right text-white">{pos.leverage}x</td>
                    <td className="py-3 text-right text-gray-400">${pos.liquidationPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Live Market Data
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(marketData).map(([symbol, ticker]: [string, any]) => (
            <div key={symbol} className="bg-gray-700/30 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-400 mb-1">{symbol}</p>
              <p className="text-lg font-bold text-white">
                ${(ticker.last || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
