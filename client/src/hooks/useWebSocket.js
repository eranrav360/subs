import { useEffect, useRef, useCallback } from 'react';
import { WS_URL } from '../utils/constants.js';

const MAX_RETRIES = 8;
const BASE_DELAY = 1500; // ms

export function useWebSocket(onMessage, onStatusChange) {
  const ws = useRef(null);
  const onMsg = useRef(onMessage);
  const onStatus = useRef(onStatusChange);
  const retries = useRef(0);
  const destroyed = useRef(false);
  const retryTimer = useRef(null);

  onMsg.current = onMessage;
  onStatus.current = onStatusChange;

  const connect = useCallback(() => {
    if (destroyed.current) return;

    onStatus.current?.('connecting');
    const socket = new WebSocket(WS_URL);
    ws.current = socket;

    socket.onopen = () => {
      retries.current = 0;
      onStatus.current?.('connected');
    };

    socket.onmessage = e => {
      try {
        const msg = JSON.parse(e.data);
        onMsg.current(msg);
      } catch {}
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

    socket.onerror = () => {
      // onclose will fire after onerror, handles retry
    };
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
