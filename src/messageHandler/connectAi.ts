import axios from 'axios';
import * as vscode from 'vscode';
import { getAccessToken } from '../auth';

const baseUrl = 'http://13.125.85.38:8080/api/v1';

export class LLMMessageHandler {
  constructor(private view: vscode.WebviewView) {}

  async handleMessage(message: any) {
    if (message.type === 'llm-chat') {
      const { chatSessionId, prompt } = message;
      try {
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`,
          'Accept': 'text/event-stream'
        };
        const response = await axios.post(
          `${baseUrl}/llm/generate-code`,
          { chatSessionId, prompt },
          { headers, responseType: 'stream' }
        );
        response.data.setEncoding('utf8');
        let buffer = '';
        response.data.on('data', (chunk: any) => {
          console.log('[Debug][connectAi] Stream data chunk:', chunk);
          buffer += chunk;
          let boundary;
          while ((boundary = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, boundary).trim();
            buffer = buffer.slice(boundary + 1);
            if (line) {
              try {
                // SSE 포맷: data:로 시작하는 줄만 파싱
                if (line.startsWith('data:')) {
                  const jsonStr = line.replace(/^data:/, '').trim();
                  if (jsonStr) {
                    const msg = JSON.parse(jsonStr);
                    console.log('[Debug][connectAi] Parsed stream message:', msg);
                    this.view.webview.postMessage({ type: 'llm-chat-response', data: msg });
                    if (msg.type === 'end') {
                      response.data.destroy();
                    }
                  }
                } else {
                  // event: 등은 무시
                  console.log('[Debug][connectAi] Ignored non-data line:', line);
                }
              } catch (e) {
                console.error('[Debug][connectAi] JSON parse error:', e, 'line:', line);
              }
            }
          }
        });
        response.data.on('end', () => {
          console.log('[Debug][connectAi] Stream ended');
        });
      } catch (error: any) {
        console.error('[Debug][connectAi] Error in handleMessage:', error);
        let errorMsg = error.message;
        if (error.response) {
          // 순환 참조 없는 안전한 값만 추출
          if (typeof error.response.data === 'string') {
            errorMsg = error.response.data;
          } else if (error.response.data && typeof error.response.data.message === 'string') {
            errorMsg = error.response.data.message;
          } else if (error.response.statusText) {
            errorMsg = error.response.statusText;
          }
          console.error('[LLMMessageHandler] Server error response:', error.response.data);
          if (error.response.data && error.response.data.read) {
            let errorBody = '';
            for await (const chunk of error.response.data) {
              errorBody += chunk;
            }
            console.error('Error body:', errorBody);
          }
        } else {
          console.error('[LLMMessageHandler] Error:', error);
        }
        this.view.webview.postMessage({ type: 'llm-chat-error', error: errorMsg });
      }
    }
  }
} 