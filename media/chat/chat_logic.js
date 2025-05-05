import { renderChatView } from './chat_ing.js';  

export function handleStartChat(message) {
  const startApp = document.getElementById('chat-start-app');
  const chatApp = document.getElementById('chat-ing-app');

  if (startApp && chatApp) {
    startApp.style.display = 'none';  
    chatApp.style.display = 'block';  
    renderChatView(message);
  } else {
    console.error('Start app or Chat app not found');
  }
}
