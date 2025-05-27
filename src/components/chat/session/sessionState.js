export function setSession(sessionId, title) {
  window.__castleCoder_session = { sessionId, title };
}
export function getSession() {
  return window.__castleCoder_session || {};
}
