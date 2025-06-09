/**
 * 이미지 업로드 및 관리 모듈
 */

// 업로드된 이미지를 저장할 임시 배열 (실제로는 서버에 업로드됩니다)
const uploadedImages = new Map();

/**
 * 이미지 파일을 서버에 업로드합니다
 * @param {File} file - 업로드할 이미지 파일
 * @returns {Promise<{imageUrl: string, fileName: string}>} 업로드 결과
 */
export async function uploadImage(file) {
  console.log('[imageUpload] 이미지 업로드 시작:', file.name);
  
  // 파일 유효성 검사
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('유효한 이미지 파일이 아닙니다.');
  }
  
  // 파일 크기 제한 (5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('파일 크기가 5MB를 초과합니다.');
  }
  
  try {
    // 파일을 Base64로 변환
    const base64Data = await fileToBase64(file);
    
    // 임시 URL 생성 (실제 구현에서는 서버 API 호출)
    const imageUrl = URL.createObjectURL(file);
    const fileName = file.name;
    
    // 업로드된 이미지 정보 저장
    const imageInfo = {
      imageUrl,
      fileName,
      file,
      base64Data,
      uploadTime: new Date().toISOString()
    };
    
    uploadedImages.set(imageUrl, imageInfo);
    
    console.log('[imageUpload] 업로드 성공:', imageInfo);
    
    // 실제 서버 업로드는 여기서 구현
    // const response = await fetch('/api/upload-image', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     fileName: file.name,
    //     fileData: base64Data,
    //     fileType: file.type
    //   })
    // });
    
    return {
      imageUrl,
      fileName
    };
    
  } catch (error) {
    console.error('[imageUpload] 업로드 실패:', error);
    throw new Error('이미지 업로드에 실패했습니다: ' + error.message);
  }
}

/**
 * 업로드된 이미지를 삭제합니다
 * @param {string} imageUrl - 삭제할 이미지 URL
 * @returns {Promise<boolean>} 삭제 성공 여부
 */
export async function deleteImage(imageUrl) {
  console.log('[imageUpload] 이미지 삭제 시작:', imageUrl);
  
  try {
    // 임시 저장된 이미지 정보 확인
    const imageInfo = uploadedImages.get(imageUrl);
    if (!imageInfo) {
      console.warn('[imageUpload] 삭제할 이미지를 찾을 수 없음:', imageUrl);
      return false;
    }
    
    // 메모리에서 제거
    uploadedImages.delete(imageUrl);
    
    // URL 객체 해제
    if (imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl);
    }
    
    // 실제 서버에서 삭제는 여기서 구현
    // const response = await fetch('/api/delete-image', {
    //   method: 'DELETE',
    //   headers: {
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     imageUrl
    //   })
    // });
    
    console.log('[imageUpload] 삭제 성공:', imageUrl);
    return true;
    
  } catch (error) {
    console.error('[imageUpload] 삭제 실패:', error);
    throw new Error('이미지 삭제에 실패했습니다: ' + error.message);
  }
}

/**
 * 업로드된 모든 이미지 목록을 반환합니다
 * @returns {Array<{imageUrl: string, fileName: string}>} 이미지 목록
 */
export function getUploadedImages() {
  return Array.from(uploadedImages.values()).map(info => ({
    imageUrl: info.imageUrl,
    fileName: info.fileName
  }));
}

/**
 * 특정 이미지의 정보를 반환합니다
 * @param {string} imageUrl - 이미지 URL
 * @returns {Object|null} 이미지 정보
 */
export function getImageInfo(imageUrl) {
  return uploadedImages.get(imageUrl) || null;
}

/**
 * 파일을 Base64 문자열로 변환합니다
 * @param {File} file - 변환할 파일
 * @returns {Promise<string>} Base64 문자열
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // "data:image/jpeg;base64," 부분을 제거하고 순수 base64만 반환
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 이미지 파일 유효성을 검사합니다
 * @param {File} file - 검사할 파일
 * @returns {boolean} 유효성 여부
 */
export function validateImageFile(file) {
  if (!file) return false;
  
  // 파일 타입 검사
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return false;
  }
  
  // 파일 크기 검사 (5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return false;
  }
  
  return true;
}

/**
 * 이미지 미리보기 URL을 생성합니다
 * @param {File} file - 이미지 파일
 * @returns {string} 미리보기 URL
 */
export function createPreviewUrl(file) {
  return URL.createObjectURL(file);
}

/**
 * 메모리 정리 - 모든 임시 URL과 저장된 이미지 정보를 제거합니다
 */
export function cleanup() {
  console.log('[imageUpload] 메모리 정리 시작');
  
  for (const [imageUrl, imageInfo] of uploadedImages) {
    if (imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl);
    }
  }
  
  uploadedImages.clear();
  console.log('[imageUpload] 메모리 정리 완료');
} 