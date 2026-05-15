import type { AnalysisSignal } from '../types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AnalysisCardProps {
  signal: AnalysisSignal;
}

export function AnalysisCard({ signal }: AnalysisCardProps) {
  const actionColors = {
    BUY: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: TrendingUp },
    SELL: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: TrendingDown },
    HOLD: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/20', icon: Minus },
  };

  const style = actionColors[signal.action];
  const ActionIcon = style.icon;

  return (
    <div className={`bg-gray-800/50 backdrop-blur-sm border ${style.border} rounded-xl p-5`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${style.bg}`}>
            <ActionIcon className={`w-5 h-5 ${style.text}`} />
          </div>
          <div>
            <h3 className="font-semibold text-white">{signal.symbol}</h3>
            <p className="text-xs text-gray-400">{signal.timeframe} · {new Date(signal.timestamp).toLocaleTimeString()}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-bold ${style.bg} ${style.text}`}>
          {signal.action}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${signal.confidence > 70 ? 'bg-emerald-400' : signal.confidence > 40 ? 'bg-yellow-400' : 'bg-red-400'}`}
            style={{ width: `${signal.confidence}%` }}
          />
        </div>
        <span className="text-xs text-gray-400">{signal.confidence}%</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center p-2 bg-gray-700/30 rounded-lg">
          <p className="text-xs text-gray-400">RSI</p>
          <p className={`text-sm font-semibold ${signal.indicators.rsi > 70 ? 'text-red-400' : signal.indicators.rsi < 30 ? 'text-emerald-400' : 'text-white'}`}>
            {signal.indicators.rsi.toFixed(1)}
          </p>
        </div>
        <div className="text-center p-2 bg-gray-700/30 rounded-lg">
          <p className="text-xs text-gray-400">MACD</p>
          <p className={`text-sm font-semibold ${signal.indicators.macd.histogram > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {signal.indicators.macd.histogram > 0 ? '+' : ''}{signal.indicators.macd.histogram.toFixed(2)}
          </p>
        </div>
        <div className="text-center p-2 bg-gray-700/30 rounded-lg">
          <p className="text-xs text-gray-400">S/R</p>
          <p className="text-sm font-semibold text-white">
            ${signal.indicators.support.toFixed(0)}/${signal.indicators.resistance.toFixed(0)}
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed">{signal.recommendation}</p>
    </div>
  );
}
