// register.js
export function renderRegisterView() {
  const memberApp = document.getElementById('member-app');
  memberApp.style.display = 'block';
  document.getElementById('chat-start-app').style.display = 'none';
  document.getElementById('chat-ing-app').style.display   = 'none';

  memberApp.innerHTML = `
    <div class="form-container">
      <h2>Sign Up</h2>
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

  document.getElementById('btn-register')
    .addEventListener('click', () => {
      const email = document.getElementById('reg-email').value;
      const firstName = document.getElementById('reg-firstname').value.toUpperCase();
      const lastName = document.getElementById('reg-lastname').value.toUpperCase();
      const password = document.getElementById('reg-password').value;
      const phoneNumber = document.getElementById('reg-phone').value;

      // 기본적인 유효성 검사
      if (!email || !firstName || !lastName || !password || !phoneNumber) {
        alert('Please fill in all fields');
        return;
      }

      // 이메일 형식 검사
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return;
      }

      // 비밀번호 길이 검사 (최소 6자)
      if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
      }

      // 전화번호 형식 검사 (숫자만)
      const phoneRegex = /^\d+$/;
      if (!phoneRegex.test(phoneNumber)) {
        alert('Please enter a valid phone number (numbers only)');
        return;
      }

      // TODO: 실제 회원가입 API 호출
      alert('Registration successful! Please login.');
      window.postMessage({ type: 'toLogin' }, '*');
    });

  document.getElementById('btn-back')
    .addEventListener('click', () => {
      window.postMessage({ type: 'toLogin' }, '*');
    });
}
