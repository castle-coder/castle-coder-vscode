import { vscode } from '../../api/vscodeApi.js';
import { renderSessionList } from './chat_session.js';
import { getChatSessionId, setChatSessionId } from '../chat_logic.js';
import { renderStartView } from '../chat_start.js';
import { setSession } from './sessionState.js';
/**
 * 세션 리스트 내 DEL 버튼에 삭제 기능을 부여합니다.
 * @param {HTMLElement} listDiv - 세션 리스트가 렌더링된 DOM 요소
 * @param {Function} onDelete - 삭제 후 콜백 (id 인자)
 */
export function attachDeleteHandlers(listDiv, onDelete) {
  let deletedSessionId = null;
  // 스타일 한 번만 추가
  if (!document.getElementById('session-list-delete-style')) {
    const style = document.createElement('style');
    style.id = 'session-list-delete-style';
    style.textContent = `
      .del-session-btn {
        margin-left:8px; background:#ff4d4f; color:#fff; border:none; border-radius:4px; padding:4px 8px; cursor:pointer;
        font-size:0.9rem;
      }
      .del-session-btn:hover {
        background:#d9363e;
      }
    `;
    document.head.appendChild(style);
  }

  // DEL 버튼에 클릭 이벤트 부여
  listDiv.querySelectorAll('.del-session-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = Number(btn.getAttribute('data-id'));
      // 현재 세션 삭제 여부 플래그 저장
      deletedSessionId = id;
      // 익스텐션에 삭제 요청
      vscode.postMessage({
        type: 'deleteChatSession',
        chatSessionId: Number(id)
      });
      // 삭제 결과는 아래에서 메시지로 받음
    });
  });

  function handleDeleteMsg(event) {
    const message = event.data;
    if (message.type === 'deleteChatSessionResponse') {
      if (message.success) {
        if (onDelete) {
          onDelete(message.chatSessionId);
        }
        renderSessionList();
  
        if (Number(deletedSessionId) === Number(message.chatSessionId)) {
          setChatSessionId(null);
          setSession(null, null);
          renderStartView(); // 진짜 새 채팅 시작 화면
        }
      } else {
        console.error('삭제 실패: ' + message.error);
      }
      window.removeEventListener('message', handleDeleteMsg);
      console.log('🔴 삭제된 세션 ID:', deletedSessionId);
      console.log('🟡 현재 세션 ID:', getChatSessionId());
      console.log('🟢 삭제 응답 ID:', message.chatSessionId);
      console.log('🟠 새 세션 생성 요청 전');

    }
  }
window.addEventListener('message', handleDeleteMsg);

window.addEventListener('message', (ev) => {
  console.log('[DEBUG][window message]', ev.data);
});
}