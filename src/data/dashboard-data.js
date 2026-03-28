// =============================================================
// data/dashboard-data.js
// Extracts courses, semester tabs, and to-do items from the
// ILIAS dashboard DOM (#il_center_col and #il_right_col).
// =============================================================

/** Returns course role: 'kurs' | 'ta' | 'gruppe' */
function getCourseRole(c) {
    if (c.type === 'Gruppe') return 'gruppe';
    if (c.id && c.id.endsWith('-01')) return 'kurs';
    if (c.id) return 'ta';
    return 'kurs';
}

/**
 * Extracts all course entries from #il_center_col.
 * Guards against homework rows (which lack .media-left img).
 */
function getCourses() {
    const scope = document.querySelector('#il_center_col') || document;
    return Array.from(scope.querySelectorAll('.il-item.il-std-item')).map(item => {
        if (!item.querySelector('.media-left img')) return null; // skip todo/homework rows
        const link = item.querySelector('.il-item-title a');
        if (!link) return null;

        const text = link.innerText.trim();
        const hasDash = text.includes('\u2013');
        const id = hasDash ? text.split('\u2013')[0].trim() : '';
        const title = hasDash ? text.split('\u2013').slice(1).join('\u2013').trim() : text;

        const props = {};
        item.querySelectorAll('.row .col-md-6').forEach(col => {
            const k = col.querySelector('.il-item-property-name')?.innerText.trim();
            const v = col.querySelector('.il-item-property-value')?.innerText.trim();
            if (k) props[k] = v || '';
        });

        const alt = item.querySelector('.media-left img')?.alt || 'Kurs';
        return {id, title, full: text, link: link.href, type: alt, props};
    }).filter(Boolean);
}

/**
 * Extracts semester filter buttons from the center column panel.
 * Scoped to avoid picking up sidebar buttons.
 */
function getSemesters() {
    const scope = document.querySelector('#il_center_col') || document;
    return Array.from(scope.querySelectorAll('.il-viewcontrol-mode button')).map(btn => ({
        label: btn.getAttribute('aria-label') || btn.innerText.trim(),
        action: btn.getAttribute('data-action') || '',
        active: btn.classList.contains('engaged') || btn.getAttribute('aria-pressed') === 'true',
    }));
}

/**
 * Extracts upcoming homework/deadline items from the right sidebar (To-Do panel).
 * These live in #il_right_col > li.il-std-item-container and link to /go/exc/...
 */
function getTodos() {
    const scope = document.querySelector('#il_right_col');
    if (!scope) return [];
    return Array.from(scope.querySelectorAll('li.il-std-item-container .il-item')).map(item => {
        const link = item.querySelector('.il-item-title a');
        if (!link) return null;

        const label = link.innerText.trim();
        const href = link.href;
        const deadline = item.querySelector('.il-item-description')?.innerText.trim() || '';

        const props = {};
        item.querySelectorAll('.row .col-md-6').forEach(col => {
            const k = col.querySelector('.il-item-property-name')?.innerText.trim();
            const v = col.querySelector('.il-item-property-value')?.innerText.trim();
            if (k) props[k] = v || '';
        });

        // /go/exc/2190669/15034 → excId = "2190669"
        const excMatch = href.match(/\/go\/exc\/(\d+)/);
        const excId = excMatch ? excMatch[1] : null;

        return {label, href, deadline, props, excId};
    }).filter(Boolean);
}