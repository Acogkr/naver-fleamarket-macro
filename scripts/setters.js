const S = window.CONSTANTS.SELECTORS;
const T = window.CONSTANTS.UI_TEXT;
const P = window.CONSTANTS.PATHS;
const M = window.CONSTANTS.MESSAGES;

// 어느 단계에서 무엇을 하고 있는지 콘솔에 남긴다. (실패 시 원인 추적용)
const log = (...args) => console.log('[매크로]', ...args);

window.setters = {
    [P.BASIC]: async (data) => {
        log('basic 단계 시작');
        document.querySelector(S.CATEGORY_BTN)?.click();
        await utils.waitForElement(S.CATEGORY_UNIT);
        await setters[P.CATEGORIES](data);
        await utils.wait();

        document.querySelector(S.INFO_CHIP)?.click();
        await utils.waitForElementByText('button', T.NONE);
        await setters[P.PROPERTIES](data);
        await utils.wait();

        const basicData = data[P.BASIC];
        await utils.setReactValue(S.TITLE, basicData.title);
        await utils.setReactValue(S.PRODUCT_NAME, basicData.productName);

        if (basicData.productStatus) {
            await utils.wait(1000);
            utils.setReactChecked(`${S.PRODUCT_STATUS}[value="${basicData.productStatus}"]`, true);
        }

        await utils.wait(1000);
        await utils.clickActionButton(T.NEXT);
        await setters[P.ATTACHMENTS](data);
    },

    [P.CATEGORIES]: async (data) => {
        log('카테고리 선택');
        const categoryData = data[P.BASIC].category;
        const paths = typeof categoryData === 'string' ? categoryData.split(' > ') : [];

        for (const name of paths) {
            const target = await utils.clickByText(S.CATEGORY_TEXT, name.trim());
            if (target) await utils.wait();
        }
        (await utils.waitForElementByText('button', T.COMPLETE)).click();
    },

    [P.PROPERTIES]: async () => {
        log('상품 속성(브랜드 등) 처리');
        const noBrandBtn = utils.clickByText('button', T.NONE);

        if (noBrandBtn) {
            await utils.wait();
            await utils.clickByText('button', T.COMPLETE);

            await utils.wait();
            await utils.clickByText('button', T.STOP) || await utils.clickByText('button', T.CONFIRM);
        }
    },

    [P.ATTACHMENTS]: async (data) => {
        log('사진/부가정보 단계 시작');
        const attachmentData = data[P.ATTACHMENTS];
        const fileInput = await utils.waitForElement(S.UPLOAD_INPUT);

        if (attachmentData.images && attachmentData.images.length > 0) {
            const dataTransfer = new DataTransfer();

            for (let i = 0; i < attachmentData.images.length; i++) {
                try {
                    const res = await fetch(attachmentData.images[i]);
                    const blob = await res.blob();
                    const file = new File([blob], `image_${i}.png`, { type: "image/png" });
                    dataTransfer.items.add(file);
                } catch (e) {
                    console.error(`[매크로] 사진 ${i}번 변환 실패:`, e);
                }
            }

            fileInput.files = dataTransfer.files;
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));

            await utils.wait(1500);
        }

        const caseBtn = document.querySelector(S.HAS_CASE);
        if (caseBtn && caseBtn.checked !== attachmentData.hasCase) {
            utils.setReactChecked(S.HAS_CASE, attachmentData.hasCase);
        }

        const warrantyBtn = document.querySelector(S.HAS_WARRANTY);
        if (warrantyBtn && warrantyBtn.checked !== attachmentData.hasWarranty) {
            utils.setReactChecked(S.HAS_WARRANTY, attachmentData.hasWarranty);
        }

        await utils.clickActionButton(T.NEXT);
        await setters[P.DESCRIPTION](data);
    },

    [P.DESCRIPTION]: async (data) => {
        log('설명 단계 시작');
        const descriptionData = data[P.DESCRIPTION];
        await utils.waitForElement(S.DESCRIPTION);
        await utils.wait();

        await utils.setReactValue(S.DESCRIPTION, descriptionData.description);

        await utils.wait();
        await utils.clickActionButton(T.NEXT);
        await setters[P.PRICE](data);
    },

    [P.PRICE]: async (data) => {
        log('가격 단계 시작');
        const priceData = data[P.PRICE];
        await utils.waitForElement('input[placeholder="원"]');
        await utils.setReactValue('input[placeholder="원"]', priceData.price);
        (await utils.waitForElementByText('button', T.CONFIRM)).click();

        await utils.waitForElement(S.PRICE_SALE_TYPE_BOX);

        if (priceData.saleType) {
            utils.setReactChecked(`${S.SALE_TYPE}[value="${priceData.saleType}"]`, true);
            await utils.wait(200);
        }

        const negBtn = document.querySelector(S.NEGOTIATION_CHECKBOX);
        if (negBtn && negBtn.checked !== priceData.canNegotiate) {
            utils.setReactChecked(S.NEGOTIATION_CHECKBOX, priceData.canNegotiate);
        }

        // 다른 마켓 동시 등록 체크박스 — 계정/조건에 따라 아예 안 보일 수 있으므로 있을 때만 처리
        const crossBtn = document.querySelector(S.CROSS_POSTING_CHECKBOX);
        if (crossBtn && crossBtn.checked !== priceData.isCrossPosting) {
            utils.setReactChecked(S.CROSS_POSTING_CHECKBOX, priceData.isCrossPosting);
        } else if (!crossBtn) {
            log('동시등록 체크박스가 이 페이지에 없어 건너뜀');
        }

        await utils.clickActionButton(T.NEXT);

        if (priceData.saleType === 'NO_SAFETY') {
            const confirmBtn = await utils.waitForElementByText(`${S.BOTTOM_SHEET} button`, T.CONFIRM).catch(() => null);
            if (confirmBtn) confirmBtn.click();
        }

        await setters[P.DELIVERY](data);
    },

    [P.DELIVERY]: async (data) => {
        log('배송/거래방식 단계 시작');
        const { delivery } = data[P.DELIVERY];

        // 택배 선택. 이 항목은 내부 input 없는 Switch 라 라벨 click 으로만 토글되고,
        // 켜지면 class 에 isChecked(SwitchUi_isChecked__...) 가 붙는다. 기본값은 "둘 다 꺼짐"
        // 이라 반드시 능동적으로 켜야 하며, 클릭이 한 번에 안 먹을 수 있으므로
        // 실제로 isChecked 가 붙을 때까지 재시도 + 검증한다. (안 켜지면 직거래로 제출돼 400)
        if (delivery.useCourier) {
            const getCourier = () => [...document.querySelectorAll('label')]
                .find(el => el.innerText.includes(T.COURIER_LABEL));
            const isOn = (el) => (el?.getAttribute('class') || '').includes('isChecked');

            await utils.waitForElementByText('label', T.COURIER_LABEL).catch(() => null);

            let courier = getCourier();
            for (let i = 0; i < 6; i++) {
                courier = getCourier();
                if (!courier) { await utils.wait(300); continue; }
                if (isOn(courier)) break;
                courier.click();
                await utils.wait(400);
            }

            if (!courier) {
                console.warn('[매크로] "택배로 보낼게요" 항목을 찾지 못했습니다.');
            } else if (!isOn(courier)) {
                console.warn('[매크로] 택배 선택이 끝내 반영되지 않았습니다.');
            } else {
                log('택배 선택 완료');
            }
        }

        await utils.wait();
        await utils.clickActionButton(T.NEXT);
        await setters[P.PUBLISH_CONFIGS](data);
    },

    [P.REGION]: async (data) => {
        const locations = data[P.DELIVERY].directTrade.locations;
        for (const fullLoc of locations) {
            const parts = fullLoc.split(' ').filter(t => t.trim() !== "");
            for (const part of parts) {
                const chip = await utils.clickByText(S.REGION_CHIP, part);
                if (chip) await utils.wait(800);
            }
        }
        (await utils.waitForElementByText('span', T.COMPLETE)).closest(S.REGION_COMPLETE_BTN)?.click();
    },

    [P.PUBLISH_CONFIGS]: async (data) => {
        log('게시판/공개설정 단계 시작');
        await utils.waitForElement(S.BOARD_NAME);

        const target = data[P.PUBLISH_CONFIGS].boardName;
        const currentBoardEl = document.querySelector(S.BOARD_NAME);

        const currentBoard = currentBoardEl?.innerText.replace(/\s/g, '');
        const targetClean = target?.replace(/\s/g, '');

        if (targetClean && targetClean !== "미선택" && currentBoard !== targetClean) {
            currentBoardEl.closest('a')?.click();

            await utils.wait(1000);
            await setters[P.CAFE_MENUS](data);
            await utils.wait(1000);
        }

        await utils.wait();
        utils.showToast(M.MACRO_DONE, 'success');
        log('자동 입력 완료 (등록 버튼은 직접 눌러 확인하세요)');
    },

    [P.CAFE_MENUS]: async (data) => {
        log('게시판(카페 메뉴) 선택');
        const target = data[P.PUBLISH_CONFIGS].boardName;
        await utils.waitForElement(S.CAFE_MENU_TEXT);
        const found = [...document.querySelectorAll(S.CAFE_MENU_TEXT)].find(el => el.innerText.includes(target));
        if (found) {
            found.closest('button')?.click();
            await utils.wait(500);
            (await utils.waitForElementByText('span', T.COMPLETE)).closest('button')?.click();
        }
    }
};
