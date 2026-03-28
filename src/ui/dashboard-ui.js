// =============================================================
// ui/dashboard-ui.js
// Builds the full dashboard UI: header, semester tabs, search,
// stats row, course list with inline to-do sub-rows.
//
// Depends on: SHARED_CSS, roleLabel, roleColor, roleIcon,
//             getCourseRole (constants.js + dashboard-data.js)
// =============================================================

function buildDashboard(courses, semesters, todos) {
    const root = nukePage();

    root.innerHTML = `
<style>
${SHARED_CSS}

/* ── controls bar ── */
#ilias-dark-ui .controls-bar{padding:14px 36px;background:var(--bg);border-bottom:1px solid var(--border);display:flex;flex-wrap:wrap;gap:10px;align-items:center}
#ilias-dark-ui .search-inner{position:relative;flex:0 0 300px}
#ilias-dark-ui .search-icon{position:absolute;left:11px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none}
#ilias-dark-ui #dash-search{width:100%;background:var(--surf2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-family:'DM Mono',monospace;font-size:12px;padding:7px 11px 7px 30px;outline:none;transition:border-color .15s}
#ilias-dark-ui #dash-search:focus{border-color:var(--accent)}
#ilias-dark-ui #dash-search::placeholder{color:var(--muted)}
#ilias-dark-ui .sem-scroll{display:flex;gap:5px;flex-wrap:wrap}
#ilias-dark-ui .sem-btn{background:var(--surf2);border:1px solid var(--border);color:var(--muted);font-family:'DM Mono',monospace;font-size:10px;padding:4px 11px;border-radius:20px;white-space:nowrap;transition:all .12s;text-decoration:none;display:inline-block}
#ilias-dark-ui .sem-btn:hover{color:var(--text);border-color:var(--accent)}
#ilias-dark-ui .sem-btn.active{background:var(--accent);color:#0a0a0c;border-color:var(--accent);font-weight:600}

/* ── stats ── */
#ilias-dark-ui .stats-row{display:flex;gap:8px;padding:12px 36px;flex-wrap:wrap;border-bottom:1px solid var(--border)}
#ilias-dark-ui .stat-chip{background:var(--surf2);border:1px solid var(--border);border-radius:7px;padding:7px 13px;font-size:11px;color:var(--muted);display:flex;align-items:center;gap:7px}
#ilias-dark-ui .stat-chip strong{font-size:15px;color:var(--text);font-family:'Syne',sans-serif;font-weight:700}
#ilias-dark-ui .stat-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}

/* ── shimmer skeleton ── */
@keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
#ilias-dark-ui .skeleton{background:linear-gradient(90deg,var(--surf2) 25%,var(--surf3) 50%,var(--surf2) 75%);background-size:400px 100%;animation:shimmer 1.4s infinite linear;border-radius:4px;height:14px}

/* ── course list ── */
#ilias-dark-ui .list-wrap{padding:12px 36px 0;display:flex;flex-direction:column;gap:8px}

/* ── course block (row + todo sub-rows) ── */
#ilias-dark-ui .course-block{display:flex;flex-direction:column}
#ilias-dark-ui .row-card{background:var(--surface);border:1px solid var(--border);border-radius:9px;display:flex;align-items:center;overflow:hidden;transition:border-color .12s,background .12s;text-decoration:none;color:inherit}
#ilias-dark-ui .course-block:has(.todo-rows:not(:empty)) .row-card{border-radius:9px 9px 0 0;border-bottom-color:transparent}
#ilias-dark-ui .row-card:hover{border-color:var(--accent);background:var(--surf2)}
#ilias-dark-ui .row-strip{width:3px;align-self:stretch;flex-shrink:0}
#ilias-dark-ui .row-badge-col{flex:0 0 96px;padding:12px 8px 12px 12px;display:flex;align-items:center}
#ilias-dark-ui .row-badge{font-size:10px;font-weight:500;padding:2px 7px;border-radius:20px;white-space:nowrap}
#ilias-dark-ui .row-id-col{flex:0 0 105px;padding:12px 8px;font-size:10px;color:var(--muted);letter-spacing:.2px}
#ilias-dark-ui .row-title-col{flex:1;padding:12px 8px;font-family:'Syne',sans-serif;font-size:13px;font-weight:600;color:var(--text);line-height:1.3;min-width:0}
#ilias-dark-ui .row-prop-col{flex:0 0 200px;padding:12px 8px;font-size:10px;color:var(--muted);line-height:1.5}
#ilias-dark-ui .row-prop-col span{color:var(--text);opacity:.7}
#ilias-dark-ui .row-open{flex:0 0 auto;margin:0 12px;background:var(--surf3);border:1px solid var(--border);color:var(--text);font-family:'DM Mono',monospace;font-size:10px;padding:5px 11px;border-radius:6px;text-decoration:none;white-space:nowrap;transition:background .12s,border-color .12s,color .12s}
#ilias-dark-ui .row-card:hover .row-open{background:var(--accent);border-color:var(--accent);color:#0a0a0c}

/* ── todo sub-rows ── */
#ilias-dark-ui .todo-rows{display:flex;flex-direction:column}
#ilias-dark-ui .todo-row{background:var(--surf2);border:1px solid var(--border);border-top:none;display:flex;align-items:center;overflow:hidden;text-decoration:none;color:inherit;transition:background .12s,border-color .12s}
#ilias-dark-ui .todo-row:last-child{border-radius:0 0 9px 9px}
#ilias-dark-ui .todo-row:hover{background:var(--surf3);border-color:var(--accent)}
#ilias-dark-ui .todo-row-indicator{width:3px;align-self:stretch;background:var(--todo);flex-shrink:0}
#ilias-dark-ui .todo-row-icon{flex:0 0 96px;padding:9px 8px 9px 12px;font-size:10px;color:var(--todo);display:flex;align-items:center;gap:5px;white-space:nowrap}
#ilias-dark-ui .todo-row-label{flex:1;padding:9px 8px;font-size:11px;color:var(--text);line-height:1.3;min-width:0}
#ilias-dark-ui .todo-row-deadline{flex:0 0 auto;padding:9px 8px;font-size:10px;color:var(--todo);white-space:nowrap}
#ilias-dark-ui .todo-row-exercise{flex:0 0 180px;padding:9px 8px;font-size:10px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#ilias-dark-ui .todo-row-open{flex:0 0 auto;margin:0 12px;background:var(--surf3);border:1px solid var(--border);color:var(--muted);font-family:'DM Mono',monospace;font-size:10px;padding:4px 10px;border-radius:5px;text-decoration:none;white-space:nowrap;transition:background .12s,border-color .12s,color .12s}
#ilias-dark-ui .todo-row:hover .todo-row-open{background:var(--todo);border-color:var(--todo);color:#0a0a0c}

/* ── empty state ── */
#ilias-dark-ui .empty-state{padding:60px 36px;text-align:center;color:var(--muted);font-size:13px}
#ilias-dark-ui .empty-state .emoji{font-size:36px;display:block;margin-bottom:10px}
</style>

<div class="dash-header">
  <a class="logo-link" href="${location.href}"><span class="logo-mark"></span> ADAM Dashboard</a>
  <div class="header-right"><div class="count-pill" id="count-label">—</div></div>
</div>

<div class="controls-bar">
  <div class="search-inner">
    <span class="search-icon">⌕</span>
    <input id="dash-search" type="text" placeholder="Kurs suchen…" autocomplete="off">
  </div>
  <div class="sem-scroll" id="sem-tabs"></div>
</div>

<div class="stats-row" id="stats-row"></div>
<div class="list-wrap" id="course-list"></div>
`;

    // Semester tabs
    const semTabs = root.querySelector('#sem-tabs');
    semesters.forEach(s => {
        const a = Object.assign(document.createElement('a'), {
            className: 'sem-btn' + (s.active ? ' active' : ''),
            textContent: s.label,
            href: s.action || '#',
        });
        semTabs.appendChild(a);
    });

    const list = root.querySelector('#course-list');
    const countLabel = root.querySelector('#count-label');
    const statsRow = root.querySelector('#stats-row');

    function renderStats(f) {
        const n = r => f.filter(c => getCourseRole(c) === r).length;
        statsRow.innerHTML = `
      <div class="stat-chip"><span class="stat-dot" style="background:var(--kurs)"></span><strong>${n('kurs')}</strong> Kurse</div>
      <div class="stat-chip"><span class="stat-dot" style="background:var(--ta)"></span><strong>${n('ta')}</strong> TA-Sessions</div>
      <div class="stat-chip"><span class="stat-dot" style="background:var(--gruppe)"></span><strong>${n('gruppe')}</strong> Gruppen</div>
      <div class="stat-chip"><strong>${f.length}</strong> Gesamt</div>`;
        countLabel.textContent = `${f.length} Einträge`;
    }

    function renderTodoRow(t) {
        const exercise = t.props['Übung'] || t.props['Exercise'] || '';
        return `
      <a class="todo-row" href="${t.href}" target="_blank">
        <div class="todo-row-indicator"></div>
        <div class="todo-row-icon">📋 Abgabe</div>
        <div class="todo-row-label">${t.label}</div>
        <div class="todo-row-deadline">${t.deadline ? '⏰ ' + t.deadline : ''}</div>
        <div class="todo-row-exercise">${exercise}</div>
        <span class="todo-row-open">Öffnen ↗</span>
      </a>`;
    }

    function renderList(f) {
        if (!f.length) {
            list.innerHTML = `<div class="empty-state"><span class="emoji">🔍</span>Keine Einträge gefunden.</div>`;
            return;
        }
        list.innerHTML = f.map(c => {
            const role = getCourseRole(c);
            const color = roleColor(role);
            const props = Object.entries(c.props).filter(([k, v]) => k && v).slice(0, 2)
                .map(([k, v]) => `${k}: <span>${v}</span>`).join('<br>');
            const myTodos = c.todos || [];

            return `
        <div class="course-block">
          <a class="row-card" href="${c.link}">
            <div class="row-strip" style="background:${color}"></div>
            <div class="row-badge-col">
              <span class="row-badge" style="background:${color}22;color:${color}">${roleIcon(role)} ${roleLabel(role)}</span>
            </div>
            <div class="row-id-col">${c.id || '—'}</div>
            <div class="row-title-col">${c.title || c.full}</div>
            <div class="row-prop-col">${props || '<span>—</span>'}</div>
            <span class="row-open">Öffnen ↗</span>
          </a>
          <div class="todo-rows">${myTodos.map(renderTodoRow).join('')}</div>
        </div>`;
        }).join('');
    }

    function applyFilter() {
        const q = root.querySelector('#dash-search').value.toLowerCase();
        const f = courses.filter(c =>
            c.full.toLowerCase().includes(q) || roleLabel(getCourseRole(c)).toLowerCase().includes(q)
        );
        renderStats(f);
        renderList(f);
    }

    root.querySelector('#dash-search').addEventListener('input', applyFilter);
    applyFilter();
}

/** Injects a yellow "content changed" banner below the stats row. */
function showDashboardStaleBanner(root) {
    if (root.querySelector('#dash-stale-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'dash-stale-banner';
    banner.style.cssText = 'background:#1a120a;border:1px solid #f59e0b;border-radius:8px;padding:10px 16px;margin:12px 36px 0;font-size:11px;color:#f59e0b;display:flex;align-items:center;justify-content:space-between;gap:12px';
    banner.innerHTML = `<span>🔄 Kursliste hat sich geändert!</span><button onclick="location.reload()" style="background:#f59e0b;border:none;border-radius:6px;color:#0a0a0c;font-size:10px;padding:4px 10px;cursor:pointer;font-weight:600">Neu laden</button>`;
    root.querySelector('.stats-row')?.after(banner);
}