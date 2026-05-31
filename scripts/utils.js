window.utils = {
    wait: async (ms = 500) => new Promise(r => setTimeout(r, ms)),

    clickByText: (selector, text) => {
        const el = [...document.querySelectorAll(selector)]
            .find(node => node.innerText.trim().includes(text));

        if (el) {
            const target = el.closest('button, a, [role="button"], label') || el;
            target.click();
        }
        return el;
    },

    // 페이지 하단의 주요 액션 버튼("다음", "등록" 등)을 텍스트로 찾아 클릭한다.
    // 클래스 해시에 의존하지 않으며, 버튼이 <button>이 아니라 <a>/role=button 인
    // 페이지(예: basic 단계)도 커버한다. 같은 라벨이 여러 개면 가장 아래(마지막) 것을 클릭.
    clickActionButton: (label) => {
        const candidates = [...document.querySelectorAll('button, a, [role="button"]')]
            .filter(el => {
                if (el.disabled || el.getAttribute('aria-disabled') === 'true') return false;
                return el.innerText.trim() === label;
            });
        const target = candidates[candidates.length - 1];
        if (target) {
            target.click();
        } else {
            console.warn(`[매크로] 액션 버튼을 찾지 못했습니다: "${label}"`);
        }
        return target || null;
    },

    setReactValue: async (selector, val) => {
        const el = document.querySelector(selector);
        if (!el) {
            console.error('Element를 찾을 수 없습니다:', selector);
            return;
        }

        val = String(val == null ? '' : val);
        const sleep = (ms) => new Promise(r => setTimeout(r, ms));

        // 페이지/포커스가 준비 안 됐으면 execCommand가 실패한다(false 반환, 값 안 들어감).
        // 그래서 "값이 실제로 들어갈 때까지" 재시도한다. 단순 value 주입과 달리
        // execCommand('insertText')는 브라우저 편집 파이프라인을 거쳐 폼 상태(draft)에
        // 저장되므로, 페이지를 넘어가도 값이 사라지지 않는다.
        const tryInsert = () => {
            if (!document.hasFocus()) window.focus();
            el.focus();
            try { el.setSelectionRange(0, el.value.length); } catch (e) { /* type=number 등 */ }
            try { return document.execCommand('insertText', false, val); } catch (e) { return false; }
        };

        let ok = false;
        for (let i = 0; i < 8; i++) {
            tryInsert();
            await sleep(120);
            if (el.value === val) { ok = true; break; }
        }

        // execCommand가 끝내 안 먹는 입력칸(type=number 등)만 native setter로 폴백.
        // (이 경로는 페이지 이동 시 값이 안 남을 수 있으므로 최후의 수단)
        if (!ok && el.value !== val) {
            console.warn('[매크로] execCommand 입력 실패, native 폴백 사용:', selector);
            const prototype = el.tagName === 'TEXTAREA'
                ? window.HTMLTextAreaElement.prototype
                : window.HTMLInputElement.prototype;
            const lastValue = el.value;
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
            nativeInputValueSetter.call(el, val);
            const tracker = el._valueTracker;
            if (tracker) tracker.setValue(lastValue);
            const eventOptions = { bubbles: true, composed: true, cancelable: true };
            el.dispatchEvent(new Event('input', eventOptions));
            el.dispatchEvent(new Event('change', eventOptions));
        }

        el.dispatchEvent(new Event('blur', { bubbles: true }));
        el.blur();

        // 상태 반영 대기
        await sleep(300);
    },

    setReactChecked: (selector, checked) => {
        const el = document.querySelector(selector);
        if (!el) {
            console.error('Element를 찾을 수 없습니다:', selector);
            return;
        }

        const lastValue = el.checked;
        const tracker = el._valueTracker;
        if (tracker) {
            tracker.setValue(lastValue);
        }

        const prototype = window.HTMLInputElement.prototype;
        const nativeCheckedSetter = Object.getOwnPropertyDescriptor(prototype, 'checked').set;
        nativeCheckedSetter.call(el, checked);

        const eventOptions = { bubbles: true, composed: true, view: window };

        el.dispatchEvent(new MouseEvent('mousedown', eventOptions));
        el.dispatchEvent(new MouseEvent('mouseup', eventOptions));
        el.dispatchEvent(new MouseEvent('click', eventOptions));

        el.dispatchEvent(new Event('change', eventOptions));
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

    // 통일된 토스트. type: 'info' | 'success' | 'error' | 'warning'
    // 색/아이콘은 타입에 따라 자동으로 정해지고, 인라인 스타일이라 페이지·팝업 어디서나 동일하게 보인다.
    showToast: (message, type = 'info') => {
        const existing = document.querySelector('.macro-toast');
        if (existing) existing.remove();

        const palette = {
            info: { bg: 'rgba(33, 33, 33, 0.92)', icon: 'ℹ' },
            success: { bg: '#03c75a', icon: '✓' },
            error: { bg: '#e5484d', icon: '✕' },
            warning: { bg: '#f5a623', icon: '!' }
        };
        const { bg, icon } = palette[type] || palette.info;

        const toast = document.createElement('div');
        toast.className = 'macro-toast';
        toast.style.cssText = `
            position: fixed; left: 50%; bottom: 40px;
            transform: translateX(-50%) translateY(10px);
            display: flex; align-items: center; gap: 8px;
            max-width: 80vw; padding: 12px 18px;
            background: ${bg}; color: #fff;
            font-size: 14px; font-weight: 600; line-height: 1.4;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Malgun Gothic", sans-serif;
            border-radius: 10px; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
            z-index: 2147483647; opacity: 0; pointer-events: none;
            transition: opacity 0.25s ease, transform 0.25s ease;
        `;
        const iconEl = document.createElement('span');
        iconEl.style.cssText = 'font-weight: 800; flex-shrink: 0;';
        iconEl.textContent = icon;
        const textEl = document.createElement('span');
        textEl.textContent = message;
        toast.append(iconEl, textEl);
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });

        const duration = type === 'error' ? 4000 : 2500;
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(10px)';
            setTimeout(() => toast.remove(), 250);
        }, duration);
    },

    fileToBase64: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
};