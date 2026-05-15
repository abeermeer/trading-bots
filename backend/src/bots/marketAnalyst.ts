import { OHLCV, binanceService } from '../services/binanceService';

export interface AnalysisSignal {
  symbol: string;
  timeframe: string;
  timestamp: number;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  indicators: {
    rsi: number;
    macd: {
      value: number;
      signal: number;
      histogram: number;
    };
    ema: {
      ema9: number;
      ema21: number;
      ema50: number;
    };
    bollingerBands: {
      upper: number;
      middle: number;
      lower: number;
    };
    support: number;
    resistance: number;
  };
  summary: string;
  recommendation: string;
}

export interface MarketAnalysis {
  symbol: string;
  signals: AnalysisSignal[];
  overallSentiment: 'bullish' | 'bearish' | 'neutral';
  updatedAt: number;
}

class MarketAnalyst {
  private analysisCache: Map<string, MarketAnalysis> = new Map();

  async analyzeSymbol(symbol: string, timeframe: string = '1h'): Promise<AnalysisSignal> {
    const ohlcv = await binanceService.fetchOHLCV(symbol, timeframe, 200);
    const closes = ohlcv.map(c => c.close);
    const highs = ohlcv.map(c => c.high);
    const lows = ohlcv.map(c => c.low);

    const rsi = this.calculateRSI(closes, 14);
    const macd = this.calculateMACD(closes);
    const ema = this.calculateEMA(closes);
    const bb = this.calculateBollingerBands(closes);
    const { support, resistance } = this.findSupportResistance(highs, lows, closes);

    const currentPrice = closes[closes.length - 1];
    const currentRSI = rsi[rsi.length - 1];
    const currentMACD = macd.macdLine[macd.macdLine.length - 1];
    const signalMACD = macd.signalLine[macd.signalLine.length - 1];

    let action: 'BUY' | 'SELL' | 'HOLD';
    let confidence = 0;
    const signals: string[] = [];

    if (currentRSI < 30 && currentPrice < bb.lower) {
      action = 'BUY';
      confidence += 30;
      signals.push('Oversold RSI + below lower BB');
    } else if (currentRSI > 70 && currentPrice > bb.upper) {
      action = 'SELL';
      confidence += 30;
      signals.push('Overbought RSI + above upper BB');
    }

    if (currentMACD > signalMACD && macd.histogram[macd.histogram.length - 1] > 0) {
      if (action === 'HOLD') action = 'BUY';
      if (action === 'BUY') confidence += 25;
      signals.push('MACD bullish cross');
    } else if (currentMACD < signalMACD && macd.histogram[macd.histogram.length - 1] < 0) {
      if (action === 'HOLD') action = 'SELL';
      if (action === 'SELL') confidence += 25;
      signals.push('MACD bearish cross');
    }

    if (ema.ema9 > ema.ema21 && ema.ema21 > ema.ema50) {
      if (action === 'HOLD') action = 'BUY';
      if (action === 'BUY') confidence += 20;
      signals.push('EMA bullish alignment');
    } else if (ema.ema9 < ema.ema21 && ema.ema21 < ema.ema50) {
      if (action === 'HOLD') action = 'SELL';
      if (action === 'SELL') confidence += 20;
      signals.push('EMA bearish alignment');
    }

    if (currentPrice <= support * 1.02) {
      if (action === 'HOLD') action = 'BUY';
      if (action === 'BUY') confidence += 15;
      signals.push('Near support level');
    } else if (currentPrice >= resistance * 0.98) {
      if (action === 'HOLD') action = 'SELL';
      if (action === 'SELL') confidence += 15;
      signals.push('Near resistance level');
    }

    if (action === 'HOLD') {
      confidence = 0;
    }

    return {
      symbol,
      timeframe,
      timestamp: Date.now(),
      action,
      confidence: Math.min(confidence, 100),
      indicators: {
        rsi: currentRSI,
        macd: {
          value: currentMACD,
          signal: signalMACD,
          histogram: macd.histogram[macd.histogram.length - 1]
        },
        ema: {
          ema9: ema.ema9,
          ema21: ema.ema21,
          ema50: ema.ema50
        },
        bollingerBands: bb,
        support,
        resistance
      },
      summary: signals.join('. ') || 'No clear signals',
      recommendation: action !== 'HOLD'
        ? `${action} ${symbol} with ${confidence}% confidence. ${signals.join('. ')}`
        : `HOLD ${symbol} - no strong signals detected. RSI: ${currentRSI.toFixed(2)}`
    };
  }

