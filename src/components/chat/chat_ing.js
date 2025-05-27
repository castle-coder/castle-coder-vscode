// src/components/chat/chat_ing.js

import { renderStartView } from './chat_start.js';
import { logout } from '../member/auth.js';
import { renderSessionList, renderSessionListOverlay } from '../chat/session/chat_session.js';

// textarea 자동 높이 조절
function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

export function renderChatView(chatDataOrMessage) {
  const startApp  = document.getElementById('chat-start-app');
  const memberApp = document.getElementById('member-app');
  const chatApp   = document.getElementById('chat-ing-app');
  if (!chatApp) return;

  // 시작/로그인 영역 숨기고, 채팅 화면만 보이기
  memberApp.style.display = 'none';
  startApp.style.display  = 'none';
  chatApp.style.display   = 'flex';

  // 항상 채팅 화면을 새로 그리기 위해 초기화
  chatApp.innerHTML = '';

  // 채팅 컨테이너 생성
  chatApp.innerHTML = `
    <div class="chat-container">
      <div class="chat-header">
        <h2>Castle Coder</h2>
        <a href="#" id="chat-ing-logout" class="text-link">Logout</a>
      </div>
      <div class="chatbox" id="chatbox"></div>
      <div class="chat-input-area">
        <textarea id="ask-input" rows="1" placeholder="Ask more..."></textarea>
        <button id="send-btn">Send</button>
      </div>
    </div>
  `;

  // 로그아웃 링크 이벤트 리스너 추가
  document.getElementById('chat-ing-logout').addEventListener('click', (e) => {
    e.preventDefault();
    console.log('Logout clicked in chat_ing.js');
    logout();
    chatApp.style.display = 'none';
    startApp.style.display = 'none';
    memberApp.style.display = 'block';
  });

  const chatbox = document.getElementById('chatbox');
  const ta      = document.getElementById('ask-input');
  const btn     = document.getElementById('send-btn');

  // 메시지 추가 헬퍼
  function addMessage(sender, text) {
    const safeText = typeof text === 'string' ? text : '';
    const el = document.createElement('div');
    el.className = `chat-message ${sender==='You'?'user':'bot'}`;
    el.innerHTML = `
      <div class="sender">${sender}</div>
      <div class="text">${safeText.replace(/\n/g,'<br>')}</div>
    `;
    chatbox.appendChild(el);
    chatbox.scrollTop = chatbox.scrollHeight;
  }

  // 세션 로드 시 messages 배열 처리
  if (chatDataOrMessage && Array.isArray(chatDataOrMessage.messages)) {
    if (chatDataOrMessage.messages.length === 0) {
      addMessage('Bot', '이 채팅 세션에는 메시지가 없습니다.');
    } else {
      chatDataOrMessage.messages.forEach(msg => {
        addMessage(msg.sender || 'Bot', msg.text);
      });
    }
    return;
  }

  // 초기 prompt 메시지 (기존 로직)
  if (chatDataOrMessage) {
    addMessage('You', chatDataOrMessage);
    addMessage('Bot', chatDataOrMessage);
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
}

// 웹뷰 메시지 리스너: newChat, showSessionList 처리
window.addEventListener('message', ev => {
  if (ev.data.type === 'newChat') {
    renderStartView();
  }
  if (ev.data.type === 'showSessionList') {
    renderSessionListOverlay();
  }
});
