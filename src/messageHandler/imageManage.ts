import axios from 'axios';
import * as vscode from 'vscode';
import { getAccessToken } from '../auth';

const baseUrl = 'http://13.125.85.38:8080/api/v1';

export class ImageManageHandler {
  constructor(private view: vscode.WebviewView) {}

  async handleMessage(message: any) {
    if (message.type === 'uploadImage') {
      const { fileName, fileData } = message;
      console.log('[ImageManageHandler] uploadImage 요청:', { fileName, fileDataLength: fileData?.length });
      try {
        // fileData는 Uint8Array로 전달됨
        const blob = new Blob([new Uint8Array(fileData)], { type: 'image/*' });
        const formData = new FormData();
        formData.append('updateImage', blob, fileName);

        const headers = {
          'Authorization': `Bearer ${getAccessToken()}`
          // Content-Type은 FormData 사용 시 axios가 자동 설정
        };

        const response = await axios.post(
          `${baseUrl}/chat/image`,
          formData,
          { headers }
        );
        console.log('[ImageManageHandler] 업로드 성공:', response.data);
        this.view.webview.postMessage({
          type: 'uploadImageResponse',
          data: response.data
        });
      } catch (error: any) {
        console.error('[ImageManageHandler] 업로드 실패:', error);
        this.view.webview.postMessage({
          type: 'uploadImageResponse',
          error: error.message || '이미지 업로드 중 오류 발생'
        });
      }
    }
    // 이미지 삭제 처리
    else if (message.type === 'deleteImage') {
      const { imageUrl } = message;
      console.log('[ImageManageHandler] deleteImage 요청:', imageUrl);
      try {
        const headers = {
          'Authorization': `Bearer ${getAccessToken()}`
        };
        const response = await axios.delete(
          `${baseUrl}/chat/image`,
          {
            headers,
            params: { imageUrl }
          }
        );
        console.log('[ImageManageHandler] 삭제 성공:', response.data);
        this.view.webview.postMessage({
          type: 'deleteImageResponse',
          imageUrl,
          data: response.data
        });
      } catch (error: any) {
        console.error('[ImageManageHandler] 삭제 실패:', error);
        this.view.webview.postMessage({
          type: 'deleteImageResponse',
          imageUrl,
          error: error.message || '이미지 삭제 중 오류 발생'
        });
      }
    }
  }
}
