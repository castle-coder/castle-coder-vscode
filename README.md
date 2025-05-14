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




5.14
promblem : register-btn을 눌렀을 때, toRegister로 postMessage가 송신되는데 변화가 일어나지 않음.

- Login 기능은 되는데 register 창 전환은 안 되는 걸 보면 