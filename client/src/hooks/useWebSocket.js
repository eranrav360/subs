import { useEffect, useRef, useCallback } from 'react';
import { WS_URL } from '../utils/constants.js';

const MAX_RETRIES = 8;
const BASE_DELAY  = 1500;

// Derive HTTP health-check URL from the WebSocket URL
const HEALTH_URL = WS_URL.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:') + '/health';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function useWebSocket(onMessage, onStatusChange) {
  const ws        = useRef(null);
  const onMsg     = useRef(onMessage);
  const onStatus  = useRef(onStatusChange);
  const retries   = useRef(0);
  const destroyed = useRef(false);
  const retryTimer = useRef(null);

  onMsg.current    = onMessage;
  onStatus.current = onStatusChange;

  const connect = useCallback(async () => {
    if (destroyed.current) return;

    // ── Step 1: wake the server via HTTP before opening WebSocket ──
    onStatus.current?.('waking');
    let serverUp = false;
    while (!destroyed.current && !serverUp) {
      try {
        const res = await fetch(HEALTH_URL, { signal: AbortSignal.timeout(5000) });
        if (res.ok) serverUp = true;
      } catch {
        await sleep(3000);
      }
    }
    if (destroyed.current) return;

    // ── Step 2: open WebSocket now that server is awake ──
    onStatus.current?.('connecting');
    const socket = new WebSocket(WS_URL);
    ws.current = socket;

    socket.onopen = () => {
      retries.current = 0;
      onStatus.current?.('connected');
    };

    socket.onmessage = e => {
      try { onMsg.current(JSON.parse(e.data)); } catch {}
    };

    socket.onclose = () => {
      if (destroyed.current) return;
      onStatus.current?.('disconnected');
      if (retries.current < MAX_RETRIES) {
        const delay = Math.min(BASE_DELAY * 2 ** retries.current, 30000);
        retries.current++;
        retryTimer.current = setTimeout(connect, delay);
      } else {
        onStatus.current?.('failed');
      }
    };

    socket.onerror = () => { /* onclose handles retry */ };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      destroyed.current = true;
      clearTimeout(retryTimer.current);
      ws.current?.close();
    };
  }, [connect]);

  const send = useCallback(msg => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg));
    }
  }, []);

  return send;
}
