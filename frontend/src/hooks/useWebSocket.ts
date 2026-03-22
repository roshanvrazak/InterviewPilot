// frontend/src/hooks/useWebSocket.ts
import { useRef, useCallback, useState } from 'react';

export function useWebSocket(onAudio: (data: ArrayBuffer) => void, onJson: (msg: any) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  const connect = useCallback((url: string) => {
    const ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer';
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => {
      if (e.data instanceof ArrayBuffer) onAudio(e.data);
      else onJson(JSON.parse(e.data));
    };
    wsRef.current = ws;
  }, [onAudio, onJson]);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      if (data instanceof ArrayBuffer) wsRef.current.send(data);
      else wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { connect, send, connected };
}
