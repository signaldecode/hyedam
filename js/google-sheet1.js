const GOOGLE_SHEETS_CONFIG = {
  url: 'https://script.google.com/macros/s/AKfycbyxwUN2As3VKXkvq7sur20WKBhkv6-SF4x0ZSt1Ny2RJwNB0CewhISnUJZplS8teTxv/exec',
  tableName: '이벤트1',
  timeout: 10000
};


function formatTimestamp(isoString) {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 구글 시트에 데이터 전송 (JSONP 방식 - CORS 문제 해결)
 */
async function submitToGoogleSheets(formData) {
  try {
    console.log('폼 데이터 전송 중:', formData);
    
    // URL 설정 확인
    if (!GOOGLE_SHEETS_CONFIG.url || GOOGLE_SHEETS_CONFIG.url.includes('YOUR_SCRIPT_ID')) {
      throw new Error('구글 시트 URL이 설정되지 않았습니다. google-sheets.js에서 URL을 업데이트하세요.');
    }
    
    // 시트 데이터 준비
    // - Apps Script가 필요한 컬럼만 뽑아 쓰도록, formData를 그대로 넘긴다.
    // - timestamp만 표시용 포맷으로 정규화
    const sheetData = {
      ...formData,
      timestamp: formatTimestamp(formData.timestamp || new Date().toISOString()),
      name: formData.name || '',
      phonenumber: formData.phonenumber || '',
      concern: formData.concern || '',
      contact_method: formData.contact_method || '',
    };

    console.log('시트 데이터 준비 완료:', sheetData);

    // GET 요청용 파라미터 생성
    const params = new URLSearchParams({
      action: 'insert',
      table: GOOGLE_SHEETS_CONFIG.tableName,
      data: JSON.stringify(sheetData)
    });

    const requestUrl = `${GOOGLE_SHEETS_CONFIG.url}?${params.toString()}`;

    // JSONP를 사용한 크로스 오리진 요청 (CORS 문제 해결)
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const callbackName = `callback_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      
      // 콜백 함수 설정
      window[callbackName] = function(response) {
        console.log('구글 시트 응답:', response);
        document.head.removeChild(script);
        delete window[callbackName];
        
        if (response && response.success === true) {
          resolve(response);
        } else {
          const errorMessage = response.error || response.message || JSON.stringify(response);
          reject(new Error(`구글 시트 오류: ${errorMessage}`));
        }
      };

      // 스크립트 에러 처리
      script.onerror = function() {
        document.head.removeChild(script);
        delete window[callbackName];
        reject(new Error('구글 시트 스크립트 로드 실패'));
      };

      // 콜백 파라미터와 함께 스크립트 소스 설정
      script.src = `${requestUrl}&callback=${callbackName}`;
      document.head.appendChild(script);

      // 타임아웃 처리 (10초)
      setTimeout(() => {
        if (window[callbackName]) {
          document.head.removeChild(script);
          delete window[callbackName];
          reject(new Error('요청 시간 초과 - 구글 시트 요청이 너무 오래 걸립니다'));
        }
      }, GOOGLE_SHEETS_CONFIG.timeout);
    });

  } catch (error) {
    console.error('구글 시트 전송 오류:', error);
    throw new Error('구글 시트 데이터 전송 실패');
  }
}

// 전역 함수로 사용 가능하게 설정
window.submitToGoogleSheets = submitToGoogleSheets;
