// =============================================================
// core/utils.js
// Page detection, DOM lifecycle helpers.
// =============================================================

/** Returns 'dashboard' | 'course' | 'other' based on the URL. */
function getPageType() {
    const base = (new URLSearchParams(location.search).get('baseClass') || '').toLowerCase();
    if (base === 'ildashboardgui') return 'dashboard';
    if (base === 'ilrepositorygui') return 'course';
    return 'other';
}

/**
 * Wipes all non-script body children, injects a fresh #ilias-dark-ui root div,
 * and returns it. Call once per page render.
 */
function nukePage() {
    Array.from(document.body.children).forEach(el => {
        if (el.tagName !== 'SCRIPT' && el.id !== 'ilias-dark-ui') el.remove();
    });
    document.body.style.cssText = 'background:#0a0a0c;margin:0;padding:0;overflow:auto;';
    const root = document.createElement('div');
    root.id = 'ilias-dark-ui';
    document.body.appendChild(root);
    return root;
}

/**
 * Resolves when `selector` appears in the DOM, or after `timeout` ms.
 * Uses MutationObserver so there's no polling interval.
 */
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

/** Removes the instant-blackout style tag injected at document-start. */
function removeBlackout() {
    document.getElementById('ilias-blackout')?.remove();
}