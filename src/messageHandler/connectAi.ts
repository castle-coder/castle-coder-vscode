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
          buffer += chunk;
          let boundary;
          while ((boundary = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, boundary).trim();
            buffer = buffer.slice(boundary + 1);
            if (line) {
              try {
                const msg = JSON.parse(line);
                this.view.webview.postMessage({ type: 'llm-chat-response', data: msg });
                if (msg.type === 'end') {
                  response.data.destroy();
                }
              } catch (e) {
                // JSON 파싱 에러 무시
              }
            }
          }
        });
        response.data.on('end', () => {
          // 스트림 종료
        });
      } catch (error: any) {
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