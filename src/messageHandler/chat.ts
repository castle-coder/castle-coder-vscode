import * as vscode from 'vscode';
import axios, { AxiosError, isAxiosError } from 'axios';

export class ChatMessageHandler {
  private baseUrl = 'http://13.125.85.38:8080/api/v1';

  constructor(private view: vscode.WebviewView) {}

  async handleMessage(message: any) {
    switch (message.type) {
      case 'createChatSession':
        await this.handleCreateChatSession(message.title);
        break;

      case 'updateChatSessionTitle':
        await this.handleUpdateChatSessionTitle(message.chatSessionId, message.title);
        break;

      case 'getChatSessionList':
        await this.handleGetChatSessionList();
        break;

      default:
        break;
    }
  }

  private async handleCreateChatSession(title: string) {
    try {
      console.log('[chat.ts] Creating chat session with title:', title);
      const res = await axios.post(`${this.baseUrl}/chat/session`, { title });
      console.log('[chat.ts] Chat session created successfully:', {
        code: res.data.code,
        message: res.data.message,
        chatSessionId: res.data.data.chatSessionId
      });
      this.view.webview.postMessage({
        type: 'createChatSessionResponse',
        success: true,
        data: res.data.data
      });
    } catch (err: unknown) {
      console.error('[chat.ts] Error creating chat session:', err);
      let errMsg = '채팅 세션 생성 중 알 수 없는 오류가 발생했습니다.';
      if (isAxiosError(err)) {
        errMsg = err.response?.data?.message ?? err.message;
      } else if (err instanceof Error) {
        errMsg = err.message;
      }
      this.view.webview.postMessage({
        type: 'createChatSessionResponse',
        success: false,
        error: errMsg
      });
    }
  }

  private async handleUpdateChatSessionTitle(chatSessionId: number, title: string) {
    try {
      console.log('[chat.ts] Updating chat session title:', { chatSessionId, title });
      console.log('PATCH body:', { chatSessionId, title });
      await axios.patch(`${this.baseUrl}/chat/session`, { chatSessionId, title });
      this.view.webview.postMessage({
        type: 'updateChatSessionTitleResponse',
        success: true
      });
    } catch (err: unknown) {
      console.error('[chat.ts] Error updating chat session title:', err);
      let errMsg = '채팅 세션 제목 수정 중 알 수 없는 오류가 발생했습니다.';
      if (isAxiosError(err)) {
        errMsg = err.response?.data?.message ?? err.message;
      } else if (err instanceof Error) {
        errMsg = err.message;
      }
      this.view.webview.postMessage({
        type: 'updateChatSessionTitleResponse',
        success: false,
        error: errMsg
      });
    }
  }

  private async handleGetChatSessionList() {
    try {
      const res = await axios.get(`${this.baseUrl}/chat/session`);
      this.view.webview.postMessage({
        type: 'getChatSessionListResponse',
        success: true,
        data: res.data.data
      });
    } catch (err: unknown) {
      let errMsg = '채팅 세션 목록 불러오기 중 오류가 발생했습니다.';
      if (isAxiosError(err)) {
        errMsg = err.response?.data?.message ?? err.message;
      } else if (err instanceof Error) {
        errMsg = err.message;
      }
      this.view.webview.postMessage({
        type: 'getChatSessionListResponse',
        success: false,
        error: errMsg
      });
    }
  }
}