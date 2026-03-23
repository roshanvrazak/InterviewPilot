// frontend/src/hooks/useWebSocket.ts
import { useRef, useCallback, useState, useEffect } from 'react';

export function useWebSocket(onAudio: (data: ArrayBuffer) => void, onJson: (msg: any) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const urlRef = useRef<string | null>(null);

  const connect = useCallback((url: string) => {
    urlRef.current = url;
    const ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      setConnected(true);
      setReconnectAttempt(0);
      const sessionId = sessionStorage.getItem('interview_session_id');
      if (sessionId) {
        ws.send(JSON.stringify({ type: 'reconnect', session_id: sessionId }));
      }
    };

    ws.onclose = () => {
      setConnected(false);
      // Exponential backoff
      const timeout = Math.min(1000 * Math.pow(2, reconnectAttempt), 30000);
      setTimeout(() => {
        setReconnectAttempt((prev) => prev + 1);
      }, timeout);
    };

    ws.onmessage = (e) => {
      if (e.data instanceof ArrayBuffer) {
        onAudio(e.data);
      } else {
        const data = JSON.parse(e.data);
        if (data.type === 'session_id') {
          sessionStorage.setItem('interview_session_id', data.session_id);
        } else if (data.type === 'scorecard') {
          sessionStorage.removeItem('interview_session_id');
        }
        onJson(data);
      }
    };

    wsRef.current = ws;
  }, [onAudio, onJson, reconnectAttempt]);

  useEffect(() => {
    if (reconnectAttempt > 0 && !connected && urlRef.current) {
      connect(urlRef.current);
    }
  }, [reconnectAttempt, connected, connect]);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      if (data instanceof ArrayBuffer) {
        wsRef.current.send(data);
      } else {
        wsRef.current.send(JSON.stringify(data));
      }
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onclose = null; // Prevent auto-reconnect
      wsRef.current.close();
      setConnected(false);
      sessionStorage.removeItem('interview_session_id');
    }
  }, []);

  return { connect, send, connected, disconnect };
}
