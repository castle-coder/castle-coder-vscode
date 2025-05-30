import * as vscode from 'vscode';
import axios from 'axios';
import { getAccessToken } from '../auth';

export class SecurityRefactoringHandler {
  private baseUrl = 'http://13.125.85.38:8080/api/v1';

  constructor(private readonly webview: vscode.WebviewView) {}

  public async handleMessage(message: any) {
    if (message.type === 'securityPrompt') {
      try {
        console.log('[CastleCoder] securityPrompt received:', message);
        // 채팅 세션 생성 (POST /chat/session, no body)
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`
        };
        const sessionResponse = await axios.post(
          `${this.baseUrl}/chat/session`,
          null,
          { headers }
        );
        const chatSessionId = sessionResponse.data.data.chatSessionId;
        console.log('[CastleCoder] Chat session created:', chatSessionId);
        // 세션 제목 수정 (PATCH /chat/session)
        await axios.patch(
          `${this.baseUrl}/chat/session`,
          { chatSessionId, title: message.sessionTitle || 'Security Refactoring' },
          { headers }
        );
        console.log('[CastleCoder] Chat session title updated:', message.sessionTitle);
        this.webview.webview.postMessage({
          type: 'sessionCreated',
          chatSessionId,
          sessionTitle: message.sessionTitle || 'Security Refactoring'
        });
        console.log('[CastleCoder] sessionCreated message sent:', { chatSessionId, sessionTitle: message.sessionTitle });
        // SSE 요청 (connectAi.ts와 동일한 방식)
        const sseHeaders = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`,
          'Accept': 'text/event-stream'
        };
        console.log('[CastleCoder] Sending refactor-code SSE request:', { chatSessionId, prompt: message.prompt });
        const response = await axios.post(
          `${this.baseUrl}/llm/refactor-code`,
          {
            chatSessionId,
            prompt: message.prompt
          },
          { headers: sseHeaders, responseType: 'stream' }
        );
        response.data.setEncoding('utf8');
        let buffer = '';
        response.data.on('data', (chunk: any) => {
          buffer += chunk;
          let boundary;
          while ((boundary = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, boundary).trim();
            buffer = buffer.slice(boundary + 1);
            if (line) {
              try {
                if (line.startsWith('data:')) {
                  const jsonStr = line.replace(/^data:/, '').trim();
                  if (jsonStr) {
                    const msg = JSON.parse(jsonStr);
                    this.webview.webview.postMessage({ type: 'securityResponse', data: msg });
                    if (msg.type === 'end') {
                      response.data.destroy();
                    }
                  }
                }
              } catch (e) {
                console.error('[CastleCoder] SSE JSON parse error:', e, 'line:', line);
              }
            }
          }
        });
        response.data.on('end', () => {
          console.log('[CastleCoder] SSE stream ended');
        });
      } catch (error: any) {
        console.error('[CastleCoder] Error in securityRefactoring handler:', error);
        this.webview.webview.postMessage({
          type: 'securityError',
          error: error.message
        });
      }
    }
  }
} 

// sse 형식인지?