  async analyzeMultiple(symbols: string[], timeframe: string = '1h'): Promise<MarketAnalysis[]> {
    const results: MarketAnalysis[] = [];

    for (const symbol of symbols) {
      const signal = await this.analyzeSymbol(symbol, timeframe);
      const buySignals = signal.action === 'BUY' ? 1 : 0;
      const sellSignals = signal.action === 'SELL' ? 1 : 0;

      const analysis: MarketAnalysis = {
        symbol,
        signals: [signal],
        overallSentiment: buySignals > sellSignals ? 'bullish' : sellSignals > buySignals ? 'bearish' : 'neutral',
        updatedAt: Date.now()
      };

      this.analysisCache.set(symbol, analysis);
      results.push(analysis);
    }

    return results;
  }

  getCachedAnalysis(symbol: string): MarketAnalysis | undefined {
    return this.analysisCache.get(symbol);
  }

  private calculateRSI(prices: number[], period: number): number[] {
    const changes: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1]);
    }

    const gains: number[] = [];
    const losses: number[] = [];
    for (const change of changes) {
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? -change : 0);
    }

    const rsi: number[] = [];
    let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < changes.length; i++) {
      avgGain = (avgGain * (period - 1) + gains[i]) / period;
      avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - 100 / (1 + rs));
      }
    }

    return rsi;
  }

  private calculateMACD(prices: number[]) {
    const ema12 = this.calculateEMAValues(prices, 12);
    const ema26 = this.calculateEMAValues(prices, 26);
    const macdLine: number[] = [];

    for (let i = 0; i < Math.min(ema12.length, ema26.length); i++) {
      macdLine.push(ema12[i] - ema26[i]);
    }

    const signalLine = this.calculateEMAValues(macdLine, 9);
    const histogram: number[] = [];

    for (let i = 0; i < Math.min(macdLine.length, signalLine.length); i++) {
      histogram.push(macdLine[i] - signalLine[i]);
    }

    return { macdLine, signalLine, histogram };
  }

  private calculateEMA(prices: number[]) {
    const ema9 = this.calculateEMAValue(prices, 9);
    const ema21 = this.calculateEMAValue(prices, 21);
    const ema50 = this.calculateEMAValue(prices, 50);
    return { ema9, ema21, ema50 };
  }

  private calculateEMAValue(prices: number[], period: number): number {
    const k = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }

    return ema;
  }

  private calculateEMAValues(prices: number[], period: number): number[] {
    if (prices.length < period) return [];

    const k = 2 / (period + 1);
    const ema: number[] = [];
    let currentEMA = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
    ema.push(currentEMA);

    for (let i = period; i < prices.length; i++) {
      currentEMA = prices[i] * k + currentEMA * (1 - k);
      ema.push(currentEMA);
    }

    return ema;
  }

  private calculateBollingerBands(prices: number[], period: number = 20) {
    const sma = prices.slice(-period).reduce((a, b) => a + b, 0) / period;
    const squaredDiffs = prices.slice(-period).map(p => Math.pow(p - sma, 2));
    const stdDev = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / period);

    return {
      upper: sma + 2 * stdDev,
      middle: sma,
      lower: sma - 2 * stdDev
    };
  }

  private findSupportResistance(highs: number[], lows: number[], closes: number[]): { support: number; resistance: number } {
    const lookback = 50;
    const recentLows = lows.slice(-lookback);
    const recentHighs = highs.slice(-lookback);

    const sortedLows = [...recentLows].sort((a, b) => a - b);
    const sortedHighs = [...recentHighs].sort((a, b) => b - a);

    const currentPrice = closes[closes.length - 1];

    const support = sortedLows[Math.floor(sortedLows.length * 0.1)];
    const resistance = sortedHighs[Math.floor(sortedHighs.length * 0.1)];

    return {
      support: Math.min(support, currentPrice * 0.95),
      resistance: Math.max(resistance, currentPrice * 1.05)
    };
  }
}

export const marketAnalyst = new MarketAnalyst();
