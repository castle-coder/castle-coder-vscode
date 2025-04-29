// src/extension.ts
import * as vscode from 'vscode';
import { CastleCoderSidebarViewProvider } from './castlecoderSidebarViewProvider';

export function activate(context: vscode.ExtensionContext) {

  console.log("🟢 Castle Coder ChatViewProvider activated");

  const provider = new CastleCoderSidebarViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
        CastleCoderSidebarViewProvider.viewType,
      provider
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('castleCoder.openview', () => {
      const message = "Menu/Title of extension is clicked";
      vscode.window.showInformationMessage(message);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('castleCoder.newChat', () => {
        provider.sendNewChat();
    })
);
  let openWebView = vscode.commands.registerCommand('castleCoder.openChatView', () => {
    const message = "Chat View is opened";
    vscode.window.showInformationMessage(message);
  });

  context.subscriptions.push(openWebView);

}

// class ChatViewProvider implements vscode.WebviewViewProvider {

//   public static readonly viewType = ''

//   constructor(private readonly extensionUri: vscode.Uri) {}

//   resolveWebviewView(view: vscode.WebviewView) {
//     const htmlPath = path.join(this.extensionUri.fsPath, 'webview', 'chat.html');
//     const html = fs.readFileSync(htmlPath, 'utf8');

//     view.webview.options = { enableScripts: true };
//     view.webview.html = html;

//     view.webview.onDidReceiveMessage((message) => {
//       if (message.command === 'ask') {
//         const fakeReply = `🧠 응답: "${message.text}"에 대한 가짜 답변입니다`;
//         view.webview.postMessage({ command: 'response', text: fakeReply });
//       }
//     });
//   }
// }

export function deactivate() {}