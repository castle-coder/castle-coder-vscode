// register.js
export function renderRegisterView() {
  const memberApp = document.getElementById('member-app');
  memberApp.style.display = 'block';
  document.getElementById('chat-start-app').style.display = 'none';
  document.getElementById('chat-ing-app').style.display   = 'none';

  memberApp.innerHTML = `
    <div class="form-container">
      <h2>Sign Up</h2>
      <input id="reg-id"      placeholder="ID" />
      <input id="reg-name"    placeholder="Name" />
      <input id="reg-pw" type="password" placeholder="Password" />
      <div class="form-buttons">
        <button id="btn-register">Register</button>
        <button id="btn-back">Back</button>
      </div>
    </div>
  `;

  document.getElementById('btn-register')
    .addEventListener('click', () => {
      // 그냥 등록 성공 처리
      alert('Registered! Please login.');
      window.postMessage({ type: 'toLogin' }, '*');
    });

  document.getElementById('btn-back')
    .addEventListener('click', () => {
      window.postMessage({ type: 'toLogin' }, '*');
    });
}
