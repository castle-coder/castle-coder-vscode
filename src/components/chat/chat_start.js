import { setChatSessionId, handleStartChat, onSessionReady } from './chat_logic.js';
import { renderChatView } from './chat_ing.js';
import { logout } from '../member/auth.js';
import { requestCreateSession as createSession, requestUpdateSessionTitle as updateSessionTitle } from '../chat/session/sessionApi.js';
import { setSession, getSession } from '../chat/session/sessionState.js';
import { renderSessionList, renderSessionListOverlay } from '../chat/session/chat_session.js';

// textarea 자동 높이 조절
function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

export function renderStartView() {
  // 새로운 채팅 시작 시 세션 상태 초기화
  window.__castleCoder_session = {};
  
  const startApp  = document.getElementById('chat-start-app');
  const memberApp = document.getElementById('member-app');
  const chatApp   = document.getElementById('chat-ing-app');
  if (!startApp) return;

  // 로그인 화면 숨기고, 시작 화면만 보이기
  memberApp.style.display = 'none';
  startApp.style.display  = 'flex';
  chatApp.style.display   = 'none';

  startApp.innerHTML = `
    <div class="start-container" style="width: 100%; box-sizing: border-box;">
      <!-- <div id="session-list" style="margin-bottom: 16px;"></div> -->
      <div class="title-row" style="display: flex; justify-content: flex-start; align-items: center; margin-bottom: 24px; width: 100%;">
        <input type="text" id="chat-title" placeholder="제목 입력" 
          style="height: 32px; font-size: 18px; padding: 4px 12px; flex: 1 1 0; min-width: 0; width: 100%; box-sizing: border-box; background: #232323; color: #fff; border: none; border-radius: 6px; outline: none; transition: background 0.2s; ::placeholder{color:#aaa;}"/>
      </div>
      <div class="start-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; width: 100%;">
        <h1 style="margin:0; font-size: 2rem; letter-spacing: -2px;">Ask Castle Coder</h1>
        <a href="#" id="chat-start-logout" class="text-link" style="margin-left: 24px; font-size: 1.2rem; color: #888;">Logout</a>
      </div>
      <div class="chat-input-area">
        <div class="input-row">
          <input type="file" id="image-upload-start" accept="image/*" style="display:none" multiple />
          <button id="image-upload-btn-start" title="이미지 첨부" type="button" style="margin-right:8px; background:transparent; border:none; cursor:pointer;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" fill="none"/><path d="M4 5C4 4.44772 4.44772 4 5 4H19C19.5523 4 20 4.44772 20 5V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V5Z" stroke="#bbb" stroke-width="1.5"/><path d="M8 13L11 16L16 11" stroke="#bbb" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8.5" cy="8.5" r="1.5" fill="#bbb"/></svg>
          </button>
          <span id="image-file-names-start" class="image-file-names" style="color:#eee;font-size:0.95em;margin-left:2px;"></span>
          <textarea id="first-question" rows="2" placeholder="Write your first question"></textarea>
          <button id="start-btn" class="sharp-btn">Start</button>
        </div>
      </div>
    </div>
  `;

  // 로그아웃 링크 이벤트 리스너 추가
  document.getElementById('chat-start-logout').addEventListener('click', (e) => {
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
    btn.addEventListener('click', async () => {
      const msg = ta.value.trim();
      const chatTitle = document.getElementById('chat-title').value.trim();
      let { sessionId, title } = getSession();
      if (msg) {
        if (!sessionId) {
          // 세션이 없을 때만 생성
          const sessionData = await createSession(chatTitle);
          console.log('[Debug] createSession response:', sessionData);
          // 실제 구조에 맞게 chatSessionId 추출
          sessionId = sessionData.chatSessionId || sessionData.sessionId || sessionData.id || (sessionData.data && (sessionData.data.chatSessionId || sessionData.data.sessionId || sessionData.data.id));
          if (!sessionId) {
            console.log('[Debug] 세션 ID 추출 실패');
            return;
          }
          setSession(sessionId, chatTitle);
          // 콜백 등록만 하고 setChatSessionId는 호출하지 않음
          onSessionReady(() => {
            handleStartChat(msg);
          });
        } else {
          handleStartChat(msg);
        }
      }
    });
  }

  // 제목 입력란 엔터 입력 시 blur 처리 (입력 완료)
  const titleInput = document.getElementById('chat-title');
  if (titleInput) {
    titleInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        titleInput.blur();
        const title = titleInput.value.trim();
        let { sessionId } = getSession();
        if (!title) return;
        if (!sessionId) {
          sessionId = await createSession(title);
          setSession(sessionId, title);
        } else {
          await updateSessionTitle(sessionId, title);
          setSession(sessionId, title);
        }
      }
    });

    // 제목 입력란 자동 너비 조절
    const ghostSpan = document.createElement('span');
    ghostSpan.style.visibility = 'hidden';
    ghostSpan.style.position = 'absolute';
    ghostSpan.style.whiteSpace = 'pre';
    // input 스타일과 완전히 동일하게 복사
    const inputStyle = window.getComputedStyle(titleInput);
    ghostSpan.style.fontSize = inputStyle.fontSize;
    ghostSpan.style.fontFamily = inputStyle.fontFamily;
    ghostSpan.style.fontWeight = inputStyle.fontWeight;
    ghostSpan.style.letterSpacing = inputStyle.letterSpacing;
    ghostSpan.style.padding = inputStyle.padding;
    ghostSpan.style.border = inputStyle.border;
    ghostSpan.style.borderRadius = inputStyle.borderRadius;
    ghostSpan.style.boxSizing = inputStyle.boxSizing;
    ghostSpan.style.lineHeight = inputStyle.lineHeight;
    ghostSpan.style.background = inputStyle.background;
    ghostSpan.style.color = inputStyle.color;
    document.body.appendChild(ghostSpan);

    function updateInputWidth() {
      ghostSpan.textContent = titleInput.value || titleInput.placeholder || '';
      // 최소/최대 너비 설정
      const minWidth = 32; // px
      const maxWidth = 400; // px
      const width = Math.min(Math.max(ghostSpan.offsetWidth, minWidth), maxWidth);
      titleInput.style.width = width + 'px';
    }

    // 초기화 및 이벤트 연결
    updateInputWidth();
    titleInput.addEventListener('input', updateInputWidth);
    titleInput.addEventListener('change', updateInputWidth);
    titleInput.addEventListener('blur', updateInputWidth);
  }

  // 이미지 업로드 버튼 이벤트
  document.getElementById('image-upload-btn-start').onclick = function() {
    document.getElementById('image-upload-start').click();
  };
  // 파일 선택 시 파일명 표시
  document.getElementById('image-upload-start').onchange = function(e) {
    const files = Array.from(e.target.files);
    const names = files.map(f => f.name).join(', ');
    document.getElementById('image-file-names-start').textContent = names;
  };

  renderSessionList();
}

// 웹뷰 메시지 리스너: newChat, userPrompt, showSessionList 처리
window.addEventListener('message', ev => {
  const { type, prompt } = ev.data;
  if (type === 'newChat') {
    renderStartView();
  }
  if (type === 'userPrompt') {
    renderChatView(prompt);
  }
  if (type === 'showSessionList') {
    renderSessionListOverlay();
  }
});
