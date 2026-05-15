import ccxt, { Binance } from 'ccxt';

export interface BinanceCredentials {
  apiKey: string;
  secretKey: string;
}

export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
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

export interface OrderResult {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: string;
  price: number;
  amount: number;
  status: string;
  timestamp: number;
}

class BinanceService {
  private spot: Binance;
  private futures: Binance;
  private initialized = false;

  constructor() {
    this.spot = new ccxt.binance({});
    this.futures = new ccxt.binance({ options: { defaultType: 'future' } });
  }

  init(credentials: BinanceCredentials) {
    this.spot.apiKey = credentials.apiKey;
    this.spot.secret = credentials.secretKey;
    this.futures.apiKey = credentials.apiKey;
    this.futures.secret = credentials.secretKey;
    this.initialized = true;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  async fetchOHLCV(symbol: string, timeframe: string = '1h', limit: number = 100): Promise<OHLCV[]> {
    const ohlcv = await this.spot.fetchOHLCV(symbol, timeframe, undefined, limit);
    return ohlcv.map(([timestamp, open, high, low, close, volume]) => ({
      timestamp,
      open,
      high,
      low,
      close,
      volume
    }));
  }

  async getTicker(symbol: string): Promise<{ last: number; bid: number; ask: number; volume: number }> {
    const ticker = await this.spot.fetchTicker(symbol);
    return {
      last: ticker.last || 0,
      bid: ticker.bid || 0,
      ask: ticker.ask || 0,
      volume: ticker.baseVolume || 0
    };
  }

  async getBalances(): Promise<AccountBalance[]> {
    const balance = await this.spot.fetchBalance();
    return Object.entries(balance.total)
      .filter(([_, total]) => (total as number) > 0)
      .map(([asset, total]) => ({
        asset,
        free: (balance.free[asset] as number) || 0,
        used: (balance.used[asset] as number) || 0,
        total: total as number
      }));
  }

  async getFuturesPositions(): Promise<Position[]> {
    const balance = await this.futures.fetchBalance();
    const positions: Position[] = [];

    if (balance.info && (balance.info as any).positions) {
      const rawPositions = (balance.info as any).positions as any[];
      for (const pos of rawPositions) {
        const size = parseFloat(pos.positionAmt);
        if (Math.abs(size) > 0) {
          const entryPrice = parseFloat(pos.entryPrice);
          const markPrice = parseFloat(pos.markPrice);
          const pnl = parseFloat(pos.unRealizedProfit);
          positions.push({
            symbol: pos.symbol,
            side: size > 0 ? 'long' : 'short',
            size: Math.abs(size),
            entryPrice,
            markPrice,
            pnl,
            pnlPercentage: entryPrice > 0 ? ((markPrice - entryPrice) / entryPrice) * 100 * (size > 0 ? 1 : -1) : 0,
            liquidationPrice: parseFloat(pos.liquidationPrice || '0'),
            leverage: parseFloat(pos.leverage || '1')
          });
        }
      }
    }
    return positions;
  }

  async createSpotOrder(
    symbol: string,
    side: 'buy' | 'sell',
    type: 'market' | 'limit',
    amount: number,
    price?: number
  ): Promise<OrderResult> {
    const params: any = {};

    if (type === 'limit' && price) {
      params.price = price;
    }

    const order = await this.spot.createOrder(symbol, type, side, amount, price);
    return {
      id: order.id,
      symbol: order.symbol,
      side: order.side as 'buy' | 'sell',
      type: order.type,
      price: order.price || 0,
      amount: order.amount || 0,
      status: order.status,
      timestamp: order.timestamp || Date.now()
    };
  }

  async createFuturesOrder(
    symbol: string,
    side: 'buy' | 'sell',
    type: 'market' | 'limit',
    amount: number,
    price?: number,
    leverage?: number
  ): Promise<OrderResult> {
    if (leverage) {
      await this.futures.setLeverage(leverage, symbol);
    }

    const order = await this.futures.createOrder(symbol, type, side, amount, price);
    return {
      id: order.id,
      symbol: order.symbol,
      side: order.side as 'buy' | 'sell',
      type: order.type,
      price: order.price || 0,
      amount: order.amount || 0,
      status: order.status,
      timestamp: order.timestamp || Date.now()
    };
  }

  async setLeverage(symbol: string, leverage: number) {
    return this.futures.setLeverage(leverage, symbol);
  }

  async getFuturesAccountInfo() {
    return this.futures.fetchBalance();
  }
}

export const binanceService = new BinanceService();
