import { renderChatView } from './chat_ing.js';

export function handleStartChat(message) {
  // chat_ing 뷰로 전환
  renderChatView(message);
}
