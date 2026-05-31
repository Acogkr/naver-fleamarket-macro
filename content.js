window.currentImages = window.currentImages || [];
window.temps = window.temps || {};

const MSG = window.CONSTANTS.MESSAGES;
const PATHS = window.CONSTANTS.PATHS;

// 사진 업로드 시 base64 로 보관 (템플릿 저장용)
document.addEventListener('change', async (event) => {
    if (event.target.id !== 'uploadInput') return;
    const files = Array.from(event.target.files);
    for (const file of files) {
        try {
            window.currentImages.push(await window.utils.fileToBase64(file));
        } catch (e) {
            console.error('[매크로] 이미지 변환 실패:', e);
        }
    }
});

// 사용자가 "다음"을 누를 때마다 현재 단계 값을 추출해 누적 (템플릿 저장용)
document.addEventListener('click', (event) => {
    const btn = event.target.closest('button');
    if (!btn || btn.innerText.trim() !== window.CONSTANTS.UI_TEXT.NEXT) return;

    const currentPath = window.location.pathname;
    const extractor = window.extractors[currentPath];
    if (!extractor) return;
    try {
        window.temps[currentPath] = extractor();
    } catch (e) {
        console.error('[매크로] 데이터 추출 실패:', currentPath, e);
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const currentPath = window.location.pathname;

    switch (request.action) {
        // 팝업이 "지원되는 페이지인지" 빠르게 확인하는 용도
        case 'PING': {
            sendResponse({ ok: true });
            return true;
        }

        // 현재까지 입력한 값을 템플릿으로 추출
        case 'GET_TEMP_DATA': {
            if (currentPath !== PATHS.PUBLISH_CONFIGS) {
                sendResponse({ error: MSG.SAVE_LAST_PAGE_ONLY });
                return true;
            }
            const data = { ...window.temps };
            if (window.extractors[currentPath]) {
                data[currentPath] = window.extractors[currentPath]();
            }
            if (Object.keys(data).length === 0) {
                sendResponse({ error: MSG.SAVE_NO_DATA });
                return true;
            }
            sendResponse({ data });
            window.currentImages = [];
            return true;
        }

        // 템플릿 값을 현재 페이지에 자동 입력
        case 'SET_TEMP_DATA': {
            const setter = window.setters[currentPath];
            if (!setter) {
                console.warn('[매크로] 정의되지 않은 경로:', currentPath);
                window.utils.showToast(MSG.PAGE_UNSUPPORTED, 'warning');
                sendResponse({ error: MSG.PAGE_UNSUPPORTED });
                return true;
            }
            window.utils.showToast(MSG.MACRO_START, 'info');
            setter(request.data)
                .then(() => sendResponse({ success: true }))
                .catch((err) => {
                    console.error('[매크로] 입력 오류:', err);
                    window.utils.showToast(MSG.MACRO_ERROR, 'error');
                    sendResponse({ error: MSG.MACRO_ERROR });
                });
            return true;
        }

        default:
            return true;
    }
});
