import { attachDeleteHandlers } from './sessionDelete.js';
import { requestChatSessionList, requestUpdateSessionTitle } from './sessionApi.js';
import { loadChatSession } from './sessionLoad.js';
import { renderChatView } from '../chat_ing.js';
import { setSession, getSession } from './sessionState.js';
import { setChatSessionId, getChatSessionId } from '../chat_logic.js';

export async function renderSessionList() {
  const listDiv = document.getElementById('session-list');
  if (!listDiv) return;
  listDiv.innerHTML = '<div>Loading...</div>';
  try {
    const sessions = await requestChatSessionList();
    // 세션 id 기준 오름차순 정렬
    sessions.sort((a, b) => a.id - b.id);
    
    // 현재 활성 세션 ID 가져오기
    const currentSessionId = getChatSessionId();
    
    if (!sessions.length) {
      listDiv.innerHTML = '<div style="color:#888;">No previous chats.</div>';
      return;
    }
    // 스타일 추가 (한 번만)
    if (!document.getElementById('session-list-style')) {
      const style = document.createElement('style');
      style.id = 'session-list-style';
      style.textContent = `
        .session-item:hover {
          background: #2c313a !important;
          color: #fff !important;
        }
        .session-item.current-session {
          font-weight: 600 !important;
        }
        .session-item.current-session:hover {
          background: #2c313a !important;
          color: #fff !important;
        }
        .session-title-edit {
          background: #333 !important;
          border: 1px solid #4CAF50;
          outline: none;
          padding: 4px 8px;
          border-radius: 4px;
          color: #fff;
          font-size: 1rem;
          width: 100%;
        }
      `;
      document.head.appendChild(style);
    }
    // 세션 리스트 렌더링 (DEL 버튼 포함)
    listDiv.innerHTML = sessions.map(
      s => {
        const isCurrentSession = currentSessionId && s.id === currentSessionId;
        const currentClass = isCurrentSession ? ' current-session' : '';
        const currentDot = isCurrentSession ? '<span style="display:inline-block;width:8px;height:8px;background:#4CAF50;border-radius:50%;margin-right:8px;"></span>' : '';
        
        return `<div style="display:flex;align-items:center;margin-bottom:4px;">
          <button class="session-item${currentClass}" data-id="${s.id}" data-title="${s.title || ''}" style="flex:1; display: flex; align-items: center; width: 100%; text-align: left; background: #23272e; color: ${isCurrentSession ? '#888' : '#fff'}; border: none; border-radius: 4px; padding: 8px 12px; cursor: ${isCurrentSession ? 'default' : 'pointer'}; font-size: 1rem; transition: background 0.2s;">
            <span style="display:inline-block;width:20px;height:20px;margin-right:12px;">
              <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
                <path d="M4 20V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7l-3 3z" stroke="#aaa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="session-title" title="${isCurrentSession ? '현재 사용 중인 세션' : '더블클릭하여 제목 편집'}">${currentDot}${s.title || '(No Title)'}</span>
          </button>
          <button class="del-session-btn" data-id="${s.id}">DEL</button>
        </div>`;
      }
    ).join('');

    // 세션 클릭 이벤트
    listDiv.querySelectorAll('.session-item').forEach(btn => {
      btn.addEventListener('click', async e => {
        // 현재 세션이거나 편집 모드일 때는 클릭 무시
        const id = Number(btn.getAttribute('data-id'));
        if (id === currentSessionId || e.target.closest('.session-title-edit')) {
          return;
        }
        
        const title = btn.getAttribute('data-title') || '';
        
        try {
          setSession(id, title);
          setChatSessionId(id);
          const chatData = await loadChatSession(id);
          renderChatView(chatData);
          
          // 세션 클릭 시 화면 전환을 위한 메시지 전송
          window.postMessage({ type: 'sessionClicked' }, '*');
          
          // 세션 리스트 오버레이 닫기
          const overlay = document.getElementById('session-list-overlay');
          if (overlay) {
            overlay.remove();
          }
          // 렌더링 완료 후 스크롤을 맨 밑으로 이동
          setTimeout(() => {
            window.postMessage({ type: 'scrollToBottom' }, '*');
          }, 100);
        } catch (error) {
          console.error('Error loading chat session:', error);
        }
      });

      // 제목 더블클릭 이벤트 (편집 모드)
      const titleSpan = btn.querySelector('.session-title');
      titleSpan.addEventListener('dblclick', async (e) => {
        e.stopPropagation();
        const sessionId = btn.getAttribute('data-id');
        const currentTitle = titleSpan.textContent === '(No Title)' ? '' : titleSpan.textContent;
        
        // 입력 필드로 변경
        const input = document.createElement('input');
        input.className = 'session-title-edit';
        input.type = 'text';
        input.value = currentTitle;
        input.style.width = `${titleSpan.offsetWidth}px`;
        
        titleSpan.style.display = 'none';
        titleSpan.parentNode.insertBefore(input, titleSpan.nextSibling);
        input.focus();
        input.select();

        // 제목 변경 완료 함수
        const saveTitle = async () => {
          const newTitle = input.value.trim();
          if (newTitle !== currentTitle) {
            try {
              await requestUpdateSessionTitle(Number(sessionId), newTitle);
              titleSpan.textContent = newTitle || '(No Title)';
              btn.setAttribute('data-title', newTitle);
              console.log('세션 제목이 변경되었습니다:', newTitle);
            } catch (error) {
              console.error('제목 변경 실패:', error);
              alert('제목 변경에 실패했습니다: ' + error.message);
            }
          }
          // 편집 모드 종료
          input.remove();
          titleSpan.style.display = '';
        };

        // Enter 키로 저장
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            saveTitle();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            input.remove();
            titleSpan.style.display = '';
          }
        });

        // 포커스 아웃 시 저장
        input.addEventListener('blur', saveTitle);
      });
    });

    // DEL 버튼에만 삭제 기능 부여 (UI에서만 삭제)
    attachDeleteHandlers(listDiv, (id) => {
      const btn = listDiv.querySelector(`.del-session-btn[data-id="${id}"]`);
      const div = btn ? btn.parentElement : null;
      if (div) div.remove();
    });
  } catch (e) {
    console.error('[chat_session.js] Error fetching session list:', e);
    listDiv.innerHTML = '<div style="color:red;">세션 목록 불러오기 실패</div>';
  }
}

export async function renderSessionListOverlay() {
  // 기존 오버레이가 있으면 제거
  let overlay = document.getElementById('session-list-overlay');
  if (overlay) overlay.remove();

  overlay = document.createElement('div');
  overlay.id = 'session-list-overlay';
  overlay.style = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0,0,0,0.35); z-index: 9999; display: flex; align-items: flex-start; justify-content: center;
  `;

  // 패널
  const panel = document.createElement('div');
  panel.style = `
    margin-top: 80px; background: #23272e; border-radius: 10px; box-shadow: 0 8px 32px #0008;
    min-width: 340px; max-width: 480px; width: 100%; padding: 24px 0 12px 0;
  `;
  panel.innerHTML = `
    <div id="session-list" style="max-height: 400px; overflow-y: auto; padding: 0 24px;"></div>
  `;

  overlay.appendChild(panel);
  document.body.appendChild(overlay);

  // 배경 클릭 시 닫기
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.remove();
  });

  // 기존 renderSessionList 함수 재사용
  await renderSessionList();

  // ESC로 닫기
  window.addEventListener('keydown', function escListener(e) {
    if (e.key === 'Escape') {
      overlay.remove();
      window.removeEventListener('keydown', escListener);
    }
  });
} 