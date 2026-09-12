import React, { useState, useRef, useEffect } from 'react';
import useStompWebSocket from '../hooks/useStompWebSocket';
import './SocketConnection.css';

export const SocketConnection: React.FC = () => {
  // 기본 엔드포인트 URL
  const [url, setUrl] = useState<string>('http://localhost:8080/ws-stomp');
  const [useSockJS, setUseSockJS] = useState<boolean>(true);
  
  // STOMP Destination 설정
  const [subDestination, setSubDestination] = useState<string>('/sub/chat/room/1');
  const [pubDestination, setPubDestination] = useState<string>('/pub/chat/message');
  
  // 메시지 및 인증 헤더
  const [inputMessage, setInputMessage] = useState<string>('{"sender":"User", "message":"Hello STOMP!"}');
  const [authToken, setAuthToken] = useState<string>('');

  const {
    status,
    logs,
    subscriptions,
    connect,
    disconnect,
    subscribeTopic,
    unsubscribeTopic,
    publishMessage,
    clearLogs,
  } = useStompWebSocket();

  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleConnect = () => {
    const headers: Record<string, string> = {};
    if (authToken.trim()) {
      headers['Authorization'] = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
    }

    connect({
      url,
      useSockJS,
      subscribeDestination: subDestination.trim(),
      headers,
    });
  };

  const handleAddSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subDestination.trim()) return;
    subscribeTopic(subDestination.trim());
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !pubDestination.trim()) return;
    publishMessage(pubDestination.trim(), inputMessage.trim());
  };

  return (
    <div className="socket-container">
      <div className="socket-card">
        <div className="socket-header-title">
          <h2 className="socket-title">STOMP 소켓 통신 클라이언트</h2>
          <span className="protocol-badge">STOMP Protocol</span>
        </div>
        
        {/* 1. 서버 엔드포인트 설정 */}
        <div className="socket-section">
          <label className="socket-label">1. STOMP 서버 엔드포인트 URL</label>
          <div className="url-input-group">
            <input
              type="text"
              className="socket-input"
              placeholder="http://localhost:8080/ws-stomp 또는 ws://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={status === 'CONNECTED' || status === 'CONNECTING'}
            />
            {status === 'CONNECTED' || status === 'CONNECTING' ? (
              <button 
                type="button" 
                className="btn btn-disconnect"
                onClick={disconnect}
              >
                연결 해제
              </button>
            ) : (
              <button 
                type="button" 
                className="btn btn-connect"
                onClick={handleConnect}
              >
                STOMP 연결
              </button>
            )}
          </div>

          <div className="options-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={useSockJS}
                onChange={(e) => setUseSockJS(e.target.checked)}
                disabled={status === 'CONNECTED' || status === 'CONNECTING'}
              />
              SockJS 사용 (Spring Boot 추천: HTTP Fallback)
            </label>

            <div className="auth-input-wrapper">
              <input
                type="text"
                className="socket-input auth-input"
                placeholder="인증 토큰 (Bearer Token... 선택사항)"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                disabled={status === 'CONNECTED' || status === 'CONNECTING'}
              />
            </div>
          </div>
        </div>

        {/* 2. 연결 상태 바 */}
        <div className="status-bar">
          <div className="status-indicator-group">
            <span className={`status-dot status-${status.toLowerCase()}`}></span>
            <span className="status-text">
              연결 상태: <strong>{
                status === 'CONNECTED' ? '🟢 연결됨 (CONNECTED)' :
                status === 'CONNECTING' ? '🟡 연결 시도 중... (CONNECTING)' :
                status === 'ERROR' ? '🔴 에러 발생 (ERROR)' : '⚪ 연결 안 됨 (DISCONNECTED)'
              }</strong>
            </span>
          </div>
        </div>

        {/* 3. Topic / Destination 구독 (Subscribe) 관리 */}
        <div className="socket-section">
          <label className="socket-label">2. Topic 구독 (Subscribe)</label>
          <form className="url-input-group" onSubmit={handleAddSubscription}>
            <input
              type="text"
              className="socket-input"
              placeholder="구독 주소 (예: /sub/chat/room/1 또는 /topic/greetings)"
              value={subDestination}
              onChange={(e) => setSubDestination(e.target.value)}
            />
            <button
              type="submit"
              className="btn btn-subscribe"
              disabled={status !== 'CONNECTED' || !subDestination.trim()}
            >
              + 구독하기
            </button>
          </form>

          {/* 구독 목록 Chip */}
          <div className="active-subs-container">
            <span className="subs-label">현재 구독 목록:</span>
            {subscriptions.length === 0 ? (
              <span className="no-subs">구독 중인 Topic이 없습니다.</span>
            ) : (
              subscriptions.map((dest) => (
                <span key={dest} className="sub-chip">
                  {dest}
                  <button 
                    type="button" 
                    className="chip-remove-btn"
                    onClick={() => unsubscribeTopic(dest)}
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* 4. 메시지 발행 (Publish / Send) */}
        <div className="socket-section">
          <label className="socket-label">3. 메시지 발행 (Publish / Send)</label>
          <form className="message-send-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="socket-input pub-dest-input"
              placeholder="발행 Destination (예: /pub/chat/message)"
              value={pubDestination}
              onChange={(e) => setPubDestination(e.target.value)}
            />
            <input
              type="text"
              className="socket-input message-input"
              placeholder={status === 'CONNECTED' ? "전송할 JSON 또는 메시지 내용..." : "STOMP 연결을 먼저 진행해주세요"}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={status !== 'CONNECTED'}
            />
            <button
              type="submit"
              className="btn btn-send"
              disabled={status !== 'CONNECTED' || !inputMessage.trim()}
            >
              전송 (Send)
            </button>
          </form>
        </div>

        {/* 5. 통신 기록 로그 콘솔 */}
        <div className="log-header">
          <span>STOMP 통신 기록 Log</span>
          <button type="button" className="btn-clear" onClick={clearLogs}>
            로그 지우기
          </button>
        </div>

        <div className="log-container">
          {logs.length === 0 ? (
            <div className="empty-log">STOMP 메시지 통신 기록이 없습니다.</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className={`log-item log-${log.type}`}>
                <span className="log-time">[{log.timestamp}]</span>
                <span className="log-type-tag">
                  {log.type === 'sent' ? '발행(SEND) ➔' :
                   log.type === 'received' ? '수신(MESSAGE) ⬅' :
                   log.type === 'system' ? '시스템 ℹ' : '에러 ⚠'}
                </span>
                {log.topic && <span className="log-topic">[{log.topic}]</span>}
                <span className="log-content">{log.text}</span>
              </div>
            ))
          )}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  );
};

export default SocketConnection;
