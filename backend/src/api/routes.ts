import { Router, Request, Response } from 'express';
import { binanceService } from '../services/binanceService';
import { marketAnalyst } from '../bots/marketAnalyst';
import { professionalTrader } from '../bots/professionalTrader';

const router = Router();

router.post('/api/init', (req: Request, res: Response) => {
  const { apiKey, secretKey } = req.body;
  if (!apiKey || !secretKey) {
    return res.status(400).json({ error: 'API key and secret key are required' });
  }
  binanceService.init({ apiKey, secretKey });
  res.json({ status: 'ok', message: 'Binance service initialized' });
});

router.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    initialized: binanceService.isInitialized(),
    traderRunning: professionalTrader.isRunning(),
    traderConfig: professionalTrader.getConfig(),
    openTrades: professionalTrader.getOpenTrades().length
  });
});

router.get('/api/balances', async (_req: Request, res: Response) => {
  try {
    const balances = await binanceService.getBalances();
    res.json(balances);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch balances' });
  }
});

router.get('/api/positions', async (_req: Request, res: Response) => {
  try {
    const positions = await binanceService.getFuturesPositions();
    res.json(positions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

router.get('/api/ticker/:symbol', async (req: Request, res: Response) => {
  try {
    const ticker = await binanceService.getTicker(req.params.symbol);
    res.json(ticker);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch ticker' });
  }
});

router.get('/api/analysis/:symbol', async (req: Request, res: Response) => {
  try {
    const timeframe = (req.query.timeframe as string) || '1h';
    const signal = await marketAnalyst.analyzeSymbol(req.params.symbol, timeframe);
    res.json(signal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze symbol' });
  }
});

router.post('/api/analysis/multiple', async (req: Request, res: Response) => {
  try {
    const { symbols, timeframe } = req.body;
    const analyses = await marketAnalyst.analyzeMultiple(symbols || ['BTCUSDT', 'ETHUSDT'], timeframe || '1h');
    res.json(analyses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze symbols' });
  }
});

router.get('/api/trader/config', (_req: Request, res: Response) => {
  res.json(professionalTrader.getConfig());
});

router.post('/api/trader/config', (req: Request, res: Response) => {
  const config = professionalTrader.updateConfig(req.body);
  res.json(config);
});

router.post('/api/trader/start', (_req: Request, res: Response) => {
  professionalTrader.start();
  res.json({ status: 'started', config: professionalTrader.getConfig() });
});

router.post('/api/trader/stop', (_req: Request, res: Response) => {
  professionalTrader.stop();
  res.json({ status: 'stopped' });
});

router.get('/api/trader/trades', (_req: Request, res: Response) => {
  res.json(professionalTrader.getTradeHistory());
});

router.get('/api/trader/open', (_req: Request, res: Response) => {
  res.json(professionalTrader.getOpenTrades());
});

router.get('/api/ohlcv/:symbol', async (req: Request, res: Response) => {
  try {
    const timeframe = (req.query.timeframe as string) || '1h';
    const limit = parseInt(req.query.limit as string) || 100;
    const ohlcv = await binanceService.fetchOHLCV(req.params.symbol, timeframe, limit);
    res.json(ohlcv);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch OHLCV data' });
  }
});

export default router;
