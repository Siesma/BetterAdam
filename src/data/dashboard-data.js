// src/data/dashboard-data.js

function getCourseRole(c) {
    if (c.type === 'Gruppe') return 'gruppe';
    if (c.id && c.id.endsWith('-01')) return 'kurs';
    if (c.id) return 'ta';
    return 'kurs';
}

function getCourses(doc = document) {
    const scope = doc.querySelector('#il_center_col') || doc;
    return Array.from(scope.querySelectorAll('.il-item.il-std-item')).map(item => {
        if (!item.querySelector('.media-left img')) return null;
        const link = item.querySelector('.il-item-title a');
        if (!link) return null;

        const text = getText(link);
        if (!text) return null;

        const hasDash = text.includes('\u2013');
        const id = hasDash ? text.split('\u2013')[0].trim() : '';
        const title = hasDash ? text.split('\u2013').slice(1).join('\u2013').trim() : text;

        const props = {};
        item.querySelectorAll('.row .col-md-6').forEach(col => {
            const k = getText(col.querySelector('.il-item-property-name'));
            const v = getText(col.querySelector('.il-item-property-value'));
            if (k) props[k] = v;
        });

        const imgEl = item.querySelector('.media-left img');
        const href = link.href || link.getAttribute('href') || '';

        return {id, title, full: text, link: href, type: imgEl?.alt || 'Kurs', props, todos: []};
    }).filter(Boolean);
}

function getSemesters(doc = document) {
    const scope = doc.querySelector('#il_center_col') || doc;
    return Array.from(scope.querySelectorAll('.il-viewcontrol-mode button')).map(btn => ({
        label: btn.getAttribute('aria-label') || getText(btn),
        action: btn.getAttribute('data-action') || '',
        active: btn.classList.contains('engaged') || btn.getAttribute('aria-pressed') === 'true',
    }));
}

function getTodos(doc = document) {
    const scope = doc.querySelector('#il_right_col');
    if (!scope) return [];
    return Array.from(scope.querySelectorAll('li.il-std-item-container .il-item')).map(item => {
        const link = item.querySelector('.il-item-title a');
        if (!link) return null;

        const label = getText(link);
        const href = link.href || link.getAttribute('href') || '';
        const deadline = getText(item.querySelector('.il-item-description'));

        const props = {};
        item.querySelectorAll('.row .col-md-6').forEach(col => {
            const k = getText(col.querySelector('.il-item-property-name'));
            const v = getText(col.querySelector('.il-item-property-value'));
            if (k) props[k] = v;
        });

        const excMatch = href.match(/\/go\/exc\/(\d+)/);
        return {label, href, deadline, props, excId: excMatch ? excMatch[1] : null};
    }).filter(Boolean);
}