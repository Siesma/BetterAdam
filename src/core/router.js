// =============================================================
// core/router.js
// Client-side SPA router.
//
// Intercepts all internal link clicks, prevents full-page
// navigation, and calls navigate(url) instead. The browser
// never makes a visible page request after the first load.
//
// History API keeps the URL bar and back/forward working.
// =============================================================

/**
 * The central navigate function. Call this instead of location.href.
 *   - Updates the URL bar via pushState
 *   - Shows cached content immediately if available
 *   - Fetches fresh content in the background
 *   - Calls the appropriate page builder based on URL
 */
async function navigate(url, {pushState = true} = {}) {
    // Normalise to absolute URL
    const absUrl = new URL(url, location.href).href;

    if (pushState) history.pushState({}, '', absUrl);

    const pageType = getPageTypeFromUrl(absUrl);

    if (pageType === 'dashboard') {
        await routeDashboard(absUrl);
    } else if (pageType === 'course') {
        await routeCourse(absUrl);
    } else {
        // External or unknown — let the browser handle it normally
        location.href = absUrl;
    }
}

/** Same logic as getPageType() but works on any URL string, not just location. */
function getPageTypeFromUrl(url) {
    try {
        const base = (new URL(url).searchParams.get('baseClass') || '').toLowerCase();
        if (base === 'ildashboardgui') return 'dashboard';
        if (base === 'ilrepositorygui') return 'course';
        // Also handle /go/crs/ and /go/fold/ shortcut URLs
        if (/\/go\/(crs|fold|exc|grp)\//.test(url)) return 'course';
    } catch {
    }
    return 'other';
}

async function routeDashboard(url) {
    const cached = cacheLoad(url);

    if (cached?.data) {
        buildDashboard(cached.data.courses, cached.data.semesters, cached.data.todos || []);
        // Background refresh
        const freshDoc = await fetchPage(url);
        if (freshDoc) {
            const courses = getCourses(freshDoc);
            const semesters = getSemesters(freshDoc);
            const todos = getTodos(freshDoc);
            const freshFp = dashboardFingerprint(courses);
            if (freshFp !== cached.fingerprint) {
                buildDashboard(courses, semesters, todos);
                showDashboardStaleBanner(document.getElementById('ilias-dark-ui'));
            }
            cacheSave(url, {courses, semesters, todos}, freshFp);
            if (todos.length) {
                const enriched = await enrichTodosWithCourseRef(todos);
                const enrichedCourses = attachTodosToCourses(courses, enriched);
                enrichedCourses.forEach((ec, i) => {
                    courses[i] = ec;
                });
                buildDashboard(courses, semesters, todos);
            }
        }
    } else {
        // No cache — show a loading skeleton, fetch, then render
        buildLoadingSkeleton('Dashboard wird geladen…');
        const freshDoc = await fetchPage(url);
        if (freshDoc) {
            const courses = getCourses(freshDoc);
            const semesters = getSemesters(freshDoc);
            const todos = getTodos(freshDoc);
            buildDashboard(courses, semesters, todos);
            cacheSave(url, {courses, semesters, todos}, dashboardFingerprint(courses));
        } else {
            buildErrorPage('Dashboard konnte nicht geladen werden.');
        }
    }
}

async function routeCourse(url) {
    const cached = cacheLoad(url);

    if (cached?.data) {
        buildCoursePage(cached.data, {fromCache: true});
        // Background refresh
        const freshDoc = await fetchPage(url);
        if (freshDoc) {
            const freshData = getCoursePageData(freshDoc);
            const freshFp = coursefingerprint(freshData);
            if (freshFp !== cached.fingerprint) {
                buildCoursePage(freshData);
                showStaleBanner();
            } else {
                const banner = document.getElementById('cache-banner');
                if (banner) {
                    banner.innerHTML = `<span>✓ Inhalte sind aktuell</span>`;
                    setTimeout(() => banner.remove(), 2000);
                }
            }
            cacheSave(url, freshData, freshFp);
        }
    } else {
        buildLoadingSkeleton('Kurs wird geladen…');
        const freshDoc = await fetchPage(url);
        if (freshDoc) {
            const freshData = getCoursePageData(freshDoc);
            buildCoursePage(freshData);
            cacheSave(url, freshData, coursefingerprint(freshData));
        } else {
            buildErrorPage('Kurs konnte nicht geladen werden.');
        }
    }
}

/**
 * Intercepts all clicks on internal adam.unibas.ch links.
 * Skips: external links, download links, links with modifiers held,
 *        links that open new tabs, and ILIAS action buttons.
 */
function installLinkInterceptor() {
    document.addEventListener('click', e => {
        // Only plain left-clicks with no modifiers
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        const a = e.target.closest('a[href]');
        if (!a) return;

        const href = a.getAttribute('href') || '';

        // Let browser handle: new-tab targets, download links, anchors, mailto, javascript:
        if (a.target === '_blank') return;
        if (a.hasAttribute('download')) return;
        if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('javascript:')) return;

        // Only intercept adam.unibas.ch links
        let absUrl;
        try {
            absUrl = new URL(href, location.href).href;
        } catch {
            return;
        }
        if (!absUrl.includes('adam.unibas.ch')) return;

        // Skip ILIAS action/command links that aren't page navigations
        // (these do things like add to favourites, leave course, etc.)
        const skipCmds = ['leave', 'addToDesk', 'removeFromDesk', 'sendfile',
            'enableAdministrationPanel', 'edit', 'infoScreen'];
        const cmdParam = new URL(absUrl).searchParams.get('cmd') || '';
        if (skipCmds.some(c => cmdParam.includes(c))) return;

        // Skip file downloads (/go/file/ or sendfile cmd)
        if (/\/go\/file\//.test(absUrl) || absUrl.includes('sendfile')) return;

        // This is a navigation we can handle — intercept it
        e.preventDefault();
        navigate(absUrl);
    }, true); // capture phase so we get it before any ILIAS handlers

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
        navigate(location.href, {pushState: false});
    });
}

