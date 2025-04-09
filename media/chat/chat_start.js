import { handleStartChat } from './chat_logic.js';
import './chat_start.css';


export function renderStartView() {
  const app = document.getElementById('app');

  app.innerHTML = `
  <div class="start-container">
    <div class="start-icon">🤖</div>
    <div class="start-title">Ask Castle Coder</div>
    <div class="start-description">
      Castle Coder is your security assistant. Ask anything about code, exploits, or defense.
    </div>
    <div class="start-hints">
      📎 or type <b>#</b> to attach context<br/>
      @ to chat with extensions<br/>
      Type / to use commands
    </div>
    <div class="chat-input-area">
      <input type="text" class="ask" id="first-question" placeholder="Ask Castle Coder" />
      <button class="add-color-button">Start</button>
    </div>
  </div>
`;


  document.getElementById('start-btn').addEventListener('click', () => {
    const msg = document.getElementById('first-question').value.trim();
    if (msg) {
      handleStartChat(msg);  // 입력된 메시지를 로직으로 전달
    }
  });
}
