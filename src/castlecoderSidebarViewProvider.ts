import * as vscode from 'vscode';

export class CastleCoderSidebarViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'castleCoder.openview';
  private _view?: vscode.WebviewView;

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
  }

  public sendNewChat() {
    this._view?.webview.postMessage({ type: 'newChat' });
  }

  public sendUserPrompt(prompt: string) {
    this._view?.webview.postMessage({ type: 'userPrompt', prompt });
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const nonce = this.getNonce();

    // 스크립트·스타일 URI
    const authScriptUri        = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'components', 'member', 'auth.js'));
    const loginScriptUri       = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'components', 'member','login.js'));
    const registerScriptUri    = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'components', 'member', 'register.js'));
    const chatStartScriptUri   = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'components', 'chat', 'chat_start.js'));
    const chatIngScriptUri     = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'components', 'chat', 'chat_ing.js'));
    const chatLogicScriptUri   = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'components', 'chat', 'chat_logic.js'));

    const loginStyleUri        = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'components', 'member', 'css', 'login.css'));
    const registerStyleUri     = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'components', 'member', 'css', 'register.css'));
    const chatStartStyleUri    = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'components', 'chat', 'chat_start.css'));
    const chatIngStyleUri      = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'components', 'chat', 'chat_ing.css'));

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <link href="${loginStyleUri}"    rel="stylesheet">
  <link href="${registerStyleUri}" rel="stylesheet">
  <link href="${chatStartStyleUri}" rel="stylesheet">
  <link href="${chatIngStyleUri}"   rel="stylesheet">
</head>
<body>
  <div id="app">
    <div id="member-app"></div>
    <div id="chat-start-app" style="display:none;"></div>
    <div id="chat-ing-app" style="display:none;"></div>
  </div>

  <script type="module" nonce="${nonce}" src="${authScriptUri}"></script>
  <script type="module" nonce="${nonce}" src="${loginScriptUri}"></script>
  <script type="module" nonce="${nonce}" src="${registerScriptUri}"></script>
  <script type="module" nonce="${nonce}" src="${chatLogicScriptUri}"></script>
  <script type="module" nonce="${nonce}" src="${chatStartScriptUri}"></script>
  <script type="module" nonce="${nonce}" src="${chatIngScriptUri}"></script>
</body>
</html>`;
  }

  private getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
