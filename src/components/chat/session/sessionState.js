export function setSession(sessionId, title) {
  console.log('[sessionState] setSession called with sessionId:', sessionId, 'title:', title);
  window.__castleCoder_session = { sessionId, title };
}
export function getSession() {
  console.log('[sessionState] getSession called');
  return window.__castleCoder_session || {};
}
