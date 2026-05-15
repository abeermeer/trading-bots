import { Bot, TrendingUp, BarChart3, Activity, Settings } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  status: string;
}

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'analysis', label: 'Market Analysis', icon: TrendingUp },
  { id: 'trading', label: 'Trading', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Header({ activeTab, setActiveTab, status }: HeaderProps) {
  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-emerald-400" />
            <div>
              <h1 className="text-xl font-bold text-white">Trading Bot</h1>
              <p className="text-xs text-gray-400">Market Analyst & Professional Trader</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span className="text-xs text-gray-400 capitalize">{status}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
