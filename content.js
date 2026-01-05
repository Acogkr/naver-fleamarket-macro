// records...
let currentImages = [];

const temps = {};
const extractors = {
    '/market-products/new/basic': () => ({
        title: document.querySelector('textarea[name="title"]')?.value || "미입력",
        category: document.querySelector('button[class*="btnCategory"] span')?.innerText || "미선택",
        productName: document.querySelector('textarea[name="product.name"]')?.value || "미입력",
        productStatus: document.querySelector('input[name="productStatus"]:checked')?.value || "미선택",
    }),

    '/market-products/new/attachments': () => ({
        images: [...currentImages],
        hasCase: document.querySelector('#hasCase')?.checked || false,
        hasWarranty: document.querySelector('#hasWarranty')?.checked || false
    }),

    '/market-products/new/description': () => ({
        description: document.querySelector('textarea[name="description"]')?.value || "미입력"
    }),

    '/market-products/new/price': () => ({
        price: document.querySelector('input[placeholder="원"][inputmode="numeric"]')?.value || "0",
        saleType: document.querySelector('input[name="saleType"]:checked')?.value,
        canNegotiate: document.querySelector('#useTransactionOfferInput')?.checked || false,
        isCrossPosting: document.querySelector('#useCrossPostingFleaMarketInput')?.checked || false
    }),

    '/market-products/new/delivery': () => {
        const allLabels = [...document.querySelectorAll('label')];
        const courierLabel = allLabels.find(el => el.innerText.includes("택배로 보낼게요"));
        const directLabel = allLabels.find(el => el.innerText.includes("직접 만나서 거래할게요"));

        const isCourierChecked = courierLabel?.getAttribute('class')?.includes('isChecked') || false;
        const isDirectChecked = directLabel?.getAttribute('class')?.includes('isChecked') || false;

        const selectedTab = document.querySelector('[role="tab"][aria-selected="true"]');
        const feeInput = document.querySelector('input[class*="PriceInputField_input"]');

        const locationChips = Array.from(
            document.querySelectorAll('div[class*="directTransactionArea"] span[class*="DsChipUi_text"]'),
            el => el.innerText.trim()
        ).filter(text => text !== "직접 추가");

        return {
            delivery: {
                useCourier: isCourierChecked,
                feePayer: selectedTab?.innerText.trim() || "미선택",
                fee: (feeInput?.value || "0").replace(/[^0-9]/g, ''),
            },
            directTrade: {
                useDirect: isDirectChecked,
                locations: locationChips
            }
        };
    },

    '/market-products/new/publish-configs': () => ({
        boardName: document.querySelector('a[href*="/cafe-menus"] span')?.innerText.trim() || "미선택"
    })
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

document.addEventListener('change', async (event) => {
    if (event.target.id === 'uploadInput') {
        const files = Array.from(event.target.files);
        for (const file of files) {
            const base64 = await fileToBase64(file);
            currentImages.push(base64);
        }
    }
});

document.addEventListener('click', async (event) => {
    const btn = event.target.closest('button');
    if (btn && btn.innerText.trim() === '다음') {
        const currentPath = window.location.pathname;
        const extractor = extractors[currentPath]
        temps[currentPath] = extractor();
    }
});

// macros..
const utils = {
    wait: async (ms = 500) => new Promise(r => setTimeout(r, ms)),

    clickByText: async (selector, text) => {
        const el = [...document.querySelectorAll(selector)]
            .find(node => node.innerText.trim().includes(text));

        if (el) {
            const target = el.closest('button') || el.closest('label') || el;
            target.click();
        }
        return el;
    },

    setReactValue: (selector, val) => {
        const el = document.querySelector(selector);
        if (!el) return;

        el.focus();
        el.click();

        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
            'value'
        ).set;

        nativeInputValueSetter.call(el, val);

        const inputEvent = new Event('input', { bubbles: true });
        el.dispatchEvent(inputEvent);

        const changeEvent = new Event('change', { bubbles: true });
        el.dispatchEvent(changeEvent);

        el.blur();
    },

    waitForElement: async (selector, timeout = 5000) => {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const timer = setInterval(() => {
                const el = document.querySelector(selector);
                if (el) {
                    clearInterval(timer);
                    resolve(el);
                } else if (Date.now() - startTime > timeout) {
                    clearInterval(timer);
                    reject(new Error(`시간 초과: ${selector}`));
                }
            }, 50);
        });
    },

    waitForElementByText: async (selector, text, timeout = 5000) => {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const timer = setInterval(() => {
                const el = [...document.querySelectorAll(selector)]
                    .find(node => node.innerText.trim().includes(text));

                if (el) {
                    clearInterval(timer);
                    resolve(el);
                } else if (Date.now() - startTime > timeout) {
                    clearInterval(timer);
                    reject(new Error(`시간 초과: "${text}"`));
                }
            }, 100);
        });
    },

    showToast: (text) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.75);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            z-index: 10000;
            font-size: 14px;
            pointer-events: none;
            transition: opacity 0.3s;
        `;
        overlay.innerText = text;
        document.body.appendChild(overlay);

        setTimeout(() => {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        }, 2000);
    },
};

const setters = {
    '/market-products/new/basic': async (data) => {
        document.querySelector('.ProductNewBasicUnitUi_btnCategory__Jz2KE')?.click();
        await utils.waitForElement('.CategoryUnitUi_text__lwXDX');
        await setters['/market-products/categories'](data);
        await utils.wait();

        document.querySelector('a.ProductNewBasicUnitUi_infoChip___DWMr')?.click();
        await utils.waitForElementByText('button', "없음");
        await setters['/market-products/product-properties?focusPropertyType=required'](data);
        await utils.wait();

        const basicData = data['/market-products/new/basic'];
        utils.setReactValue('textarea[name="title"]', basicData.title);
        utils.setReactValue('textarea[name="product.name"]', basicData.productName);

        if (basicData.productStatus) {
            document.querySelector(`input[name="productStatus"][value="${basicData.productStatus}"]`)?.click();
        }

        await utils.wait()
        await utils.clickByText('button.DsButtonUi_grayDefault__2dIoY', "다음");
        await setters['/market-products/new/attachments'](data);
    },

    '/market-products/categories': async (data) => {
        const categoryData = data['/market-products/new/basic'].category;

        const paths = typeof categoryData === 'string' ? categoryData.split(' > ') : [];

        for (const name of paths) {
            const target = await utils.clickByText('span.CategoryUnitUi_text__lwXDX', name.trim());
            if (target) await utils.wait();
        }
        (await utils.waitForElementByText('button', "완료")).click();
    },

    '/market-products/product-properties?focusPropertyType=required': async () => {
        const noBrandBtn = utils.clickByText('button', "없음");

        if (noBrandBtn) {
            await utils.wait()
            await utils.clickByText('button', "완료");

            await utils.wait()
            await utils.clickByText('button', "그만하기") || await utils.clickByText('button', "확인");
        }
    },

    '/market-products/new/attachments': async (data) => {
        const attachmentData = data['/market-products/new/attachments'];
        const fileInput = await utils.waitForElement('#uploadInput');

        if (attachmentData.images && attachmentData.images.length > 0) {
            const dataTransfer = new DataTransfer();

            for (let i = 0; i < attachmentData.images.length; i++) {
                try {
                    const res = await fetch(attachmentData.images[i]);
                    const blob = await res.blob();
                    const file = new File([blob], `image_${i}.png`, { type: "image/png" });
                    dataTransfer.items.add(file);
                } catch (e) {
                    console.error(`사진 ${i}번 변환 실패:`, e);
                }
            }

            fileInput.files = dataTransfer.files;
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));

            await utils.wait(1500);
        }

        const caseBtn = document.querySelector('#hasCase');
        if (caseBtn && caseBtn.checked !== attachmentData.hasCase) {
            caseBtn.click();
        }

        const warrantyBtn = document.querySelector('#hasWarranty');
        if (warrantyBtn && warrantyBtn.checked !== attachmentData.hasWarranty) {
            warrantyBtn.click();
        }

        await utils.clickByText('button', "다음");
        await setters['/market-products/new/description'](data);
    },

    '/market-products/new/description': async (data) => {
        const descriptionData = data['/market-products/new/description'];
        await utils.waitForElement('textarea[name="description"]');
        await utils.wait();

        utils.setReactValue('textarea[name="description"]', descriptionData.description);

        await utils.wait();
        await utils.clickByText('button', "다음");
        await setters['/market-products/new/price'](data);
    },

    '/market-products/new/price': async (data) => {
        const priceData = data['/market-products/new/price'];
        await utils.waitForElement('input[placeholder="원"]');
        utils.setReactValue('input[placeholder="원"]', priceData.price);
        (await utils.waitForElementByText('button', "확인")).click();

        await utils.waitForElement('.productsNew_priceMarketSaleType__51dFb');

        if (priceData.saleType) {
            const saleTypeBtn = document.querySelector(`input[name="saleType"][value="${priceData.saleType}"]`);
            saleTypeBtn?.click();
            await utils.wait(200);
        }

        const negBtn = document.querySelector('#useTransactionOfferInput');
        if (negBtn && negBtn.checked !== priceData.canNegotiate) {
            negBtn.click();
        }

        const crossBtn = document.querySelector('#useCrossPostingFleaMarketInput');
        if (crossBtn && crossBtn.checked !== priceData.isCrossPosting) {
            crossBtn.click();
        }

        await utils.clickByText('button.DsButtonUi_grayDefault__2dIoY', "다음");

        if (priceData.saleType === 'NO_SAFETY') {
            const confirmBtn = await utils.waitForElementByText('.BottomSheetUi_container__CEqYQ button', "확인").catch(() => null);

            if (confirmBtn) {
                confirmBtn.click();
            }
        }

        await setters['/market-products/new/delivery'](data);
    },

    '/market-products/new/delivery': async (data) => {
        const deliveryInfo = data['/market-products/new/delivery'];
        const { delivery, directTrade } = deliveryInfo;

        if (delivery.useCourier) {
            document.evaluate("//span[contains(., '택배')]", document, null, 9, null).singleNodeValue?.click();
        }

        await utils.wait()
        await utils.clickByText('button.DsButtonUi_grayDefault__2dIoY', "다음");
        await setters['/market-products/new/publish-configs'](data);
    },

    '/market-products/region': async (data) => { // 테스트 필요
        const locations = data['/market-products/new/delivery'].directTrade.locations;
        for (const fullLoc of locations) {
            const parts = fullLoc.split(' ').filter(t => t.trim() !== "");
            for (const part of parts) {
                const chip = await utils.clickByText('span[class*="DsChipUi_text"]', part);
                if (chip) await utils.wait(800);
            }
        }
        (await utils.waitForElementByText('span', "완료")).closest('span[class*="DsButtonUi_wrap"]')?.click();
    },

    '/market-products/new/publish-configs': async (data) => {
        await utils.waitForElement('a[href*="/cafe-menus"] span');

        const target = data['/market-products/new/publish-configs'].boardName;
        const currentBoardEl = document.querySelector('a[href*="/cafe-menus"] span');

        const currentBoard = currentBoardEl?.innerText.replace(/\s/g, '');
        const targetClean = target?.replace(/\s/g, '');

        if (targetClean && targetClean !== "미선택" && currentBoard !== targetClean) {
            currentBoardEl.closest('a')?.click();

            await utils.wait(1000);
            await setters['/market-products/cafe-menus'](data);
            await utils.wait(1000);
        }

        await utils.wait();
        utils.showToast("✅ 입력 완료");
    },

    '/market-products/cafe-menus': async (data) => {
        const target = data['/market-products/new/publish-configs'].boardName;
        await utils.waitForElement('span[class*="SelectListButtonUi_mainText"]');
        const found = [...document.querySelectorAll('span[class*="SelectListButtonUi_mainText"]')].find(el => el.innerText.includes(target));
        if (found) {
            found.closest('button')?.click();
            await utils.wait(500);
            (await utils.waitForElementByText('span', "완료")).closest('button')?.click();
        }
    }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const currentPath = window.location.pathname;

    if (request.action === "GET_TEMP_DATA") {
        if (currentPath === '/market-products/new/publish-configs') {
            const data = temps || {};

            const currentPath = window.location.pathname;
            if (extractors[currentPath]) {
                data[currentPath] = extractors[currentPath]();
            }

            if (Object.keys(data).length > 0) {
                sendResponse({ data: data });
                currentImages = []
            } else {
                sendResponse({ data: null, error: "저장할 데이터가 없습니다. 단계를 진행해주세요." });
            }
        } else {
            sendResponse({ data: null, error: "마지막 페이지에서 탬플릿을 저장 할 수 있습니다." });
        }
    }

    else if (request.action === "SET_TEMP_DATA") {
        sendResponse({ success: true });

        if (setters[currentPath]) {
            setters[currentPath](request.data).catch((err) => {
                console.error(err);
            });
        } else {
            utils.showToast("⚠️ 자동 입력을 지원하지 않는 페이지입니다.");
            console.error(`정의되지 않은 경로입니다: ${currentPath}`);
        }
    }

    return true;
});

