import axios from 'axios';
import * as vscode from 'vscode';
import { getAccessToken } from '../auth';

const baseUrl = 'http://13.125.85.38:8080/api/v1';

export class LLMMessageHandler {
  constructor(private view: vscode.WebviewView) {}

  async handleMessage(message: any) {
    if (message.type === 'llm-chat') {
      const { chatSessionId, prompt, imageUrls } = message;
      try {
        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`,
          'Accept': 'text/event-stream'
        };
        
        // imageUrls가 있으면 포함, 없으면 제외
        const requestBody = imageUrls 
          ? { chatSessionId, prompt, imageUrls }
          : { chatSessionId, prompt };

        const response = await axios.post(
          `${baseUrl}/llm/generate-code`,
          requestBody,
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
                    if (msg.type === 'end') {
                      // end 타입일 때 버튼 상태를 먼저 변경
                      this.view.webview.postMessage({ 
                        type: 'update-button-state',
                        data: { isEndButton: false }
                      });
                      // 그 다음에 end 메시지 전송
                      this.view.webview.postMessage({ type: 'llm-chat-end', data: msg });
                      // 버퍼 초기화 및 스트림 정리
                      buffer = '';
                      break;
                    } else {
                      this.view.webview.postMessage({ type: 'llm-chat-response', data: msg });
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
    // llm-cancel 메시지 타입 추가
    else if (message.type === 'llm-cancel') {
      const { chatSessionId } = message;
      try {
        const headers = {
          'Authorization': `Bearer ${getAccessToken()}`,
          'Accept': '*/*'
        };
        const response = await axios.delete(
          `${baseUrl}/llm/cancel/${chatSessionId}`,
          { headers }
        );
        // 요청 취소 성공 시
        this.view.webview.postMessage({
          type: 'llm-cancel-response',
          data: response.data
        });
      } catch (error: any) {
        let errorMsg = error.message;
        if (error.response && error.response.data && typeof error.response.data.message === 'string') {
          errorMsg = error.response.data.message;
        }
        // 요청 취소 실패 시
        this.view.webview.postMessage({
          type: 'llm-cancel-error',
          error: errorMsg
        });
      }
    }
  }
} 