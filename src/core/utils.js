// src/core/utils.js

function getPageType() {
    return getPageTypeFromUrl(location.href);
}

function getPageTypeFromUrl(url) {
    try {
        const base = (new URL(url).searchParams.get('baseClass') || '').toLowerCase();
        if (base === 'ildashboardgui') return 'dashboard';
        if (base === 'ilrepositorygui') return 'course';
        if (/\/go\/(crs|fold|exc|grp)\//.test(url)) return 'course';
    } catch {
    }
    return 'other';
}

function nukePage() {
    document.getElementById('ilias-dark-ui')?.remove();
    Array.from(document.body.children).forEach(el => {
        if (el.tagName !== 'SCRIPT' && el.id !== 'ilias-dark-ui') el.remove();
    });
    document.body.style.cssText = 'background:#0a0a0c;margin:0;padding:0;overflow:auto;';
    const root = document.createElement('div');
    root.id = 'ilias-dark-ui';
    document.body.appendChild(root);
    return root;
}

async function fetchPage(url) {
    try {
        const res = await fetch(url, {credentials: 'include'});
        if (!res.ok) return null;
        return new DOMParser().parseFromString(await res.text(), 'text/html');
    } catch {
        return null;
    }
}

// Works on both live DOM (innerText) and DOMParser docs (textContent only).
function getText(el) {
    if (!el) return '';
    return (typeof el.innerText === 'string' ? el.innerText : el.textContent || '').trim();
}

function removeBlackout() {
    document.getElementById('ilias-blackout')?.remove();
}

function waitFor(selector, timeout = 10000) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) return resolve();
        const obs = new MutationObserver(() => {
            if (document.querySelector(selector)) {
                obs.disconnect();
                resolve();
            }
        });
        obs.observe(document.documentElement, {childList: true, subtree: true});
        setTimeout(() => {
            obs.disconnect();
            resolve();
        }, timeout);
    });
}