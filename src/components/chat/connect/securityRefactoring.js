// securityRefactoring.js
import { handleStartChat } from '../chat_logic.js';
import { vscode } from '../../api/vscodeApi.js';
import { renderChatView } from '../chat_ing.js';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked@4.3.0/lib/marked.esm.js';

// 안전한 마크다운 파싱 (스트리밍 중 불완전한 마크다운 처리)
function safeParseMarkdown(text) {
  try {
    // 불완전한 코드 블록 처리
    let safeText = text;
    
    // 홀수 개의 ``` 가 있는 경우 (미완성 코드 블록)
    const codeBlockMatches = safeText.match(/```/g);
    if (codeBlockMatches && codeBlockMatches.length % 2 === 1) {
      // 마지막 ```부터 끝까지를 일반 텍스트로 처리
      const lastIndex = safeText.lastIndexOf('```');
      const beforeLastBlock = safeText.substring(0, lastIndex);
      const afterLastBlock = safeText.substring(lastIndex + 3);
      safeText = beforeLastBlock + '\n```\n' + afterLastBlock + '\n```';
    }
    
    // 불완전한 인라인 코드 처리
    const inlineCodeMatches = safeText.match(/`/g);
    if (inlineCodeMatches && inlineCodeMatches.length % 2 === 1) {
      safeText += '`';
    }
    
    return marked.parse(safeText);
  } catch (error) {
    console.warn('Markdown parsing error:', error);
    // 파싱 실패 시 안전한 HTML 변환
    return text.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/\n/g, '<br>')
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .replace(/`([^`\n]+)`/g, '<code>$1</code>');
  }
}

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
      } else if (message.type === 'scrollToBottom') {
        // 스크롤을 맨 밑으로 내리기
        this.scrollToBottom();
      }
    });
  }

  scrollToBottom() {
    const chatbox = document.getElementById('chatbox');
    if (chatbox) {
      setTimeout(() => {
        chatbox.scrollTop = chatbox.scrollHeight;
      }, 100); // 약간의 딜레이를 주어 DOM 업데이트 후 스크롤
    }
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
    botMsg.querySelector('.text').innerHTML = safeParseMarkdown(content);
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
