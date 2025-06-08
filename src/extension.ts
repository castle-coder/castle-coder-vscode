import * as vscode from 'vscode';
import { CastleCoderSidebarViewProvider } from './castlecoderSidebarViewProvider';
import { setAccessToken, setUserId } from './auth';

interface AuthState {
  accessToken?: string;
  userId?: string;
  isAuthenticated: boolean;
}

export function activate(context: vscode.ExtensionContext) {
  console.log('🟢 Castle Coder activated');

  // 로그인 상태 초기화
  const auth = context.globalState.get('castleCoder_auth') as AuthState | undefined;
  if (auth) {
    const { accessToken, userId } = auth;
    if (accessToken) {
      setAccessToken(accessToken);
    }
    if (userId) {
      setUserId(userId);
    }
  }
  vscode.commands.executeCommand('setContext', 'castleCoder:isLoggedIn', !!auth);

  const provider = new CastleCoderSidebarViewProvider(context.extensionUri, context);

  // 1) 사이드바 뷰 프로바이더 등록
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      CastleCoderSidebarViewProvider.viewType,
      provider,
      {
        // 이 옵션을 추가!
        webviewOptions: {
          retainContextWhenHidden: true
        }
      }
    )
  );

  // 2) 명령어: 사이드바 열기
  context.subscriptions.push(
    vscode.commands.registerCommand('castleCoder.openview', async () => {
      const auth = context.globalState.get('castleCoder_auth');
      if (!auth) {
        // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
        await vscode.commands.executeCommand('workbench.view.extension.castlecoder-sidebar-view');
        return;
      }
      await vscode.commands.executeCommand('workbench.view.extension.castlecoder-sidebar-view');
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
      
      // 선택된 텍스트 가져오기
      const selection = editor.selection;
      const code = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);
      
      if (!code) {
        vscode.window.showWarningMessage('No code selected');
        return;
      }

      // 파일 이름 가져오기 (확장자 제외)
      const fileName = editor.document.fileName.split('/').pop()?.split('.')[0] || 'unknown';
      const sessionTitle = `${fileName} 보안 점검`;

      // 디버깅 로그
      console.log('[CastleCoder] Security Refactor command executed');
      vscode.window.showInformationMessage(`[CastleCoder] Security Refactor 명령 실행: ${sessionTitle}`);

      // 사이드바 활성화 및 포커스
      await vscode.commands.executeCommand('castleCoder.openview');
      // 사이드바가 열릴 때까지 잠시 대기
      await new Promise((r) => setTimeout(r, 100));

      // 선택된 코드만 전송
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
