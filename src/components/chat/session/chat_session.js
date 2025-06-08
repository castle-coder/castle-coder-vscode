import { attachDeleteHandlers } from './sessionDelete.js';
import { requestChatSessionList } from './sessionApi.js';
import { loadChatSession } from './sessionLoad.js';
import { renderChatView } from '../chat_ing.js';
import { setSession } from './sessionState.js';
import { setChatSessionId } from '../chat_logic.js';

export async function renderSessionList() {
  const listDiv = document.getElementById('session-list');
  if (!listDiv) return;
  listDiv.innerHTML = '<div>Loading...</div>';
  try {
    const sessions = await requestChatSessionList();
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
      `;
      document.head.appendChild(style);
    }
    // 세션 리스트 렌더링 (DEL 버튼 포함)
    listDiv.innerHTML = sessions.map(
      s => `<div style="display:flex;align-items:center;margin-bottom:4px;">
        <button class="session-item" data-id="${s.id}" data-title="${s.title || ''}" style="flex:1; display: flex; align-items: center; width: 100%; text-align: left; background: #23272e; color: #fff; border: none; border-radius: 4px; padding: 8px 12px; cursor: pointer; font-size: 1rem; transition: background 0.2s;">
          <span style="display:inline-block;width:20px;height:20px;margin-right:12px;">
            <svg viewBox="0 0 24 24" fill="none" width="20" height="20">
              <path d="M4 20V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7l-3 3z" stroke="#aaa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span>${s.title || '(No Title)'}</span>
        </button>
        <button class="del-session-btn" data-id="${s.id}">DEL</button>
      </div>`
    ).join('');

    // 세션 클릭 이벤트
    listDiv.querySelectorAll('.session-item').forEach(btn => {
      btn.addEventListener('click', async e => {
        const id = btn.getAttribute('data-id');
        const title = btn.getAttribute('data-title') || '';
        try {
          setSession(Number(id), title);
          setChatSessionId(Number(id));
          const chatData = await loadChatSession(Number(id));
          renderChatView(chatData);
        } catch (error) {
          console.error('Error loading chat session:', error);
        }
      });
    });

    // DEL 버튼에만 삭제 기능 부여 (UI에서만 삭제)
    attachDeleteHandlers(listDiv, (id) => {
      const div = listDiv.querySelector(`.del-session-btn[data-id="${id}"]`).parentElement;
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