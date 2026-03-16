import { useEffect, useRef, useCallback } from 'react';
import { WS_URL } from '../utils/constants.js';

export function useWebSocket(onMessage) {
  const ws = useRef(null);
  const onMsg = useRef(onMessage);
  onMsg.current = onMessage;

  useEffect(() => {
    const socket = new WebSocket(WS_URL);
    ws.current = socket;

    socket.onmessage = e => {
      try {
        const msg = JSON.parse(e.data);
        onMsg.current(msg);
      } catch {}
    };

    return () => socket.close();
  }, []);

  const send = useCallback(msg => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(msg));
    }
  }, []);

  return send;
}
