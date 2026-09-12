import { useState, useRef, useCallback, useEffect } from 'react';
import { Client, StompHeaders, type IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface StompLogMessage {
  id: string;
  type: 'sent' | 'received' | 'system' | 'error';
  text: string;
  timestamp: string;
  topic?: string;
}

export interface UseStompOptions {
  url: string;
  subscribeDestination?: string;
  publishDestination?: string;
  useSockJS?: boolean;
  headers?: Record<string, string>;
}

export function useStompWebSocket() {
  const [status, setStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR'>('DISCONNECTED');
  const [logs, setLogs] = useState<StompLogMessage[]>([]);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  
  const clientRef = useRef<Client | null>(null);
  const activeSubsRef = useRef<Map<string, any>>(new Map());

  const addLog = useCallback((type: StompLogMessage['type'], text: string, topic?: string) => {
    const newLog: StompLogMessage = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      text,
      timestamp: new Date().toLocaleTimeString(),
      topic,
    };
    setLogs((prev) => [...prev, newLog]);
  }, []);

  const connect = useCallback((options: UseStompOptions) => {
    const { url, useSockJS = false, headers = {} } = options;

    if (!url.trim()) {
      alert('소켓 엔드포인트 주소를 입력해주세요. (예: ws://localhost:8080/ws-stomp 또는 http://localhost:8080/ws-stomp)');
      return;
    }

    if (clientRef.current) {
      clientRef.current.deactivate();
    }

    setStatus('CONNECTING');
    addLog('system', `[STOMP 연결 시도] ${url} (SockJS: ${useSockJS ? 'ON' : 'OFF'})`);

    const stompHeaders: StompHeaders = { ...headers };

    const client = new Client({
      connectHeaders: stompHeaders,
      debug: (str) => {
        console.log('[STOMP Debug]:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    if (useSockJS) {
      client.webSocketFactory = () => new SockJS(url);
    } else {
      client.brokerURL = url;
    }

    client.onConnect = (frame) => {
      setStatus('CONNECTED');
      addLog('system', `[STOMP 연결 성공] Session: ${frame.headers['user-name'] || 'Connected'}`);

      // 기본 구독 주소가 지정된 경우 자동 구독
      if (options.subscribeDestination?.trim()) {
        subscribeTopic(options.subscribeDestination.trim(), client);
      }
    };

    client.onStompError = (frame) => {
      setStatus('ERROR');
      addLog('error', `[STOMP 에러] ${frame.headers['message'] || '알 수 없는 STOMP 에러'}`);
      console.error('STOMP Error Frame:', frame);
    };

    client.onWebSocketClose = (evt) => {
      setStatus('DISCONNECTED');
      addLog('system', `[STOMP 연결 종료] Code: ${evt.code}`);
    };

    client.activate();
    clientRef.current = client;
  }, [addLog]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      addLog('system', '[STOMP 연결 해제 요청]');
      activeSubsRef.current.forEach((sub) => sub.unsubscribe());
      activeSubsRef.current.clear();
      setSubscriptions([]);
      clientRef.current.deactivate();
      clientRef.current = null;
      setStatus('DISCONNECTED');
    }
  }, [addLog]);

  const subscribeTopic = useCallback((destination: string, customClient?: Client) => {
    const client = customClient || clientRef.current;
    if (!client || !client.connected) {
      alert('STOMP 소켓이 연결된 상태에서만 구독할 수 있습니다.');
      return;
    }

    if (activeSubsRef.current.has(destination)) {
      addLog('system', `[구독 중복] 이미 구독 중인 Destination입니다: ${destination}`);
      return;
    }

    try {
      const sub = client.subscribe(destination, (message: IMessage) => {
        addLog('received', message.body, destination);
      });

      activeSubsRef.current.set(destination, sub);
      setSubscriptions((prev) => [...prev, destination]);
      addLog('system', `[구독 시작] ${destination}`);
    } catch (err: any) {
      addLog('error', `[구독 실패] ${destination}: ${err.message}`);
    }
  }, [addLog]);

  const unsubscribeTopic = useCallback((destination: string) => {
    const sub = activeSubsRef.current.get(destination);
    if (sub) {
      sub.unsubscribe();
      activeSubsRef.current.delete(destination);
      setSubscriptions((prev) => prev.filter((d) => d !== destination));
      addLog('system', `[구독 해제] ${destination}`);
    }
  }, [addLog]);

  const publishMessage = useCallback((destination: string, body: string, headers?: Record<string, string>) => {
    if (!clientRef.current || !clientRef.current.connected) {
      alert('STOMP 소켓이 연결되어 있지 않습니다.');
      return false;
    }

    if (!destination.trim()) {
      alert('발행(Publish) Destination 주소를 입력해주세요. (예: /pub/message)');
      return false;
    }

    try {
      clientRef.current.publish({
        destination: destination.trim(),
        body,
        headers,
      });
      addLog('sent', body, destination);
      return true;
    } catch (err: any) {
      addLog('error', `[메시지 발행 실패] ${destination}: ${err.message}`);
      return false;
    }
  }, [addLog]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, []);

  return {
    status,
    logs,
    subscriptions,
    connect,
    disconnect,
    subscribeTopic,
    unsubscribeTopic,
    publishMessage,
    clearLogs,
  };
}

export default useStompWebSocket;
