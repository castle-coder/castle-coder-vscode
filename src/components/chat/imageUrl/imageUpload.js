import { vscode } from '../../api/vscodeApi.js';

export function uploadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function(e) {
      const arrayBuffer = e.target.result;
      const uint8Arr = new Uint8Array(arrayBuffer);
      console.log('[Webview] uploadImage 요청:', file.name, uint8Arr.length);
      vscode.postMessage({
        type: 'uploadImage',
        fileName: file.name,
        fileData: Array.from(uint8Arr)
      });
      function handleResponse(event) {
        const msg = event.data;
        if (msg.type === 'uploadImageResponse') {
          window.removeEventListener('message', handleResponse);
          console.log('[Webview] uploadImage 응답:', msg);
          if (msg.data && msg.data.code === 200 && msg.data.data && msg.data.data.imageUrl) {
            resolve({ imageUrl: msg.data.data.imageUrl, fileName: file.name });
          } else {
            reject(new Error(msg.error || (msg.data && msg.data.message) || '이미지 업로드 실패'));
          }
        }
      }
      window.addEventListener('message', handleResponse);
    };
    reader.onerror = function() {
      reject(new Error('파일 읽기 오류'));
    };
    reader.readAsArrayBuffer(file);
  });
} 