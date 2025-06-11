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
        <button
          type="button"
          id="reg-email-check"
          title="Check Email"
          style="position:absolute; right:8px; top:50%; transform:translateY(-50%); width:24px; height:24px; border:1px solid #666; border-radius:4px; background:#333; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s ease;"
        >
          <span id="check-icon" style="display:none; color:white; font-size:16px; font-weight:bold; line-height:1;">✓</span>
        </button>
      </div>

      <input id="reg-firstname" placeholder="First Name" />
      <input id="reg-lastname" placeholder="Last Name" />
      <input id="reg-password" type="password" placeholder="Password" />
      <input id="reg-phone" type="tel" placeholder="Phone Number" />

      <div class="form-buttons">
        <button id="btn-register">sign up</button>
        <button id="btn-back">Back</button>
      </div>
    </div>
  `;

  const errorDiv       = document.getElementById('reg-error');
  const emailEl        = document.getElementById('reg-email');
  const emailCheckBtn  = document.getElementById('reg-email-check');
  const checkIcon      = document.getElementById('check-icon');
  
  // 체크 상태를 저장하는 변수
  let isEmailChecked = false;

  // 이메일 입력 필드 변경 시 체크 상태 초기화
  emailEl.addEventListener('input', () => {
    console.log('[Webview] emailEl input');
    setEmailChecked(false);
    errorDiv.textContent = '';
  });

  // 체크 상태 설정 함수
  function setEmailChecked(checked) {
    isEmailChecked = checked;
    if (checked) {
      emailCheckBtn.style.background = '#22c55e';
      emailCheckBtn.style.borderColor = '#22c55e';
      checkIcon.style.display = 'block';
    } else {
      emailCheckBtn.style.background = '#333';
      emailCheckBtn.style.borderColor = '#666';
      checkIcon.style.display = 'none';
    }
  }

  // 전역에서 접근 가능하도록 설정
  window.setEmailChecked = setEmailChecked;

  // 이메일 중복 체크 버튼
  emailCheckBtn.addEventListener('click', () => {
    const email = emailEl.value.trim()
    if (!email) {
      errorDiv.style.color = '#ff6b6b'
      errorDiv.textContent = '이메일을 입력한 후 체크해주세요.'
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
    if (!isEmailChecked) {
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