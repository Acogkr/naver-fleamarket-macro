document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('saveBtn');
    const importBtn = document.getElementById('importBtn');
    const importInput = document.getElementById('importInput');
    const templateList = document.getElementById('templateList');
    const STORAGE_KEY = 'naver-fleamarket-templates';

    const loadTemplates = () => {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
            const templates = result[STORAGE_KEY] || [];
            renderTemplates(templates);
        });
    };

    const showToast = (text) => {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            white-space: nowrap;
            z-index: 1000;
            pointer-events: none;
            transition: opacity 0.3s;
        `;
        toast.innerText = text;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 1500);
    };

    function renderTemplates(templates) {
        templateList.innerHTML = '';

        if (templates.length === 0) {
            templateList.innerHTML = '<div style="text-align:center;color:#ccc;padding:20px;">저장된 템플릿이 없습니다.</div>';
            return;
        }

        templates.forEach((t) => {
            const item = document.createElement('div');
            item.className = 'template-item';

            item.innerHTML = `
                <div class="info-area">
                    <div class="template-name">${t.title}</div>
                </div>
                <div class="btn-control-group">
                    <button class="btn-icon btn-export" title="내보내기">저장</button>
                    <button class="btn-icon btn-delete" title="삭제">삭제</button>
                </div>
            `;

            item.querySelector('.info-area').addEventListener('click', async () => {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab?.id) {
                    chrome.tabs.sendMessage(tab.id, {
                        action: "SET_TEMP_DATA",
                        data: t.content
                    }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.error(chrome.runtime.lastError);
                            return;
                        }

                        if (response && response.error) {
                            showToast(response.error);
                        }
                    });
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

        chrome.tabs.sendMessage(tab.id, { action: "GET_TEMP_DATA" }, (response) => {
            if (chrome.runtime.lastError || !response) return;

            if (response.error) {
                showToast(response.error);
                return;
            }

            const currentTemps = response.data;
            chrome.storage.local.get([STORAGE_KEY], (result) => {
                const prev = result[STORAGE_KEY] || [];
                const newEntry = {
                    id: Date.now(),
                    title: currentTemps['/market-products/new/basic']?.title || `템플릿 ${prev.length + 1}`,
                    content: currentTemps
                };

                const updated = [newEntry, ...prev];
                chrome.storage.local.set({ [STORAGE_KEY]: updated }, () => {
                    loadTemplates();
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
                    showToast("올바르지 않은 템플릿 형식입니다.")
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
                        showToast(`${imported.length}개의 템플릿을 가져왔습니다.`);
                    });
                });
            } catch (err) {
                showToast("파일을 읽는 중 오류가 발생했습니다: " + err.message);
            }
            importInput.value = '';
        };
        reader.readAsText(file);
    });

    function exportTemplate(template) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `template_${template.title}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    loadTemplates();
});
