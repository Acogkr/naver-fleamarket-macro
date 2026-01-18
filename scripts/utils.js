window.utils = {
    wait: async (ms = 500) => new Promise(r => setTimeout(r, ms)),

    clickByText: (selector, text) => {
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

    fileToBase64: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
};