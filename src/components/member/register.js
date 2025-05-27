import { vscode } from '../api/vscodeApi.js';
import { renderLoginView }    from './login.js';

export function renderRegisterView() {
  // console.log('[Webview] renderRegisterView called');
  const memberApp = document.getElementById('member-app');
  memberApp.style.display = 'block';
  document.getElementById('chat-start-app').style.display = 'none';
  document.getElementById('chat-ing-app').style.display   = 'none';

  memberApp.innerHTML = `
    <div class="form-container">
      <h2>Sign Up</h2>
      <div id="reg-error" class="error-message"></div>
      <div class="input-group" style="position:relative;">
        <input id="reg-email" type="email" placeholder="Email" />
        <input
          type="checkbox"
          id="reg-email-check"
          title="Check Email"
          style="position:absolute; right:8px; top:50%; transform:translateY(-50%);"
        />
      </div>

      <input id="reg-firstname" placeholder="First Name" />
      <input id="reg-lastname" placeholder="Last Name" />
      <input id="reg-password" type="password" placeholder="Password" />
      <input id="reg-phone" type="tel" placeholder="Phone Number" />

      <div class="form-buttons">
        <button id="btn-register">Register</button>
        <button id="btn-back">Back</button>
      </div>
    </div>
  `;

  const errorDiv       = document.getElementById('reg-error');
  const emailEl        = document.getElementById('reg-email');
  const emailCheckBox  = document.getElementById('reg-email-check');

  // 이메일 중복 체크박스
  emailCheckBox.addEventListener('change', () => {
    const email = emailEl.value.trim()
    if (!email) {
      errorDiv.style.color = '#ff6b6b'
      errorDiv.textContent = '이메일을 입력한 후 체크해주세요.'
      emailCheckBox.checked = false
      return
    }
    // console.log('[Webview] Sending checkEmail for', email);
    vscode.postMessage({ type: 'checkEmail', email })
  }) 

  // 회원가입 필드
  document.getElementById('btn-register').addEventListener('click', () => {
    const email     =  emailEl.value.trim();
    const firstName    = document.getElementById('reg-firstname').value.trim();
    const lastName     = document.getElementById('reg-lastname').value.trim();
    const password     = document.getElementById('reg-password').value;
    const phone       = document.getElementById('reg-phone').value.trim();

    if (!email || !firstName || !lastName || !password || !phone) {
      errorDiv.style.color = '#ff6b6b'
      errorDiv.textContent = '모든 필드를 입력해주세요.'
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorDiv.style.color = '#ff6b6b'
      errorDiv.textContent = '유효한 이메일 주소를 입력해주세요.'
      return
    }
    if (!emailCheckBox.checked) {
      errorDiv.style.color = '#ff6b6b'
      errorDiv.textContent = '이메일 중복 확인을 해주세요.'
      return
    }
    if (password.length < 6) {
      errorDiv.style.color = '#ff6b6b'
      errorDiv.textContent = '비밀번호는 최소 6자 이상이어야 합니다.'
      return
    }
    if (!/^\d+$/.test(phone)) {
      errorDiv.style.color = '#ff6b6b'
      errorDiv.textContent = '전화번호는 숫자만 입력해주세요.'
      return
    }

    errorDiv.textContent = '';
    vscode.postMessage(
      { type: 'signup', body: { email, firstName, lastName, password, phone } }
    )
  });

  document.getElementById('btn-back').addEventListener('click', () => {
    console.log('[Webview] Rendering login view');
    renderLoginView();
  })
}