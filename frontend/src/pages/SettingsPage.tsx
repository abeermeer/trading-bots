import { useState, useEffect } from 'react';
import type { BotStatus, BotConfig } from '../types';
import { useApi } from '../hooks/useApi';
import { Save, Key, Sliders } from 'lucide-react';

interface SettingsPageProps {
  status: BotStatus | null;
  onRefresh: () => void;
}

export function SettingsPage({ status, onRefresh }: SettingsPageProps) {
  const api = useApi();
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [initMsg, setInitMsg] = useState('');

  useEffect(() => {
    if (status?.traderConfig) {
      setConfig(status.traderConfig);
    }
  }, [status]);

  const handleInit = async () => {
    if (!apiKey || !secretKey) return;
    try {
      await api.initBinance(apiKey, secretKey);
      setInitMsg('Binance API initialized successfully!');
      onRefresh();
    } catch (err) {
      setInitMsg('Failed to initialize. Check your keys.');
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await api.updateTraderConfig(config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  const updateConfig = (key: keyof BotConfig, value: any) => {
    if (!config) return;
    setConfig({ ...config, [key]: value });
  };

  if (!config) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Settings</h2>
        <p className="text-sm text-gray-400">Configure your trading bots</p>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-yellow-400" />
          Binance API Configuration
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Binance API key"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Secret Key</label>
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Enter your Binance secret key"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <button
            onClick={handleInit}
            disabled={!apiKey || !secretKey}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-all"
          >
            Initialize Connection
          </button>
          {initMsg && (
            <p className={`text-sm ${initMsg.includes('success') ? 'text-emerald-400' : 'text-red-400'}`}>
              {initMsg}
            </p>
          )}
          {status?.initialized && (
            <p className="text-sm text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Connected to Binance
            </p>
          )}
        </div>
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-blue-400" />
          Trading Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Market Type</label>
            <select
              value={config.type}
              onChange={(e) => updateConfig('type', e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            >
              <option value="futures">Futures</option>
              <option value="spot">Spot</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Leverage</label>
            <input
              type="number"
              value={config.leverage}
              onChange={(e) => updateConfig('leverage', parseInt(e.target.value) || 1)}
              min={1}
              max={125}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Max Position Size ($)</label>
            <input
              type="number"
              value={config.maxPositionSize}
              onChange={(e) => updateConfig('maxPositionSize', parseFloat(e.target.value) || 0)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Risk Per Trade (%)</label>
            <input
              type="number"
              value={config.riskPerTrade * 100}
              onChange={(e) => updateConfig('riskPerTrade', (parseFloat(e.target.value) || 0) / 100)}
              min={0.1}
              max={100}
              step={0.1}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Min Confidence (%)</label>
            <input
              type="number"
              value={config.minConfidence}
              onChange={(e) => updateConfig('minConfidence', parseInt(e.target.value) || 0)}
              min={0}
              max={100}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Max Open Trades</label>
            <input
              type="number"
              value={config.maxOpenTrades}
              onChange={(e) => updateConfig('maxOpenTrades', parseInt(e.target.value) || 1)}
              min={1}
              max={20}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Stop Loss (%)</label>
            <input
              type="number"
              value={config.stopLoss * 100}
              onChange={(e) => updateConfig('stopLoss', (parseFloat(e.target.value) || 0) / 100)}
              min={0.1}
              max={100}
              step={0.1}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Take Profit (%)</label>
            <input
              type="number"
              value={config.takeProfit * 100}
              onChange={(e) => updateConfig('takeProfit', (parseFloat(e.target.value) || 0) / 100)}
              min={0.1}
              max={500}
              step={0.1}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm text-gray-400 mb-2">Trading Symbols</label>
          <div className="flex flex-wrap gap-2">
            {['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'DOGEUSDT', 'ADAUSDT', 'AVAXUSDT', 'LINKUSDT'].map((sym) => (
              <button
                key={sym}
                onClick={() => {
                  const symbols = config.symbols.includes(sym)
                    ? config.symbols.filter(s => s !== sym)
                    : [...config.symbols, sym];
                  updateConfig('symbols', symbols);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  config.symbols.includes(sym)
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-gray-700 text-gray-400 border border-gray-600 hover:border-gray-500'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-700">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-700 text-white rounded-lg text-sm font-medium transition-all"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
