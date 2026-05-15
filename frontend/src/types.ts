export interface BotStatus {
  initialized: boolean;
  traderRunning: boolean;
  traderConfig: BotConfig;
  openTrades: number;
}

export interface BotConfig {
  enabled: boolean;
  type: 'spot' | 'futures';
  maxPositionSize: number;
  riskPerTrade: number;
  leverage: number;
  symbols: string[];
  minConfidence: number;
  maxOpenTrades: number;
  stopLoss: number;
  takeProfit: number;
}

export interface AccountBalance {
  asset: string;
  free: number;
  used: number;
  total: number;
}

export interface Position {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  markPrice: number;
  pnl: number;
  pnlPercentage: number;
  liquidationPrice: number;
  leverage: number;
}

export interface AnalysisSignal {
  symbol: string;
  timeframe: string;
  timestamp: number;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  indicators: {
    rsi: number;
    macd: { value: number; signal: number; histogram: number };
    ema: { ema9: number; ema21: number; ema50: number };
    bollingerBands: { upper: number; middle: number; lower: number };
    support: number;
    resistance: number;
  };
  summary: string;
  recommendation: string;
}

export interface Ticker {
  last: number;
  bid: number;
  ask: number;
  volume: number;
}

export interface TradeExecution {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'spot' | 'futures';
  amount: number;
  price: number;
  status: 'pending' | 'executed' | 'failed';
  timestamp: number;
  reason: string;
}

export interface TradeHistory {
  trades: TradeExecution[];
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  totalPnL: number;
}

export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
