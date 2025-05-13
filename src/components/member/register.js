// window.addEventListener('message', event => {
//   if (event.data.command === 'setBaseUrl') {
//     window.baseUrl = event.data.baseUrl;
//   }
// });

export function renderRegisterView() {
  const memberApp = document.getElementById('member-app');
  memberApp.style.display = 'block';
  document.getElementById('chat-start-app').style.display = 'none';
  document.getElementById('chat-ing-app').style.display   = 'none';

  // Initialize baseUrl
  window.baseUrl = 'http://13.125.85.38:8080/api/v1';

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
  const firstNameEl    = document.getElementById('reg-firstname');
  const lastNameEl     = document.getElementById('reg-lastname');
  const passwordEl     = document.getElementById('reg-password');
  const phoneEl        = document.getElementById('reg-phone');
  const base           = window.baseUrl;

  // 1) 이메일 체크박스 이벤트: 중복 검사
  emailCheckBox.addEventListener('change', async () => {
    errorDiv.textContent = '';
    const email = emailEl.value.trim();
    if (!email) {
      errorDiv.textContent = '이메일을 입력한 후 체크해주세요.';
      emailCheckBox.checked = false;
      return;
    }
    try {
      const res = await fetch(`${window.baseUrl}/member/check-email?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('fetch url:', window.baseUrl);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || '이미 등록된 이메일입니다.');
      }
      errorDiv.style.color = 'limegreen';
      errorDiv.textContent = '사용 가능한 이메일입니다.';
    } catch (e) {
      errorDiv.style.color = '#ff6b6b';
      errorDiv.textContent = e.message;
      emailCheckBox.checked = false;
    }
  });

  // 2) Register 버튼: 최종 검증·회원가입
  document.getElementById('btn-register').addEventListener('click', async () => {
    errorDiv.textContent = '';
    errorDiv.style.color = '#ff6b6b';

    const email     = emailEl.value.trim();
    const firstName = firstNameEl.value.trim().toUpperCase();
    const lastName  = lastNameEl.value.trim().toUpperCase();
    const password  = passwordEl.value;
    const phone     = phoneEl.value.trim();

    // 빈 필드
    if (!email || !firstName || !lastName || !password || !phone) {
      errorDiv.textContent = '모든 필드를 입력해주세요.';
      return;
    }
    // 이메일 포맷
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorDiv.textContent = '유효한 이메일 주소를 입력해주세요.';
      return;
    }
    // 이메일 중복 체크여부
    if (!emailCheckBox.checked) {
      errorDiv.textContent = '이메일 중복 확인을 해주세요.';
      return;
    }
    // 비밀번호 길이
    if (password.length < 6) {
      errorDiv.textContent = '비밀번호는 최소 6자 이상이어야 합니다.';
      return;
    }
    // 전화번호 숫자만
    if (!/^\d+$/.test(phone)) {
      errorDiv.textContent = '전화번호는 숫자만 입력해주세요.';
      return;
    }

    try {
      const res = await fetch(`${window.baseUrl}/member/sign-up`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, lastName, password, phone })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || '회원가입에 실패했습니다.');
      }
      errorDiv.style.color = 'limegreen';
      errorDiv.textContent = '회원가입 완료! 로그인해주세요.';
      window.postMessage({ type: 'toLogin' }, '*');
    } catch (e) {
      errorDiv.textContent = e.message;
    }
  });

  document.getElementById('btn-back').addEventListener('click', () => {
    window.postMessage({ type: 'toLogin' }, '*');
  });
}
