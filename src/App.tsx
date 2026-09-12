import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Profile from './components/Profile';
import KakaoCallback from './components/KakaoCallback';
import AppleCallback from './components/AppleCallback';
import SocketConnection from './components/SocketConnection';
import './App.css';

function NavigationHeader() {
  const location = useLocation();
  
  if (location.pathname.startsWith('/login/oauth2/code/')) {
    return null;
  }

  return (
    <header className="app-header">
      <nav className="nav-tabs">
        <Link 
          to="/" 
          className={`nav-tab ${location.pathname === '/' ? 'active' : ''}`}
        >
          🔑 OAuth2 로그인 테스트
        </Link>
        <Link 
          to="/socket" 
          className={`nav-tab ${location.pathname === '/socket' ? 'active' : ''}`}
        >
          🔌 소켓 통신 연결 테스트
        </Link>
      </nav>
    </header>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSdkReady, setIsSdkReady] = useState(false);

  useEffect(() => {
    const kakaoKey = import.meta.env.VITE_KAKAO_JS_KEY;
    
    const initKakao = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        if (kakaoKey) {
          window.Kakao.init(kakaoKey);
          console.log('Kakao SDK Initialized');
        }
        setIsSdkReady(true);
      } else if (window.Kakao && window.Kakao.isInitialized()) {
        setIsSdkReady(true);
      }
    };

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (window.Kakao) {
        initKakao();
        clearInterval(interval);
      } else if (attempts > 15) {
        // Fallback after 1.5 seconds if SDK fails to load
        setIsSdkReady(true);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleSdkLoginSuccess = (data?: any) => {
    console.log('Login Success Data:', data);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    if (window.Kakao && window.Kakao.Auth && window.Kakao.Auth.getAccessToken()) {
      try {
        window.Kakao.Auth.logout(() => {
          setIsLoggedIn(false);
        });
      } catch (err) {
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }
  };

  if (!isSdkReady) {
    return (
      <div className="app-container">
        <div className="login-card">
          <div className="loading-spinner"></div>
          <p>카카오 SDK 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-wrapper">
        <NavigationHeader />
        <main className="app-container">
          <Routes>
            <Route 
              path="/" 
              element={isLoggedIn ? <Profile onLogout={handleLogout} /> : <Login onSdkLoginSuccess={handleSdkLoginSuccess} />} 
            />
            <Route path="/socket" element={<SocketConnection />} />
            <Route path="/login/oauth2/code/kakao" element={<KakaoCallback />} />
            <Route path="/login/oauth2/code/apple" element={<AppleCallback />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
