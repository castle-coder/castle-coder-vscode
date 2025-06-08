// securityRefactoring.js
import { handleStartChat } from '../chat_logic.js';
import { vscode } from '../../api/vscodeApi.js';
import { renderChatView } from '../chat_ing.js';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked@4.3.0/lib/marked.esm.js';

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
        
        // 채팅과 동일한 방식으로 처리
        await handleStartChat(message.prompt);
      } else if (message.type === 'securityResponse') {
        this.handleSecurityResponse(message.data);
      } else if (message.type === 'securityError') {
        console.error('[CastleCoder] Webview: handleSecurityError', message.error);
        this.handleSecurityError(message.error);
      } else if (message.type === 'showChatView') {
        // 채팅 뷰 표시
        renderChatView({
          chatSessionId: message.chatSessionId,
          sessionTitle: message.sessionTitle,
          messages: []
        });
      }
    });
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
        <div class="sender">Castle Coder</div>
        <div class="text markdown-body"></div>
      `;
      document.getElementById('chatbox').appendChild(botMsg);
    }
    // 스트리밍 중에도 마크다운 파싱 적용
    botMsg.querySelector('.text').innerHTML = marked.parse(content);
    chatbox.scrollTop = chatbox.scrollHeight;
  }

  handleSecurityError(error) {
    const chatbox = document.getElementById('chatbox');
    if (chatbox) {
      const el = document.createElement('div');
      el.className = 'chat-message bot';
      el.innerHTML = `
        <div class="sender">Bot</div>
        <div class="text">[Error] ${error}</div>
      `;
      chatbox.appendChild(el);
      chatbox.scrollTop = chatbox.scrollHeight;
    }
  }
}

// 컴포넌트 인스턴스 생성
new SecurityRefactoring();
