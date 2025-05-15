import { handleStartChat } from './chat_logic.js';
import { renderChatView } from './chat_ing.js';
import { logout } from '../member/auth.js';

// textarea 자동 높이 조절
function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

export function renderStartView() {
  const startApp  = document.getElementById('chat-start-app');
  const memberApp = document.getElementById('member-app');
  const chatApp   = document.getElementById('chat-ing-app');
  if (!startApp) return;

  // 로그인 화면 숨기고, 시작 화면만 보이기
  memberApp.style.display = 'none';
  startApp.style.display  = 'flex';
  chatApp.style.display   = 'none';

  startApp.innerHTML = `
    <div class="start-container">
      <div class="start-header">
        <h1>Ask Castle Coder</h1>
        <p>Castle Coder is your security assistant. Ask anything about code, exploits, or defense.</p>
        <a href="#" id="logout-link" class="text-link">Logout</a>
      </div>
      <div class="chat-input-area">
        <textarea id="first-question" rows="2" placeholder="Ask Castle Coder"></textarea>
        <button id="start-btn">Start</button>
      </div>
    </div>
  `;

  // 로그아웃 링크 이벤트 리스너 추가
  document.getElementById('logout-link').addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });

  const ta  = document.getElementById('first-question');
  const btn = document.getElementById('start-btn');
  if (ta) {
    ta.style.overflow = 'hidden';
    autoResize(ta);
    ta.addEventListener('input', () => autoResize(ta));
    ta.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        btn.click();
      }
    });
  }
  if (btn && ta) {
    btn.addEventListener('click', () => {
      const msg = ta.value.trim();
      if (msg) handleStartChat(msg);
    });
  }
}

// 웹뷰 메시지 리스너: newChat, userPrompt 처리
window.addEventListener('message', ev => {
  const { type, prompt } = ev.data;
  if (type === 'newChat') {
    renderStartView();
  }
  if (type === 'userPrompt') {
    renderChatView(prompt);
  }
});
