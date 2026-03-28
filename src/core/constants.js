// =============================================================
// core/constants.js
// Shared CSS, design tokens, and role lookup tables.
// =============================================================

const SHARED_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@600;700;800&display=swap');
  html,body{background:#0a0a0c!important;overflow:auto!important;height:auto!important;margin:0!important;padding:0!important}
  #ilias-dark-ui{
    --bg:#0a0a0c;--surface:#111115;--surf2:#18181e;--surf3:#222228;
    --border:#2a2a34;--accent:#e8ff6b;--text:#e8e8f0;--muted:#6b6b80;
    --kurs:#10b981;--ta:#a78bfa;--gruppe:#3b82f6;--todo:#f59e0b;
    font-family:'DM Mono',monospace;background:var(--bg);color:var(--text);padding-bottom:80px;
  }
  #ilias-dark-ui *{box-sizing:border-box;margin:0;padding:0}
  #ilias-dark-ui .dash-header{
    background:var(--surface);border-bottom:1px solid var(--border);
    padding:18px 36px;display:flex;align-items:center;justify-content:space-between;
    position:sticky;top:0;z-index:200;
  }
  #ilias-dark-ui .logo-link{
    display:flex;align-items:center;gap:10px;text-decoration:none;
    font-family:'Syne',sans-serif;font-weight:800;font-size:18px;letter-spacing:-.5px;color:var(--text);
  }
  #ilias-dark-ui .logo-mark{display:inline-block;width:24px;height:24px;background:var(--accent);border-radius:6px;flex-shrink:0}
  #ilias-dark-ui .header-right{display:flex;align-items:center;gap:10px}
  #ilias-dark-ui .count-pill{font-size:11px;color:var(--muted);background:var(--surf2);border:1px solid var(--border);border-radius:20px;padding:3px 11px}
  #ilias-dark-ui .back-btn{font-family:'DM Mono',monospace;font-size:11px;color:var(--muted);background:var(--surf2);border:1px solid var(--border);border-radius:7px;padding:5px 12px;text-decoration:none;transition:color .12s,border-color .12s}
  #ilias-dark-ui .back-btn:hover{color:var(--accent);border-color:var(--accent)}
  ::-webkit-scrollbar{width:5px;height:5px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:#2a2a34;border-radius:3px}
`;


const ROLE_LABEL = {kurs: 'Kurs', ta: 'TA-Session', gruppe: 'Gruppe'};
const ROLE_COLOR = {kurs: '#10b981', ta: '#a78bfa', gruppe: '#3b82f6'};
const ROLE_ICON = {kurs: '◆', ta: '◇', gruppe: '◈'};

const MISSING_LABEL = 'Undefined'
const MISSING_COLOR = '#10b981'
const MISSING_ICON = '◆'

const roleLabel = r => ROLE_LABEL[r] || MISSING_LABEL
const roleColor = r => ROLE_COLOR[r] || MISSING_COLOR
const roleIcon = r => ROLE_ICON[r] || MISSING_ICON


function typeEmoji(type) {
    const t = (type || '').toLowerCase();
    if (t.includes('ordner') || t === 'folder') return '📁';
    if (t.includes('übung') || t === 'exercise') return '📋';
    if (t.includes('datei') || t === 'file') return '📄';
    if (t.includes('forum')) return '💬';
    if (t.includes('wiki')) return '📖';
    if (t.includes('test') || t.includes('quiz')) return '✏️';
    if (t.includes('video')) return '▶️';
    if (t.includes('link') || t.includes('url')) return '🔗';
    return '▸';
}

function typeColor(type) {
    const t = (type || '').toLowerCase();
    if (t.includes('übung') || t === 'exercise') return 'var(--todo)';
    if (t.includes('ordner')) return 'var(--gruppe)';
    if (t.includes('datei')) return 'var(--ta)';
    return 'var(--muted)';
}

const DASHBOARD_URL = 'https://adam.unibas.ch/ilias.php?baseClass=ilDashboardGUI&cmd=jumpToSelectedItems';