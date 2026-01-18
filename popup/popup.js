document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('saveBtn');
    const importBtn = document.getElementById('importBtn');
    const importInput = document.getElementById('importInput');
    const templateList = document.getElementById('templateList');
    const STORAGE_KEY = 'fleamarket_templates';

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

        if (templates.length === 0) {
            templateList.innerHTML = `
                <div style="text-align:center;color:#999;padding:40px 20px;">
                    <div>📂</div>
                    <div style="margin-top:10px;font-size:13px;">저장된 템플릿이 없습니다.</div>
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
                    <div class="template-date">${date}</div>
                </div>
                </div>
                <div class="btn-control-group">
                    <button class="btn-icon btn-export" title="내보내기">저장</button>
                    <button class="btn-icon btn-delete" title="삭제">삭제</button>
                </div>
            `;

            item.addEventListener('mouseenter', () => {
                const previewData = getPreviewData(t.content);

                globalTooltip.innerHTML = previewData.map(d => `
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

            item.querySelector('.info-area').addEventListener('click', async () => {
                if (isProcessing) return;
                isProcessing = true;
                utils.showToast("⏳ 매크로 실행 요청...");

                const timeoutId = setTimeout(() => {
                    if (isProcessing) {
                        isProcessing = false;
                        utils.showToast("⏳ 응답 시간이 초과되었습니다.");
                    }
                }, 3000);

                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab?.id) {
                    chrome.tabs.sendMessage(tab.id, {
                        action: "SET_TEMP_DATA",
                        data: t.content
                    }, (response) => {
                        clearTimeout(timeoutId);
                        if (!isProcessing) return;

                        isProcessing = false;

                        if (chrome.runtime.lastError) {
                            utils.showToast("새로고침 하거나 지원되지 않는 페이지입니다.");
                            return;
                        }

                        if (response && response.error) {
                            utils.showToast(response.error);
                        } else if (response && response.success) {
                            utils.showToast("✅ 입력 완료!");
                        }
                    });
                } else {
                    clearTimeout(timeoutId);
                    isProcessing = false;
                    utils.showToast("활성화된 탭을 찾을 수 없습니다.");
                }
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
            });
        });
    }

    saveBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) return;

        chrome.tabs.sendMessage(tab.id, { action: "GET_TEMP_DATA" }, (response) => {
            if (chrome.runtime.lastError) {
                utils.showToast("페이지를 새로고침하거나 지원되지 않는 페이지입니다.");
                return;
            }

            if (!response) return;

            if (response.error) {
                utils.showToast(response.error);
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
                    utils.showToast("템플릿이 저장되었습니다! 🎉");
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
                    utils.showToast("올바르지 않은 템플릿 형식입니다.")
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
                        utils.showToast(`${imported.length}개의 템플릿을 가져왔습니다.`);
                    });
                });
            } catch (err) {
                utils.showToast("파일을 읽는 중 오류가 발생했습니다.");
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
