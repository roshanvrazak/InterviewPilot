// frontend/src/hooks/useWebSocket.ts
import { useRef, useCallback, useState, useEffect } from 'react';

export function useWebSocket(onAudio: (data: ArrayBuffer) => void, onJson: (msg: any) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const urlRef = useRef<string | null>(null);

  // Use refs for callbacks to ensure onmessage always has the latest versions
  // without triggering a socket reconnection
  const onAudioRef = useRef(onAudio);
  const onJsonRef = useRef(onJson);

  useEffect(() => {
    onAudioRef.current = onAudio;
    onJsonRef.current = onJson;
  }, [onAudio, onJson]);

  const connect = useCallback((url: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
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

    ws.onerror = () => {
      setConnected(false);
      sessionStorage.removeItem('interview_session_id');
    };

    ws.onclose = (event) => {
      setConnected(false);
      
      // If closed with an error code (not 1000/1001), clear the session
      if (event.code > 1001) {
        sessionStorage.removeItem('interview_session_id');
      }

      // Exponential backoff only if not explicitly disconnected
      if (urlRef.current) {
        const timeout = Math.min(1000 * Math.pow(2, reconnectAttempt), 30000);
        setTimeout(() => {
          setReconnectAttempt((prev) => prev + 1);
        }, timeout);
      }
    };

    ws.onmessage = (e) => {
      if (e.data instanceof ArrayBuffer) {
        onAudioRef.current(e.data);
      } else {
        const data = JSON.parse(e.data);
        if (data.type === 'session_id') {
          sessionStorage.setItem('interview_session_id', data.session_id);
        } else if (data.type === 'scorecard') {
          sessionStorage.removeItem('interview_session_id');
        }
        onJsonRef.current(data);
      }
    };

    wsRef.current = ws;
  }, [reconnectAttempt]); // connect only depends on the attempt count now

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
    urlRef.current = null;
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
    sessionStorage.removeItem('interview_session_id');
  }, []);

  return { connect, send, connected, disconnect };
}
