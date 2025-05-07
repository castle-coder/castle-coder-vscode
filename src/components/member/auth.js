// auth.js

import { renderLoginView }    from './login.js';
import { renderRegisterView } from './register.js';
import { renderStartView }    from '../chat/chat_start.js';

// 전역 인증 상태
window.__castleCoder_isAuthenticated = false;

// 메시지 리스너
window.addEventListener('message', (e) => {
  const { type } = e.data;
  if (type === 'toLogin') {
    renderLoginView();
  }
  if (type === 'toRegister') {
    renderRegisterView();
  }
  if (type === 'newChat' && window.__castleCoder_isAuthenticated) {
    renderStartView();
  }
});

// ▶️ **웹뷰 로드 직후** 로그인 화면부터 띄우기
renderLoginView();

// 로그인 성공 시 호출 (login.js 에서 import 해 와서 씁니다)
export function onLoginSuccess() {
  window.__castleCoder_isAuthenticated = true;
  // 직접 시작 화면 렌더로 넘어가거나…
  // window.postMessage 방식 대신, 같은 웹뷰 내에서 직접 이벤트를 트리거:
  window.dispatchEvent(new MessageEvent('message', { data: { type: 'newChat' } }));
}
