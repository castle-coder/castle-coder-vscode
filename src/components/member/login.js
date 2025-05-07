// login.js

import { onLoginSuccess } from './auth.js'; // auth.js 에서 가져오세요

export function renderLoginView() {
  const memberApp = document.getElementById('member-app');
  memberApp.innerHTML = `
    <div class="form-container">
      <h2>Login</h2>
      <input id="login-email" type="email" placeholder="Email" />
      <input id="login-password" type="password" placeholder="Password" />
      <div class="form-buttons">
        <button id="login-btn">Login</button>
        <button id="register-btn">Register</button>
      </div>
    </div>
  `;
  memberApp.style.display = 'block';
  
  document.getElementById('login-btn').addEventListener('click', () => {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    // 기본적인 유효성 검사
    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address');
      return;
    }

    // TODO: 실제 로그인 API 호출
    // 임시로 admin@example.com / 123456 으로 테스트
    if (email === 'admin@example.com' && password === '123456') {
      onLoginSuccess();
    } else {
      alert('Invalid email or password');
    }
  });

  document.getElementById('register-btn').addEventListener('click', () => {
    window.dispatchEvent(new MessageEvent('message', { data: { type: 'toRegister' } }));
  });
}
