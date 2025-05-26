import * as vscode from 'vscode';
import axios, { AxiosError, isAxiosError } from 'axios';
import { setAccessToken } from '../auth';

export class MessageHandler {
  private baseUrl = 'http://13.125.85.38:8080/api/v1';
  private accessToken: string | null = null;

  constructor(private view: vscode.WebviewView) {}

  async handleMessage(message: any) {
    switch (message.type) {
      case 'checkEmail':
        await this.handleCheckEmail(message.email);
        break;
        
      case 'login':
        await this.handleLogin(message.body);
        break;

      case 'signup':
        await this.handleSignup(message.body);
        break;

      case 'newChat':
        this.view.webview.postMessage({ type: 'newChat' });
        break;

      case 'userPrompt':
        this.view.webview.postMessage({ type: 'userPrompt', prompt: message.prompt });
        break;

      default:
        break;
    }
  }

  private async handleCheckEmail(email: string) {
    try {
      const res = await axios.get(
        `${this.baseUrl}/member/check-email`,
        { params: { email } }
      );
      this.view.webview.postMessage({
        type: 'checkEmailResult',
        success: true,
        available: true,
      });
    } catch (err: unknown) {
      let errMsg = '이메일 중복 체크 중 알 수 없는 오류가 발생했습니다.';
      if (isAxiosError(err)) {
        const errorCode = err.response?.data?.errorCode;
        
        if (err.response?.status === 404) {
          this.view.webview.postMessage({
            type: 'checkEmailResult',
            success: true,
            available: false,
          });
          return;
        }
        errMsg = err.response?.data?.message ?? err.message;
      } else if (err instanceof Error) {
        errMsg = err.message;
      }
      this.view.webview.postMessage({
        type: 'checkEmailResult',
        success: false,
        error: errMsg,
      });
    }
  }

  private async handleLogin(body: { email: string; password: string }) {
    try {
      console.log('[Extension] Attempting login with:', { email: body.email });
      const res = await axios.post<{ data: { accessToken: string } }>(
        `${this.baseUrl}/auth/login`,
        body,
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('[Extension] Login response:', res.data);
      this.accessToken = res.data.data.accessToken;
      setAccessToken(this.accessToken);
      this.view.webview.postMessage({
        type: 'loginResponse',
        success: true,
        data: res.data,
      });
    } catch (err: unknown) {
      console.error('[Extension] Login error details:', err);
      let errMsg = '로그인 중 알 수 없는 오류가 발생했습니다.';
      if (isAxiosError(err)) {
        console.error('[Extension] Axios error response:', err.response?.data);
        errMsg = err.response?.data?.message ?? err.message;
      } else if (err instanceof Error) {
        errMsg = err.message;
      }
      this.view.webview.postMessage({
        type: 'loginError',
        success: false,
        error: errMsg,
      });
    }
  }

  private async handleSignup(body: any) {
    try {
      const res = await axios.post(
        `${this.baseUrl}/member/sign-up`,
        body
      );
      this.view.webview.postMessage({
        type: 'signupResponse',
        success: true,
        data: res.data,
      });
    } catch (err: unknown) {
      let errMsg = '회원가입 중 알 수 없는 오류가 발생했습니다.';
      if (isAxiosError(err)) {
        errMsg = err.response?.data?.message ?? err.message;
      } else if (err instanceof Error) {
        errMsg = err.message;
      }
      this.view.webview.postMessage({
        type: 'signupError',
        success: false,
        error: errMsg,
      });
    }
  }
}
