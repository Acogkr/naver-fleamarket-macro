window.setters = {
    [CONSTANTS.PATHS.BASIC]: async (data) => {
        document.querySelector(CONSTANTS.SELECTORS.CATEGORY_BTN)?.click();
        await utils.waitForElement(CONSTANTS.SELECTORS.CATEGORY_UNIT);
        await setters[CONSTANTS.PATHS.CATEGORIES](data);
        await utils.wait();

        document.querySelector(CONSTANTS.SELECTORS.INFO_CHIP)?.click();
        await utils.waitForElementByText('button', window.CONSTANTS.UI_TEXT.NONE);
        await setters[CONSTANTS.PATHS.PROPERTIES](data);
        await utils.wait();

        const basicData = data[CONSTANTS.PATHS.BASIC];
        utils.setReactValue(CONSTANTS.SELECTORS.TITLE, basicData.title);
        utils.setReactValue(CONSTANTS.SELECTORS.PRODUCT_NAME, basicData.productName);

        if (basicData.productStatus) {
            await utils.wait(1000);
            utils.setReactChecked(`${CONSTANTS.SELECTORS.PRODUCT_STATUS}[value="${basicData.productStatus}"]`, true);
        }

        await utils.wait(1000)
        await utils.clickByText(CONSTANTS.SELECTORS.NEXT_BUTTON, window.CONSTANTS.UI_TEXT.NEXT);
        await setters[CONSTANTS.PATHS.ATTACHMENTS](data);
    },

    [CONSTANTS.PATHS.CATEGORIES]: async (data) => {
        const categoryData = data[CONSTANTS.PATHS.BASIC].category;
        const paths = typeof categoryData === 'string' ? categoryData.split(' > ') : [];

        for (const name of paths) {
            const target = await utils.clickByText(CONSTANTS.SELECTORS.CATEGORY_TEXT, name.trim());
            if (target) await utils.wait();
        }
        (await utils.waitForElementByText('button', window.CONSTANTS.UI_TEXT.COMPLETE)).click();
    },

    [CONSTANTS.PATHS.PROPERTIES]: async () => {
        const noBrandBtn = utils.clickByText('button', window.CONSTANTS.UI_TEXT.NONE);

        if (noBrandBtn) {
            await utils.wait()
            await utils.clickByText('button', window.CONSTANTS.UI_TEXT.COMPLETE);

            await utils.wait()
            await utils.clickByText('button', window.CONSTANTS.UI_TEXT.STOP) || await utils.clickByText('button', window.CONSTANTS.UI_TEXT.CONFIRM);
        }
    },

    [CONSTANTS.PATHS.ATTACHMENTS]: async (data) => {
        const attachmentData = data[CONSTANTS.PATHS.ATTACHMENTS];
        const fileInput = await utils.waitForElement(CONSTANTS.SELECTORS.UPLOAD_INPUT);

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
            utils.setReactChecked('#hasCase', attachmentData.hasCase);
        }

        const warrantyBtn = document.querySelector('#hasWarranty');
        if (warrantyBtn && warrantyBtn.checked !== attachmentData.hasWarranty) {
            utils.setReactChecked('#hasWarranty', attachmentData.hasWarranty);
        }

        await utils.clickByText('button', window.CONSTANTS.UI_TEXT.NEXT);
        await setters[CONSTANTS.PATHS.DESCRIPTION](data);
    },

    [CONSTANTS.PATHS.DESCRIPTION]: async (data) => {
        const descriptionData = data[CONSTANTS.PATHS.DESCRIPTION];
        await utils.waitForElement(CONSTANTS.SELECTORS.DESCRIPTION);
        await utils.wait();

        utils.setReactValue(CONSTANTS.SELECTORS.DESCRIPTION, descriptionData.description);

        await utils.wait();
        await utils.clickByText('button', window.CONSTANTS.UI_TEXT.NEXT);
        await setters[CONSTANTS.PATHS.PRICE](data);
    },

    [CONSTANTS.PATHS.PRICE]: async (data) => {
        const priceData = data[CONSTANTS.PATHS.PRICE];
        await utils.waitForElement('input[placeholder="원"]');
        utils.setReactValue('input[placeholder="원"]', priceData.price);
        (await utils.waitForElementByText('button', window.CONSTANTS.UI_TEXT.CONFIRM)).click();

        await utils.waitForElement('.productsNew_priceMarketSaleType__51dFb');

        if (priceData.saleType) {
            utils.setReactChecked(`${CONSTANTS.SELECTORS.SALE_TYPE}[value="${priceData.saleType}"]`, true);
            await utils.wait(200);
        }

        const negBtn = document.querySelector(CONSTANTS.SELECTORS.NEGOTIATION_CHECKBOX);
        if (negBtn && negBtn.checked !== priceData.canNegotiate) {
            utils.setReactChecked(CONSTANTS.SELECTORS.NEGOTIATION_CHECKBOX, priceData.canNegotiate);
        }

        const crossBtn = document.querySelector(CONSTANTS.SELECTORS.CROSS_POSTING_CHECKBOX);
        if (crossBtn && crossBtn.checked !== priceData.isCrossPosting) {
            utils.setReactChecked(CONSTANTS.SELECTORS.CROSS_POSTING_CHECKBOX, priceData.isCrossPosting);
        }

        await utils.clickByText(CONSTANTS.SELECTORS.NEXT_BUTTON, window.CONSTANTS.UI_TEXT.NEXT);

        if (priceData.saleType === 'NO_SAFETY') {
            const confirmBtn = await utils.waitForElementByText('.BottomSheetUi_container__CEqYQ button', window.CONSTANTS.UI_TEXT.CONFIRM).catch(() => null);

            if (confirmBtn) {
                confirmBtn.click();
            }
        }

        await setters[CONSTANTS.PATHS.DELIVERY](data);
    },

    [CONSTANTS.PATHS.DELIVERY]: async (data) => {
        const deliveryInfo = data[CONSTANTS.PATHS.DELIVERY];
        const { delivery } = deliveryInfo;

        if (delivery.useCourier) {
            document.evaluate("//span[contains(., '택배')]", document, null, 9, null).singleNodeValue?.click();
        }

        await utils.wait()
        await utils.clickByText(CONSTANTS.SELECTORS.NEXT_BUTTON, window.CONSTANTS.UI_TEXT.NEXT);
        await setters[CONSTANTS.PATHS.PUBLISH_CONFIGS](data);
    },

    [CONSTANTS.PATHS.REGION]: async (data) => {
        const locations = data[CONSTANTS.PATHS.DELIVERY].directTrade.locations;
        for (const fullLoc of locations) {
            const parts = fullLoc.split(' ').filter(t => t.trim() !== "");
            for (const part of parts) {
                const chip = await utils.clickByText(CONSTANTS.SELECTORS.REGION_CHIP, part);
                if (chip) await utils.wait(800);
            }
        }
        (await utils.waitForElementByText('span', window.CONSTANTS.UI_TEXT.COMPLETE)).closest(CONSTANTS.SELECTORS.REGION_COMPLETE_BTN)?.click();
    },

    [CONSTANTS.PATHS.PUBLISH_CONFIGS]: async (data) => {
        await utils.waitForElement(CONSTANTS.SELECTORS.BOARD_NAME);

        const target = data[CONSTANTS.PATHS.PUBLISH_CONFIGS].boardName;
        const currentBoardEl = document.querySelector(CONSTANTS.SELECTORS.BOARD_NAME);

        const currentBoard = currentBoardEl?.innerText.replace(/\s/g, '');
        const targetClean = target?.replace(/\s/g, '');

        if (targetClean && targetClean !== "미선택" && currentBoard !== targetClean) {
            currentBoardEl.closest('a')?.click();

            await utils.wait(1000);
            await setters[CONSTANTS.PATHS.CAFE_MENUS](data);
            await utils.wait(1000);
        }

        await utils.wait();
        utils.showToast(window.CONSTANTS.UI_TEXT.INPUT_COMPLETED);
    },

    [CONSTANTS.PATHS.CAFE_MENUS]: async (data) => {
        const target = data[CONSTANTS.PATHS.PUBLISH_CONFIGS].boardName;
        await utils.waitForElement(CONSTANTS.SELECTORS.CAFE_MENU_TEXT);
        const found = [...document.querySelectorAll(CONSTANTS.SELECTORS.CAFE_MENU_TEXT)].find(el => el.innerText.includes(target));
        if (found) {
            found.closest('button')?.click();
            await utils.wait(500);
            (await utils.waitForElementByText('span', window.CONSTANTS.UI_TEXT.COMPLETE)).closest('button')?.click();
        }
    }
};
