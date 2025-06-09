import * as vscode from 'vscode';
import axios from 'axios';
import { getAccessToken } from '../auth';

export class SecurityRefactoringHandler {
  private baseUrl = 'http://13.125.85.38:8080/api/v1';
  private currentStream: any = null;
  private isProcessing: boolean = false;

  constructor(private readonly webview: vscode.WebviewView) {
    // 메시지 핸들러는 CastleCoderSidebarViewProvider에서 처리
  }

  private async handleCancelMessage(message: any) {
    const { chatSessionId } = message;
    try {
      // 현재 진행 중인 스트림 정리
      this.cleanupStream();
      
      const headers = {
        'Authorization': `Bearer ${getAccessToken()}`,
        'Accept': '*/*'
      };
      const response = await axios.delete(
        `${this.baseUrl}/llm/cancel/${chatSessionId}`,
        { headers }
      );
      // 요청 취소 성공 시
      this.webview.webview.postMessage({
        type: 'llm-cancel-response',
        data: response.data
      });
    } catch (error: any) {
      let errorMsg = error.message;
      if (error.response && error.response.data && typeof error.response.data.message === 'string') {
        errorMsg = error.response.data.message;
      }
      // 요청 취소 실패 시
      this.webview.webview.postMessage({
        type: 'llm-cancel-error',
        error: errorMsg
      });
    }
  }

  private cleanupStream() {
    if (this.currentStream) {
      this.currentStream.destroy();
      this.currentStream = null;
    }
    this.isProcessing = false;
  }

  public async handleMessage(message: any) {
    if (message.type === 'llm-cancel') {
      await this.handleCancelMessage(message);
    } else if (message.type === 'securityPrompt') {
      if (this.isProcessing) {
        console.log('[CastleCoder] Already processing security refactoring, ignoring new request');
        return;
      }

      this.isProcessing = true;
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
        
        // CastleCoder 뷰를 보이게 설정
        this.webview.show(true);
        
        // 세션 생성 후 뷰 업데이트
        this.webview.webview.postMessage({
          type: 'sessionCreated',
          chatSessionId,
          sessionTitle: message.sessionTitle || 'Security Refactoring'
        });
        
        // 채팅 뷰로 전환
        this.webview.webview.postMessage({
          type: 'showChatView',
          chatSessionId,
          sessionTitle: message.sessionTitle || 'Security Refactoring'
        });
        
        // 사용자 입력을 채팅 메시지로 표시
        this.webview.webview.postMessage({
          type: 'userPrompt',
          prompt: message.prompt
        });
        
        // 스크롤을 맨 밑으로 내리기
        this.webview.webview.postMessage({
          type: 'scrollToBottom'
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
        
        // 현재 스트림 저장
        this.currentStream = response.data;
        
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
                    if (msg.type === 'end') {
                      // end 타입일 때 버튼 상태를 먼저 변경
                      this.webview.webview.postMessage({ 
                        type: 'update-button-state',
                        data: { isEndButton: false }
                      });
                      // 그 다음에 end 메시지 전송
                      this.webview.webview.postMessage({ type: 'llm-chat-end', data: msg });
                      // 버퍼 초기화 및 스트림 정리
                      buffer = '';
                      this.cleanupStream();
                      break;
                    } else {
                      this.webview.webview.postMessage({ type: 'llm-chat-response', data: msg });
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
          this.cleanupStream();
        });
        response.data.on('error', (error: any) => {
          console.error('[CastleCoder] Stream error:', error);
          this.cleanupStream();
        });
      } catch (error: any) {
        console.error('[CastleCoder] Error in securityRefactoring handler:', error);
        this.cleanupStream();
        let errorMsg = error.message;
        if (error.response && error.response.data && typeof error.response.data.message === 'string') {
          errorMsg = error.response.data.message;
        }
        this.webview.webview.postMessage({
          type: 'llm-chat-error',
          error: errorMsg
        });
      }
    }
  }
} 

// sse 형식인지?