// auth.js

import { renderLoginView }    from './login.js';
import { renderRegisterView } from './register.js';
import { renderStartView }    from '../chat/chat_start.js';

// 전역 인증 상태 및 사용자 정보
window.__castleCoder_auth = {
  isAuthenticated: false,
  user: null
};

// 메시지 리스너
window.addEventListener('message', (e) => {
  const { type } = e.data;
  console.log('Received message:', type);
  
  if (type === 'toLogin') {
    renderLoginView();
  }
  if (type === 'toRegister') {
    renderRegisterView();
  }
  if (type === 'newChat' && window.__castleCoder_auth.isAuthenticated) {
    console.log('Rendering start view...');
    renderStartView();
  }
});

// ▶️ **웹뷰 로드 직후** 로그인 화면부터 띄우기
renderLoginView();

// 로그인 성공 시 호출
export function onLoginSuccess(userData = null) {
  console.log('Login successful, setting authentication state...');
  window.__castleCoder_auth.isAuthenticated = true;
  window.__castleCoder_auth.user = userData || {
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User'
  };
  
  // 시작 화면으로 전환
  window.dispatchEvent(new MessageEvent('message', { data: { type: 'newChat' } }));
}

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
