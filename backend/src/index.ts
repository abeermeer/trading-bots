import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import routes from './api/routes';
import { binanceService } from './services/binanceService';
import { marketAnalyst } from './bots/marketAnalyst';
import { professionalTrader } from './bots/professionalTrader';

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(cors());
app.use(express.json());
app.use(routes);

const PORT = process.env.PORT || 3001;

const apiKey = process.env.BINANCE_API_KEY;
const secretKey = process.env.BINANCE_SECRET_KEY;

if (apiKey && secretKey) {
  binanceService.init({ apiKey, secretKey });
  console.log('[Server] Binance service initialized from env vars');
}

wss.on('connection', (ws: WebSocket) => {
  console.log('[WS] Client connected');

  const interval = setInterval(async () => {
    if (ws.readyState !== WebSocket.OPEN) return;

    try {
      const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];
      const tickers: Record<string, any> = {};

      for (const symbol of symbols) {
        try {
          tickers[symbol] = await binanceService.getTicker(symbol);
        } catch { }
      }

      ws.send(JSON.stringify({
        type: 'market_data',
        data: tickers,
        timestamp: Date.now()
      }));
    } catch { }
  }, 5000);

  ws.on('close', () => {
    clearInterval(interval);
    console.log('[WS] Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`[Server] Trading Bot API running on port ${PORT}`);
  console.log(`[Server] WebSocket available at ws://localhost:${PORT}/ws`);
});
