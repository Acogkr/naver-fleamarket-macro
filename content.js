

window.currentImages = window.currentImages || [];
window.temps = window.temps || {};

document.addEventListener('change', async (event) => {
    if (event.target.id === 'uploadInput') {
        const files = Array.from(event.target.files);
        for (const file of files) {
            const base64 = await window.utils.fileToBase64(file);
            window.currentImages.push(base64);
        }
    }
});

document.addEventListener('click', async (event) => {
    const btn = event.target.closest('button');
    if (btn && btn.innerText.trim() === window.CONSTANTS.UI_TEXT.NEXT) {
        const currentPath = window.location.pathname;
        const extractor = window.extractors[currentPath];
        if (extractor) {
            window.temps[currentPath] = extractor();
        }
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const currentPath = window.location.pathname;

    if (request.action === "GET_TEMP_DATA") {
        if (currentPath === window.CONSTANTS.PATHS.PUBLISH_CONFIGS) {
            const data = window.temps || {};

            if (window.extractors[currentPath]) {
                data[currentPath] = window.extractors[currentPath]();
            }

            if (Object.keys(data).length > 0) {
                sendResponse({ data: data });
                window.currentImages = [];
            } else {
                sendResponse({ data: null, error: "저장할 데이터가 없습니다. 단계를 진행해주세요." });
            }
        } else {
            sendResponse({ data: null, error: "마지막 페이지에서 탬플릿을 저장 할 수 있습니다." });
        }
    }

    else if (request.action === "SET_TEMP_DATA") {
        if (window.setters[currentPath]) {
            window.setters[currentPath](request.data)
                .then(() => {
                    sendResponse({ success: true });
                })
                .catch((err) => {
                    console.error("Error setting data:", err);
                    window.utils.showToast("❌ 입력 중 오류가 발생했습니다.");
                    sendResponse({ error: "입력 중 오류가 발생했습니다." });
                });
        } else {
            window.utils.showToast("⚠️ 자동 입력을 지원하지 않는 페이지입니다.");
            console.error(`정의되지 않은 경로: ${currentPath}`);
            sendResponse({ error: "자동 입력을 지원하지 않는 페이지입니다." });
        }
    }

    return true;
});
