import { onLoginSuccess } from './auth.js'; 

export function renderLoginView() {
  const memberApp = document.getElementById('member-app');
  memberApp.innerHTML = `
    <div class="form-container">
      <h2>Login</h2>
      <div id="login-error" calass="error-message"></div>
      <input id="login-email" type="email" placeholder="Email" />
      <input id="login-password" type="password" placeholder="Password" />
      <div class="form-buttons">
        <button id="login-btn">Login</button>
        <button id="register-btn">Register</button>
      </div>
    </div>
  `;
  memberApp.style.display = 'block';

  const errorDiv = document.getElementById('login-error');
  
  document.getElementById('login-btn').addEventListener('click', () => {
    errorDiv.textContent = '';
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    // 기본적인 유효성 검사
    if (!email || !password) {
      errorDiv.textContent = '모든 필드를 입력해주세요.';
      return;
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errorDiv.textContent = '유효한 이메일 주소를 입력해주세요.';
      return;
    }

    // TODO: 실제 로그인 API 호출

    fetch(`${window.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    .then(res => {
      if(!res.ok) return res.json().then(err => { throw new Error(err.message || '로그인 실패'); });
      return res.json();
    })
    .then(data => onLoginSuccess(data))
    .catch(err => {
      errorDiv.textContent = err.message;
    });
  });

  document.getElementById('register-btn').addEventListener('click', () => {
    window.dispatchEvent(new MessageEvent('message', { data: { type: 'toRegister' } }));
  });
}
