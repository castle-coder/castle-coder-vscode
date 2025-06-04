import * as vscode from 'vscode';
import { CastleCoderSidebarViewProvider } from './castlecoderSidebarViewProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('🟢 Castle Coder activated');

  const provider = new CastleCoderSidebarViewProvider(context.extensionUri);

  // 1) 사이드바 뷰 프로바이더 등록
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      CastleCoderSidebarViewProvider.viewType,
      provider
    )
  );

  // 2) 명령어: 사이드바 열기
  context.subscriptions.push(
    vscode.commands.registerCommand('castleCoder.openview', async () => {
      await vscode.commands.executeCommand(
        'workbench.view.extension.castlecoder-sidebar-view'
      );
    })
  );

  // 3) 명령어: 새 채팅 시작
  context.subscriptions.push(
    vscode.commands.registerCommand('castleCoder.newChat', () => {
      provider.sendNewChat();
    })
  );

  // 4) 명령어: 코드 보안 리팩터링
  context.subscriptions.push(
    vscode.commands.registerCommand('castleCoder.securityRefactor', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor found');
        return;
      }
      
      // 전체 파일 내용 가져오기
      const code = editor.document.getText();
      if (!code) {
        vscode.window.showWarningMessage('File is empty');
        return;
      }

      // 파일 이름 가져오기 (확장자 제외)
      const fileName = editor.document.fileName.split('/').pop()?.split('.')[0] || 'unknown';
      const sessionTitle = `${fileName} 보안 점검`;

      // 디버깅 로그
      console.log('[CastleCoder] Security Refactor command executed');
      vscode.window.showInformationMessage(`[CastleCoder] Security Refactor 명령 실행: ${sessionTitle}`);

      // 사이드바 활성화
      await vscode.commands.executeCommand('castleCoder.openview');
      await new Promise((r) => setTimeout(r, 50));

      // 사용자 프롬프트 전송 (securityPrompt 타입)
      // const prompt = `Refactor the following code to be more secure:\n\n${code}`;
      const prompt = `\n\n${code}`;
      provider.sendSecurityPrompt(prompt, sessionTitle);
    })
  );

  const openChatView = vscode.commands.registerCommand(
    'castleCoder.openChatView',
    () => {
      vscode.window.showInformationMessage('Chat view opened');
    }
  );
  context.subscriptions.push(openChatView);

  // 6) 명령어: 세션 목록 보기
  context.subscriptions.push(
    vscode.commands.registerCommand('castleCoderSidebar.menu.view', () => {
      provider.showSessionList();
    })
  );
}

export function deactivate() {
  // Cleanup if necessary
}
