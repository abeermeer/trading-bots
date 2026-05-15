import { binanceService } from '../services/binanceService';
import { marketAnalyst, AnalysisSignal } from './marketAnalyst';

export interface TradeExecution {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'spot' | 'futures';
  amount: number;
  price: number;
  status: 'pending' | 'executed' | 'failed';
  timestamp: number;
  signal: AnalysisSignal;
  reason: string;
}

export interface TradeHistory {
  trades: TradeExecution[];
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  totalPnL: number;
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

class ProfessionalTrader {
  private config: BotConfig = {
    enabled: false,
    type: 'futures',
    maxPositionSize: 1000,
    riskPerTrade: 0.02,
    leverage: 3,
    symbols: ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT'],
    minConfidence: 60,
    maxOpenTrades: 3,
    stopLoss: 0.05,
    takeProfit: 0.15
  };

  private openTrades: TradeExecution[] = [];
  private tradeHistory: TradeExecution[] = [];
  private activePositions: Map<string, TradeExecution> = new Map();
  private intervalId: NodeJS.Timeout | null = null;

  getConfig(): BotConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<BotConfig>): BotConfig {
    this.config = { ...this.config, ...updates };
    return this.getConfig();
  }

  start(): void {
    if (this.intervalId) return;
    this.config.enabled = true;

    this.intervalId = setInterval(async () => {
      await this.tradingCycle();
    }, 60000);

    setTimeout(() => this.tradingCycle(), 1000);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.config.enabled = false;
  }

  isRunning(): boolean {
    return this.config.enabled && this.intervalId !== null;
  }

  getOpenTrades(): TradeExecution[] {
    return [...this.openTrades];
  }

  getTradeHistory(): TradeHistory {
    return {
      trades: this.tradeHistory,
      totalTrades: this.tradeHistory.length,
      successfulTrades: this.tradeHistory.filter(t => t.status === 'executed').length,
      failedTrades: this.tradeHistory.filter(t => t.status === 'failed').length,
      totalPnL: this.tradeHistory.reduce((acc, t) => {
        return t.status === 'executed' ? acc + this.calculateTradePnL(t) : acc;
      }, 0)
    };
  }

  private async tradingCycle(): Promise<void> {
    if (!this.config.enabled || !binanceService.isInitialized()) return;

    const analyses = await marketAnalyst.analyzeMultiple(this.config.symbols, '15m');

    for (const analysis of analyses) {
      if (this.activePositions.has(analysis.symbol)) {
        await this.managePosition(analysis.symbol, analysis.signals[0]);
        continue;
      }

      if (this.openTrades.length >= this.config.maxOpenTrades) break;

      const signal = analysis.signals[0];
      if (signal.action !== 'HOLD' && signal.confidence >= this.config.minConfidence) {
        await this.executeTrade(signal);
      }
    }
  }

  private async executeTrade(signal: AnalysisSignal): Promise<void> {
    try {
      const ticker = await binanceService.getTicker(signal.symbol);
      const price = signal.action === 'BUY' ? ticker.ask : ticker.bid;
      const positionSize = this.config.maxPositionSize * this.config.riskPerTrade;
      const amount = positionSize / price;

      let order;
      if (this.config.type === 'futures') {
        await binanceService.setLeverage(signal.symbol, this.config.leverage);
        order = await binanceService.createFuturesOrder(
          signal.symbol,
          signal.action === 'BUY' ? 'buy' : 'sell',
          'market',
          amount,
          undefined,
          this.config.leverage
        );
      } else {
        order = await binanceService.createSpotOrder(
          signal.symbol,
          signal.action === 'BUY' ? 'buy' : 'sell',
          'market',
          amount
        );
      }

      const trade: TradeExecution = {
        id: order.id,
        symbol: signal.symbol,
        side: signal.action === 'BUY' ? 'buy' : 'sell',
        type: this.config.type,
        amount,
        price: order.price || price,
        status: 'executed',
        timestamp: Date.now(),
        signal,
        reason: signal.recommendation
      };

      this.openTrades.push(trade);
      this.activePositions.set(signal.symbol, trade);
      this.tradeHistory.push(trade);

      console.log(`[Trader] Executed ${signal.action} ${signal.symbol} at ${price}`);
    } catch (error) {
      const failedTrade: TradeExecution = {
        id: `failed-${Date.now()}`,
        symbol: signal.symbol,
        side: signal.action === 'BUY' ? 'buy' : 'sell',
        type: this.config.type,
        amount: 0,
        price: 0,
        status: 'failed',
        timestamp: Date.now(),
        signal,
        reason: `Failed to execute: ${error}`
      };

      this.tradeHistory.push(failedTrade);
      console.error(`[Trader] Failed to execute ${signal.symbol}:`, error);
    }
  }

  private async managePosition(symbol: string, signal: AnalysisSignal): Promise<void> {
    const position = this.activePositions.get(symbol);
    if (!position) return;

    try {
      const ticker = await binanceService.getTicker(symbol);
      const currentPrice = ticker.last;
      const entryPrice = position.price;
      const pnlPercent = ((currentPrice - entryPrice) / entryPrice) * 100 * (position.side === 'buy' ? 1 : -1);

      let shouldClose = false;
      let closeReason = '';

      if (pnlPercent <= -this.config.stopLoss * 100) {
        shouldClose = true;
        closeReason = `Stop loss hit at ${pnlPercent.toFixed(2)}%`;
      } else if (pnlPercent >= this.config.takeProfit * 100) {
        shouldClose = true;
        closeReason = `Take profit hit at ${pnlPercent.toFixed(2)}%`;
      } else if (signal.action === 'SELL' && position.side === 'buy') {
        shouldClose = true;
        closeReason = 'Signal reversal to sell';
      } else if (signal.action === 'BUY' && position.side === 'sell') {
        shouldClose = true;
        closeReason = 'Signal reversal to buy';
      }

      if (shouldClose) {
        const closeSide = position.side === 'buy' ? 'sell' : 'buy';
        await binanceService.createFuturesOrder(symbol, closeSide, 'market', position.amount);

        const closedTrade = this.openTrades.find(t => t.id === position.id);
        if (closedTrade) {
          closedTrade.status = 'executed';
          closedTrade.reason += ` | Closed: ${closeReason}`;
        }

        this.activePositions.delete(symbol);
        this.openTrades = this.openTrades.filter(t => t.id !== position.id);
        console.log(`[Trader] Closed ${symbol}: ${closeReason}`);
      }
    } catch (error) {
      console.error(`[Trader] Error managing position ${symbol}:`, error);
    }
  }

  private calculateTradePnL(trade: TradeExecution): number {
    if (trade.status !== 'executed' || !trade.price) return 0;
    return 0;
  }
}

export const professionalTrader = new ProfessionalTrader();
