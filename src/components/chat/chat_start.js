import { handleStartChat } from './chat_logic.js';

// 입력창 자동 리사이즈 함수
function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

// Webview 전체에서 + 버튼 메시지 받기
window.addEventListener('message', (event) => {
  const message = event.data;
  if (message.type === 'newChat') {
    renderStartView();
  }
  else if (message.type === 'userPrompt') {
    handleStartChat(message.prompt);

    fetchRefactor(prompt)
      .then((refactored) => {
        const chatbox = document.getElementById('chatbox');
        addMessage(chatbox, 'Bot', refactored);
    })
    .catch(err => {
      console.error(err);
      const chatbox = document.getElementById('chatbox');
      addMessage(chatbox, 'Bot', '⚠ Failed to refactor: ' + err.message);
    });
  }
});

export function renderStartView() {
  const startApp = document.getElementById('chat-start-app');
  const chatApp  = document.getElementById('chat-ing-app');
  if (!startApp || !chatApp) return;

  startApp.style.display = 'block';
  chatApp.style.display  = 'none';

  startApp.innerHTML = `
    <div class="start-container">
      <div class="start-title">Ask Castle Coder</div>
      <div class="start-description">
        Castle Coder is your security assistant. Ask anything about code, exploits, or defense.
      </div>
    </div>

    <div class="chat-input-area">
      <div class="input-wrapper">
        <textarea id="first-question" placeholder="Ask Castle Coder" rows="1"></textarea>
        <button id="start-btn">Start</button>
      </div>
    </div>
  `;

  const firstQuestionInput = document.getElementById('first-question');
  const startButton        = document.getElementById('start-btn');

  if (firstQuestionInput) {
    // 초기 리사이즈
    firstQuestionInput.style.overflow = 'hidden';
    autoResize(firstQuestionInput);
    // 입력될 때마다 리사이즈
    firstQuestionInput.addEventListener('input', () => autoResize(firstQuestionInput));
    // 엔터 이벤트
    firstQuestionInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        startButton.click();
      }
    });
  }

  if (startButton) {
    startButton.addEventListener('click', () => {
      const msg = firstQuestionInput.value.trim();
      if (msg) handleStartChat(msg);
    });
  }
}

renderStartView();