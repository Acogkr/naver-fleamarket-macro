window.extractors = {
    [CONSTANTS.PATHS.BASIC]: () => ({
        title: document.querySelector(CONSTANTS.SELECTORS.TITLE)?.value || "미입력",
        category: document.querySelector(CONSTANTS.SELECTORS.CATEGORY_BTN)?.innerText || "미선택",
        productName: document.querySelector(CONSTANTS.SELECTORS.PRODUCT_NAME)?.value || "미입력",
        productStatus: document.querySelector(`${CONSTANTS.SELECTORS.PRODUCT_STATUS}:checked`)?.value || "미선택",
    }),

    [CONSTANTS.PATHS.ATTACHMENTS]: () => ({
        images: [...(window.currentImages || [])],
        hasCase: document.querySelector(CONSTANTS.SELECTORS.HAS_CASE)?.checked || false,
        hasWarranty: document.querySelector(CONSTANTS.SELECTORS.HAS_WARRANTY)?.checked || false
    }),

    [CONSTANTS.PATHS.DESCRIPTION]: () => ({
        description: document.querySelector(CONSTANTS.SELECTORS.DESCRIPTION)?.value || "미입력"
    }),

    [CONSTANTS.PATHS.PRICE]: () => ({
        price: document.querySelector(CONSTANTS.SELECTORS.PRICE_INPUT)?.value || "0",
        saleType: document.querySelector(`${CONSTANTS.SELECTORS.SALE_TYPE}:checked`)?.value,
        canNegotiate: document.querySelector(CONSTANTS.SELECTORS.NEGOTIATION_CHECKBOX)?.checked || false,
        isCrossPosting: document.querySelector(CONSTANTS.SELECTORS.CROSS_POSTING_CHECKBOX)?.checked || false
    }),

    [CONSTANTS.PATHS.DELIVERY]: () => {
        const allLabels = [...document.querySelectorAll('label')];
        const courierLabel = allLabels.find(el => el.innerText.includes(window.CONSTANTS.UI_TEXT.COURIER_LABEL));
        const directLabel = allLabels.find(el => el.innerText.includes(window.CONSTANTS.UI_TEXT.DIRECT_LABEL));

        const isCourierChecked = courierLabel?.getAttribute('class')?.includes('isChecked') || false;
        const isDirectChecked = directLabel?.getAttribute('class')?.includes('isChecked') || false;

        const selectedTab = document.querySelector('[role="tab"][aria-selected="true"]');
        const feeInput = document.querySelector(CONSTANTS.SELECTORS.DELIVERY_FEE_INPUT);

        const locationChips = Array.from(
            document.querySelectorAll(CONSTANTS.SELECTORS.DIRECT_LOCATION_CHIP),
            el => el.innerText.trim()
        ).filter(text => text !== window.CONSTANTS.UI_TEXT.DIRECT_ADD);

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

    [CONSTANTS.PATHS.PUBLISH_CONFIGS]: () => ({
        boardName: document.querySelector(CONSTANTS.SELECTORS.BOARD_NAME)?.innerText.trim() || "미선택"
    })
};
