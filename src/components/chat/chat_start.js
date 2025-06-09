import { setChatSessionId, handleStartChat, onSessionReady } from './chat_logic.js';
import { renderChatView } from './chat_ing.js';
import { logout } from '../member/auth.js';
import { requestCreateSession as createSession, requestUpdateSessionTitle as updateSessionTitle } from '../chat/session/sessionApi.js';
import { setSession, getSession } from '../chat/session/sessionState.js';
import { renderSessionList, renderSessionListOverlay } from '../chat/session/chat_session.js';
import { uploadImage } from './imageUrl/imageUpload.js';
import { deleteImage } from './imageUrl/imageDelete.js';
import { sendLLMChatMessage, sendLLMChatMessageWithImage } from './connect/codeGenerate.js';

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
      <div class="start-header" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; width: 100%;">
        <h1 style="margin:0; font-size: 2rem; letter-spacing: -2px;">Ask Castle Coder</h1>
        <a href="#" id="chat-start-logout" class="text-link" style="font-size: 1.2rem; color: #888;">Logout</a>
      </div>
      <div class="description-section" style="margin-bottom: 32px; text-align: center;">
        <p style="margin: 0 0 16px 0; font-size: 16px; color: #e0e0e0; line-height: 1.5; font-weight: 500;">
          Your AI Assistant for Secure & Efficient Code Development
        </p>
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #bbb; line-height: 1.4;">
          Get expert help with code reviews, security vulnerability analysis, refactoring, and optimization
        </p>
        <p style="margin: 0; font-size: 13px; color: #999; line-height: 1.3;">
          Smart code suggestions 
          • Security-first approach 
          • Performance optimization 
          • Best practices guidance
        </p>
      </div>
      <div class="chat-input-area">
        <div class="input-row">
          <input type="file" id="image-upload-start" accept="image/*" style="display:none" multiple />
          <button id="image-upload-btn-start" title="이미지 첨부" type="button" style="margin-right:8px; background:transparent; border:none; cursor:pointer;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" fill="none"/><path d="M4 5C4 4.44772 4.44772 4 5 4H19C19.5523 4 20 4.44772 20 5V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V5Z" stroke="#bbb" stroke-width="1.5"/><path d="M8 13L11 16L16 11" stroke="#bbb" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="8.5" cy="8.5" r="1.5" fill="#bbb"/></svg>
          </button>
          <div id="image-file-list-start" class="image-file-list" style="display:flex;gap:4px;"></div>
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
      let { sessionId, title } = getSession();
      if (msg) {
        if (!sessionId) {
          // 세션이 없을 때만 생성 (기본 제목 사용)
          const sessionData = await createSession('새 채팅 세션');
          console.log('[Debug] createSession response:', sessionData);
          // 실제 구조에 맞게 chatSessionId 추출
          sessionId = sessionData.chatSessionId || sessionData.sessionId || sessionData.id || (sessionData.data && (sessionData.data.chatSessionId || sessionData.data.sessionId || sessionData.data.id));
          if (!sessionId) {
            console.log('[Debug] 세션 ID 추출 실패');
            return;
          }
          setSession(sessionId, '새 채팅 세션');
          // 콜백 등록만 하고 setChatSessionId는 호출하지 않음
          onSessionReady(() => {
            handleStartChat(msg, attachedImages.map(img => img.imageUrl));
            ta.value = '';
            autoResize(ta);
            attachedImages = [];
            renderFileList(attachedImages);
          });
        } else {
          handleStartChat(msg, attachedImages.map(img => img.imageUrl));
          ta.value = '';
          autoResize(ta);
          attachedImages = [];
          renderFileList(attachedImages);
        }
      }
    });
  }

  // 첨부 이미지 리스트 (imageUrl, fileName)
  let attachedImages = [];

  // 이미지 업로드 버튼 이벤트
  document.getElementById('image-upload-btn-start').onclick = function() {
    document.getElementById('image-upload-start').click();
  };
  // 파일 선택 시 서버 업로드
  document.getElementById('image-upload-start').onchange = async function(e) {
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
    const listDiv = document.getElementById('image-file-list-start');
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
