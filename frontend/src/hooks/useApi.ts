import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useApi() {
  const api = axios.create({ baseURL: API_BASE });

  const initBinance = async (apiKey: string, secretKey: string) => {
    const { data } = await api.post('/api/init', { apiKey, secretKey });
    return data;
  };

  const getStatus = async () => {
    const { data } = await api.get('/api/status');
    return data;
  };

  const getBalances = async () => {
    const { data } = await api.get('/api/balances');
    return data;
  };

  const getPositions = async () => {
    const { data } = await api.get('/api/positions');
    return data;
  };

  const getTicker = async (symbol: string) => {
    const { data } = await api.get(`/api/ticker/${symbol}`);
    return data;
  };

  const getAnalysis = async (symbol: string, timeframe = '1h') => {
    const { data } = await api.get(`/api/analysis/${symbol}`, { params: { timeframe } });
    return data;
  };

  const analyzeMultiple = async (symbols: string[], timeframe = '1h') => {
    const { data } = await api.post('/api/analysis/multiple', { symbols, timeframe });
    return data;
  };

  const getTraderConfig = async () => {
    const { data } = await api.get('/api/trader/config');
    return data;
  };

  const updateTraderConfig = async (config: any) => {
    const { data } = await api.post('/api/trader/config', config);
    return data;
  };

  const startTrader = async () => {
    const { data } = await api.post('/api/trader/start');
    return data;
  };

  const stopTrader = async () => {
    const { data } = await api.post('/api/trader/stop');
    return data;
  };

  const getTradeHistory = async () => {
    const { data } = await api.get('/api/trader/trades');
    return data;
  };

  const getOpenTrades = async () => {
    const { data } = await api.get('/api/trader/open');
    return data;
  };

  const getOHLCV = async (symbol: string, timeframe = '1h', limit = 100) => {
    const { data } = await api.get(`/api/ohlcv/${symbol}`, { params: { timeframe, limit } });
    return data;
  };

  return {
    initBinance, getStatus, getBalances, getPositions, getTicker,
    getAnalysis, analyzeMultiple, getTraderConfig, updateTraderConfig,
    startTrader, stopTrader, getTradeHistory, getOpenTrades, getOHLCV
  };
}

export function useWebSocket() {
  const [marketData, setMarketData] = useState<Record<string, any>>({});
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const wsUrl = (import.meta.env.VITE_WS_URL || 'ws://localhost:3001') + '/ws';
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'market_data') {
          setMarketData(msg.data);
        }
      } catch { }
    };

    return () => ws.close();
  }, []);

  return { marketData };
}
