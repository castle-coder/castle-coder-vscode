# castle-coder-vscode

1. login 기능 추가
    - ~~css : login, register, chat_start, chat_ing 분리 및 재정의~~
2. chatting 기록 저장 어떻게 할 지 
    - localStorage
    - server : 다중 디바이스 지원에 필요 - 굳이 사용하지 않아도 될 듯 싶다.
    - memento API (vscode extension 특화)
3. chatting 기능
    - webview sidebar 상단에 메뉴 추가 (~~창 닫기, 새로운 채팅창 열기~~, 메뉴창 열기)
    - ~~UI 수정 필요 (chat_start.css 진행하고 chat_ing.css는 안해도 될 듯)~~
  
4. security refactoring
    - ~~code scrab → move to sidebar~~
    - vscode extension → LLM


5.27
채팅 세션 생성 - 제목 붙일 때 post 요청 보내는 걸로 설정했는데
문제가 patch가 따로 존재해서 제목을 생성해도 제목이 같이 전송되지 않고 생성 요청만 전송됨.
PATCH로 제목 설정을 하기 위해서는 enter를 한 번 더 눌러야 됨.

PATCH 에러 해결 필요.