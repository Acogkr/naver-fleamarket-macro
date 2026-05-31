document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('saveBtn');
    const importBtn = document.getElementById('importBtn');
    const importInput = document.getElementById('importInput');
    const templateList = document.getElementById('templateList');
    const STORAGE_KEY = 'fleamarket_templates';
    const M = window.CONSTANTS.MESSAGES;

    let isProcessing = false;

    const loadTemplates = () => {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
            const templates = result[STORAGE_KEY] || [];
            renderTemplates(templates);
        });
    };




    function getPreviewData(content) {
        const basic = content['/market-products/new/basic'] || {};
        const price = content['/market-products/new/price'] || {};
        const delivery = content['/market-products/new/delivery'] || {};

        return [
            { label: '카테고리', value: basic.category || '-' },
            { label: '상품명', value: basic.productName || '-' },
            { label: '가격', value: price.price ? `${parseInt(price.price).toLocaleString()}원` : '-' },
            { label: '거래방식', value: delivery.delivery?.useCourier ? '택배' : '직거래' }
        ];
    }

    function renderTemplates(templates) {
        templateList.innerHTML = '';
        const globalTooltip = document.getElementById('globalTooltip');
        const templateCount = document.getElementById('templateCount');

        templateCount.textContent = templates.length;

        if (templates.length === 0) {
            templateList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📂</div>
                    <div class="empty-state-title">저장된 템플릿이 없습니다</div>
                    <div class="empty-state-desc">네이버 플리마켓 등록 페이지에서<br>'현재 페이지 저장'을 눌러 템플릿을 만들어 보세요</div>
                </div>
            `;
            return;
        }

        templates.forEach((t) => {
            const item = document.createElement('div');
            item.className = 'template-item';

            const date = new Date(t.id).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

            item.innerHTML = `
                <div class="info-area">
                    <div class="template-name" title="${t.title}">${t.title}</div>
                    <div class="template-date">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="9"/>
                            <polyline points="12 7 12 12 15 14"/>
                        </svg>
                        ${date}
                    </div>
                </div>
                <div class="btn-control-group">
                    <button class="btn-icon btn-export" title="JSON으로 내보내기">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                    </button>
                    <button class="btn-icon btn-delete" title="삭제">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6M14 11v6"/>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                    </button>
                </div>
            `;

            item.addEventListener('mouseenter', () => {
                const previewData = getPreviewData(t.content);

                globalTooltip.innerHTML = `<div class="preview-title">미리보기</div>` + previewData.map(d => `
                    <div class="preview-row">
                        <span class="preview-label">${d.label}</span>
                        <span class="preview-value">${d.value}</span>
                    </div>
                `).join('');

                globalTooltip.classList.add('show');
            });

            item.addEventListener('mouseleave', () => {
                globalTooltip.classList.remove('show');
            });

            item.querySelector('.info-area').addEventListener('click', () => {
                if (isProcessing) return;
                isProcessing = true;

                chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
                    if (!tab?.id) {
                        isProcessing = false;
                        utils.showToast(M.NO_ACTIVE_TAB, 'error');
                        return;
                    }
                    // 먼저 PING 으로 "지원되는 페이지(content script 주입됨)"인지 확인한다.
                    chrome.tabs.sendMessage(tab.id, { action: "PING" }, (resp) => {
                        if (chrome.runtime.lastError || !resp || !resp.ok) {
                            isProcessing = false;
                            utils.showToast(M.NOT_SUPPORTED_PAGE, 'error');
                            return;
                        }
                        // 지원되면 데이터를 보내고 팝업을 닫는다. 팝업이 열려 있으면 포커스를
                        // 가져가서 페이지의 execCommand 입력이 폼에 저장되지 않으므로(뒤로 가면 빈칸),
                        // 닫아서 페이지가 포커스를 되찾게 한다. 진행/완료/오류 토스트는 페이지에 표시된다.
                        chrome.tabs.sendMessage(tab.id, { action: "SET_TEMP_DATA", data: t.content });
                        window.close();
                    });
                });
            });

            item.querySelector('.btn-export').addEventListener('click', (e) => {
                e.stopPropagation();
                exportTemplate(t);
            });

            item.querySelector('.btn-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('정말 삭제하시겠습니까?')) {
                    deleteTemplate(t.id);
                }
            });

            templateList.appendChild(item);
        });
    }

    function deleteTemplate(id) {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
            const list = result[STORAGE_KEY] || [];
            const updated = list.filter(t => t.id !== id);
            chrome.storage.local.set({ [STORAGE_KEY]: updated }, () => {
                loadTemplates();
                utils.showToast(M.TEMPLATE_DELETED, 'success');
            });
        });
    }

    saveBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
            utils.showToast(M.NO_ACTIVE_TAB, 'error');
            return;
        }

        chrome.tabs.sendMessage(tab.id, { action: "GET_TEMP_DATA" }, (response) => {
            if (chrome.runtime.lastError || !response) {
                utils.showToast(M.NOT_SUPPORTED_PAGE, 'error');
                return;
            }

            if (response.error) {
                utils.showToast(response.error, 'warning');
                return;
            }

            const currentTemps = response.data;
            chrome.storage.local.get([STORAGE_KEY], (result) => {
                const prev = result[STORAGE_KEY] || [];
                const suggestedTitle = currentTemps['/market-products/new/basic']?.title?.substring(0, 15) || `템플릿 ${prev.length + 1}`;

                const newEntry = {
                    id: Date.now(),
                    title: suggestedTitle,
                    content: currentTemps
                };

                const updated = [newEntry, ...prev];
                chrome.storage.local.set({ [STORAGE_KEY]: updated }, () => {
                    loadTemplates();
                    utils.showToast(M.TEMPLATE_SAVED, 'success');
                });
            });
        });
    });

    importBtn.addEventListener('click', () => {
        importInput.click();
    });

    importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                const newTemplates = Array.isArray(json) ? json : [json];

                if (!newTemplates.every(t => t.title && t.content)) {
                    utils.showToast(M.IMPORT_INVALID, 'error');
                    return;
                }

                const imported = newTemplates.map(t => ({
                    ...t,
                    id: Date.now() + Math.floor(Math.random() * 1000)
                }));

                chrome.storage.local.get([STORAGE_KEY], (result) => {
                    const prev = result[STORAGE_KEY] || [];
                    const updated = [...imported, ...prev];
                    chrome.storage.local.set({ [STORAGE_KEY]: updated }, () => {
                        loadTemplates();
                        utils.showToast(`${imported.length}개의 템플릿을 가져왔습니다`, 'success');
                    });
                });
            } catch (err) {
                utils.showToast(M.IMPORT_READ_ERROR, 'error');
            }
            importInput.value = '';
        };
        reader.readAsText(file);
    });

    function exportTemplate(template) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `template_${template.title.replace(/[\/\\?%*:|"<>]/g, '-')}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    loadTemplates();
});
