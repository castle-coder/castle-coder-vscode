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
            localResourceRoots: [this._extensionUri],
            };
            webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);
    }

    private getHtmlForWebview(webview: vscode.Webview): string {

        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'sidebar.js')
        );
        const styleResetUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css')
        );
        const styleVSCodeUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css')
        );
        const stylesheetUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'sidebar.css')
        );

        const nonce = getNonce();

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <link rel="stylesheet" href="https://unpkg.com/modern-css-reset/dist/reset.min.css" />
    <link href="https://fonts.googleapis.com/css2?family=Muli:wght@300;400;700&display=swap" rel="stylesheet">

            <link href="${styleResetUri}" rel="stylesheet">
            <link href="${styleVSCodeUri}" rel="stylesheet">
            
    <link href="${stylesheetUri}" rel="stylesheet">
            
        </head>

        <body>
        <section class="wrapper">
  <div class="container">
        <div class="content">
            <h2 class="subtitle">Castle Coder</h2>
            <input type="text" class="ask" placeholder="Ask Castle Coder" name="ask" required>
            
            <button class="add-color-button">send</button>
            
            <p class="text">Be careful security</p>

            
        </div>
  </div>
        </section>
        <!--<script nonce="${nonce}" src="${scriptUri}"></script>-->
  </body>

        </html>`;
}
}

function getNonce() {
let text = "";
const possible =
"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
for (let i = 0; i < 32; i++) {
text += possible.charAt(Math.floor(Math.random() * possible.length));
}
return text;
}