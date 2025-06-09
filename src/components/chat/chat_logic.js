import { renderChatView } from './chat_ing.js';  
import { sendLLMChatMessage, sendLLMChatMessageWithImage } from './connect/codeGenerate.js';
import { setSession } from './session/sessionState.js';
import { renderSessionList } from './session/chat_session.js';




let chatSessionId = null;
let onSessionReadyCallback = null;


export function setChatSessionId(id) {
  chatSessionId = id;
  if (onSessionReadyCallback) {
    onSessionReadyCallback();
    onSessionReadyCallback = null;
  }
}

export function getChatSessionId() {
  return chatSessionId;
}

export function onSessionReady(callback) {
  if (chatSessionId) {
    callback();
  } else {
    onSessionReadyCallback = callback;
  }
}

window.addEventListener('message', ev => {
  const { type, chatSessionId: newId, data, sessionTitle } = ev.data;
  if ((type === 'sessionCreated' || type === 'createChatSessionResponse') && 
      (typeof newId === 'number' || (data && typeof data.chatSessionId === 'number'))) {
    const sessionId = newId || (data && data.chatSessionId);
    console.debug('[Debug] 받은 세션 ID:', sessionId, 'sessionTitle:', sessionTitle);
    setChatSessionId(sessionId);
    if (sessionTitle) {
      setSession(sessionId, sessionTitle);
      console.debug('[Debug] setSession 호출:', sessionId, sessionTitle);
    }
    if (typeof renderSessionList === 'function') {
      renderSessionList();
      console.debug('[Debug] renderSessionList 호출');
    }
  } else if (type === 'scrollToBottom') {
    // 스크롤을 맨 밑으로 내리기
    const chatbox = document.getElementById('chatbox');
    if (chatbox) {
      setTimeout(() => {
        chatbox.scrollTop = chatbox.scrollHeight;
      }, 100); // 약간의 딜레이를 주어 DOM 업데이트 후 스크롤
    }
  } else if (type === 'sessionClicked') {
    // 세션 버튼 클릭 시 채팅 화면으로 전환
    const startApp = document.getElementById('chat-start-app');
    const chatApp = document.getElementById('chat-ing-app');
    
    if (startApp && chatApp) {
      startApp.style.display = 'none';
      chatApp.style.display = 'block';
      console.debug('[Debug] 세션 클릭으로 채팅 화면 전환');
    }
  }
});

export function handleStartChat(prompt, imageUrls = []) {
  const startApp = document.getElementById('chat-start-app');
  const chatApp = document.getElementById('chat-ing-app');
  
  if (!chatSessionId) {
    console.error('chatSessionId가 설정되지 않았습니다!');
    return;
  }
  if (imageUrls && imageUrls.length > 0) {
    sendLLMChatMessageWithImage({ chatSessionId, prompt, imageUrls });
  } else {
    sendLLMChatMessage({ chatSessionId, prompt });
  }
  if (startApp && chatApp) {
    startApp.style.display = 'none';  
    chatApp.style.display = 'block';  
    renderChatView(prompt);
  } else {
    console.error('Start app or Chat app not found');
  }
}

export function handleSendMessage(prompt, imageUrls = []) {
  if (!chatSessionId) {
    console.error('chatSessionId가 설정되지 않았습니다!');
    return;
  }
  if (imageUrls && imageUrls.length > 0) {
    sendLLMChatMessageWithImage({ chatSessionId, prompt, imageUrls });
  } else {
    sendLLMChatMessage({ chatSessionId, prompt });
  }
}
