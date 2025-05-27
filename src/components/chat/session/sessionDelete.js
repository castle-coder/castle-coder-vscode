import { vscode } from '../../api/vscodeApi.js';
import { renderSessionList } from './chat_session.js';
/**
 * 세션 리스트 내 DEL 버튼에 삭제 기능을 부여합니다.
 * @param {HTMLElement} listDiv - 세션 리스트가 렌더링된 DOM 요소
 * @param {Function} onDelete - 삭제 후 콜백 (id 인자)
 */
export function attachDeleteHandlers(listDiv, onDelete) {
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
      const id = btn.getAttribute('data-id');
      console.log('[sessionDelete] DEL 버튼 클릭됨, id:', id);
      // 익스텐션에 삭제 요청
      vscode.postMessage({
        type: 'deleteChatSession',
        chatSessionId: Number(id)
      });
      console.log('[sessionDelete] deleteChatSession 메시지 전송:', { chatSessionId: Number(id) });
      // 삭제 결과는 아래에서 메시지로 받음
    });
  });

  // 삭제 결과 메시지 수신
  window.addEventListener('message', function handleDeleteMsg(event) {
    const message = event.data;
    console.log('[sessionDelete] window message:', message);
    if (message.type === 'deleteChatSessionResponse') {
      console.log('[sessionDelete] deleteChatSessionResponse 수신:', message);
      if (message.success) {
        if (onDelete) {
          console.log('[sessionDelete] onDelete 콜백 호출:', message.chatSessionId);
          onDelete(message.chatSessionId);
        }
        // 삭제 성공 시 세션 목록 새로고침
        renderSessionList();
      } else {
        alert('삭제 실패: ' + message.error);
      }
      window.removeEventListener('message', handleDeleteMsg);
    }
  });
}
