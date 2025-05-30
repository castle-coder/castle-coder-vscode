import { renderStartView } from './chat_start.js';
import { logout } from '../member/auth.js';
import { renderSessionList, renderSessionListOverlay } from '../chat/session/chat_session.js';
import { handleSendMessage } from './chat_logic.js';
import { getSession } from '../chat/session/sessionState.js';

// textarea 자동 높이 조절
function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

// 전역 addMessage 함수
function addMessage(sender, text) {
  console.log('[Debug] addMessage called. stack:', new Error().stack);
  const chatbox = document.getElementById('chatbox');
  console.log('[Debug] addMessage called. chatbox:', chatbox, 'sender:', sender, 'text:', text);
  if (!chatbox) return;
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

// 실시간으로 봇 메시지를 업데이트(마지막 메시지 덮어쓰기)
function updateBotMessage(text) {
  const chatbox = document.getElementById('chatbox');
  if (!chatbox) return;
  let lastBotMsg = chatbox.querySelector('.chat-message.bot:last-child');
  if (!lastBotMsg) {
    // 없으면 새로 추가
    lastBotMsg = document.createElement('div');
    lastBotMsg.className = 'chat-message bot';
    chatbox.appendChild(lastBotMsg);
  }
  lastBotMsg.innerHTML = `
    <div class="sender">Bot</div>
    <div class="text">${text.replace(/\n/g, '<br>')}</div>
  `;
  chatbox.scrollTop = chatbox.scrollHeight;
}

export function renderChatView(chatDataOrMessage) {
  console.log('[Debug] renderChatView called', chatDataOrMessage);
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
  const sessionTitle = getSession().title || 'Castle Coder';
  chatApp.innerHTML = `
    <div class="chat-container">
      <div class="chat-header">
        <h2>${sessionTitle}</h2>
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
    logout();
    chatApp.style.display = 'none';
    startApp.style.display = 'none';
    memberApp.style.display = 'block';
  });

  const chatbox = document.getElementById('chatbox');
  const ta      = document.getElementById('ask-input');
  const btn     = document.getElementById('send-btn');

  // 세션 로드 시 messages 배열 처리
  if (chatDataOrMessage && Array.isArray(chatDataOrMessage.messages)) {
    if (chatDataOrMessage.messages.length === 0) {
      addMessage('Bot', '이 채팅 세션에는 메시지가 없습니다.');
    } else {
      chatDataOrMessage.messages.forEach(msg => {
        const chatbox = document.getElementById('chatbox');
        const lastBotMsg = chatbox && chatbox.querySelector('.chat-message.bot:last-child');
        const lastText = lastBotMsg ? lastBotMsg.textContent.trim() : null;
        const newText = (msg.text || '').trim();
        if (msg.sender === 'Bot' && lastText && lastText === newText) {
          // 중복 Bot 메시지면 추가하지 않음
          return;
        }
        addMessage(msg.sender || 'Bot', msg.text);
        // 그냥 이 부분 없앨까?
      });
    }
    return;
  }

  if (chatDataOrMessage) {
    addMessage('You', chatDataOrMessage);
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
    console.log('[Debug] Registering send button event listener');
    btn.addEventListener('click', async () => {
      const msg = ta.value.trim();
      console.log('[Debug] Send button clicked:', msg);
      if (!msg) return;
      handleSendMessage(msg);
      ta.value = '';
      autoResize(ta);
    });
  }
}

let llmBotBuffer = '';

// 메시지 이벤트 리스너 중복 등록 방지
if (!window.__castleCoder_message_listener_registered) {
  window.addEventListener('message', ev => {
    if (ev.data.type === 'newChat') {
      renderStartView();
    }
    if (ev.data.type === 'showSessionList') {
      renderSessionListOverlay();
    }
    if (ev.data.type === 'llm-chat-response') {
      const data = ev.data.data;
      console.log('[Debug] llm-chat-response:', data);

      if (data.type === 'token' && data.content !== undefined) {
        llmBotBuffer += data.content;
        console.log('[Debug] Token received:', data.content, '| Current buffer:', llmBotBuffer);
        updateBotMessage(llmBotBuffer);
      }
      if (data.type === 'end') {
        console.log('[Debug] End message received. Final buffer:', llmBotBuffer);
        addMessage('Bot', llmBotBuffer);
        llmBotBuffer = '';
      }
      return;
    }
    if (ev.data.type === 'llm-chat-error') {
      console.log('[Debug] llm-chat-error:', ev.data.error);
      const chatbox = document.getElementById('chatbox');
      if (chatbox) {
        const el = document.createElement('div');
        el.className = 'chat-message bot';
        el.innerHTML = `
          <div class="sender">Bot</div>
          <div class="text">[Error] ${ev.data.error}</div>
        `;
        chatbox.appendChild(el);
        chatbox.scrollTop = chatbox.scrollHeight;
      }
    }
  });
  window.__castleCoder_message_listener_registered = true;
}
