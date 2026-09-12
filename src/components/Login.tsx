import React from 'react';

interface LoginProps {
  onSdkLoginSuccess: (authObj: any) => void;
}

const Login: React.FC<LoginProps> = ({ onSdkLoginSuccess }) => {
  // Spring Boot Security default OAuth2 authorization endpoints
  const SPRING_KAKAO_URL = `http://localhost:8080/oauth2/authorization/kakao`;
  const SPRING_APPLE_URL = `http://localhost:8080/oauth2/authorization/apple`;

  // 1. Kakao SDK Login
  const handleKakaoSdkLogin = () => {
    if (!window.Kakao) {
      alert('Kakao SDK가 로드되지 않았습니다.');
      return;
    }
    
    window.Kakao.Auth.login({
      success: async (authObj: any) => {
        console.log('Kakao SDK Login Success:', authObj);
        try {
          const res = await fetch('http://localhost:8080/sdk/oauth2/authorization/kakao', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ authObj })
          });
          const data = await res.json();
          console.log('Backend Kakao Auth Data:', data);
        } catch (err) {
          console.error('Backend Auth Failed:', err);
        }
        onSdkLoginSuccess(authObj);
      },
      fail: (err: any) => {
        console.error('Kakao SDK Login Failed:', err);
      },
    });
  };

  // 2. Apple JS SDK Login (Popup Mode)
  const handleAppleSdkLogin = async () => {
    if (!window.AppleID) {
      alert('Apple ID SDK가 로드되지 않았습니다.');
      return;
    }

    const clientId = import.meta.env.VITE_APPLE_CLIENT_ID;
    const redirectURI = import.meta.env.VITE_APPLE_REDIRECT_URI || 'http://localhost:5173/login/oauth2/code/apple';

    if (!clientId || clientId === 'com.yourdomain.app.service') {
      alert(
        ' 애플로그인 설정 필요:\n\n' +
        'invalid_client 에러는 Apple에 등록되지 않은 임시 Client ID(Services ID)를 사용했기 때문입니다.\n\n' +
        '.env 파일의 VITE_APPLE_CLIENT_ID 값에 Apple Developer Console에서 생성한 실제 Services ID를 입력해주세요!'
      );
      return;
    }

    try {
      window.AppleID.auth.init({
        clientId: clientId,
        scope: 'email',
        redirectURI: redirectURI,
        state: 'origin:web',
        usePopup: true
      });

      const response = await window.AppleID.auth.signIn();
      console.log('Apple SDK Login Success:', response);

      // Apple JS SDK 응답(id_token)을 백엔드 DTO(AppleSdkRequest) 규격에 맞게 변환
      const idToken = response.authorization?.id_token || response.authorization?.code;

      const payload = {
        authObj: {
          access_token: idToken,
          refresh_token: null
        }
      };

      console.log('Sending Apple DTO Payload to Backend:', payload);

      try {
        const res = await fetch('http://localhost:8080/sdk/oauth2/authorization/apple', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log('Backend Apple Auth Data:', data);
      } catch (err) {
        console.error('Backend Apple Auth Failed:', err);
      }

      onSdkLoginSuccess(response);
    } catch (error: any) {
      if (error?.error === 'popup_closed_by_user') {
        console.info('사용자가 애플 로그인 팝업 창을 닫았거나 취소했습니다.');
      } else {
        console.error('Apple SDK Login Error:', error);
      }
    }
  };

  const handleKakaoSpringLogin = () => {
    window.location.href = SPRING_KAKAO_URL;
  };

  const handleAppleSpringLogin = () => {
    window.location.href = SPRING_APPLE_URL;
  };

  return (
    <div className="login-card">
      <div className="login-header">
        <h2 className="brand-logo">MyService</h2>
        <p>로그인 방식을 선택해 주세요.</p>
      </div>

      <div className="social-login-group">
        <div className="provider-section-title">카카오 로그인</div>
        
        {/* Kakao SDK */}
        <div className="login-option">
          <span>방법 1: Kakao JS SDK (프론트 단독)</span>
          <button className="kakao-login-button-styled" onClick={handleKakaoSdkLogin}>
            <img 
              src="https://developers.kakao.com/tool/resource/static/img/button/login/full/ko/kakao_login_medium_narrow.png" 
              alt="카카오 SDK 로그인" 
            />
          </button>
        </div>

        {/* Kakao Spring Boot Redirect */}
        <div className="login-option">
          <span>방법 2: Kakao Spring Boot OAuth2</span>
          <button className="kakao-login-button-styled spring-button" onClick={handleKakaoSpringLogin}>
             <div className="custom-social-button kakao-btn">
               <img src="https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_medium.png" alt="" width="20"/>
               <span>카카오로 시작하기 (Backend)</span>
             </div>
          </button>
        </div>

        <div className="divider-small"></div>

        <div className="provider-section-title">애플 로그인 (Sign in with Apple)</div>

        {/* Apple JS SDK */}
        <div className="login-option">
          <span>방법 1: Apple JS SDK (팝업 모드)</span>
          <button className="apple-login-button-styled" onClick={handleAppleSdkLogin}>
            <div className="custom-social-button apple-btn">
              <svg width="18" height="18" viewBox="0 0 170 170" fill="currentColor">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.16-1.9-14.48-6.08-3.48-2.8-7.42-7.55-11.83-14.26-6.63-10.12-11.8-21.43-15.51-33.92-3.71-12.5-5.57-24.16-5.57-35 0-14.7 3.73-26.68 11.19-35.94 7.46-9.26 16.7-13.98 27.72-14.16 4.7 0 9.87 1.25 15.51 3.75 5.64 2.5 9.47 3.75 11.49 3.75 1.76 0 5.76-1.32 12.01-3.96 6.25-2.64 11.53-3.83 15.84-3.57 11.87.53 21.6 4.96 29.19 13.29-10.45 6.31-15.57 15.11-15.36 26.4.22 8.78 3.52 16.14 9.9 22.08 6.38 5.94 14.16 9.45 23.34 10.53-2.39 7.23-5.56 14.24-9.51 21.03zM119.22 31.85c0-6.84 2.47-13.35 7.41-19.53 4.94-6.18 11.16-10.13 18.66-11.85.22.98.33 1.94.33 2.88 0 6.74-2.52 13.35-7.56 19.83-5.04 6.48-11.23 10.4-18.57 11.76-.08-.87-.27-2.06-.27-3.09z" />
              </svg>
              <span>Apple로 로그인 (JS SDK)</span>
            </div>
          </button>
        </div>

        {/* Apple Spring Boot Redirect */}
        <div className="login-option">
          <span>방법 2: Apple Spring Boot OAuth2</span>
          <button className="apple-login-button-styled" onClick={handleAppleSpringLogin}>
            <div className="custom-social-button apple-btn apple-btn-outline">
              <svg width="18" height="18" viewBox="0 0 170 170" fill="currentColor">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.16-1.9-14.48-6.08-3.48-2.8-7.42-7.55-11.83-14.26-6.63-10.12-11.8-21.43-15.51-33.92-3.71-12.5-5.57-24.16-5.57-35 0-14.7 3.73-26.68 11.19-35.94 7.46-9.26 16.7-13.98 27.72-14.16 4.7 0 9.87 1.25 15.51 3.75 5.64 2.5 9.47 3.75 11.49 3.75 1.76 0 5.76-1.32 12.01-3.96 6.25-2.64 11.53-3.83 15.84-3.57 11.87.53 21.6 4.96 29.19 13.29-10.45 6.31-15.57 15.11-15.36 26.4.22 8.78 3.52 16.14 9.9 22.08 6.38 5.94 14.16 9.45 23.34 10.53-2.39 7.23-5.56 14.24-9.51 21.03zM119.22 31.85c0-6.84 2.47-13.35 7.41-19.53 4.94-6.18 11.16-10.13 18.66-11.85.22.98.33 1.94.33 2.88 0 6.74-2.52 13.35-7.56 19.83-5.04 6.48-11.23 10.4-18.57 11.76-.08-.87-.27-2.06-.27-3.09z" />
              </svg>
              <span>Apple로 로그인 (Backend)</span>
            </div>
          </button>
        </div>
      </div>
      
      <p className="signup-prompt">
        계정이 없으신가요? <a href="#" className="signup-link">회원가입</a>
      </p>
    </div>
  );
};

export default Login;
