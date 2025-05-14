// auth.js

import { renderLoginView }    from './login.js';
import { renderRegisterView } from './register.js';
import { renderStartView }    from '../chat/chat_start.js';

// 전역 인증 상태 및 사용자 정보
window.__castleCoder_auth = { isAuthenticated: false, user: null };

// 메시지 리스너
window.addEventListener('message', (e) => {
  const msg = e.data;
  
  switch (msg.type) {
    case 'toLogin':
      renderLoginView()
      break

    case 'toRegister':
      renderRegisterView()
      break

    // 로그인 response
    case 'loginResponse':
      // { success: true, data: { token, ... } }
      if (msg.success) {
        window.__castleCoder_auth = {
          isAuthenticated: true,
          user: msg.data
        }
        renderStartView()
      } else {
        document.getElementById('login-error').textContent = msg.error
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
        fb.style.color = 'limegreen'
        fb.textContent = msg.available
          ? '사용 가능한 이메일입니다.'
          : '이미 등록된 이메일입니다.'
      } else {
        fb.style.color = '#ff6b6b'
        fb.textContent = msg.error
      }
      break

    case 'newChat':
      if (window.__castleCoder_auth.isAuthenticated) {
        console.log('Rendering start view...');
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

// ▶️ **웹뷰 로드 직후** 로그인 화면부터 띄우기
renderLoginView();

// 로그아웃 함수
export function logout() {
  window.__castleCoder_auth.isAuthenticated = false;
  window.__castleCoder_auth.user = null;
  renderLoginView();
}

// 현재 인증 상태 확인
export function isAuthenticated() {
  return window.__castleCoder_auth.isAuthenticated;
}

// 현재 사용자 정보 가져오기
export function getCurrentUser() {
  return window.__castleCoder_auth.user;
}
