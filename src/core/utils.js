// =============================================================
// core/utils.js
// Page detection, DOM lifecycle helpers, background fetch parser.
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
 * Fetches a URL silently in the background and returns a parsed Document.
 * The user never sees this request — it uses their existing session cookies.
 * Returns null on any network or parse error.
 */
async function fetchPage(url) {
    try {
        const res = await fetch(url, {credentials: 'include'});
        if (!res.ok) return null;
        return new DOMParser().parseFromString(await res.text(), 'text/html');
    } catch {
        return null;
    }
}

/** Removes the instant-blackout style tag injected at document-start. */
function removeBlackout() {
    document.getElementById('ilias-blackout')?.remove();
}