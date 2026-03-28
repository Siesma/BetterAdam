// src/core/router.js

async function navigate(url, {pushState = true} = {}) {
    const absUrl = new URL(url, location.href).href;
    const pageType = getPageTypeFromUrl(absUrl);

    // Wipe current page immediately — no old content visible while fetching
    buildLoadingSkeleton();
    if (pushState) history.pushState({}, '', absUrl);

    if (pageType === 'dashboard') await routeDashboard(absUrl);
    else if (pageType === 'course') await routeCourse(absUrl);
    else location.href = absUrl;
}

async function routeDashboard(url) {
    const cached = cacheLoad(url);

    if (cached?.data) {
        buildDashboard(cached.data.courses, cached.data.semesters, cached.data.todos || []);
        const freshDoc = await fetchPage(url);
        if (!freshDoc) return;
        const courses = getCourses(freshDoc);
        const semesters = getSemesters(freshDoc);
        const todos = getTodos(freshDoc);
        const freshFp = dashboardFingerprint(courses);
        const enrichedCourses = await enrichAndAttach(courses, todos);
        cacheSave(url, {courses: enrichedCourses, semesters, todos}, freshFp);
        buildDashboard(enrichedCourses, semesters, todos);
        if (freshFp !== cached.fingerprint) {
            showDashboardStaleBanner(document.getElementById('ilias-dark-ui'));
        }
    } else {
        const freshDoc = await fetchPage(url);
        if (!freshDoc) {
            buildErrorPage('Dashboard konnte nicht geladen werden.');
            return;
        }
        const courses = getCourses(freshDoc);
        const semesters = getSemesters(freshDoc);
        const todos = getTodos(freshDoc);
        const enrichedCourses = await enrichAndAttach(courses, todos);
        buildDashboard(enrichedCourses, semesters, todos);
        cacheSave(url, {courses: enrichedCourses, semesters, todos}, dashboardFingerprint(courses));
    }
}

async function routeCourse(url) {
    const cached = cacheLoad(url);

    if (cached?.data) {
        buildCoursePage(cached.data, {fromCache: true});
        const freshDoc = await fetchPage(url);
        if (!freshDoc) return;
        const freshData = getCoursePageData(freshDoc);
        const freshFp = coursefingerprint(freshData);
        cacheSave(url, freshData, freshFp);
        if (freshFp !== cached.fingerprint) {
            buildCoursePage(freshData);
            showStaleBanner();
        } else {
            const banner = document.getElementById('cache-banner');
            if (banner) {
                banner.innerHTML = '<span>✓ Inhalte sind aktuell</span>';
                setTimeout(() => banner.remove(), 2000);
            }
        }
    } else {
        const freshDoc = await fetchPage(url);
        if (!freshDoc) {
            buildErrorPage('Kurs konnte nicht geladen werden.');
            return;
        }
        const freshData = getCoursePageData(freshDoc);
        buildCoursePage(freshData);
        cacheSave(url, freshData, coursefingerprint(freshData));
    }
}

function installLinkInterceptor() {
    document.addEventListener('click', e => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const a = e.target.closest('a[href]');
        if (!a) return;
        const href = a.getAttribute('href') || '';
        if (a.target === '_blank') return;
        if (a.hasAttribute('download')) return;
        if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('javascript:')) return;

        let absUrl;
        try {
            absUrl = new URL(href, location.href).href;
        } catch {
            return;
        }
        if (!absUrl.includes('adam.unibas.ch')) return;

        const skipCmds = ['leave', 'addToDesk', 'removeFromDesk', 'sendfile',
            'enableAdministrationPanel', 'edit', 'infoScreen'];
        const cmdParam = new URL(absUrl).searchParams.get('cmd') || '';
        if (skipCmds.some(c => cmdParam.includes(c))) return;
        if (/\/go\/file\//.test(absUrl) || absUrl.includes('sendfile')) return;

        e.preventDefault();
        navigate(absUrl);
    }, true);

    window.addEventListener('popstate', () => {
        navigate(location.href, {pushState: false});
    });
}

function buildLoadingSkeleton(message = 'Wird geladen…') {
    const root = nukePage();
    const dashUrl = 'https://adam.unibas.ch/ilias.php?baseClass=ilDashboardGUI&cmd=jumpToSelectedItems';
    root.innerHTML = `
<style>
${SHARED_CSS}
@keyframes shimmer{0%{background-position:-600px 0}100%{background-position:600px 0}}
#ilias-dark-ui .sk{background:linear-gradient(90deg,var(--surf2) 25%,var(--surf3) 50%,var(--surf2) 75%);background-size:600px 100%;animation:shimmer 1.4s infinite linear;border-radius:6px}
#ilias-dark-ui .skeleton-wrap{padding:28px 36px;display:flex;flex-direction:column;gap:10px}
</style>
<div class="dash-header">
  <a class="logo-link" href="${dashUrl}"><span class="logo-mark"></span> ADAM Dashboard</a>
  <div class="header-right"><span style="font-size:11px;color:var(--muted)">${message}</span></div>
</div>
<div class="skeleton-wrap">
  ${Array.from({length: 7}, (_, i) =>
        `<div class="sk" style="height:46px;width:100%;opacity:${1 - i * 0.1}"></div>`
    ).join('')}
</div>`;
}

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