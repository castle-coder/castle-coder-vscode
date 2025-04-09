import '../chat/chat_ing.css';


export function renderChatView(initialMessage) {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="chat-container">
        <h2>Castle Coder</h2>
        <div class="chatbox" id="chatbox"></div>
        <input type="text" class="ask" placeholder="Ask more..." />
        <button class="add-color-button">send</button>
        <p class="text">Be careful security</p>
      </div>
    `;
  
    const chatbox = document.getElementById('chatbox');
  
    // 초기 메시지 렌더링
    if (initialMessage) {
      addMessage(chatbox, 'You', initialMessage);
      addMessage(chatbox, 'Bot', 'This is my response to: ' + initialMessage);
    }
  
    const input = document.querySelector('.ask');
    const button = document.querySelector('.add-color-button');
  
    button.addEventListener('click', () => {
      const message = input.value.trim();
      if (!message) return;
      addMessage(chatbox, 'You', message);
      addMessage(chatbox, 'Bot', 'This is my response to: ' + message);
      input.value = '';
      chatbox.scrollTop = chatbox.scrollHeight;
    });
  }
  
//   function addMessage(chatbox, sender, message) {
//     const msgDiv = document.createElement('div');
//     msgDiv.textContent = `${sender}: ${message}`;
//     chatbox.appendChild(msgDiv);
//   }
  

  function addMessage(chatbox, sender, message) {
    const msgWrapper = document.createElement('div');
    msgWrapper.className = `chat-message ${sender === 'You' ? 'user' : 'bot'}`;
  
    msgWrapper.innerHTML = `
      <div class="sender">${sender}</div>
      <div class="text">${message}</div>
    `;
  
    chatbox.appendChild(msgWrapper);
  }
  