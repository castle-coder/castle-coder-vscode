// castlecoderSidebarViewProvider.ts
import * as vscode from 'vscode';
import axios, { AxiosError, isAxiosError } from 'axios';

export class CastleCoderSidebarViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'castleCoder.openview';
  private _view?: vscode.WebviewView;
  private baseUrl = 'http://13.125.85.38:8080/api/v1';

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    

    webviewView.webview.onDidReceiveMessage(async (message: any) => {
      switch (message.type) {

        case 'checkEmail':
          try {
            const res = await axios.get<{ available: boolean }>(
              `${this.baseUrl}/member/check-email`,
              { params: { email: message.email } }
            )
            this._view?.webview.postMessage({
              type: 'checkEmailResult',
              success: true,
              available: res.data.available,
            })
          } catch (err: unknown) {
            let errMsg = '이메일 중복 체크 중 알 수 없는 오류가 발생했습니다.'
            if (isAxiosError(err)) {
              errMsg = err.response?.data?.message ?? err.message
            } else if (err instanceof Error) {
              errMsg = err.message
            }
            this._view?.webview.postMessage({
              type: 'checkEmailResult',
              success: false,
              error: errMsg,
            })
          }
          break

        case 'login':
          try {
            const res = await axios.post<{ token: string }>(
              `${this.baseUrl}/auth/login`,
              message.body,
              { withCredentials: true }
            )
            this._view?.webview.postMessage({
              type: 'loginResponse',
              success: true,
              data: res.data,
            })
          } catch (err: unknown) {
            let errMsg = '로그인 중 알 수 없는 오류가 발생했습니다.'
            if (isAxiosError(err)) {
              errMsg = err.response?.data?.message ?? err.message
            } else if (err instanceof Error) {
              errMsg = err.message
            }
            this._view?.webview.postMessage({
              type: 'loginError',
              success: false,
              error: errMsg,
            })
          }
          break

        case 'signup':
          try {
            const res = await axios.post(
              `${this.baseUrl}/member/sign-up`,
              message.body
            )
            this._view?.webview.postMessage({
              type: 'signupResponse',
              success: true,
              data: res.data,
            })
          } catch (err: unknown) {
            let errMsg = '회원가입 중 알 수 없는 오류가 발생했습니다.'
            if (isAxiosError(err)) {
              errMsg = err.response?.data?.message ?? err.message
            } else if (err instanceof Error) {
              errMsg = err.message
            }
            this._view?.webview.postMessage({
              type: 'signupError',
              success: false,
              error: errMsg,
            })
          }
          break

        case 'newChat':
          this.sendNewChat()
          break

        case 'userPrompt':
          this.sendUserPrompt(message.prompt)
          break

        default:
          console.warn('알 수 없는 메시지 타입:', message.type)
          break
      }
    })
  }

  public sendNewChat() {
    // existing functionality preserved
    this._view?.webview.postMessage({ type: 'newChat' });
  }

  public sendUserPrompt(prompt: string) {
    // existing functionality preserved
    this._view?.webview.postMessage({ type: 'userPrompt', prompt });
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const nonce = this.getNonce();

    // resource URIs
    const authScriptUri      = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'components', 'member', 'auth.js'));
    const loginScriptUri     = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'components', 'member', 'login.js'));
    const loginStyleUri      = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'components', 'member', 'css', 'login.css'));
    
    const registerScriptUri  = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'components', 'member', 'register.js'));
    const registerStyleUri   = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'components', 'member', 'css', 'register.css'));
    
    const chatLogicUri       = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'components', 'chat', 'chat_logic.js'));
    const chatStartUri       = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'components', 'chat', 'chat_start.js'));
    const chatStartStyleUri  = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'components', 'chat', 'chat_start.css'));
    const chatIngUri         = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'components', 'chat', 'chat_ing.js'));
    const chatIngStyleUri    = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'components', 'chat', 'chat_ing.css'));

    const cspMeta = `
      <meta http-equiv="Content-Security-Policy"
        content="
          default-src 'none';
          script-src 'nonce-${nonce}' ${webview.cspSource};
          style-src ${webview.cspSource} 'unsafe-inline';
          img-src ${webview.cspSource} https:;
        ">
    `;


    return `<!DOCTYPE html>
<html lang="en">
<head>
  ${cspMeta}
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- 스타일 로드 --> 
  <link href="${registerStyleUri}" rel="stylesheet" />

  <link href="${loginStyleUri}" rel="stylesheet" />
  <link href="${chatStartStyleUri}" rel="stylesheet" />
  <link href="${chatIngStyleUri}" rel="stylesheet" />
</head>
<body>

  <div id="app">
    <div id="member-app"></div>
    <div id="chat-start-app" style="display: none;"></div>
    <div id="chat-ing-app" style="display: none;"></div>
  </div>

  <!-- Chat UI -->
  <div id="chatContainer"></div>

  <script type="module" nonce="${nonce}" src="${authScriptUri}"></script>
  <script type="module" nonce="${nonce}" src="${loginScriptUri}"></script>
  <script type="module"  nonce="${nonce}" src="${registerScriptUri}"></script>
  <script type="module"  nonce="${nonce}" src="${chatLogicUri}"></script>
  <script type="module"  nonce="${nonce}" src="${chatStartUri}"></script>
  <script type="module"  nonce="${nonce}" src="${chatIngUri}"></script>
</body>
</html>`;
  }

  private getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}