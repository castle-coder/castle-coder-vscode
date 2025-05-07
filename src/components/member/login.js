// login.js

import { onLoginSuccess } from './auth.js'; // auth.js 에서 가져오세요

export function renderLoginView() {
  const memberApp = document.getElementById('member-app');
  memberApp.innerHTML = `
    <div class="form-container">
      <h2>Login</h2>
      <input id="login-id" placeholder="ID" />
      <input id="login-pw" type="password" placeholder="Password" />
      <div class="form-buttons">
        <button id="login-btn">Login</button>
        <button id="register-btn">Register</button>
      </div>
    </div>
  `;
  memberApp.style.display = 'block';
  
  document.getElementById('login-btn').addEventListener('click', () => {
    const id = document.getElementById('login-id').value;
    const pw = document.getElementById('login-pw').value;
    // mock 검사
    if (id === 'admin' && pw === '1234') {
      onLoginSuccess();
    } else {
      alert('잘못된 자격증명');
    }
  });

  document.getElementById('register-btn').addEventListener('click', () => {
    window.dispatchEvent(new MessageEvent('message', { data: { type: 'toRegister' } }));
  });
}
