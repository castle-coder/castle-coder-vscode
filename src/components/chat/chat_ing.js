import { renderStartView } from './chat_start.js';
import { logout } from '../member/auth.js';
import { renderSessionList, renderSessionListOverlay } from '../chat/session/chat_session.js';
import { getSession } from '../chat/session/sessionState.js';
import { uploadImage } from './imageUrl/imageUpload.js';
import { deleteImage } from './imageUrl/imageDelete.js';
import { getChatSessionId, handleSendMessage, setChatSessionId } from './chat_logic.js';

// textarea 자동 높이 조절
function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

// 전역 addMessage 함수
function addMessage(sender, text) {
  const chatbox = document.getElementById('chatbox');
  console.log('[Debug] addMessage called. chatbox:', chatbox, 'sender:', sender, 'text:', text);
  if (!chatbox) return;
  const safeText = typeof text === 'string' ? text : '';
  const el = document.createElement('div');
  el.className = `chat-message ${sender==='You'?'user':'bot'}`;
  el.innerHTML = `
    <div class="sender">${sender === 'Bot' ? 'Castle Coder' : sender}</div>
    <div class="text">${safeText.replace(/\n/g,'<br>')}</div>
  `;
  chatbox.appendChild(el);
  chatbox.scrollTop = chatbox.scrollHeight;
  
  // 봇의 로딩 메시지인 경우 애니메이션 시작
  if (sender === 'Bot' && text === 'Generate...') {
    startLoadingAnimation();
  }
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
    <div class="sender">Castle Coder</div>
    <div class="text">${text.replace(/\n/g, '<br>')}</div>
  `;
  chatbox.scrollTop = chatbox.scrollHeight;
}

// Send 버튼 활성/비활성 함수 수정
function setSendButtonEnabled(enabled, isEndButton = false) {
  const btn = document.getElementById('send-btn');
  if (!btn) return;
  
  btn.disabled = !enabled;
  if (enabled) {
    if (isEndButton) {
      btn.textContent = 'Cancel';
      btn.className = 'sharp-btn cancel-btn';
      btn.style.cssText = `
        background: #ef4444 !important;
        background-image: none !important;
        border-color: #ef4444 !important;
        color: white !important;
        padding: 8px 16px !important;
        border-radius: 4px !important;
        border: 1px solid !important;
        font-weight: 500 !important;
        cursor: pointer !important;
        opacity: 1 !important;
        box-shadow: none !important;
      `;
    } else {
      btn.textContent = 'Send';
      btn.className = 'sharp-btn';
      btn.style.cssText = `
        background-color: #22c55e !important;
        border-color: #22c55e !important;
        color: white !important;
        padding: 8px 16px !important;
        border-radius: 4px !important;
        border: 1px solid !important;
        font-weight: 500 !important;
        cursor: pointer !important;
        opacity: 1 !important;
      `;
    }
  } else {
    btn.className = 'sharp-btn disabled-btn';
    btn.style.cssText = `
      background-color: #888 !important;
      border-color: #888 !important;
      color: white !important;
      padding: 8px 16px !important;
      border-radius: 4px !important;
      border: 1px solid !important;
      font-weight: 500 !important;
      cursor: not-allowed !important;
      opacity: 0.7 !important;
    `;
  }
}

// 로딩 애니메이션을 위한 전역 변수
let loadingAnimationInterval = null;

// 로딩 애니메이션 함수
function startLoadingAnimation() {
  let dots = 0;
  const maxDots = 3;
  
  // 기존 인터벌이 있다면 제거
  if (loadingAnimationInterval) {
    clearInterval(loadingAnimationInterval);
  }
  
  loadingAnimationInterval = setInterval(() => {
    dots = (dots + 1) % (maxDots + 1);
    const loadingText = 'Generate' + '.'.repeat(dots);
    const loadingMessage = document.querySelector('.chat-message.bot:last-child .text');
    if (loadingMessage && loadingMessage.textContent.startsWith('Generate')) {
      loadingMessage.textContent = loadingText;
    }
  }, 500);
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
        <div class="input-row">
          <input type="file" id="image-upload-ing" accept="image/*" style="display:none" multiple />
          <button id="image-upload-btn-ing" title="이미지 첨부" type="button" style="margin-right:8px; background:transparent; border:none; cursor:pointer;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" fill="none"/><path d="M4 5C4 4.44772 4.44772 4 5 4H19C19.5523 4 20 4.44772 20 5V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V5Z" stroke="#bbb" stroke-width="1.5"/><path d="M8 13L11 16L16 11" stroke="#bbb" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8.5" cy="8.5" r="1.5" fill="#bbb"/></svg>
          </button>
          <div id="image-file-list-ing" class="image-file-list" style="display:flex;gap:4px;"></div>
          <textarea id="ask-input" rows="1" placeholder="Ask more..."></textarea>
          <button id="send-btn" class="sharp-btn">Send</button>
        </div>
      </div>
    </div>
    <style>
      .sharp-btn {
        padding: 8px 16px;
        border-radius: 4px;
        border: 1px solid;
        font-weight: 500;
        transition: all 0.2s;
        color: white;
      }
      .sharp-btn:not(.disabled-btn) {
        background-color: #22c55e;
        border-color: #22c55e;
      }
      .sharp-btn.cancel-btn {
        background-color: #ef4444 !important;
        border-color: #ef4444 !important;
      }
      .sharp-btn.disabled-btn {
        background-color: #888;
        border-color: #888;
      }
    </style>
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
      addMessage('Bot', 'Generate...');
      startLoadingAnimation();
      setSendButtonEnabled(true, true);
    } else {
      chatDataOrMessage.messages.forEach(msg => {
        addMessage(msg.sender || 'Bot', msg.text);
      });
    }
  } else if (typeof chatDataOrMessage === 'string' && chatDataOrMessage.trim() !== '') {
    addMessage('You', chatDataOrMessage);
    addMessage('Bot', 'Generate...');
    startLoadingAnimation();
    setSendButtonEnabled(true, true);
  }

  // chatSessionId 설정
  if (chatDataOrMessage && chatDataOrMessage.chatSessionId) {
    setChatSessionId(chatDataOrMessage.chatSessionId);
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

  // 첨부 이미지 리스트 (imageUrl, fileName)
  let attachedImages = [];

  // 이미지 업로드 버튼 이벤트
  document.getElementById('image-upload-btn-ing').onclick = function() {
    document.getElementById('image-upload-ing').click();
  };
  // 파일 선택 시 서버 업로드
  document.getElementById('image-upload-ing').onchange = async function(e) {
    const files = Array.from(e.target.files);
    for (const file of files) {
      try {
        const result = await uploadImage(file);
        console.log('[첨부 성공]', result);
        attachedImages.push(result);
        renderFileList(attachedImages);
      } catch (err) {
        console.error('[첨부 실패]', err);
      }
    }
    e.target.value = '';
  };
  // 첨부 리스트 렌더링 함수 (imageUrl, fileName 기반)
  function renderFileList(list) {
    const listDiv = document.getElementById('image-file-list-ing');
    listDiv.innerHTML = '';
    list.forEach((item, idx) => {
      const fileSpan = document.createElement('span');
      fileSpan.textContent = item.fileName;
      fileSpan.style.cssText = 'color:#eee;font-size:0.95em; background:#222; border-radius:4px; padding:2px 6px; margin-right:2px; display:inline-flex; align-items:center;';
      const delBtn = document.createElement('button');
      delBtn.textContent = '✕';
      delBtn.style.cssText = 'margin-left:4px; background:none; border:none; color:#bbb; font-size:1em; cursor:pointer;';
      delBtn.onclick = async function() {
        try {
          await deleteImage(item.imageUrl);
          attachedImages.splice(idx, 1);
          renderFileList(attachedImages);
        } catch (err) {
          console.error('[삭제 실패]', err);
        }
      };
      fileSpan.appendChild(delBtn);
      listDiv.appendChild(fileSpan);
    });
  }

  // 전송 버튼
  if (btn && ta) {
    console.log('[Debug] Registering send button event listener');
    btn.addEventListener('click', async () => {
      const msg = ta.value.trim();
      console.log('[Debug] Send button clicked:', msg);
      
      // Cancel 버튼인 경우 취소 처리
      if (btn.textContent === 'Cancel') {
        console.log('[Debug] Cancel button clicked');
        cancelResponse();
        return;
      }
      
      if (!msg) return;
      const imageUrls = attachedImages.map(img => img.imageUrl);
      // 질문을 보낼 때 바로 내 메시지를 추가
      addMessage('You', msg);
      addMessage('Bot', 'Generate...');

      setSendButtonEnabled(true, true); // Cancel 버튼으로 변경
      handleSendMessage(msg, imageUrls);
      ta.value = '';
      autoResize(ta);
      attachedImages = [];
      renderFileList(attachedImages);
    });
  }
}

let llmBotBuffer = '';

// 메시지 이벤트 리스너 중복 등록 방지
if (!window.__castleCoder_message_listener_registered) {
  window.addEventListener('message', ev => {
    if (ev.data.type === 'newChat') {
      // 새로운 채팅 시작 시 버퍼 초기화
      llmBotBuffer = '';
      renderStartView();
      // 시작 버튼을 Cancel 버튼으로 변경
      const startBtn = document.querySelector('.start-btn');
      if (startBtn) {
        startBtn.textContent = 'Cancel';
        startBtn.style.cssText = `
          background-color: #ef4444;
          border-color: #ef4444;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          border: 1px solid;
          font-weight: 500;
          cursor: pointer;
          opacity: 1;
        `;
      }
    }
    if (ev.data.type === 'showSessionList') {
      renderSessionListOverlay();
    }
    if (ev.data.type === 'llm-chat-response') {
      const data = ev.data.data;
      console.log('[Debug] llm-chat-response:', data);

      if (data.type === 'token' && data.content !== undefined) {
        // 새로운 토큰이 시작될 때 이전 응답 제거
        if (llmBotBuffer === '') {
          const lastBotMessage = document.querySelector('.chat-message.bot:last-child');
          if (lastBotMessage) {
            lastBotMessage.remove();
          }
        }
        
        llmBotBuffer += data.content;
        console.log('[Debug] Token received:', data.content, '| Current buffer:', llmBotBuffer);
        updateBotMessage(llmBotBuffer);
      }
      if (data.type === 'end') {
        if (llmBotBuffer.trim() !== '') {
          stopLoadingAnimation();
        }
        llmBotBuffer = '';
        // end 타입이 오면 무조건 Send 버튼으로 변경
        setSendButtonEnabled(true, false);
      }
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
    if (ev.data.type === 'update-button-state') {
      setSendButtonEnabled(true, ev.data.data.isEndButton);
    }
  });
  window.__castleCoder_message_listener_registered = true;
}

// 응답 취소 함수
function cancelResponse() {
  const chatSessionId = getChatSessionId();
  
  if (!chatSessionId) {
    console.error('[Debug] No chatSessionId found');
    return;
  }
  
  // 즉시 Send 버튼으로 변경
  setSendButtonEnabled(true, false);
  
  // 로딩 메시지 제거
  const loadingMessage = document.querySelector('.chat-message.bot:last-child');
  if (loadingMessage && loadingMessage.textContent.includes('Generate')) {
    loadingMessage.remove();
  }
  
  // 애니메이션 중지
  stopLoadingAnimation();
  
  // 취소 API 호출
  vscode.postMessage({
    type: 'llm-cancel',
    chatSessionId: chatSessionId
  });
  
  // 취소 메시지 추가
  addMessage('Bot', '응답이 취소되었습니다.');
}
