export function renderRegisterView() {
  const memberApp = document.getElementById('member-app');
  memberApp.style.display = 'block';
  document.getElementById('chat-start-app').style.display = 'none';
  document.getElementById('chat-ing-app').style.display   = 'none';

  memberApp.innerHTML = `
    <div class="form-container">
      <h2>Sign Up</h2>
      <div id="reg-error" class="error-message"></div>
      <input id="reg-email" type="email" placeholder="Email" />
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

  const errorDiv = document.getElementById('reg-error');

  document.getElementById('btn-register')
    .addEventListener('click', () => {
      errorDiv.textContent = '';
      const email       = document.getElementById('reg-email').value.trim();
      const firstName   = document.getElementById('reg-firstname').value.trim();
      const lastName    = document.getElementById('reg-lastname').value.trim();
      const password    = document.getElementById('reg-password').value;
      const phoneNumber = document.getElementById('reg-phone').value.trim();

      // 기본적인 유효성 검사
      if (!email || !firstName || !lastName || !password || !phoneNumber) {
        errorDiv.textContent = '모든 필드를 입력해주세요';
        return;
      }

      // 이메일 형식 검사
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errorDiv.textContent = '유효한 이메일 주소를 입력해주세요';
        return;
      }

      // 비밀번호 길이 검사 (최소 6자)
      if (password.length < 6) {
        errorDiv.textContent = '비밀번호의 길이는 최소 6자 이상이어야 합니다';
        return;
      }

      // 전화번호 형식 검사 (숫자만)
      const phoneRegex = /^\d+$/;
      if (!phoneRegex.test(phoneNumber)) {
        errorDiv.textContent = '전화번호는 숫자만 입력해주세요';
        return;
      }

      // 실제 회원가입 API 호출
      fetch(`${window.baseUrl}/member/sign-up`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, lastName, password, phoneNumber })
      })
      .then(res => {
        if (!res.ok) return res.json().then(err => { throw new Error(err.message || '회원가입에 실패했습니다.'); });
        return res.json();
      })
      .then(() => {
        errorDiv.style.color = 'limegreen';
        errorDiv.textContent = '회원가입 완료! 로그인해주세요.';
        window.postMessage({ type: 'toLogin' }, '*');
      })
      .catch(err => {
        errorDiv.textContent = err.message;
      });
    });

  document.getElementById('btn-back')
    .addEventListener('click', () => {
      window.postMessage({ type: 'toLogin' }, '*');
    });
}
