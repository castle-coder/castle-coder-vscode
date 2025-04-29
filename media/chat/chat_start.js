import { handleStartChat } from './chat_logic.js';

export function renderStartView() {
  const startApp = document.getElementById('chat-start-app');
  if (!startApp) {
    console.error('Chat start app element not found');
    return;
  }

  startApp.innerHTML = `
    <div class="start-container">
      <div class="start-title">Ask Castle Coder</div>
      <div class="start-description">
        Castle Coder is your security assistant. Ask anything about code, exploits, or defense.
      </div>
      <div class="chat-input-area">
        <input type="text" class="ask" id="first-question" placeholder="Ask Castle Coder" />
        <button id="start-btn" class="add-color-button">Start</button>
      </div>
    </div>
  `;

  const startButton = document.getElementById('start-btn');
  const firstQuestionInput = document.getElementById('first-question');

  if (startButton && firstQuestionInput) {
    startButton.addEventListener('click', () => {
      const msg = firstQuestionInput.value.trim();
      if (msg) {
        handleStartChat(msg);
      }
    });
  } else {
    console.error('Start button or input field not found');
  }
}

renderStartView();
