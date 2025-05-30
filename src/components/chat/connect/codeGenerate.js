import { vscode } from '../../api/vscodeApi.js';

export function sendLLMChatMessage({ chatSessionId, prompt }) {
  console.log('LLM 요청:', { chatSessionId, prompt });
  vscode.postMessage({
    type: 'llm-chat',
    chatSessionId,
    prompt
  });
}
