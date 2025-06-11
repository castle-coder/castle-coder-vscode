export function setSession(sessionId, title) {
  window.__castleCoder_session = { sessionId, title };
  
  // Extension Host에 세션 상태 저장
  if (window.vscode) {
    window.vscode.postMessage({
      type: 'saveSession',
      data: { sessionId, title }
    });
  }
}

export function getSession() {
  return window.__castleCoder_session;
}

export function clearSession() {
  window.__castleCoder_session = null;
  
  // Extension Host에서 세션 상태 제거
  if (window.vscode) {
    window.vscode.postMessage({
      type: 'saveSession',
      data: null
    });
  }
}

// Extension Host로부터 세션 상태 복원
window.addEventListener('message', (e) => {
  const msg = e.data;
  if (msg.type === 'restoreSessionState') {
    window.__castleCoder_session = msg.data;
  }
});
