import { renderLoginView }    from './login.js';
import { renderStartView }    from '../chat/chat_start.js';
import { vscode } from '../api/vscodeApi.js';

// 전역 인증 상태 및 사용자 정보
window.__castleCoder_auth = { isAuthenticated: false, user: null };

// 로컬 스토리지에서 인증 정보 복원
function restoreAuthState() {
  const savedAuth = localStorage.getItem('castleCoder_auth');
  if (savedAuth) {
    try {
      const { user, accessToken, refreshToken } = JSON.parse(savedAuth);
      if (accessToken && refreshToken && user) {
        window.__castleCoder_auth = {
          isAuthenticated: true,
          user: user,
          accessToken: accessToken,
          refreshToken: refreshToken
        };
        renderStartView();
        return;
      }
    } catch (e) {
      console.error('Failed to restore auth state:', e);
      localStorage.removeItem('castleCoder_auth');
    }
  }
}

// 메시지 리스너
window.addEventListener('message', (e) => {
  const msg = e.data;
  // console.log('[Webview] Received message:', msg);
  
  switch (msg.type) {

    // 로그인 response
    case 'loginResponse':
      // { success: true, data: { token, ... } }
      if (msg.success) {
        const { accessToken, refreshToken, ...user } = msg.data;
        window.__castleCoder_auth = {
          isAuthenticated: true,
          user: user,
          accessToken: accessToken,
          refreshToken: refreshToken
        };
        // 로컬 스토리지에 인증 정보 저장
        localStorage.setItem('castleCoder_auth', JSON.stringify({
          user: user,
          accessToken: accessToken,
          refreshToken: refreshToken
        }));
        renderStartView();
      } else {
        document.getElementById('login-error').textContent = msg.error;
      }
      break

    // 로그인 에러 처리
    case 'loginError':
     document.getElementById('login-error').textContent = msg.error
      break

    // 회원가입 response
    case 'signupResponse':
      if (msg.success) {
        // 가입 성공
        document.getElementById('reg-error').style.color = 'limegreen'
        document.getElementById('reg-error').textContent = '회원가입 완료! 로그인해주세요.'
      } else {
        document.getElementById('reg-error').style.color = '#ff6b6b'
        document.getElementById('reg-error').textContent = msg.error
      }
      break

     // 회원가입 에러 처리
    case 'signupError':
      document.getElementById('reg-error').style.color = '#ff6b6b'
      document.getElementById('reg-error').textContent = msg.error
      break

    // 이메일 중복 체크 response
    case 'checkEmailResult':
      // { success: boolean, available?: boolean, error?: string }
      const fb = document.getElementById('reg-error')
      if (msg.success) {
        if (msg.available) {
          fb.style.color = 'limegreen'
          fb.textContent = '사용 가능한 이메일입니다.'
        } else {
          fb.style.color = '#ff6b6b'
          fb.textContent = '이미 등록된 이메일입니다.'
        }
      } else {
        fb.style.color = '#ff6b6b'
        fb.textContent = msg.error
      }
      break

    case 'newChat':
      if (window.__castleCoder_auth.isAuthenticated) {
        renderStartView();
      }
      break

    default:
      break
  }
  
  // if (type === 'newChat' && window.__castleCoder_auth.isAuthenticated) {
  //   console.log('Rendering start view...');
  //   renderStartView();
  // }
})

// ▶️ **웹뷰 로드 직후** 저장된 인증 상태 확인 후 적절한 화면 표시
restoreAuthState();
if (!window.__castleCoder_auth.isAuthenticated) {
  renderLoginView();
}

// 로그아웃 함수
export function logout() {
  window.__castleCoder_auth.isAuthenticated = false;
  window.__castleCoder_auth.user = null;
  localStorage.removeItem('castleCoder_auth');
  renderLoginView();
  vscode.postMessage({ type: 'logout' });
}

// 현재 인증 상태 확인
export function isAuthenticated() {
  return window.__castleCoder_auth.isAuthenticated;
}

// 현재 사용자 정보 가져오기
export function getCurrentUser() {
  return window.__castleCoder_auth.user;
}
