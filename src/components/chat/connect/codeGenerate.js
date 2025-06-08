import { vscode } from '../../api/vscodeApi.js';

let currentSSE = null;

export function setCurrentSSE(sse) {
  currentSSE = sse;
}

export function closeCurrentSSE() {
  if (currentSSE) {
    currentSSE.close();
    currentSSE = null;
  }
}

export function sendLLMChatMessage({ chatSessionId, prompt }) {
  console.log('LLM 요청:', { chatSessionId, prompt });
  vscode.postMessage({
    type: 'llm-chat',
    chatSessionId,
    prompt
  });
}

export function sendLLMChatMessageWithImage({ chatSessionId, prompt, imageUrls }) {
  console.log('LLM 요청 (이미지 포함):', { chatSessionId, prompt, imageUrls });
  vscode.postMessage({
    type: 'llm-chat',
    chatSessionId,
    prompt,
    imageUrls
  });
}

// 응답 취소 함수
export function cancelResponse(chatSessionId) {
  if (!chatSessionId) {
    console.error('[Debug] No chatSessionId found');
    return;
  }
  
  // 취소 API 호출
  vscode.postMessage({
    type: 'llm-cancel',
    chatSessionId
  });
  console.log('[Debug] LLM 취소 요청 전송:', { chatSessionId });
}