/** Loading skeleton shown while fetching on cache miss. */
function buildLoadingSkeleton(message = 'Wird geladen…') {
    const root = nukePage();
    const dashUrl = 'https://adam.unibas.ch/ilias.php?baseClass=ilDashboardGUI&cmd=jumpToSelectedItems';
    root.innerHTML = `
<style>
${SHARED_CSS}
@keyframes shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
#ilias-dark-ui .sk{background:linear-gradient(90deg,var(--surf2) 25%,var(--surf3) 50%,var(--surf2) 75%);background-size:600px 100%;animation:shimmer 1.4s infinite linear;border-radius:6px}
#ilias-dark-ui .skeleton-wrap{padding:28px 36px;display:flex;flex-direction:column;gap:10px}
#ilias-dark-ui .skeleton-label{font-size:11px;color:var(--muted);margin-bottom:4px}
</style>
<div class="dash-header">
  <a class="logo-link" href="${dashUrl}"><span class="logo-mark"></span> ADAM Dashboard</a>
  <div class="header-right"><span style="font-size:11px;color:var(--muted)">${message}</span></div>
</div>
<div class="skeleton-wrap">
  ${Array.from({length: 6}, (_, i) => `
    <div class="sk" style="height:48px;width:100%;opacity:${1 - i * 0.12}"></div>
  `).join('')}
</div>`;
}

/** Error page shown if fetch fails entirely. */
function buildErrorPage(message) {
    const root = nukePage();
    const dashUrl = 'https://adam.unibas.ch/ilias.php?baseClass=ilDashboardGUI&cmd=jumpToSelectedItems';
    root.innerHTML = `
<style>${SHARED_CSS}</style>
<div class="dash-header">
  <a class="logo-link" href="${dashUrl}"><span class="logo-mark"></span> ADAM Dashboard</a>
</div>
<div style="padding:60px 36px;text-align:center;color:var(--muted);font-size:13px">
  <div style="font-size:32px;margin-bottom:12px">⚠️</div>
  ${message}<br><br>
  <a href="${dashUrl}" style="color:var(--accent);font-size:11px">← Zurück zum Dashboard</a>
</div>`;
}