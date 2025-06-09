import * as vscode from 'vscode';
import axios, { AxiosError, isAxiosError } from 'axios';
import { setAccessToken, setUserId } from '../auth';

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

      case 'logout':
        await vscode.commands.executeCommand('setContext', 'castleCoder:isLoggedIn', false);
        break;

      case 'getProfile':
        await this.handleGetProfile();
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
      const response = await axios.post(`${this.baseUrl}/auth/login`, body);
      if (response.data) {
        // 로그인 성공 시 상태 업데이트
        await vscode.commands.executeCommand('setContext', 'castleCoder:isLoggedIn', true);
        const { accessToken, refreshToken } = response.data.data;
        if (accessToken) {
          this.accessToken = accessToken;
          setAccessToken(accessToken);

          // JWT 토큰에서 userId 추출 (sub 클레임)
          const tokenParts = accessToken.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            const userId = payload.sub;
            setUserId(userId);
            // Extension Host에 인증 정보 저장
            this.view.webview.postMessage({
              type: 'saveAuth',
              data: {
                accessToken,
                refreshToken,
                userId,
                isAuthenticated: true
              }
            });

            // loginResponse에 userId 추가
            this.view.webview.postMessage({ 
              type: 'loginResponse', 
              success: true, 
              data: {
                ...response.data,
                data: {
                  ...response.data.data,
                  id: userId
                }
              }
            });
          }
        }
      }
    } catch (error) {
      if (isAxiosError(error)) {
        this.view.webview.postMessage({ 
          type: 'loginResponse', 
          success: false, 
          error: error.response?.data?.message || '로그인에 실패했습니다.' 
        });
      }
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

  private async handleGetProfile() {
    try {
      // accessToken이 없으면 auth.ts에서 가져오기
      if (!this.accessToken) {
        const { getAccessToken } = await import('../auth');
        this.accessToken = getAccessToken();
      }
      
      if (!this.accessToken) {
        throw new Error('로그인이 필요합니다.');
      }

      const res = await axios.get(
        `${this.baseUrl}/member/profiles`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`
          }
        }
      );

      // 응답 코드가 200이면 성공
      if (res.status === 200 && res.data?.code === 200) {
        // userId 저장
        const profileData = res.data.data;
        if (profileData && profileData.id) {
          setUserId(profileData.id.toString());
        }
        
        this.view.webview.postMessage({
          type: 'profileResponse',
          success: true,
          data: res.data.data,
        });
      } else {
        // 200이 아니면 실패로 처리
        this.view.webview.postMessage({
          type: 'profileResponse',
          success: false,
          error: res.data?.message || '프로필 조회에 실패했습니다.',
        });
      }
    } catch (err: unknown) {
      let errMsg = '프로필 조회 중 오류가 발생했습니다.';
      if (isAxiosError(err)) {
        // 401, 403 등 인증 오류 시
        if (err.response?.status === 401 || err.response?.status === 403) {
          errMsg = '인증이 만료되었습니다. 다시 로그인해주세요.';
        } else {
          errMsg = err.response?.data?.message ?? err.message;
        }
      } else if (err instanceof Error) {
        errMsg = err.message;
      }
      
      this.view.webview.postMessage({
        type: 'profileResponse',
        success: false,
        error: errMsg,
      });
    }
  }
}
