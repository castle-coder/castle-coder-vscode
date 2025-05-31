import { vscode } from '../../api/vscodeApi.js';

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
