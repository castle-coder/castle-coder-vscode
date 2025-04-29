import { renderChatView } from './chat_ing.js';  

export function handleStartChat(message) {
  const startApp = document.getElementById('chat-start-app');
  const chatApp = document.getElementById('chat-ing-app');

  if (startApp && chatApp) {
    startApp.style.display = 'none';  // start 화면 숨기기
    chatApp.style.display = 'block';  // 채팅 화면 보이기
    renderChatView(message);
  } else {
    console.error('Start app or Chat app not found');
  }
}
