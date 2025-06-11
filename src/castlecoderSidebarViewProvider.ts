// castlecoderSidebarViewProvider.ts
import * as vscode from 'vscode';
import axios, { AxiosError, isAxiosError } from 'axios';
import { MessageHandler } from './messageHandler/login_register';
import { ChatMessageHandler } from './messageHandler/chat';
import { LLMMessageHandler } from './messageHandler/connectAi';
import { SecurityRefactoringHandler } from './messageHandler/securityRefactoring';
import { ImageManageHandler } from './messageHandler/imageManage';

export class CastleCoderSidebarViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'castleCoder.openview';
  private _view?: vscode.WebviewView;
  private baseUrl = 'http://13.125.85.38:8080/api/v1';
  private _messageHandler?: MessageHandler;
  private _chatMessageHandler?: ChatMessageHandler;
  private _llmMessageHandler?: LLMMessageHandler;
  private _securityRefactoringHandler?: SecurityRefactoringHandler;
  private _imageManageHandler?: ImageManageHandler;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ) {
    this._view = webviewView;
    this._messageHandler = new MessageHandler(webviewView);
    this._chatMessageHandler = new ChatMessageHandler(webviewView);
    this._llmMessageHandler = new LLMMessageHandler(webviewView);
    this._securityRefactoringHandler = new SecurityRefactoringHandler(webviewView);
    this._imageManageHandler = new ImageManageHandler(webviewView);

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    // Webview가 재생성될 때 상태 복원
    this._restoreState(webviewView.webview);

    this._setWebviewMessageListener(webviewView.webview);
  }

  private _restoreState(webview: vscode.Webview) {
    // Extension Host에 저장된 상태를 가져와서 Webview에 전달
    const auth = this._context.globalState.get('castleCoder_auth');
    const session = this._context.globalState.get('castleCoder_session');
    
    if (auth) {
      webview.postMessage({ 
        type: 'restoreAuthState', 
        data: auth 
      });
    }
    
    if (session) {
      webview.postMessage({ 
        type: 'restoreSessionState', 
        data: session 
      });
    }
  }

  public sendNewChat() {
    this._view?.webview.postMessage({ type: 'newChat' });
  }

  public sendUserPrompt(prompt: string) {
    this._view?.webview.postMessage({ type: 'userPrompt', prompt });
  }

  public sendSecurityPrompt(prompt: string, sessionTitle: string) {
    this._view?.webview.postMessage({ 
      type: 'securityPrompt', 
      prompt,
      sessionTitle 
    });
  }
  // sessionTitle이 필요한가? 

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
    const securityRefactoringUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, 'src', 'components', 'chat', 'connect', 'securityRefactoring.js')
    );

    // 캐슬 이미지 URI 추가
    const castleImageUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'castle.png'));

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
  
  <!-- 캐슬 이미지 CSS 변수 설정 -->
  <style>
    :root {
      --castle-image-url: url('${castleImageUri}');
    }
  </style>
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
  <script type="module" nonce="${nonce}" src="${securityRefactoringUri}"></script>
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

  private _setWebviewMessageListener(webview: vscode.Webview) {
    webview.onDidReceiveMessage(async (msg) => {
      if (
        msg.type === 'createChatSession' ||
        msg.type === 'updateChatSessionTitle' ||
        msg.type === 'getChatSessionList' ||
        msg.type === 'deleteChatSession' ||
        msg.type === 'loadChatSession'
      ) {
        await this._chatMessageHandler?.handleMessage(msg);
      } else if (msg.type === 'llm-chat') {
        await this._llmMessageHandler?.handleMessage(msg);
      } else if (msg.type === 'llm-cancel') {
        // llm-cancel은 LLMMessageHandler와 SecurityRefactoringHandler 모두에서 처리
        await this._llmMessageHandler?.handleMessage(msg);
        await this._securityRefactoringHandler?.handleMessage(msg);
      } else if (msg.type === 'securityPrompt') {
        await this._securityRefactoringHandler?.handleMessage(msg);
      } else if (msg.type === 'uploadImage') {
        await this._imageManageHandler?.handleMessage(msg);
      } else if (msg.type === 'deleteImage') {
        await this._imageManageHandler?.handleMessage(msg);
      } else if (msg.type === 'getAuth') {
        const auth = this._context.globalState.get('castleCoder_auth');
        console.log('[CastleCoder][ExtensionHost] getAuth:', auth);
        webview.postMessage({ type: 'authInfo', data: auth });
      } else if (msg.type === 'saveAuth' && msg.data) {
        console.log('[CastleCoder][ExtensionHost] saveAuth:', msg.data);
        await this._context.globalState.update('castleCoder_auth', msg.data);
      } else if (msg.type === 'saveSession' && msg.data) {
        await this._context.globalState.update('castleCoder_session', msg.data);
      } else if (msg.type === 'logout') {
        await this._context.globalState.update('castleCoder_auth', undefined);
        await this._context.globalState.update('castleCoder_session', undefined);
      } else {
        await this._messageHandler?.handleMessage(msg);
      }
    });
  }
}