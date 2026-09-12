import React, { useEffect, useState } from 'react';

interface ProfileProps {
  onLogout: () => void;
}

const Profile: React.FC<ProfileProps> = ({ onLogout }) => {
  const [user, setUser] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (window.Kakao && window.Kakao.Auth?.getAccessToken()) {
      window.Kakao.API.request({
        url: '/v2/user/me',
        success: (res: any) => {
          console.log('User Profile:', res);
          setUser(res);
        },
        fail: (error: any) => {
          console.error('Failed to get user profile:', error);
          setErrorMsg('프로필 정보를 불러오지 못했습니다.');
          // 유효하지 않은 토큰이면 로그아웃 처리
          onLogout();
        },
      });

      // 3초 이상 응답이 없으면 자동 로그아웃 처리
      timer = setTimeout(() => {
        if (!user) {
          console.warn('Profile request timed out');
          onLogout();
        }
      }, 3000);
    } else {
      // AccessToken이 없으면 바로 로그아웃 상태로 전환
      onLogout();
    }

    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    if (window.Kakao && window.Kakao.Auth && window.Kakao.Auth.getAccessToken()) {
      window.Kakao.Auth.logout(() => {
        console.log('Logged out');
        onLogout();
      });
    } else {
      onLogout();
    }
  };

  if (errorMsg) {
    return (
      <div className="profile-container">
        <p style={{ color: '#ef4444', marginBottom: '16px' }}>{errorMsg}</p>
        <button className="logout-button" onClick={onLogout}>
          로그인 화면으로 돌아가기
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-container">
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '12px', color: '#666' }}>프로필 정보 불러오는 중...</p>
        <button 
          className="logout-button" 
          style={{ marginTop: '16px', backgroundColor: '#e2e8f0', color: '#334155' }} 
          onClick={onLogout}
        >
          로그인 화면으로 강제 이동
        </button>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <h2>Welcome, {user.kakao_account?.profile?.nickname || '사용자'}!</h2>
      {user.kakao_account?.profile?.thumbnail_image_url && (
        <img 
          src={user.kakao_account.profile.thumbnail_image_url} 
          alt="Profile" 
          className="profile-image"
        />
      )}
      <div className="user-details">
        <p>Email: {user.kakao_account?.email || 'N/A'}</p>
      </div>
      <button className="logout-button" onClick={handleLogout}>
        로그아웃 (로그인 화면으로)
      </button>
    </div>
  );
};

export default Profile;
