import React from 'react';

interface LoginProps {
  onSdkLoginSuccess: (authObj: any) => void;
}

const Login: React.FC<LoginProps> = ({ onSdkLoginSuccess }) => {
  // Spring Boot Security default OAuth2 authorization endpoint
  const SPRING_OAUTH2_URL = `http://localhost:8080/oauth2/authorization/kakao`;

  const handleSdkLogin = () => {
    if (!window.Kakao) {
      alert('Kakao SDK가 로드되지 않았습니다.');
      return;
    }
    
    window.Kakao.Auth.login({
      success: async (authObj: any) => {
        console.log('SDK Login Success:', authObj);
        try {
        const response = await fetch('http://localhost:8080/sdk/oauth2/authorization/kakao', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          authObj: authObj
        })
      }).then(response => response.json())
      .then(data => console.log(data));
    } catch (err) {
      console.error('Backend Auth Failed:', err);
    }
        onSdkLoginSuccess(authObj);
      },
      fail: (err: any) => {
        console.error('SDK Login Failed:', err);
      },
    });

    //  window.Kakao.Auth.authorize({
    //   redirectUri: 'http://localhost:5173'
    // });
  };

  const handleSpringLogin = () => {
    // Redirect the entire page to the Spring Boot backend
    window.location.href = SPRING_OAUTH2_URL;
  };

  return (
    <div className="login-card">
      <div className="login-header">
        <h2 className="brand-logo">MyService</h2>
        <p>로그인 방식을 선택해 주세요.</p>
      </div>

      <div className="social-login-group">
        {/* Option 1: JavaScript SDK (Popup) */}
        <div className="login-option">
          <span>방법 1: JS SDK (프론트 단독)</span>
          <button className="kakao-login-button-styled" onClick={handleSdkLogin}>
            <img 
              src="https://developers.kakao.com/tool/resource/static/img/button/login/full/ko/kakao_login_medium_narrow.png" 
              alt="카카오 SDK 로그인" 
            />
          </button>
        </div>

        <div className="divider-small"></div>

        {/* Option 2: Spring Boot OAuth2 (Redirect) */}
        <div className="login-option">
          <span>방법 2: Spring Boot OAuth2 (백엔드 연동)</span>
          <button className="kakao-login-button-styled spring-button" onClick={handleSpringLogin}>
             <div className="custom-kakao-button">
               <img src="https://developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_medium.png" alt="" width="20"/>
               <span>카카오로 시작하기 (Backend)</span>
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
