import { vscode } from '../../api/vscodeApi.js';

// 채팅 세션 생성 요청 (프론트 → 익스텐션)
export function requestCreateSession(title) {
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
  return new Promise((resolve, reject) => {
    vscode.postMessage({
      type: 'updateChatSessionTitle',
      chatSessionId: chatSessionId,
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