window.CONSTANTS = {
    PATHS: {
        BASIC: '/market-products/new/basic',
        ATTACHMENTS: '/market-products/new/attachments',
        DESCRIPTION: '/market-products/new/description',
        PRICE: '/market-products/new/price',
        DELIVERY: '/market-products/new/delivery',
        PUBLISH_CONFIGS: '/market-products/new/publish-configs',
        CATEGORIES: '/market-products/categories',
        PROPERTIES: '/market-products/product-properties?focusPropertyType=required',
        REGION: '/market-products/region',
        CAFE_MENUS: '/market-products/cafe-menus'
    },
    SELECTORS: {
        TITLE: 'textarea[name="title"]',
        CATEGORY_BTN: 'button[class*="btnCategory"] span',
        PRODUCT_NAME: 'textarea[name="product.name"]',
        PRODUCT_STATUS: 'input[name="productStatus"]',
        DESCRIPTION: 'textarea[name="description"]',
        PRICE_INPUT: 'input[placeholder="원"][inputmode="numeric"]',
        SALE_TYPE: 'input[name="saleType"]',
        NEGOTIATION_CHECKBOX: '#useTransactionOfferInput',
        CROSS_POSTING_CHECKBOX: '#useCrossPostingFleaMarketInput',
        DELIVERY_FEE_INPUT: 'input[class*="PriceInputField_input"]',
        BOARD_NAME: 'a[href*="/cafe-menus"] span',
        UPLOAD_INPUT: '#uploadInput',
        NEXT_BUTTON: 'button.DsButtonUi_grayDefault__2dIoY',
        CONFIRM_BUTTON: 'button'
    },
    UI_TEXT: {
        NEXT: "다음",
        CONFIRM: "확인",
        COMPLETE: "완료",
        STOP: "그만하기",
        NONE: "없음",
        INPUT_COMPLETED: "✅ 입력 완료",
        ERROR_INPUT: "❌ 입력 중 오류가 발생했습니다.",
        NO_SUPPORT: "⚠️ 자동 입력을 지원하지 않는 페이지입니다.",
        COURIER_LABEL: "택배로 보낼게요",
        DIRECT_LABEL: "직접 만나서 거래할게요",
        DIRECT_ADD: "직접 추가"
    }
};
