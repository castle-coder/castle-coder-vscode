import { vscode } from '../../api/vscodeApi.js';

// 채팅 세션 생성 요청 (프론트 → 익스텐션)
export function requestCreateSession(title) {
  console.log('[sessionApi] requestCreateSession called', title);
  return new Promise((resolve, reject) => {
    vscode.postMessage({
      type: 'createChatSession',
      title: title
    });

    // 응답을 처리하는 이벤트 리스너
    window.addEventListener('message', function handleMessage(event) {
      const message = event.data;
      if (message.type === 'createChatSessionResponse') {
        window.removeEventListener('message', handleMessage);
        if (message.success) {
          resolve(message.data);
        } else {
          reject(new Error(message.error));
        }
      }
    });
  });
}

// 채팅 세션 제목 수정 요청 (프론트 → 익스텐션)
export function requestUpdateSessionTitle(chatSessionId, title) {
  console.log('[sessionApi] requestUpdateSessionTitle called', {chatSessionId, title});
  return new Promise((resolve, reject) => {
    vscode.postMessage({
      type: 'updateChatSessionTitle',
      chatSessionId: typeof chatSessionId === 'object' ? chatSessionId.chatSessionId : chatSessionId,
      title: title
    });

    // 응답을 처리하는 이벤트 리스너
    window.addEventListener('message', function handleMessage(event) {
      const message = event.data;
      if (message.type === 'updateChatSessionTitleResponse') {
        window.removeEventListener('message', handleMessage);
        if (message.success) {
          resolve(message.data);
        } else {
          reject(new Error(message.error));
        }
      }
    });
  });
}

// 채팅 세션 목록 요청 (프론트 → 익스텐션)
export function requestChatSessionList() {
  return new Promise((resolve, reject) => {
    vscode.postMessage({ type: 'getChatSessionList' });

    window.addEventListener('message', function handleMessage(event) {
      const message = event.data;
      if (message.type === 'getChatSessionListResponse') {
        window.removeEventListener('message', handleMessage);
        if (message.success) {
          resolve(message.data);
        } else {
          reject(new Error(message.error));
        }
      }
    });
  });
}