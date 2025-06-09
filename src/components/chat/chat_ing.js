import { renderStartView } from './chat_start.js';
import { logout } from '../member/auth.js';
import { renderSessionList, renderSessionListOverlay } from '../chat/session/chat_session.js';
import { getSession, setSession } from './session/sessionState.js';
import { uploadImage, deleteImage } from './connect/imageUpload.js';
import { getChatSessionId, handleSendMessage, setChatSessionId } from './chat_logic.js';
import { loadChatSession } from './session/sessionLoad.js';
import { cancelResponse as cancelLLMResponse } from './connect/codeGenerate.js';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked@4.3.0/lib/marked.esm.js';
import { requestUpdateSessionTitle } from './session/sessionApi.js';

// 간단한 syntax highlighting 함수
function highlightCode(code, language) {
  if (!language) language = 'javascript';
  
  // HTML 특수문자 이스케이프
  let highlightedCode = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  // 언어별 패턴 정의
  const patterns = {
    javascript: {
      keywords: ['function', 'const', 'let', 'var', 'if', 'else', 'for', 'while', 'return', 'class', 'extends', 'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'finally', 'throw', 'new', 'this', 'super', 'static', 'public', 'private', 'protected'],
      comments: [/\/\*[\s\S]*?\*\//g, /\/\/.*$/gm],
      strings: [/&quot;[^&]*?&quot;/g, /&#x27;[^&]*?&#x27;/g, /`[^`]*?`/g]
    },
    python: {
      keywords: ['def', 'class', 'if', 'elif', 'else', 'for', 'while', 'return', 'import', 'from', 'as', 'try', 'except', 'finally', 'raise', 'with', 'async', 'await', 'lambda', 'and', 'or', 'not', 'in', 'is', 'True', 'False', 'None'],
      comments: [/#.*$/gm],
      strings: [/&quot;[^&]*?&quot;/g, /&#x27;[^&]*?&#x27;/g, /&quot;&quot;&quot;[\s\S]*?&quot;&quot;&quot;/g, /&#x27;&#x27;&#x27;[\s\S]*?&#x27;&#x27;&#x27;/g]
    },
    html: {
      keywords: ['html', 'head', 'body', 'div', 'span', 'p', 'a', 'img', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'meta', 'link', 'script', 'style'],
      comments: [/&lt;!--[\s\S]*?--&gt;/g],
      strings: [/&quot;[^&]*?&quot;/g, /&#x27;[^&]*?&#x27;/g]
    },
    css: {
      keywords: ['color', 'background', 'margin', 'padding', 'border', 'width', 'height', 'display', 'position', 'top', 'left', 'right', 'bottom', 'font', 'text', 'line-height', 'z-index', 'opacity', 'transform', 'transition'],
      comments: [/\/\*[\s\S]*?\*\//g],
      strings: [/&quot;[^&]*?&quot;/g, /&#x27;[^&]*?&#x27;/g]
    }
  };

  const langPatterns = patterns[language] || patterns.javascript;
  
  // 임시 플래그를 사용하여 하이라이팅된 부분 표시
  const FLAG_START = '___HIGHLIGHT_START___';
  const FLAG_END = '___HIGHLIGHT_END___';
  
  // 1. 주석 하이라이팅
  if (langPatterns.comments) {
    langPatterns.comments.forEach(commentPattern => {
      highlightedCode = highlightedCode.replace(commentPattern, `${FLAG_START}comment${FLAG_END}$&${FLAG_START}/comment${FLAG_END}`);
    });
  }

  // 2. 문자열 하이라이팅
  if (langPatterns.strings) {
    langPatterns.strings.forEach(stringPattern => {
      highlightedCode = highlightedCode.replace(stringPattern, `${FLAG_START}string${FLAG_END}$&${FLAG_START}/string${FLAG_END}`);
    });
  }

  // 3. 숫자 하이라이팅 (플래그로 보호된 영역 제외)
  const numberRegex = /\b\d+(?:\.\d+)?\b/g;
  let match;
  let parts = [];
  let lastIndex = 0;
  
  while ((match = numberRegex.exec(highlightedCode)) !== null) {
    const beforeMatch = highlightedCode.substring(lastIndex, match.index);
    if (!beforeMatch.includes(FLAG_START) || beforeMatch.lastIndexOf(FLAG_END) > beforeMatch.lastIndexOf(FLAG_START)) {
      parts.push(beforeMatch);
      parts.push(`${FLAG_START}number${FLAG_END}${match[0]}${FLAG_START}/number${FLAG_END}`);
    } else {
      parts.push(beforeMatch + match[0]);
    }
    lastIndex = numberRegex.lastIndex;
  }
  parts.push(highlightedCode.substring(lastIndex));
  highlightedCode = parts.join('');

  // 4. 키워드 하이라이팅
  langPatterns.keywords.forEach(keyword => {
    const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'g');
    let match;
    let parts = [];
    let lastIndex = 0;
    
    while ((match = keywordRegex.exec(highlightedCode)) !== null) {
      const beforeMatch = highlightedCode.substring(lastIndex, match.index);
      if (!beforeMatch.includes(FLAG_START) || beforeMatch.lastIndexOf(FLAG_END) > beforeMatch.lastIndexOf(FLAG_START)) {
        parts.push(beforeMatch);
        parts.push(`${FLAG_START}keyword${FLAG_END}${match[0]}${FLAG_START}/keyword${FLAG_END}`);
      } else {
        parts.push(beforeMatch + match[0]);
      }
      lastIndex = keywordRegex.lastIndex;
    }
    parts.push(highlightedCode.substring(lastIndex));
    highlightedCode = parts.join('');
  });

  // 5. 함수 호출 하이라이팅
  const functionRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
  let fMatch;
  let fParts = [];
  let fLastIndex = 0;
  
  while ((fMatch = functionRegex.exec(highlightedCode)) !== null) {
    const beforeMatch = highlightedCode.substring(fLastIndex, fMatch.index);
    if (!beforeMatch.includes(FLAG_START) || beforeMatch.lastIndexOf(FLAG_END) > beforeMatch.lastIndexOf(FLAG_START)) {
      fParts.push(beforeMatch);
      fParts.push(`${FLAG_START}function${FLAG_END}${fMatch[1]}${FLAG_START}/function${FLAG_END}(`);
    } else {
      fParts.push(beforeMatch + fMatch[0]);
    }
    fLastIndex = functionRegex.lastIndex - 1; // '(' 제외
  }
  fParts.push(highlightedCode.substring(fLastIndex));
  highlightedCode = fParts.join('');

  // 플래그를 실제 HTML 태그로 변환
  highlightedCode = highlightedCode
    .replace(new RegExp(`${FLAG_START}comment${FLAG_END}`, 'g'), '<span class="code-comment">')
    .replace(new RegExp(`${FLAG_START}/comment${FLAG_END}`, 'g'), '</span>')
    .replace(new RegExp(`${FLAG_START}string${FLAG_END}`, 'g'), '<span class="code-string">')
    .replace(new RegExp(`${FLAG_START}/string${FLAG_END}`, 'g'), '</span>')
    .replace(new RegExp(`${FLAG_START}number${FLAG_END}`, 'g'), '<span class="code-number">')
    .replace(new RegExp(`${FLAG_START}/number${FLAG_END}`, 'g'), '</span>')
    .replace(new RegExp(`${FLAG_START}keyword${FLAG_END}`, 'g'), '<span class="code-keyword">')
    .replace(new RegExp(`${FLAG_START}/keyword${FLAG_END}`, 'g'), '</span>')
    .replace(new RegExp(`${FLAG_START}function${FLAG_END}`, 'g'), '<span class="code-function">')
    .replace(new RegExp(`${FLAG_START}/function${FLAG_END}`, 'g'), '</span>');

  return highlightedCode;
}

// marked 설정
marked.setOptions({
  highlight: function(code, lang) {
    return highlightCode(code, lang);
  },
  langPrefix: 'language-'
});

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

// 코드 블록에 복사 버튼 추가 함수
function addCopyButtonsToCodeBlocks(element) {
  const codeBlocks = element.querySelectorAll('pre code');
  
  codeBlocks.forEach((codeBlock, index) => {
    const pre = codeBlock.parentElement;
    
    // 이미 복사 버튼이 있는지 확인
    if (pre.querySelector('.copy-btn')) return;
    
    // 복사 버튼 생성
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" stroke-width="2" fill="none"/>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2" fill="none"/>
      </svg>
    `;
    copyBtn.title = '코드 복사';
    
    // 복사 기능
    copyBtn.addEventListener('click', async () => {
      // HTML 태그 제거하고 원본 텍스트만 추출
      let textToCopy = codeBlock.textContent || codeBlock.innerText;
      
      try {
        await navigator.clipboard.writeText(textToCopy);
        
        // 성공 피드백
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polyline points="20,6 9,17 4,12" stroke="currentColor" stroke-width="2" fill="none"/>
          </svg>
        `;
        copyBtn.style.color = '#22c55e';
        
        setTimeout(() => {
          copyBtn.innerHTML = originalHTML;
          copyBtn.style.color = '';
        }, 2000);
        
      } catch (err) {
        console.error('복사 실패:', err);
        
        // 폴백 방법 (구형 브라우저용)
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          
          // 성공 피드백
          const originalHTML = copyBtn.innerHTML;
          copyBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polyline points="20,6 9,17 4,12" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
          `;
          copyBtn.style.color = '#22c55e';
          
          setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
            copyBtn.style.color = '';
          }, 2000);
          
        } catch (fallbackErr) {
          console.error('폴백 복사도 실패:', fallbackErr);
        } finally {
          document.body.removeChild(textArea);
        }
      }
    });
    
    // pre 태그에 상대 위치 설정 및 버튼 추가
    pre.style.position = 'relative';
    pre.appendChild(copyBtn);
  });
}

// textarea 자동 높이 조절
function autoResize(textarea) {
  textarea.style.height = 'auto';
  const scrollHeight = textarea.scrollHeight;
  const maxHeight = 120; // max-height와 동일하게 설정
  
  if (scrollHeight <= maxHeight) {
    textarea.style.height = scrollHeight + 'px';
  } else {
    textarea.style.height = maxHeight + 'px';
  }
}

// 전역 addMessage 함수
function addMessage(sender, text, imageUrls = []) {
  const chatbox = document.getElementById('chatbox');
  console.log('[Debug] addMessage called. chatbox:', chatbox, 'sender:', sender, 'text:', text, 'imageUrls:', imageUrls);
  if (!chatbox) return;
  const safeText = typeof text === 'string' ? text : '';
  const el = document.createElement('div');
  el.className = `chat-message ${sender==='You'?'user':'bot'}`;
  
  // 사용자 메시지와 봇 메시지 처리 분리
  if (sender === 'You') {
    // 사용자 메시지는 텍스트로만 처리
    const senderDiv = document.createElement('div');
    senderDiv.className = 'sender';
    senderDiv.textContent = sender;
    
    const textDiv = document.createElement('div');
    textDiv.className = 'text';
    textDiv.textContent = safeText; // HTML 이스케이프됨
    
    el.appendChild(senderDiv);
    el.appendChild(textDiv);
    
    // 이미지가 있는 경우 추가
    if (imageUrls && imageUrls.length > 0) {
      const imageContainer = document.createElement('div');
      imageContainer.className = 'message-images';
      imageContainer.style.cssText = 'margin-top: 8px; display: flex; flex-wrap: wrap; gap: 8px;';
      
      imageUrls.forEach(imageUrl => {
        const imageDiv = document.createElement('div');
        imageDiv.className = 'message-image-container';
        imageDiv.style.cssText = 'border: 1px solid #444; border-radius: 4px; overflow: hidden; max-width: 60px;';
        
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = '첨부 이미지';
        img.style.cssText = 'width: 100%; height: auto; display: block; cursor: pointer;';
        img.onclick = () => window.open(imageUrl, '_blank');
        
        imageDiv.appendChild(img);
        imageContainer.appendChild(imageDiv);
      });
      
      el.appendChild(imageContainer);
    }
  } else {
    // 봇 메시지는 마크다운 파싱
    const formattedText = marked.parse(safeText);
    
    // 이미지 HTML 생성
    let imageHTML = '';
    if (imageUrls && imageUrls.length > 0) {
      imageHTML = '<div class="message-images" style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 8px;">';
      imageUrls.forEach(imageUrl => {
        imageHTML += `
          <div class="message-image-container" style="border: 1px solid #444; border-radius: 4px; overflow: hidden; max-width: 60px;">
            <img src="${imageUrl}" alt="첨부 이미지" style="width: 100%; height: auto; display: block; cursor: pointer;" onclick="window.open('${imageUrl}', '_blank')" />
          </div>
        `;
      });
      imageHTML += '</div>';
    }
    
    el.innerHTML = `
      <div class="sender">Castle Coder</div>
      <div class="text markdown-body">${formattedText}</div>
      ${imageHTML}
    `;
  }
  
  chatbox.appendChild(el);
  chatbox.scrollTop = chatbox.scrollHeight;
  
  // 봇 메시지인 경우 복사 버튼 추가
  if (sender === 'Bot') {
    addCopyButtonsToCodeBlocks(el);
  }
  
  // 봇의 로딩 메시지인 경우 애니메이션 시작
  if (sender === 'Bot' && text === 'Generate...') {
    startLoadingAnimation();
  }
}

// 마크다운 파싱 성능 최적화를 위한 변수들
let lastUpdateTime = 0;
let pendingUpdate = null;

// 실시간으로 봇 메시지를 업데이트(마지막 메시지 덮어쓰기)
function updateBotMessage(text) {
  const chatbox = document.getElementById('chatbox');
  if (!chatbox) return;
  
  const now = Date.now();
  const textLength = text.length;
  
  // 성능 최적화: 짧은 간격으로 너무 많은 업데이트 방지
  const updateInterval = textLength > 1000 ? 200 : 100;
  
  // 이전 업데이트에서 너무 적은 시간이 지났으면 throttle
  if (now - lastUpdateTime < updateInterval) {
    if (pendingUpdate) {
      clearTimeout(pendingUpdate);
    }
    pendingUpdate = setTimeout(() => {
      updateBotMessage(text);
      pendingUpdate = null;
    }, updateInterval);
    return;
  }
  
  lastUpdateTime = now;
  
  let lastBotMsg = chatbox.querySelector('.chat-message.bot:last-child');
  if (!lastBotMsg) {
    // 없으면 새로 추가
    lastBotMsg = document.createElement('div');
    lastBotMsg.className = 'chat-message bot';
    chatbox.appendChild(lastBotMsg);
  }
  
  // 안전한 마크다운 파싱
  let parsedContent;
  try {
    parsedContent = safeParseMarkdown(text);
  } catch (error) {
    console.error('Markdown parsing failed:', error);
    // 완전 실패 시 일반 텍스트로 표시
    parsedContent = text.replace(/\n/g, '<br>');
  }
  
  lastBotMsg.innerHTML = `
    <div class="sender">Castle Coder</div>
    <div class="text markdown-body">${parsedContent}</div>
  `;
  
  // 복사 버튼 추가 (throttling 적용)
  if (!lastBotMsg._copyButtonTimeout) {
    lastBotMsg._copyButtonTimeout = setTimeout(() => {
      addCopyButtonsToCodeBlocks(lastBotMsg);
      lastBotMsg._copyButtonTimeout = null;
    }, 300);
  }
  
  chatbox.scrollTop = chatbox.scrollHeight;
}

// Send 버튼 활성/비활성 함수 수정
function setSendButtonEnabled(enabled, isEndButton = false) {
  const btn = document.getElementById('send-btn');
  if (!btn) return;
  
  btn.disabled = !enabled;
  if (enabled) {
    if (isEndButton) {
      // Cancel 버튼 (네모 아이콘)
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="16" height="16" fill="white"/>
        </svg>
      `;
      btn.style.cssText = `
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 28px !important;
        height: 28px !important;
        background: #ef4444 !important;
        border: none !important;
        border-radius: 6px !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        flex-shrink: 0 !important;
        opacity: 1 !important;
      `;
    } else {
      // Send 버튼 (화살표 아이콘)
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="white"/>
        </svg>
      `;
      btn.style.cssText = `
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 28px !important;
        height: 28px !important;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        border: none !important;
        border-radius: 6px !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        flex-shrink: 0 !important;
        opacity: 1 !important;
      `;
    }
  } else {
    // Disabled 버튼
    btn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="white"/>
      </svg>
    `;
    btn.style.cssText = `
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 28px !important;
      height: 28px !important;
      background: #888 !important;
      border: none !important;
      border-radius: 6px !important;
      cursor: not-allowed !important;
      transition: all 0.2s ease !important;
      flex-shrink: 0 !important;
      opacity: 0.7 !important;
    `;
  }
}

// 로딩 애니메이션을 위한 전역 변수
let loadingAnimationInterval = null;

// 로딩 애니메이션 함수
function startLoadingAnimation() {
  let dots = 0;
  const maxDots = 3;
  
  // 기존 인터벌이 있다면 제거
  if (loadingAnimationInterval) {
    clearInterval(loadingAnimationInterval);
  }
  
  loadingAnimationInterval = setInterval(() => {
    dots = (dots + 1) % (maxDots + 1);
    const loadingText = 'Generate' + '.'.repeat(dots);
    const loadingMessage = document.querySelector('.chat-message.bot:last-child .text');
    if (loadingMessage && loadingMessage.textContent.startsWith('Generate')) {
      loadingMessage.textContent = loadingText;
    }
  }, 500);
}

// 로딩 애니메이션 정지 함수 추가
function stopLoadingAnimation() {
  if (loadingAnimationInterval) {
    clearInterval(loadingAnimationInterval);
    loadingAnimationInterval = null;
  }
}

export function renderChatView(chatDataOrMessage) {
  console.log('[Debug] renderChatView called', chatDataOrMessage);
  const startApp  = document.getElementById('chat-start-app');
  const memberApp = document.getElementById('member-app');
  const chatApp   = document.getElementById('chat-ing-app');
  if (!chatApp) return;

  // 시작/로그인 영역 숨기고, 채팅 화면만 보이기
  memberApp.style.display = 'none';
  startApp.style.display  = 'none';
  chatApp.style.display   = 'flex';

  // 항상 채팅 화면을 새로 그리기 위해 초기화
  chatApp.innerHTML = '';

  // 채팅 컨테이너 생성
  const sessionTitle = getSession().title || 'Castle Coder';
  chatApp.innerHTML = `
    <div class="chat-container">
      <div class="chat-header">
        <h2 class="session-title-header" title="클릭하여 제목 편집">${sessionTitle}</h2>
        <a href="#" id="chat-ing-logout" class="text-link">Logout</a>
      </div>
      <div class="chatbox" id="chatbox"></div>
      <div class="chat-input-area">
        <div class="input-container" style="margin-bottom: 2px;">
          <input type="file" id="image-upload-ing" accept="image/*" style="display:none" multiple />
          <textarea 
            id="ask-input" 
            rows="1" 
            placeholder="How can I help you?" 
            style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; padding: 8px; outline: none; color: #fff; font-size: 13px; line-height: 1.3; resize: none; min-height: 18px; max-height: 120px; overflow-y: auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; transition: all 0.2s ease; box-sizing: border-box;"
          ></textarea>
        </div>
        <div class="button-row" style="display: flex; align-items: center; gap: 2px;">
          <button id="image-upload-btn-ing" title="이미지 첨부" type="button" style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: rgba(255,255,255,0.1); border: none; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; flex-shrink: 0;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="24" height="24" fill="none"/>
              <path d="M4 5C4 4.44772 4.44772 4 5 4H19C19.5523 4 20 4.44772 20 5V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V5Z" stroke="#bbb" stroke-width="1.5"/>
              <path d="M8 13L11 16L16 11" stroke="#bbb" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="8.5" cy="8.5" r="1.5" fill="#bbb"/>
            </svg>
          </button>
          <div id="image-file-list-ing" class="image-file-list" style="display:flex;gap:8px;flex-wrap:wrap;flex:1;"></div>
          <button id="send-btn" style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; flex-shrink: 0;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="white"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
    <style>
      .chat-container {
        display: flex;
        flex-direction: column;
        height: 100vh;
      }
      .chat-header {
        flex-shrink: 0;
        padding: 0.5rem 0.75rem;
        border-bottom: 1px solid #3f3f46;
        background-color: #18181b;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .chat-header h2 {
        margin: 0;
        font-size: 1.1rem;
        font-weight: 600;
        color: #f4f4f5;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: background-color 0.2s;
      }
      .chat-header h2:hover {
        background-color: rgba(255,255,255,0.1);
      }
      .session-title-edit-header {
        background: #333 !important;
        border: 1px solid #4CAF50;
        outline: none;
        padding: 4px 8px;
        border-radius: 4px;
        color: #fff;
        font-size: 1.1rem;
        font-weight: 600;
        width: 200px;
      }
      .chatbox {
        flex: 1;
        overflow-y: auto;
        padding: 0.75rem;
      }
      .chat-input-area {
        flex-shrink: 0;
        padding: 0.25rem 0.75rem;
        border-top: 1px solid #3f3f46;
      }
      .sharp-btn {
        padding: 8px 16px;
        border-radius: 4px;
        border: 1px solid;
        font-weight: 500;
        transition: all 0.2s;
        color: white;
      }
      .sharp-btn:not(.disabled-btn) {
        background-color: #22c55e;
        border-color: #22c55e;
      }
      .sharp-btn.cancel-btn {
        background-color: #ef4444 !important;
        border-color: #ef4444 !important;
      }
      .sharp-btn.disabled-btn {
        background-color: #888;
        border-color: #888;
      }
      .markdown-body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        font-size: 15px;
        line-height: 1.6;
        word-wrap: break-word;
        color: #e4e4e7;
      }
      .markdown-body h1,
      .markdown-body h2,
      .markdown-body h3,
      .markdown-body h4,
      .markdown-body h5,
      .markdown-body h6 {
        margin-top: 24px;
        margin-bottom: 16px;
        font-weight: 600;
        line-height: 1.25;
        color: #f4f4f5;
      }
      .markdown-body h1 { font-size: 2em; border-bottom: 1px solid #3f3f46; padding-bottom: 0.3em; }
      .markdown-body h2 { font-size: 1.5em; border-bottom: 1px solid #3f3f46; padding-bottom: 0.3em; }
      .markdown-body h3 { font-size: 1.25em; }
      .markdown-body h4 { font-size: 1em; }
      .markdown-body h5 { font-size: 0.875em; }
      .markdown-body h6 { font-size: 0.85em; color: #a1a1aa; }
      
      .markdown-body code {
        background-color: rgba(63, 63, 70, 0.4);
        border-radius: 4px;
        font-size: 85%;
        margin: 0;
        padding: 0.2em 0.4em;
        font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
      }
      
      .markdown-body pre {
        background-color: #0d1117;
        border-radius: 8px;
        font-size: 12px;
        line-height: 1.45;
        overflow: auto;
        padding: 16px;
        margin: 16px 0;
        border: 1px solid #30363d;
        position: relative;
      }
      
      .markdown-body pre code {
        background-color: transparent;
        border: 0;
        display: block;
        line-height: inherit;
        margin: 0;
        overflow: visible;
        padding: 0;
        word-wrap: normal;
        color: #e6edf3;
        font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
        font-size: 12px;
      }
      
      /* highlight.js 테마 오버라이드 */
      .markdown-body .hljs {
        background: transparent !important;
        color: #e6edf3 !important;
      }
      
      /* 인라인 코드 스타일 개선 */
      .markdown-body :not(pre) > code {
        background-color: rgba(110, 118, 129, 0.2);
        color: #f85149;
        padding: 0.2em 0.4em;
        border-radius: 3px;
        font-size: 85%;
      }
      
      /* 커스텀 syntax highlighting 색상 */
      .markdown-body .code-keyword {
        color: #ff7b72;
        font-weight: 600;
      }
      
      .markdown-body .code-string {
        color: #a5d6ff;
      }
      
      .markdown-body .code-comment {
        color: #8b949e;
        font-style: italic;
      }
      
      .markdown-body .code-number {
        color: #79c0ff;
      }
      
      .markdown-body .code-function {
        color: #d2a8ff;
        font-weight: 500;
      }
      
      .markdown-body .code-operator {
        color: #ffa657;
      }
      
      .markdown-body .code-type {
        color: #7ee787;
      }
      
      .markdown-body blockquote {
        margin: 0 0 16px;
        padding: 0 1em;
        color: #a1a1aa;
        border-left: 0.25em solid #3f3f46;
      }
      
      .markdown-body ul,
      .markdown-body ol {
        padding-left: 2em;
        margin-top: 0;
        margin-bottom: 16px;
      }
      
      .markdown-body li {
        margin: 0.25em 0;
      }
      
      .markdown-body table {
        border-collapse: collapse;
        border-spacing: 0;
        margin: 16px 0;
        width: 100%;
        overflow: auto;
      }
      
      .markdown-body table th {
        font-weight: 600;
        background-color: #27272a;
      }
      
      .markdown-body table th,
      .markdown-body table td {
        border: 1px solid #3f3f46;
        padding: 8px 12px;
      }
      
      .markdown-body table tr {
        background-color: #18181b;
        border-top: 1px solid #3f3f46;
      }
      
      .markdown-body table tr:nth-child(2n) {
        background-color: #27272a;
      }
      
      .markdown-body hr {
        height: 0.25em;
        padding: 0;
        margin: 24px 0;
        background-color: #3f3f46;
        border: 0;
      }
      
      .markdown-body a {
        color: #60a5fa;
        text-decoration: none;
      }
      
      .markdown-body a:hover {
        text-decoration: underline;
      }
      
      .markdown-body img {
        max-width: 100%;
        box-sizing: border-box;
        border-radius: 4px;
      }
      
      .markdown-body p {
        margin-top: 0;
        margin-bottom: 16px;
      }
      
      .markdown-body strong {
        font-weight: 600;
        color: #f4f4f5;
      }
      
      .markdown-body em {
        font-style: italic;
        color: #d4d4d8;
      }
      
      /* 복사 버튼 스타일 */
      .copy-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        color: #8b949e;
        cursor: pointer;
        padding: 6px;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        opacity: 0;
        visibility: hidden;
        z-index: 10;
      }
      
      .markdown-body pre:hover .copy-btn {
        opacity: 1;
        visibility: visible;
      }
      
      .copy-btn:hover {
        background: rgba(255, 255, 255, 0.2);
        color: #f0f6fc;
        border-color: rgba(255, 255, 255, 0.3);
      }
      
      .copy-btn:active {
        transform: scale(0.95);
      }
    </style>
  `;

  // 로그아웃 링크 이벤트 리스너 추가
  document.getElementById('chat-ing-logout').addEventListener('click', (e) => {
    e.preventDefault();
    logout();
    chatApp.style.display = 'none';
    startApp.style.display = 'none';
    memberApp.style.display = 'block';
  });

  const chatbox = document.getElementById('chatbox');
  const ta      = document.getElementById('ask-input');
  const btn     = document.getElementById('send-btn');

  // 세션 로드 시 messages 배열 처리
  if (chatDataOrMessage && Array.isArray(chatDataOrMessage.messages)) {
    if (chatDataOrMessage.messages.length === 0) {
      addMessage('Bot', 'No messages yet. Start a new conversation!');
      setSendButtonEnabled(true, false);
    } else {
      // 메시지를 원래 순서대로 출력
      chatDataOrMessage.messages.forEach(msg => {
        console.log('[ChatLog]', msg.createdAt, msg);
        addMessage(msg.sender || 'Bot', msg.text, msg.imageUrls || []);
      });
      // 메시지 로드 후 DOM 렌더링이 완료된 후 스크롤을 맨 아래로 이동
      requestAnimationFrame(() => {
        if (chatbox) {
          console.log('[ChatLog] scrollToBottom');
          console.log('[ChatLog] chatbox:', chatbox);
          console.log('[ChatLog] chatbox.scrollHeight:', chatbox.scrollHeight);
          console.log('[ChatLog] chatbox.clientHeight:', chatbox.clientHeight);
          console.log('[ChatLog] chatbox.offsetHeight:', chatbox.offsetHeight);
          console.log('[ChatLog] chatbox.scrollTop (before):', chatbox.scrollTop);
          console.log('[ChatLog] chatbox.style.overflow:', getComputedStyle(chatbox).overflow);
          console.log('[ChatLog] chatbox.style.overflowY:', getComputedStyle(chatbox).overflowY);
          console.log('[ChatLog] chatbox.style.height:', getComputedStyle(chatbox).height);
          chatbox.scrollTop = chatbox.scrollHeight;
          console.log('[ChatLog] chatbox.scrollTop (after):', chatbox.scrollTop);
          
          // 모든 코드 블록에 복사 버튼 추가
          addCopyButtonsToCodeBlocks(chatbox);
        }
      });
    }
  } else if (typeof chatDataOrMessage === 'string' && chatDataOrMessage.trim() !== '') {
    addMessage('You', chatDataOrMessage);
    addMessage('Bot', 'Generate...');
    startLoadingAnimation();
    setSendButtonEnabled(true, true);
  }

  // chatSessionId 설정
  if (chatDataOrMessage && chatDataOrMessage.chatSessionId) {
    setChatSessionId(chatDataOrMessage.chatSessionId);
  }

  // 입력창 세팅
  if (ta) {
    autoResize(ta);
    ta.addEventListener('input', () => autoResize(ta));
    ta.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        btn.click();
      }
    });
  }

  // 첨부 이미지 리스트 (imageUrl, fileName)
  let attachedImages = [];

  // 이미지 업로드 버튼 이벤트
  document.getElementById('image-upload-btn-ing').onclick = function() {
    document.getElementById('image-upload-ing').click();
  };
  // 파일 선택 시 서버 업로드
  document.getElementById('image-upload-ing').onchange = async function(e) {
    const files = Array.from(e.target.files);
    for (const file of files) {
      try {
        const result = await uploadImage(file);
        console.log('[첨부 성공]', result);
        attachedImages.push(result);
        renderFileList(attachedImages);
      } catch (err) {
        console.error('[첨부 실패]', err);
      }
    }
    e.target.value = '';
  };
  // 첨부 리스트 렌더링 함수 (imageUrl, fileName 기반)
  function renderFileList(list) {
    const listDiv = document.getElementById('image-file-list-ing');
    listDiv.innerHTML = '';
    list.forEach((item, idx) => {
      const fileSpan = document.createElement('span');
      fileSpan.textContent = item.fileName;
      fileSpan.style.cssText = 'color:#eee;font-size:0.95em; background:#222; border-radius:4px; padding:2px 6px; margin-right:2px; display:inline-flex; align-items:center;';
      const delBtn = document.createElement('button');
      delBtn.textContent = '✕';
      delBtn.style.cssText = 'margin-left:4px; background:none; border:none; color:#bbb; font-size:1em; cursor:pointer;';
      delBtn.onclick = async function() {
        try {
          await deleteImage(item.imageUrl);
          attachedImages.splice(idx, 1);
          renderFileList(attachedImages);
        } catch (err) {
          console.error('[삭제 실패]', err);
        }
      };
      fileSpan.appendChild(delBtn);
      listDiv.appendChild(fileSpan);
    });
  }

  // 전송 버튼
  if (btn && ta) {
    console.log('[Debug] Registering send button event listener');
    btn.addEventListener('click', async () => {
      const msg = ta.value.trim();
      console.log('[Debug] Send button clicked:', msg);
      
      // Cancel 버튼인 경우 취소 처리 (배경색으로 판단)
      if (btn.style.background.includes('#ef4444') || btn.style.backgroundColor.includes('rgb(239, 68, 68)')) {
        console.log('[Debug] Cancel button clicked');
        cancelResponse();
        return;
      }
      
      if (!msg) return;
      const imageUrls = attachedImages.map(img => img.imageUrl);
      // 질문을 보낼 때 바로 내 메시지를 추가
      addMessage('You', msg, imageUrls);
      addMessage('Bot', 'Generate...');

      setSendButtonEnabled(true, true); // Cancel 버튼으로 변경
      handleSendMessage(msg, imageUrls);
      ta.value = '';
      autoResize(ta);
      attachedImages = [];
      renderFileList(attachedImages);
    });
  }

  // 세션 제목 편집 이벤트 리스너
  const sessionTitleHeader = document.querySelector('.session-title-header');
  if (sessionTitleHeader) {
    sessionTitleHeader.addEventListener('click', async (e) => {
      const sessionId = getChatSessionId();
      if (!sessionId) return;
      
      const currentTitle = sessionTitleHeader.textContent === 'Castle Coder' ? '' : sessionTitleHeader.textContent;
      
      // 입력 필드로 변경
      const input = document.createElement('input');
      input.className = 'session-title-edit-header';
      input.type = 'text';
      input.value = currentTitle;
      
      sessionTitleHeader.style.display = 'none';
      sessionTitleHeader.parentNode.insertBefore(input, sessionTitleHeader.nextSibling);
      input.focus();
      input.select();

      // 제목 변경 완료 함수
      const saveTitle = async () => {
        const newTitle = input.value.trim();
        if (newTitle !== currentTitle) {
          try {
            await requestUpdateSessionTitle(sessionId, newTitle);
            sessionTitleHeader.textContent = newTitle || 'Castle Coder';
            // 세션 상태도 업데이트
            setSession(sessionId, newTitle);
            console.log('세션 제목이 변경되었습니다:', newTitle);
          } catch (error) {
            console.error('제목 변경 실패:', error);
            alert('제목 변경에 실패했습니다: ' + error.message);
          }
        }
        // 편집 모드 종료
        input.remove();
        sessionTitleHeader.style.display = '';
      };

      // Enter 키로 저장
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          saveTitle();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          input.remove();
          sessionTitleHeader.style.display = '';
        }
      });

      // 포커스 아웃 시 저장
      input.addEventListener('blur', saveTitle);
    });
  }
}

let llmBotBuffer = '';

// 메시지 이벤트 리스너 중복 등록 방지
if (!window.__castleCoder_message_listener_registered) {
  window.addEventListener('message', ev => {
    if (ev.data.type === 'newChat') {
      // 새로운 채팅 시작 시 버퍼 및 최적화 변수 초기화
      llmBotBuffer = '';
      lastUpdateTime = 0;
      if (pendingUpdate) {
        clearTimeout(pendingUpdate);
        pendingUpdate = null;
      }
      renderStartView();
      // 시작 버튼을 Cancel 버튼으로 변경
      const startBtn = document.querySelector('.start-btn');
      if (startBtn) {
        startBtn.textContent = 'Cancel';
        startBtn.style.cssText = `
          background-color: #ef4444;
          border-color: #ef4444;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          border: 1px solid;
          font-weight: 500;
          cursor: pointer;
          opacity: 1;
        `;
      }
    }
    if (ev.data.type === 'showSessionList') {
      renderSessionListOverlay();
    }
    if (ev.data.type === 'llm-chat-response') {
      const data = ev.data.data;
      console.log('[Debug] llm-chat-response:', data);

      // 취소된 경우 취소 메시지로 변경하고 더 이상의 토큰 처리 중단
      if (data.cancelled) {
        const lastBotMessage = document.querySelector('.chat-message.bot:last-child');
        if (lastBotMessage) {
          lastBotMessage.innerHTML = `
            <div class="sender">Castle Coder</div>
            <div class="text">cancelled.</div>
          `;
        }
        return;
      }

      if (data.type === 'token' && data.content !== undefined) {
        // 새로운 토큰이 시작될 때 이전 응답 제거 및 변수 초기화
        if (llmBotBuffer === '') {
          const lastBotMessage = document.querySelector('.chat-message.bot:last-child');
          if (lastBotMessage) {
            lastBotMessage.remove();
          }
          lastUpdateTime = 0;
          if (pendingUpdate) {
            clearTimeout(pendingUpdate);
            pendingUpdate = null;
          }
        }
        
        llmBotBuffer += data.content;
        console.log('[Debug] Token received:', data.content, '| Current buffer:', llmBotBuffer);
        updateBotMessage(llmBotBuffer);
      }
    }
    if (ev.data.type === 'llm-chat-end') {
      console.log('llmbotbuffer:',llmBotBuffer);
      const data = ev.data.data;
      
      // 취소된 경우 취소 메시지로 변경
      if (data.cancelled) {
        const lastBotMessage = document.querySelector('.chat-message.bot:last-child');
        if (lastBotMessage) {
          lastBotMessage.innerHTML = `
            <div class="sender">Castle Coder</div>
            <div class="text">cancelled.</div>
          `;
        }
      } else {
        // 최종 완전한 마크다운 파싱 및 복사 버튼 추가
        if (llmBotBuffer.trim()) {
          const lastBotMessage = document.querySelector('.chat-message.bot:last-child');
          if (lastBotMessage) {
            // 모든 timeout 정리
            if (lastBotMessage._copyButtonTimeout) {
              clearTimeout(lastBotMessage._copyButtonTimeout);
              lastBotMessage._copyButtonTimeout = null;
            }
            if (pendingUpdate) {
              clearTimeout(pendingUpdate);
              pendingUpdate = null;
            }
            
            // 최종 완전한 마크다운 파싱 (marked.parse 직접 사용)
            try {
              const finalParsedText = marked.parse(llmBotBuffer);
              lastBotMessage.innerHTML = `
                <div class="sender">Castle Coder</div>
                <div class="text markdown-body">${finalParsedText}</div>
              `;
            } catch (error) {
              console.error('Final markdown parsing failed:', error);
              lastBotMessage.innerHTML = `
                <div class="sender">Castle Coder</div>
                <div class="text markdown-body">${llmBotBuffer.replace(/\n/g, '<br>')}</div>
              `;
            }
            
            // 최종 복사 버튼 추가
            addCopyButtonsToCodeBlocks(lastBotMessage);
          }
        }
        
        // 세션 log(메시지) 갱신
        const sessionId = getChatSessionId && getChatSessionId();
        if (sessionId) {
          loadChatSession(sessionId).then(chatData => {
            renderChatView(chatData);
          });
        }
      }
      
      // 모든 변수 초기화
      llmBotBuffer = '';
      lastUpdateTime = 0;
      if (pendingUpdate) {
        clearTimeout(pendingUpdate);
        pendingUpdate = null;
      }
      
      if (llmBotBuffer.trim() !== '') {
        stopLoadingAnimation();
      }
    }
    if (ev.data.type === 'llm-chat-error') {
      console.log('[Debug] llm-chat-error:', ev.data.error);
      const chatbox = document.getElementById('chatbox');
      if (chatbox) {
        const el = document.createElement('div');
        el.className = 'chat-message bot';
        el.innerHTML = `
          <div class="sender">Bot</div>
          <div class="text">[Error] ${ev.data.error}</div>
        `;
        chatbox.appendChild(el);
        chatbox.scrollTop = chatbox.scrollHeight;
      }
    }
    if (ev.data.type === 'update-button-state') {
      setSendButtonEnabled(true, ev.data.data.isEndButton);
    }
    if (ev.data.type === 'llm-cancel-response') {
      console.log('[Debug] Cancel response:', ev.data.data);
      // 취소 성공 시 현재 메시지를 취소 메시지로 변경
      const lastBotMessage = document.querySelector('.chat-message.bot:last-child');
      if (lastBotMessage) {
        lastBotMessage.innerHTML = `
          <div class="sender">Castle Coder</div>
          <div class="text">cancelled.</div>
        `;
      }
      // 버퍼 초기화
      llmBotBuffer = '';
      // 애니메이션 중지
      stopLoadingAnimation();
      // Send 버튼으로 변경
      setSendButtonEnabled(true, false);
    }
    if (ev.data.type === 'llm-cancel-error') {
      console.error('[Debug] Cancel error:', ev.data.error);
      // 취소 실패 시 에러 메시지 표시
      const lastBotMessage = document.querySelector('.chat-message.bot:last-child');
      if (lastBotMessage) {
        lastBotMessage.innerHTML = `
          <div class="sender">Castle Coder</div>
          <div class="text">[Error] 취소 요청 실패: ${ev.data.error}</div>
        `;
      }
      // Send 버튼으로 변경
      setSendButtonEnabled(true, false);
    }
  });
  window.__castleCoder_message_listener_registered = true;
}

// 응답 취소 함수
function cancelResponse() {
  const chatSessionId = getChatSessionId();
  
  if (!chatSessionId) {
    console.error('[Debug] No chatSessionId found');
    return;
  }
  
  // 즉시 Send 버튼으로 변경
  setSendButtonEnabled(true, false);
  
  // 로딩 메시지 제거
  const loadingMessage = document.querySelector('.chat-message.bot:last-child');
  if (loadingMessage && loadingMessage.textContent.includes('Generate')) {
    loadingMessage.remove();
  }
  
  // 애니메이션 중지
  stopLoadingAnimation();
  
  // 취소 API 호출
  cancelLLMResponse(chatSessionId);
  
  // 취소 메시지 추가
  addMessage('Bot', 'cancelled.');
}
