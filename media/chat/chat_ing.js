// 입력창 자동 리사이즈 함수
function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

export function renderChatView(initialMessage) {
  const chatApp = document.getElementById('chat-ing-app');
  if (!chatApp) return;

  chatApp.innerHTML = `
    <div class="chat-container">
      <h2>Castle Coder</h2>
      <div class="chatbox" id="chatbox"></div>
      <div class="chat-input-area">
        <div class="input-wrapper">
          <textarea id="ask-input" placeholder="Ask more..." rows="1"></textarea>
          <button id="send-btn" class="add-color-button">Send</button>
        </div>
      </div>
      <p class="text">Be careful with security.</p>
    </div>
  `;

  const input      = document.getElementById('ask-input');
  const sendButton = document.getElementById('send-btn');
  const chatbox    = document.getElementById('chatbox');

  // 초기 메시지
  if (initialMessage) {
    addMessage(chatbox, 'You', initialMessage);
    addMessage(chatbox, 'Bot', initialMessage);
  }

  // 자동 리사이즈 설정
  if (input) {
    input.style.overflow = 'hidden';
    autoResize(input);
    input.addEventListener('input', () => autoResize(input));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendButton.click();
      }
    });
  }

  // 전송
  sendButton.addEventListener('click', () => {
    const message = input.value.trim();
    if (!message) return;
    addMessage(chatbox, 'You', message);
    addMessage(chatbox, 'Bot', message);
    input.value = '';
    autoResize(input);
    chatbox.scrollTop = chatbox.scrollHeight;
  });
}

function addMessage(chatbox, sender, message) {
  const msgWrapper = document.createElement('div');
  msgWrapper.className = `chat-message ${sender === 'You' ? 'user' : 'bot'}`;
  const formatted = message.replace(/\n/g, '<br>');
  msgWrapper.innerHTML = `
    <div class="sender">${sender}</div>
    <div class="text">${formatted}</div>
  `;
  chatbox.appendChild(msgWrapper);
}
