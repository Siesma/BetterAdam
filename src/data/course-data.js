// =============================================================
// data/course-data.js
// Extracts structured data from an ilrepositorygui course page.
//
// The real ILIAS course page is structured as:
//   .breadcrumb .crumb a          → breadcrumb trail
//   h1.il-page-content-header     → course title
//   #il_center_col .ilContainerBlock  → each named section (Lecture / Exercises / Project…)
//     .ilContainerBlockHeader h2  → section heading
//     .ilObjListRow               → one item per row
//       .ilContainerListItemIcon img[alt]  → type label
//       .il_ContainerItemTitle a   → item link + name
//       .il_ItemProperty           → metadata (deadline, file size, date…)
//   #il_right_col li.il-std-item-container  → Neuigkeiten (news) sidebar
// =============================================================

function getCoursePageData() {
    // ── Title ────────────────────────────────────────────────
    const titleEl = document.querySelector(
        'h1.il-page-content-header, h1.ilHeader, h1'
    );
    const title = titleEl?.innerText?.trim() || document.title || 'Kurs';

    // ── Breadcrumbs ──────────────────────────────────────────
    const crumbs = Array.from(document.querySelectorAll('.breadcrumb .crumb a')).map(a => ({
        text: a.innerText.trim(),
        link: a.href || '',
    })).filter(c => c.text);

    // ── Content sections ─────────────────────────────────────
    const sections = [];
    document.querySelectorAll('#il_center_col .ilContainerBlock').forEach(block => {
        const heading = block.querySelector('.ilContainerBlockHeader h2')?.innerText?.trim() || '';
        const items = [];

        block.querySelectorAll('.ilObjListRow').forEach(row => {
            const a = row.querySelector('.il_ContainerItemTitle a');
            if (!a) return;
            const label = a.innerText.trim();
            const href = a.href || '';
            if (!label) return;

            // Type from icon alt text (e.g. "Ordner", "Übung", "Datei")
            const type = row.querySelector('.ilContainerListItemIcon img')?.alt?.trim() || '';

            // Extra metadata spans: deadline, file size, modified date, page count…
            const props = Array.from(row.querySelectorAll('.il_ItemProperty'))
                .map(el => el.innerText.replace(/\s+/g, ' ').trim())
                .filter(Boolean);

            const desc = row.querySelector('.il_Description')?.innerText?.trim() || '';

            items.push({label, href, type, props, desc});
        });

        if (heading || items.length) sections.push({heading, items});
    });

    // ── News sidebar (Neuigkeiten) ───────────────────────────
    const news = [];
    document.querySelectorAll('#il_right_col li.il-std-item-container .il-item').forEach(item => {
        const a = item.querySelector('.il-item-title a');
        if (!a) return;

        const label = a.innerText.trim();
        // Relative hrefs need to be made absolute
        const href = a.href || (location.origin + '/' + (a.getAttribute('href') || '').replace(/^\//, ''));
        const desc = item.querySelector('.il-item-description')?.innerText?.trim() || '';
        const date = item.querySelector('.il-item-property-value')?.innerText?.trim() || '';

        news.push({label, href, desc, date});
    });

    return {title, crumbs, sections, news};
}