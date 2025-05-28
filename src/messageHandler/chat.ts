import * as vscode from 'vscode';
import axios, { AxiosError, isAxiosError } from 'axios';
import { getAccessToken } from '../auth';

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

      case 'deleteChatSession':
        await this.handleDeleteChatSession(message.chatSessionId);
        break;

      case 'loadChatSession':
        await this.handleLoadChatSession(message.chatSessionId);
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
      // 디버깅: Authorization 헤더 확인
      const testConfig = await axios.getUri({
        url: `${this.baseUrl}/chat/session`,
        method: 'patch',
        headers: { 'Content-Type': 'application/json' }
      });
      // 실제로 axios 인스턴스의 기본 헤더 확인
      console.log('[chat.ts] axios.defaults.headers.common:', axios.defaults.headers.common);
      // PATCH 요청
      await axios.patch(
        `${this.baseUrl}/chat/session`,
        { chatSessionId, title },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAccessToken()}`,
            'Accept': 'application/json'
          }
        }
      );
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

  private async handleDeleteChatSession(chatSessionId: number) {
    console.log('[chat.ts] handleDeleteChatSession called with:', chatSessionId);
    try {
      const res = await axios.delete(`${this.baseUrl}/chat/session`, {
        params: { chatSessionId },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`,
          'Accept': 'application/json'
        }
      });
      console.log('[chat.ts] Sending deleteChatSessionResponse to webview:', {
        success: true,
        chatSessionId
      });
      this.view.webview.postMessage({
        type: 'deleteChatSessionResponse',
        success: true,
        chatSessionId
      });
    } catch (err: unknown) {
      let errMsg = '채팅 세션 삭제 중 오류가 발생했습니다.';
      if (isAxiosError(err)) {
        console.error('[chat.ts] DELETE error response:', err.response?.data);
        errMsg = err.response?.data?.message ?? err.message;
      } else if (err instanceof Error) {
        errMsg = err.message;
      }
      this.view.webview.postMessage({
        type: 'deleteChatSessionResponse',
        success: false,
        error: errMsg,
        chatSessionId
      });
    }
  }

  private async handleLoadChatSession(chatSessionId: number) {
    try {
      console.log('[chat.ts] Loading chat session:', chatSessionId);
      const res = await axios.get(`${this.baseUrl}/chat/logs`, {
        params: { chatSessionId },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`,
          'Accept': 'application/json'
        }
      });
      
      // Transform the response data into the expected format
      const transformedData = res.data.data.map((log: any) => [
        { sender: 'You', text: log.prompt },
        { sender: 'Bot', text: log.response }
      ]).flat();
      
      this.view.webview.postMessage({
        type: 'loadChatSessionResponse',
        success: true,
        data: transformedData
      });
    } catch (err: unknown) {
      console.error('[chat.ts] Error loading chat session:', err);
      let errMsg = '채팅 세션 로드 중 오류가 발생했습니다.';
      if (isAxiosError(err)) {
        errMsg = err.response?.data?.message ?? err.message;
      } else if (err instanceof Error) {
        errMsg = err.message;
      }
      this.view.webview.postMessage({
        type: 'loadChatSessionResponse',
        success: false,
        error: errMsg
      });
    }
  }
}