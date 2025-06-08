import { renderLoginView }    from './login.js';
import { renderStartView }    from '../chat/chat_start.js';
import { vscode } from '../api/vscodeApi.js';

// 전역 인증 상태 및 사용자 정보
window.__castleCoder_auth = { isAuthenticated: false, user: null };

// 로딩 표시
function showLoading() {
  const memberApp = document.getElementById('member-app');
  if (memberApp) {
    memberApp.innerHTML = '<div style="color:#888;padding:32px;text-align:center;">Loading...</div>';
    memberApp.style.display = 'block';
  }
}

// Extension Host로부터 상태 복원
function restoreAuthStateFromExtension(authData) {
  // 다양한 구조를 모두 커버
  const accessToken =
    authData?.accessToken ||
    authData?.data?.accessToken ||
    authData?.user?.data?.accessToken;
  const refreshToken =
    authData?.refreshToken ||
    authData?.data?.refreshToken ||
    authData?.user?.data?.refreshToken;
  const user =
    authData?.user?.data?.user ||
    authData?.user ||
    authData?.data?.user ||
    authData?.user?.data ||
    authData?.data;

  if (authData && accessToken) {
    window.__castleCoder_auth = {
      isAuthenticated: true,
      user: user,
      accessToken: accessToken,
      refreshToken: refreshToken
    };
    renderStartView();
  } else {
    renderLoginView();
  }
}

// 최초 mount 시 로딩 표시
showLoading();

// 일정 시간 내에 인증 정보가 오지 않으면 로그인 화면으로 fallback
let authTimeout = setTimeout(() => {
  renderLoginView();
}, 1500); // 1.5초 후에도 응답 없으면 로그인 화면

// 메시지 리스너
window.addEventListener('message', (e) => {
  const msg = e.data;
  // console.log('[Webview] Received message:', msg);
  
  switch (msg.type) {
    // Extension Host로부터 상태 복원
    case 'restoreAuthState':
    case 'authInfo':
      clearTimeout(authTimeout);
      restoreAuthStateFromExtension(msg.data);
      break;

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
        // Extension Host에도 저장
        console.log('[CastleCoder][Webview] Sending saveAuth', { user, accessToken, refreshToken });
        vscode.postMessage({
          type: 'saveAuth',
          data: {
            user: user,
            accessToken: accessToken,
            refreshToken: refreshToken
          }
        });
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

    case 'restoreSessionState':
      console.log('[CastleCoder][Webview] Session from extension globalState:', msg.data);
      break

    default:
      break
  }
  
  // if (type === 'newChat' && window.__castleCoder_auth.isAuthenticated) {
  //   console.log('Rendering start view...');
  //   renderStartView();
  // }
})

// Webview가 mount될 때 Extension Host에 인증 정보 요청
console.log('[CastleCoder][Webview] Sending getAuth');
vscode.postMessage({ type: 'getAuth' });

// 로그아웃 함수
export function logout() {
  window.__castleCoder_auth.isAuthenticated = false;
  window.__castleCoder_auth.user = null;
  localStorage.removeItem('castleCoder_auth');
  renderLoginView();
  if (vscode) {
    vscode.postMessage({ type: 'logout' });
  }
}

// 현재 인증 상태 확인
export function isAuthenticated() {
  return window.__castleCoder_auth.isAuthenticated;
}

// 현재 사용자 정보 가져오기
export function getCurrentUser() {
  return window.__castleCoder_auth.user;
}
