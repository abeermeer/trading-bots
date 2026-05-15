import { useEffect, useState } from 'react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useApi } from '../hooks/useApi';
import type { OHLCV } from '../types';

interface PriceChartProps {
  symbol: string;
  timeframe?: string;
}

export function PriceChart({ symbol, timeframe = '1h' }: PriceChartProps) {
  const api = useApi();
  const [data, setData] = useState<OHLCV[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const ohlcv = await api.getOHLCV(symbol, timeframe, 50);
        setData(ohlcv);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, [symbol, timeframe]);

  if (loading) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 h-80 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400" />
      </div>
    );
  }

  const chartData = data.map(d => ({
    time: new Date(d.timestamp).toLocaleTimeString(),
    price: d.close,
    high: d.high,
    low: d.low,
  }));

  const lastPrice = chartData[chartData.length - 1]?.price || 0;
  const firstPrice = chartData[0]?.price || 1;
  const isUp = lastPrice >= firstPrice;

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm text-gray-400">{symbol}</h3>
          <p className={`text-lg font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
            ${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          {timeframe}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isUp ? '#34d399' : '#f87171'} stopOpacity={0.3} />
              <stop offset="95%" stopColor={isUp ? '#34d399' : '#f87171'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
          <YAxis domain={['dataMin - 50', 'dataMax + 50']} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
          />
          <Area type="monotone" dataKey="price" stroke={isUp ? '#34d399' : '#f87171'} fill={`url(#gradient-${symbol})`} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
