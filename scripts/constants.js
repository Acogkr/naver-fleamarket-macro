window.CONSTANTS = {
    PATHS: {
        BASIC: '/market-products/new/basic',
        ATTACHMENTS: '/market-products/new/attachments',
        DESCRIPTION: '/market-products/new/description',
        PRICE: '/market-products/new/price',
        DELIVERY: '/market-products/new/delivery',
        PUBLISH_CONFIGS: '/market-products/new/publish-configs',
        CATEGORIES: '/market-products/categories',
        PROPERTIES: '/market-products/product-properties',
        REGION: '/market-products/region',
        CAFE_MENUS: '/market-products/cafe-menus'
    },
    SELECTORS: {
        // ── 안정적 셀렉터 (name / id / placeholder / href 기반 — 배포해도 잘 안 변함) ──
        TITLE: 'textarea[name="title"]',
        PRODUCT_NAME: 'textarea[name="product.name"]',
        PRODUCT_STATUS: 'input[name="productStatus"]',
        DESCRIPTION: 'textarea[name="description"]',
        PRICE_INPUT: 'input[placeholder="원"][inputmode="numeric"]',
        SALE_TYPE: 'input[name="saleType"]',
        NEGOTIATION_CHECKBOX: '#useTransactionOfferInput',
        CROSS_POSTING_CHECKBOX: '#useCrossPostingFleaMarketInput',
        UPLOAD_INPUT: '#uploadInput',
        HAS_CASE: '#hasCase',
        HAS_WARRANTY: '#hasWarranty',
        BOARD_NAME: 'a[href*="/cafe-menus"] span',

        // ── 부분일치 셀렉터 (CSS-module 해시가 바뀌어도 살아남도록 class*= 사용) ──
        CATEGORY_BTN: 'button[class*="btnCategory"] span',
        DELIVERY_FEE_INPUT: 'input[class*="PriceInputField_input"]',
        CATEGORY_UNIT: '[class*="CategoryUnitUi_text"]',
        CATEGORY_TEXT: 'span[class*="CategoryUnitUi_text"]',
        INFO_CHIP: 'a[class*="ProductNewBasicUnitUi_infoChip"]',
        REGION_CHIP: 'span[class*="DsChipUi_text"]',
        REGION_COMPLETE_BTN: 'span[class*="DsButtonUi_wrap"]',
        CAFE_MENU_TEXT: 'span[class*="SelectListButtonUi_mainText"]',
        DIRECT_LOCATION_CHIP: 'div[class*="directTransactionArea"] span[class*="DsChipUi_text"]',
        // 예전엔 setters.js에 완전 해시로 하드코딩돼 있던 것들 → 부분일치로 통합
        PRICE_SALE_TYPE_BOX: '[class*="priceMarketSaleType"]',
        BOTTOM_SHEET: '[class*="BottomSheetUi_container"]',

        // ── 액션 버튼은 클래스 대신 "텍스트"로 찾는다 (utils.clickActionButton 사용).
        //    버튼이 <button>이 아니라 <a>/role=button 인 페이지(basic 등)도 커버하는 후보 집합 ──
        ACTION_BUTTON: 'button, a[class*="DsButtonUi"], [role="button"]'
    },
    // 네이버 페이지에 실제로 표시되는 UI 텍스트(매크로가 찾아 누르는 대상)
    UI_TEXT: {
        NEXT: "다음",
        REGISTER: "등록",
        CONFIRM: "확인",
        COMPLETE: "완료",
        STOP: "그만하기",
        NONE: "없음",
        COURIER_LABEL: "택배로 보낼게요",
        DIRECT_LABEL: "직접 만나서 거래할게요",
        DIRECT_ADD: "직접 추가"
    },
    // 사용자에게 보여줄 알림 문구(toast). 이모지는 넣지 않는다 — 토스트가 타입별
    // 색/아이콘을 자동으로 붙이므로 문구는 평문으로 통일한다.
    MESSAGES: {
        // 페이지(매크로 실행) 측
        MACRO_START: "자동 입력을 시작합니다",
        MACRO_DONE: "자동 입력 완료 — 등록 버튼을 눌러 확인하세요",
        MACRO_ERROR: "입력 중 오류가 발생했습니다",
        PAGE_UNSUPPORTED: "이 페이지에서는 자동 입력을 지원하지 않습니다",
        SAVE_LAST_PAGE_ONLY: "마지막 단계(게시판 선택)에서 저장할 수 있습니다",
        SAVE_NO_DATA: "저장할 데이터가 없습니다. 등록 단계를 진행해 주세요",
        // 팝업(템플릿 관리) 측
        NOT_SUPPORTED_PAGE: "네이버 플리마켓 등록 페이지에서 실행하거나 새로고침해 주세요",
        NO_ACTIVE_TAB: "활성화된 탭을 찾을 수 없습니다",
        TEMPLATE_SAVED: "템플릿을 저장했습니다",
        TEMPLATE_DELETED: "템플릿을 삭제했습니다",
        IMPORT_INVALID: "올바르지 않은 템플릿 형식입니다",
        IMPORT_READ_ERROR: "파일을 읽는 중 오류가 발생했습니다"
    }
};
