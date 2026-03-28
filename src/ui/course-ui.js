// =============================================================
// ui/course-ui.js
// Builds the course detail page UI: two-column layout with
// named content sections on the left and a news sidebar on the right.
//
// Depends on: SHARED_CSS, DASHBOARD_URL, typeEmoji, typeColor (constants.js)
// =============================================================

function buildCoursePage(data, {fromCache = false} = {}) {
    const root = nukePage();

    root.innerHTML = `
<style>
${SHARED_CSS}

/* ── two-column layout ── */
#ilias-dark-ui .course-outer{display:flex;align-items:flex-start;gap:20px;padding:28px 36px 0;max-width:1200px;margin:0 auto}
#ilias-dark-ui .course-main{flex:1;min-width:0}
#ilias-dark-ui .course-sidebar{flex:0 0 260px;position:sticky;top:66px}

/* ── cache banner ── */
#ilias-dark-ui .cache-banner{display:flex;align-items:center;justify-content:space-between;background:#1a1a10;border:1px solid var(--accent);border-radius:8px;padding:10px 16px;margin-bottom:18px;font-size:11px;color:var(--accent);gap:12px}
#ilias-dark-ui .cache-banner.stale{background:#1a120a;border-color:var(--todo);color:var(--todo)}
#ilias-dark-ui .cache-reload-btn{background:var(--todo);border:none;border-radius:6px;color:#0a0a0c;font-family:'DM Mono',monospace;font-size:10px;padding:4px 10px;cursor:pointer;white-space:nowrap;font-weight:600;flex-shrink:0}
#ilias-dark-ui .cache-banner:not(.stale) .cache-reload-btn{background:var(--surf3);color:var(--muted);border:1px solid var(--border)}

/* ── breadcrumb ── */
#ilias-dark-ui .breadcrumb-row{display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-bottom:20px}
#ilias-dark-ui .bc-item{font-size:10px;color:var(--muted);text-decoration:none;transition:color .12s}
#ilias-dark-ui .bc-item:hover{color:var(--accent)}
#ilias-dark-ui .bc-sep{color:var(--border);font-size:10px}
#ilias-dark-ui .bc-current{font-size:10px;color:var(--text)}

/* ── hero ── */
#ilias-dark-ui .course-hero{margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid var(--border)}
#ilias-dark-ui .course-hero h2{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;letter-spacing:-.6px;color:var(--text);line-height:1.2}

/* ── section block ── */
#ilias-dark-ui .section-block{margin-bottom:24px}
#ilias-dark-ui .section-heading{font-size:10px;letter-spacing:1.5px;color:var(--muted);text-transform:uppercase;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px}
#ilias-dark-ui .section-count{background:var(--surf3);border:1px solid var(--border);border-radius:20px;padding:1px 7px;font-size:9px;color:var(--muted)}

/* ── item rows ── */
#ilias-dark-ui .item-list{display:flex;flex-direction:column;gap:3px}
#ilias-dark-ui .item-row{background:var(--surface);border:1px solid var(--border);border-radius:8px;display:flex;align-items:center;text-decoration:none;color:inherit;overflow:hidden;transition:border-color .12s,background .12s}
#ilias-dark-ui .item-row:hover{border-color:var(--accent);background:var(--surf2)}
#ilias-dark-ui .item-row-strip{width:3px;align-self:stretch;flex-shrink:0}
#ilias-dark-ui .item-row-icon{flex:0 0 36px;display:flex;align-items:center;justify-content:center;padding:12px 0;font-size:13px}
#ilias-dark-ui .item-row-body{flex:1;padding:11px 8px 11px 0;min-width:0}
#ilias-dark-ui .item-row-label{font-family:'Syne',sans-serif;font-size:13px;font-weight:600;color:var(--text);line-height:1.3;margin-bottom:2px}
#ilias-dark-ui .item-row-desc{font-size:10px;color:var(--muted)}
#ilias-dark-ui .item-row-meta{flex:0 0 auto;padding:0 10px;display:flex;flex-direction:column;align-items:flex-end;gap:2px}
#ilias-dark-ui .item-prop{font-size:9px;color:var(--muted);white-space:nowrap;background:var(--surf3);border:1px solid var(--border);border-radius:4px;padding:1px 6px}
#ilias-dark-ui .item-prop.deadline{color:var(--todo);border-color:var(--todo);background:#1a120a}
#ilias-dark-ui .item-row-arrow{flex:0 0 auto;font-size:11px;color:var(--border);padding:0 12px 0 4px;transition:color .12s}
#ilias-dark-ui .item-row:hover .item-row-arrow{color:var(--accent)}

/* ── news sidebar ── */
#ilias-dark-ui .sidebar-panel{background:var(--surface);border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:14px}
#ilias-dark-ui .sidebar-panel-head{padding:11px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
#ilias-dark-ui .sidebar-panel-head h3{font-family:'Syne',sans-serif;font-size:11px;font-weight:700;color:var(--text)}
#ilias-dark-ui .sidebar-count{font-size:9px;background:var(--surf3);border:1px solid var(--border);border-radius:20px;padding:1px 7px;color:var(--muted)}
#ilias-dark-ui .news-item{display:block;padding:10px 14px;border-bottom:1px solid var(--border);text-decoration:none;color:inherit;transition:background .12s}
#ilias-dark-ui .news-item:last-child{border-bottom:none}
#ilias-dark-ui .news-item:hover{background:var(--surf2)}
#ilias-dark-ui .news-item-label{font-size:11px;color:var(--text);margin-bottom:3px;line-height:1.3}
#ilias-dark-ui .news-item-desc{font-size:10px;color:var(--muted);margin-bottom:3px}
#ilias-dark-ui .news-item-date{font-size:9px;color:var(--muted)}
#ilias-dark-ui .no-news{padding:16px 14px;font-size:11px;color:var(--muted);text-align:center}
</style>

<div class="dash-header">
  <a class="logo-link" href="${DASHBOARD_URL}"><span class="logo-mark"></span> ADAM Dashboard</a>
  <div class="header-right">
    <a class="back-btn" href="${DASHBOARD_URL}">← Dashboard</a>
  </div>
</div>

<div class="course-outer">
  <div class="course-main">
    <div id="cache-banner-slot"></div>

    ${data.crumbs.length ? `
    <div class="breadcrumb-row">
      <a class="bc-item" href="${DASHBOARD_URL}">Dashboard</a>
      ${data.crumbs.map((c, i) =>
        `<span class="bc-sep">›</span>
         ${i === data.crumbs.length - 1
            ? `<span class="bc-current">${c.text}</span>`
            : `<a class="bc-item" href="${c.link}">${c.text}</a>`}`
    ).join('')}
    </div>` : ''}

    <div class="course-hero">
      <h2>${data.title}</h2>
    </div>

    ${data.sections.map(sec => `
      <div class="section-block">
        ${sec.heading ? `
        <div class="section-heading">
          ${sec.heading}
          <span class="section-count">${sec.items.length}</span>
        </div>` : ''}
        <div class="item-list">
          ${sec.items.map(item => {
        const color = typeColor(item.type);
        const propsHtml = item.props.map(p => {
            const isDeadline = p.includes('Abgabefrist') || p.toLowerCase().includes('deadline');
            return `<span class="item-prop${isDeadline ? ' deadline' : ''}">${p}</span>`;
        }).join('');
        return `
            <a class="item-row" href="${item.href || '#'}">
              <div class="item-row-strip" style="background:${color}"></div>
              <div class="item-row-icon">${typeEmoji(item.type)}</div>
              <div class="item-row-body">
                <div class="item-row-label">${item.label}</div>
                ${item.desc ? `<div class="item-row-desc">${item.desc}</div>` : ''}
              </div>
              ${propsHtml ? `<div class="item-row-meta">${propsHtml}</div>` : ''}
              <div class="item-row-arrow">↗</div>
            </a>`;
    }).join('')}
        </div>
      </div>`).join('')}

    ${!data.sections.length
        ? `<div style="color:var(--muted);font-size:12px;padding:40px 0;text-align:center">Keine Inhalte gefunden.</div>`
        : ''}
  </div>

  <aside class="course-sidebar">
    <div class="sidebar-panel">
      <div class="sidebar-panel-head">
        <h3>Neuigkeiten</h3>
        <span class="sidebar-count">${data.news.length}</span>
      </div>
      ${data.news.length
        ? data.news.map(n => `
          <a class="news-item" href="${n.href}">
            <div class="news-item-label">${n.label}</div>
            ${n.desc ? `<div class="news-item-desc">${n.desc}</div>` : ''}
            ${n.date ? `<div class="news-item-date">${n.date}</div>` : ''}
          </a>`).join('')
        : '<div class="no-news">Keine Neuigkeiten.</div>'}
    </div>
  </aside>
</div>
`;

    if (fromCache) {
        const slot = root.querySelector('#cache-banner-slot');
        if (slot) {
            slot.innerHTML = `
        <div class="cache-banner" id="cache-banner">
          <span>⚡ Aus Cache geladen — wird im Hintergrund aktualisiert…</span>
          <button class="cache-reload-btn" onclick="location.reload()">Jetzt laden</button>
        </div>`;
        }
    }
}

/**
 * Upgrades the cache banner to "stale" (content changed) state,
 * or injects a new banner if the page wasn't served from cache.
 */
function showStaleBanner() {
    const banner = document.getElementById('cache-banner');
    if (banner) {
        banner.className = 'cache-banner stale';
        banner.innerHTML = `
      <span>🔄 Neue Inhalte verfügbar!</span>
      <button class="cache-reload-btn" onclick="location.reload()">Neu laden</button>`;
    } else {
        const main = document.querySelector('#ilias-dark-ui .course-main');
        if (!main) return;
        const div = document.createElement('div');
        div.innerHTML = `
      <div class="cache-banner stale" style="margin-bottom:18px">
        <span>🔄 Neue Inhalte verfügbar!</span>
        <button class="cache-reload-btn" onclick="location.reload()">Neu laden</button>
      </div>`;
        main.prepend(div.firstElementChild);
    }
}