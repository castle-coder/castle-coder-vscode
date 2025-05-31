import { vscode } from '../../api/vscodeApi.js';

export function deleteImage(imageUrl) {
  return new Promise((resolve, reject) => {
    console.log('[Webview] deleteImage 요청:', imageUrl);
    vscode.postMessage({
      type: 'deleteImage',
      imageUrl
    });
    function handleResponse(event) {
      const msg = event.data;
      if (msg.type === 'deleteImageResponse' && msg.imageUrl === imageUrl) {
        window.removeEventListener('message', handleResponse);
        console.log('[Webview] deleteImage 응답:', msg);
        if (msg.data && msg.data.code === 200) {
          resolve(msg.data);
        } else {
          reject(new Error(msg.error || (msg.data && msg.data.message) || '이미지 삭제 실패'));
        }
      }
    }
    window.addEventListener('message', handleResponse);
  });
}
