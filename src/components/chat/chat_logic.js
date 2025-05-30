import { renderChatView } from './chat_ing.js';  
import { sendLLMChatMessage } from './connect/codeGenerate.js';




let chatSessionId = null;

export function setChatSessionId(id) {
  chatSessionId = id;
}

export function getChatSessionId() {
  return chatSessionId;
}

export function handleStartChat(prompt) {
  const startApp = document.getElementById('chat-start-app');
  const chatApp = document.getElementById('chat-ing-app');
  if (!chatSessionId) {
    console.error('chatSessionId가 설정되지 않았습니다!');
    return;
  }
  sendLLMChatMessage({
    chatSessionId,
    prompt
  });
  if (startApp && chatApp) {
    startApp.style.display = 'none';  
    chatApp.style.display = 'block';  
    renderChatView(prompt);
  } else {
    console.error('Start app or Chat app not found');
  }
}

export function handleSendMessage(prompt) {
  if (!chatSessionId) {
    console.error('chatSessionId가 설정되지 않았습니다!');
    return;
  }
  sendLLMChatMessage({
    chatSessionId,
    prompt
  });
}
