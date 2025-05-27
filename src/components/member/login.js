import { vscode } from '../api/vscodeApi.js';
import { renderRegisterView } from './register.js';

export function renderLoginView() {
  const memberApp = document.getElementById('member-app');
  memberApp.innerHTML = `
    <div class="form-container">
      <h2>Login</h2>
      <div id="login-error" class="error-message"></div>
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

    vscode.postMessage(
      { type: 'login', body: { email, password } }
    );
  });

  document.getElementById('register-btn').addEventListener('click', () => {
    renderRegisterView();
  });
}