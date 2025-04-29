export function renderChatView(initialMessage) {
  const chatApp = document.getElementById('chat-ing-app');
  chatApp.innerHTML = `
    <div class="chat-container">
      <h2>Castle Coder</h2>
      <div class="chatbox" id="chatbox"></div>
      <input type="text" class="ask" id="ask-input" placeholder="Ask more..." />
      <button id="send-btn" class="add-color-button">Send</button>
      <p class="text">Be careful with security.</p>
    </div>
  `;

  const chatbox = document.getElementById('chatbox');
  const input = document.getElementById('ask-input');
  const sendButton = document.getElementById('send-btn');

  // 초기 메시지 렌더링
  if (initialMessage) {
    addMessage(chatbox, 'You', initialMessage);
    addMessage(chatbox, 'Bot', 'This is my response to: ' + initialMessage);
  }

  // 메시지 전송 함수
  function sendMessage() {
    const message = input.value.trim();
    if (!message) return;
    addMessage(chatbox, 'You', message);
    addMessage(chatbox, 'Bot', 'This is my response to: ' + message);
    input.value = '';
    chatbox.scrollTop = chatbox.scrollHeight;
  }

  // 버튼 클릭하면 메시지 전송
  sendButton.addEventListener('click', sendMessage);

  // 엔터 키 입력으로도 메시지 전송
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  });
}

function addMessage(chatbox, sender, message) {
  const msgWrapper = document.createElement('div');
  msgWrapper.className = `chat-message ${sender === 'You' ? 'user' : 'bot'}`;

  msgWrapper.innerHTML = `
    <div class="sender">${sender}</div>
    <div class="text">${message}</div>
  `;

  chatbox.appendChild(msgWrapper);
}
