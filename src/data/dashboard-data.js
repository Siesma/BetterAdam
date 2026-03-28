// =============================================================
// data/dashboard-data.js
// Extracts courses, semester tabs, and to-do items.
//
// Every function accepts an optional `doc` parameter.
// When omitted, it reads from the live `document`.
// When provided (a DOMParser result from fetchPage), it reads
// from that instead — enabling background-fetch extraction.
// =============================================================

/** Returns course role: 'kurs' | 'ta' | 'gruppe' */
function getCourseRole(c) {
    if (c.type === 'Gruppe') return 'gruppe';
    if (c.id && c.id.endsWith('-01')) return 'kurs';
    if (c.id) return 'ta';
    return 'kurs';
}

/**
 * Extracts all course entries from the center column.
 * Guards against homework rows (which lack .media-left img).
 */
function getCourses(doc = document) {
    const scope = doc.querySelector('#il_center_col') || doc;
    return Array.from(scope.querySelectorAll('.il-item.il-std-item')).map(item => {
        if (!item.querySelector('.media-left img')) return null;
        const link = item.querySelector('.il-item-title a');
        if (!link) return null;

        const text = link.innerText ? link.innerText.trim() : (link.textContent || '').trim();
        const hasDash = text.includes('\u2013');
        const id = hasDash ? text.split('\u2013')[0].trim() : '';
        const title = hasDash ? text.split('\u2013').slice(1).join('\u2013').trim() : text;

        const props = {};
        item.querySelectorAll('.row .col-md-6').forEach(col => {
            const k = (col.querySelector('.il-item-property-name')?.textContent || '').trim();
            const v = (col.querySelector('.il-item-property-value')?.textContent || '').trim();
            if (k) props[k] = v;
        });

        const imgEl = item.querySelector('.media-left img');
        const alt = imgEl ? (imgEl.alt || 'Kurs') : 'Kurs';
        const href = link.href || '';

        return {id, title, full: text, link: href, type: alt, props};
    }).filter(Boolean);
}

/**
 * Extracts semester filter buttons from the center column panel.
 */
function getSemesters(doc = document) {
    const scope = doc.querySelector('#il_center_col') || doc;
    return Array.from(scope.querySelectorAll('.il-viewcontrol-mode button')).map(btn => ({
        label: (btn.getAttribute('aria-label') || btn.textContent || '').trim(),
        action: btn.getAttribute('data-action') || '',
        active: btn.classList.contains('engaged') || btn.getAttribute('aria-pressed') === 'true',
    }));
}

/**
 * Extracts upcoming homework/deadline items from the right sidebar (To-Do panel).
 */
function getTodos(doc = document) {
    const scope = doc.querySelector('#il_right_col');
    if (!scope) return [];
    return Array.from(scope.querySelectorAll('li.il-std-item-container .il-item')).map(item => {
        const link = item.querySelector('.il-item-title a');
        if (!link) return null;

        const label = (link.innerText || link.textContent || '').trim();
        const href = link.href || '';
        const deadlineEl = item.querySelector('.il-item-description');
        const deadline = deadlineEl ? (deadlineEl.innerText || deadlineEl.textContent || '').trim() : '';

        const props = {};
        item.querySelectorAll('.row .col-md-6').forEach(col => {
            const k = (col.querySelector('.il-item-property-name')?.textContent || '').trim();
            const v = (col.querySelector('.il-item-property-value')?.textContent || '').trim();
            if (k) props[k] = v;
        });

        const excMatch = href.match(/\/go\/exc\/(\d+)/);
        const excId = excMatch ? excMatch[1] : null;

        return {label, href, deadline, props, excId};
    }).filter(Boolean);
}