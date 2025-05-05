import * as vscode from 'vscode';

export class CastleCoderSidebarViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'castleCoder.openview';
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) {}

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken
    ): Thenable<void> | void {
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
        if ( !this._view) {
            console.warn('WebviewView is not yet resolved');
            return;
        }
        this._view?.webview.postMessage({
            type: 'userPrompt',
            prompt,
            meta: 'securityRefactor'
        });
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'chat', 'chat_start.js')
        );
        const styleResetUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css')
        );
        const styleVSCodeUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css')
        );
        const sidebarStyleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'sidebar', 'sidebar.css')
        );
        const chatStartStyleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'chat', 'chat_start.css')
        );
        const chatIngStyleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'chat', 'chat_ing.css')
        );

        const nonce = getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <link href="${styleResetUri}" rel="stylesheet">
    <link href="${styleVSCodeUri}" rel="stylesheet">
    <link href="${sidebarStyleUri}" rel="stylesheet">
    <link href="${chatStartStyleUri}" rel="stylesheet">
    <link href="${chatIngStyleUri}" rel="stylesheet">
</head>

<body>
    <div id="app">
        <div id="chat-start-app"></div>
        <div id="chat-ing-app" style="display:none;"></div>
    </div>
    <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
    }
}

function getNonce() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
