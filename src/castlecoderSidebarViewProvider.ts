// castlecoderSidebarViewProvider.ts
import * as vscode from 'vscode';
import axios, { AxiosError, isAxiosError } from 'axios';
import { MessageHandler } from './messageHandler/login_register';
import { ChatMessageHandler } from './messageHandler/chat';

export class CastleCoderSidebarViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'castleCoder.openview';
  private _view?: vscode.WebviewView;
  private baseUrl = 'http://13.125.85.38:8080/api/v1';
  private _messageHandler?: MessageHandler;
  private _chatMessageHandler?: ChatMessageHandler;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ) {
    this._view = webviewView;
    this._messageHandler = new MessageHandler(webviewView);
    this._chatMessageHandler = new ChatMessageHandler(webviewView);

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (message: any) => {
      if (
        message.type === 'createChatSession' ||
        message.type === 'updateChatSessionTitle' ||
        message.type === 'getChatSessionList'
      ) {
        await this._chatMessageHandler?.handleMessage(message);
      } else {
        await this._messageHandler?.handleMessage(message);
      }
    });
  }

  public sendNewChat() {
    this._view?.webview.postMessage({ type: 'newChat' });
  }

  public sendUserPrompt(prompt: string) {
    this._view?.webview.postMessage({ type: 'userPrompt', prompt });
  }

  public showSessionList() {
    this._view?.webview.postMessage({ type: 'showSessionList' });
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const nonce = this.getNonce();

    // resource URIs
    const authScriptUri      = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'components', 'member', 'auth.js'));
    const loginScriptUri     = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'components', 'member', 'login.js'));
    const registerScriptUri  = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'components', 'member', 'register.js'));
    
    const loginStyleUri      = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'components', 'member', 'css', 'login.css'));
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
  <script type="module" nonce="${nonce}" src="${registerScriptUri}"></script>
  <script type="module" nonce="${nonce}" src="${chatLogicUri}"></script>
  <script type="module" nonce="${nonce}" src="${chatStartUri}"></script>
  <script type="module" nonce="${nonce}" src="${chatIngUri}"></script>
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