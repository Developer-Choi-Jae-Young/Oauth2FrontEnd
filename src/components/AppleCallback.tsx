import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AppleCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Apple OAuth2 / Spring Boot callback handling logic
    console.log('Apple OAuth2 Callback received');
    
    // Parse URL params or hash if Apple SDK redirect mode was used
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const idToken = params.get('id_token');

    if (code || idToken) {
      console.log('Apple Authorization Code:', code);
      console.log('Apple Identity Token:', idToken);
    }

    setTimeout(() => {
      navigate('/');
    }, 1500);
  }, [navigate]);

  return (
    <div className="app-container">
      <div className="login-card">
        <h2>애플 로그인 처리 중...</h2>
        <p>잠시만 기다려 주세요.</p>
        <div className="loading-spinner"></div>
      </div>
    </div>
  );
};

export default AppleCallback;
