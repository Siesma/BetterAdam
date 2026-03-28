// =============================================================
// data/course-data.js
// Extracts structured data from a course page document.
// Accepts an optional `doc` parameter so it works on both the
// live DOM and on documents returned by fetchPage().
// =============================================================

function getCoursePageData(doc = document) {
    // ── Title ────────────────────────────────────────────────
    const titleEl = doc.querySelector(
        'h1.il-page-content-header, h1.ilHeader, h1'
    );
    const title = titleEl ? (titleEl.innerText || titleEl.textContent || '').trim()
        : (doc.title || 'Kurs');

    // ── Breadcrumbs ──────────────────────────────────────────
    const crumbs = Array.from(doc.querySelectorAll('.breadcrumb .crumb a')).map(a => ({
        text: (a.innerText || a.textContent || '').trim(),
        link: a.href || '',
    })).filter(c => c.text);

    // ── Content sections ─────────────────────────────────────
    const sections = [];
    doc.querySelectorAll('#il_center_col .ilContainerBlock').forEach(block => {
        const headingEl = block.querySelector('.ilContainerBlockHeader h2');
        const heading = headingEl ? (headingEl.innerText || headingEl.textContent || '').trim() : '';
        const items = [];

        block.querySelectorAll('.ilObjListRow').forEach(row => {
            const a = row.querySelector('.il_ContainerItemTitle a');
            if (!a) return;
            const label = (a.innerText || a.textContent || '').trim();
            const href = a.href || '';
            if (!label) return;

            const iconImg = row.querySelector('.ilContainerListItemIcon img');
            const type = iconImg ? (iconImg.alt || '').trim() : '';

            const props = Array.from(row.querySelectorAll('.il_ItemProperty'))
                .map(el => (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim())
                .filter(Boolean);

            const descEl = row.querySelector('.il_Description');
            const desc = descEl ? (descEl.innerText || descEl.textContent || '').trim() : '';

            items.push({label, href, type, props, desc});
        });

        if (heading || items.length) sections.push({heading, items});
    });

    // ── News sidebar ─────────────────────────────────────────
    const news = [];
    doc.querySelectorAll('#il_right_col li.il-std-item-container .il-item').forEach(item => {
        const a = item.querySelector('.il-item-title a');
        if (!a) return;
        const label = (a.innerText || a.textContent || '').trim();
        const href = a.href || '';
        const descEl = item.querySelector('.il-item-description');
        const desc = descEl ? (descEl.innerText || descEl.textContent || '').trim() : '';
        const dateEl = item.querySelector('.il-item-property-value');
        const date = dateEl ? (dateEl.innerText || dateEl.textContent || '').trim() : '';
        news.push({label, href, desc, date});
    });

    return {title, crumbs, sections, news};
}