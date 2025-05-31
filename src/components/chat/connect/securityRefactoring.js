// securityRefactoring.js
import { handleStartChat } from '../chat_logic.js';
import { vscode } from '../../api/vscodeApi.js';

export class SecurityRefactoring {
  constructor() {
    this.llmBotBuffer = '';
    this.setupMessageListener();
  }

  setupMessageListener() {
    window.addEventListener('message', async (event) => {
      const message = event.data;
      if (message.type === 'securityPrompt') {
        // 익스텐션(백엔드)로 다시 메시지 전송
        vscode.postMessage({
          type: 'securityPrompt',
          prompt: message.prompt,
          sessionTitle: message.sessionTitle
        });
        // 기존 디버깅 및 UI 로직도 유지
        await this.handleSecurityPrompt(message.prompt);
      } else if (message.type === 'securityResponse') {
        this.handleSecurityResponse(message.data);
      } else if (message.type === 'securityError') {
        console.error('[CastleCoder] Webview: handleSecurityError', message.error);
        this.handleSecurityError(message.error);
      }
    });
  }

  async handleSecurityPrompt(prompt) {
    handleStartChat(prompt);
  }

  handleSecurityResponse(response) {
    // 기존 llm-chat-response와 동일하게 스트림 처리
    const chatbox = document.getElementById('chatbox');
    if (!chatbox) return;
    if (response.type === 'token' && response.content !== undefined) {
      this.llmBotBuffer += response.content;
      this.updateBotMessage(this.llmBotBuffer);
    }
    if (response.type === 'end') {
      this.llmBotBuffer = '';
    }
  }

  updateBotMessage(content) {
    let botMsg = document.getElementById('castle-coder-bot-msg');
    if (!botMsg) {
      botMsg = document.createElement('div');
      botMsg.id = 'castle-coder-bot-msg';
      botMsg.className = 'chat-message bot';
      botMsg.innerHTML = `
        <div class=\"sender\">Bot</div>
        <div class=\"text\"></div>
      `;
      document.getElementById('chatbox').appendChild(botMsg);
    }
    botMsg.querySelector('.text').textContent = content;
    botMsg.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  handleSecurityError(error) {
    const chatbox = document.getElementById('chatbox');
    if (chatbox) {
      const el = document.createElement('div');
      el.className = 'chat-message bot';
      el.innerHTML = `
        <div class=\"sender\">Bot</div>
        <div class=\"text\">[Error] ${error}</div>
      `;
      chatbox.appendChild(el);
      chatbox.scrollTop = chatbox.scrollHeight;
    }
  }
}

// 컴포넌트 인스턴스 생성
new SecurityRefactoring();
