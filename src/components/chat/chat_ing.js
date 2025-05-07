// src/components/chat/chat_ing.js

import { renderStartView } from './chat_start.js';

// textarea 자동 높이 조절
function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

export function renderChatView(initialMessage) {
  const startApp  = document.getElementById('chat-start-app');
  const memberApp = document.getElementById('member-app');
  const chatApp   = document.getElementById('chat-ing-app');
  if (!chatApp) return;

  // 시작/로그인 영역 숨기고, 채팅 화면만 보이기
  memberApp.style.display = 'none';
  startApp.style.display  = 'none';
  chatApp.style.display   = 'flex';

  chatApp.innerHTML = `
    <div class="chat-container">
      <h2>Castle Coder</h2>
      <div class="chatbox" id="chatbox"></div>
      <div class="chat-input-area">
        <textarea id="ask-input" rows="1" placeholder="Ask more..."></textarea>
        <button id="send-btn">Send</button>
      </div>
      <p class="text">Be careful with security.</p>
    </div>
  `;

  const chatbox = document.getElementById('chatbox');
  const ta      = document.getElementById('ask-input');
  const btn     = document.getElementById('send-btn');

  // 메시지 추가 헬퍼
  function addMessage(sender, text) {
    const el = document.createElement('div');
    el.className = `chat-message ${sender==='You'?'user':'bot'}`;
    el.innerHTML = `
      <div class="sender">${sender}</div>
      <div class="text">${text.replace(/\n/g,'<br>')}</div>
    `;
    chatbox.appendChild(el);
    chatbox.scrollTop = chatbox.scrollHeight;
  }

  // 초기 prompt 메시지
  if (initialMessage) {
    addMessage('You', initialMessage);
    addMessage('Bot', initialMessage);
  }

  // 입력창 세팅
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

  // 전송 버튼
  if (btn && ta) {
    btn.addEventListener('click', () => {
      const msg = ta.value.trim();
      if (!msg) return;
      addMessage('You', msg);
      addMessage('Bot', msg);
      ta.value = '';
      autoResize(ta);
    });
  }

  // 사이드바 상단 + 버튼 눌러 “newChat” 들어오면 시작 화면 복귀
  window.addEventListener('message', ev => {
    if (ev.data.type === 'newChat') {
      renderStartView();
    }
  });
}
