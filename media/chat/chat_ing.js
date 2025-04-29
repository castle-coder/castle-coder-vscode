export function renderChatView(initialMessage) {
  const chatApp = document.getElementById('chat-ing-app');
  chatApp.innerHTML = `
    <div class="chat-container">
      <h2>Castle Coder</h2>
      <div class="chatbox" id="chatbox"></div>
      <textarea class="ask" id="ask-input" placeholder="Ask more..."></textarea>
      <button id="send-btn" class="add-color-button">Send</button>
      <p class="text">Be careful with security.</p>
    </div>
  `;

  const chatbox = document.getElementById('chatbox');
  const input = document.getElementById('ask-input');
  const sendButton = document.getElementById('send-btn');

  if (initialMessage) {
    addMessage(chatbox, 'You', initialMessage);
    addMessage(chatbox, 'Bot', initialMessage);
  }

  function sendMessage() {
    const message = input.value.trim();
    if (!message) return;
    addMessage(chatbox, 'You', message);
    addMessage(chatbox, 'Bot', message);
    input.value = '';
    chatbox.scrollTop = chatbox.scrollHeight;
  }

  sendButton.addEventListener('click', sendMessage);

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); 
      sendMessage();
    }
  });
}

function addMessage(chatbox, sender, message) {
  const msgWrapper = document.createElement('div');
  msgWrapper.className = `chat-message ${sender === 'You' ? 'user' : 'bot'}`;

  const formattedMessage = message.replace(/\n/g, '<br>');

  msgWrapper.innerHTML = `
    <div class="sender">${sender}</div>
    <div class="text">${formattedMessage}</div>
  `;
  chatbox.appendChild(msgWrapper);
}
