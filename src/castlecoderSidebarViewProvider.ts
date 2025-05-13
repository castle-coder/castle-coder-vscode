// castlecoderSidebarViewProvider.ts
import * as vscode from 'vscode';

export class CastleCoderSidebarViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'castleCoder.openview';
  private _view?: vscode.WebviewView;
  private readonly baseUrl = 'http://13.125.85.38:8080/api/v1';

  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(
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

    // Send baseUrl to webview
    webviewView.webview.postMessage({ command: 'setBaseUrl', baseUrl: this.baseUrl });

    // handle messages from webview
    webviewView.webview.onDidReceiveMessage(message => {
      switch (message.type) {
        case 'login':
          this.postToServer('/auth/login', message.body);
          break;
        case 'signup':
          this.postToServer('/member/sign-up', message.body);
          break;
        case 'newChat':
          this.sendNewChat();
          break;
        case 'userPrompt':
          this.sendUserPrompt(message.prompt);
          break;
        default:
          break;
      }
    });
  }

  private postToServer(path: string, body: any) {
    fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
      .then(res => res.json())
      .then(data => this._view?.webview.postMessage({ type: 'loginResponse', data }))
      .catch(err => this._view?.webview.postMessage({ type: 'loginError', error: err.message }));
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

    // 1) API 호출을 허용하는 CSP 정의
    const csp = `
      default-src 'none';
      connect-src 'self' http://13.125.85.38:8080/api/v1 http://13.125.85.38:8080;
      img-src ${webview.cspSource};
      script-src 'nonce-${nonce}' 'unsafe-inline';
      style-src ${webview.cspSource} 'unsafe-inline';
      font-src ${webview.cspSource};
    `.replace(/\s+/g, ' ');

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


    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- inline baseUrl 설정 (CSP nonce 허용) -->
  <script nonce="${nonce}">
    window.baseUrl = "http://13.125.85.38:8080/api/v1";
  </script>

  <!-- 스타일 로드 --> 
  <link href="${registerStyleUri}" rel="stylesheet" />

  <link href="${loginStyleUri}" rel="stylesheet" />
  <link href="${chatStartStyleUri}" rel="stylesheet" />
  <link href="${chatIngStyleUri}" rel="stylesheet" />
</head>
<body>
  <!-- Member controls -->
  <div id="memberControls">
    <button id="loginBtn">Login</button>
    <button id="signupBtn">Sign Up</button>
  </div>

  <!-- Chat UI -->
  <div id="chatContainer"></div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    let baseUrl = '';

    window.addEventListener('message', event => {
      const msg = event.data;
      if (msg.command === 'setBaseUrl') {
        baseUrl = msg.baseUrl;
      }
      if (msg.type === 'loginResponse') {
        console.log('Login successful:', msg.data);
      }
      if (msg.type === 'loginError') {
        console.error('Login error:', msg.error);
      }
    });

    document.getElementById('loginBtn').addEventListener('click', () => {
      const userId = prompt('Enter User ID for login');
      if (!userId) return;
      vscode.postMessage({ type: 'login', body: { user_id: userId } });
    });

    document.getElementById('signupBtn').addEventListener('click', () => {
      const username = prompt('Enter Username for sign-up');
      const password = prompt('Enter Password for sign-up');
      if (!username || !password) return;
      vscode.postMessage({ type: 'signup', body: { username, password } });
    });
  </script>

  <script nonce="${nonce}" src="${authScriptUri}"></script>
  <script nonce="${nonce}" src="${loginScriptUri}"></script>
  <script nonce="${nonce}" src="${registerScriptUri}"></script>
  <script nonce="${nonce}" src="${chatLogicUri}"></script>
  <script nonce="${nonce}" src="${chatStartUri}"></script>
  <script nonce="${nonce}" src="${chatIngUri}"></script>
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