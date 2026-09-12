import { useState, useEffect, useRef, useCallback } from 'react';

export type SocketStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export interface UseWebSocketOptions {
  autoReconnect?: boolean;
  reconnectInterval?: number;
  onOpen?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    autoReconnect = false,
    reconnectInterval = 3000,
    onOpen,
    onMessage,
    onError,
    onClose,
  } = options;

  const [status, setStatus] = useState<SocketStatus>('DISCONNECTED');
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const urlRef = useRef<string>('');

  const connect = useCallback((url: string) => {
    if (!url) return;
    urlRef.current = url;

    if (socketRef.current) {
      socketRef.current.close();
    }

    setStatus('CONNECTING');

    try {
      const ws = new WebSocket(url);

      ws.onopen = (event) => {
        setStatus('CONNECTED');
        if (onOpen) onOpen(event);
      };

      ws.onmessage = (event) => {
        setLastMessage(event);
        if (onMessage) onMessage(event);
      };

      ws.onerror = (event) => {
        setStatus('ERROR');
        if (onError) onError(event);
      };

      ws.onclose = (event) => {
        setStatus('DISCONNECTED');
        socketRef.current = null;
        if (onClose) onClose(event);

        if (autoReconnect && urlRef.current) {
          setTimeout(() => {
            connect(urlRef.current);
          }, reconnectInterval);
        }
      };

      socketRef.current = ws;
    } catch (err) {
      setStatus('ERROR');
    }
  }, [autoReconnect, reconnectInterval, onOpen, onMessage, onError, onClose]);

  const disconnect = useCallback(() => {
    urlRef.current = '';
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((data: Parameters<WebSocket['send']>[0]) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(data);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return {
    connect,
    disconnect,
    sendMessage,
    status,
    lastMessage,
    socket: socketRef.current,
  };
}

export default useWebSocket;
