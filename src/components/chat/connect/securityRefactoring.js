// securityRefactoring.js
import { vscode } from '../../api/vscodeApi.js';
import { renderChatView } from '../chat_ing.js';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked@4.3.0/lib/marked.esm.js';

// 안전한 마크다운 파싱 (스트리밍 중 불완전한 마크다운 처리)
function safeParseMarkdown(text) {
  try {
    let safeText = text;
    
    // 1. 불완전한 코드 블록 처리 (더 강력한 방식)
    const codeBlockMatches = safeText.match(/```/g);
    if (codeBlockMatches && codeBlockMatches.length % 2 === 1) {
      // 홀수 개의 ```가 있으면 마지막 코드 블록이 미완성
      const lastCodeBlockIndex = safeText.lastIndexOf('```');
      const beforeLastBlock = safeText.substring(0, lastCodeBlockIndex);
      const afterLastBlock = safeText.substring(lastCodeBlockIndex + 3);
      
      // 미완성 코드 블록을 일반 텍스트로 처리
      safeText = beforeLastBlock + '\n\n**[코드 작성 중...]**\n\n```text\n' + afterLastBlock + '\n```';
    }
    
    // 2. 불완전한 인라인 코드 처리
    const inlineCodeMatches = safeText.match(/(?<!\\)`/g); // 이스케이프되지 않은 백틱만 카운트
    if (inlineCodeMatches && inlineCodeMatches.length % 2 === 1) {
      // 마지막 백틱 이후에 너무 긴 텍스트가 있으면 백틱을 닫기
      const lastBacktickIndex = safeText.lastIndexOf('`');
      const afterLastBacktick = safeText.substring(lastBacktickIndex + 1);
      
      if (afterLastBacktick.length > 50 || afterLastBacktick.includes('\n')) {
        // 너무 길거나 줄바꿈이 있으면 일반 텍스트로 처리
        safeText = safeText.substring(0, lastBacktickIndex) + ' [코드 작성 중...] ' + afterLastBacktick;
      } else {
        safeText += '`';
      }
    }
    
    // 3. 불완전한 볼드/이탤릭 처리
    const boldMatches = safeText.match(/(?<!\\)\*\*/g);
    if (boldMatches && boldMatches.length % 2 === 1) {
      safeText += '**';
    }
    
    const italicMatches = safeText.match(/(?<!\\)\*(?!\*)/g);
    if (italicMatches && italicMatches.length % 2 === 1) {
      safeText += '*';
    }
    
    // 4. 불완전한 링크 처리
    if (safeText.includes('[') && !safeText.includes('](')) {
      const lastBracketIndex = safeText.lastIndexOf('[');
      const afterBracket = safeText.substring(lastBracketIndex);
      if (!afterBracket.includes(']') && afterBracket.length > 50) {
        safeText = safeText.substring(0, lastBracketIndex) + afterBracket.substring(1);
      }
    }
    
    return marked.parse(safeText);
  } catch (error) {
    console.warn('Markdown parsing error:', error);
    // 파싱 완전 실패 시 안전한 HTML 변환
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`\n]+)`/g, '<code>$1</code>')
      .replace(/```[\s\S]*?```/g, (match) => {
        const code = match.replace(/```\w*\n?/, '').replace(/```$/, '');
        return `<pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
      });
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
        // 익스텐션(백엔드)로 다시 메시지 전송 (새로운 세션에서만 처리)
        vscode.postMessage({
          type: 'securityPrompt',
          prompt: message.prompt,
          sessionTitle: message.sessionTitle
        });
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
