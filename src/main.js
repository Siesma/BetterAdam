// ==UserScript==
// @name         BetterAdam — Dark Dashboard
// @description  Dark-themed ILIAS dashboard for adam.unibas.ch
// @match        https://adam.unibas.ch/*
// @grant        none
// @run-at       document-start
// @require      https://raw.githubusercontent.com/Siesma/BetterAdam/main/src/core/constants.js
// @require      https://raw.githubusercontent.com/Siesma/BetterAdam/main/src/core/utils.js
// @require      https://raw.githubusercontent.com/Siesma/BetterAdam/main/src/core/cache.js
// @require      https://raw.githubusercontent.com/Siesma/BetterAdam/main/src/core/router.js
// @require      https://raw.githubusercontent.com/Siesma/BetterAdam/main/src/data/dashboard-data.js
// @require      https://raw.githubusercontent.com/Siesma/BetterAdam/main/src/data/todo-enrichment.js
// @require      https://raw.githubusercontent.com/Siesma/BetterAdam/main/src/data/course-data.js
// @require      https://raw.githubusercontent.com/Siesma/BetterAdam/main/src/ui/dashboard-ui.js
// @require      https://raw.githubusercontent.com/Siesma/BetterAdam/main/src/ui/course-ui.js
// ==/UserScript==

(function injectBlackout() {
    const s = document.createElement('style');
    s.id = 'ilias-blackout';
    s.textContent = `html{background:#0a0a0c!important}body>*:not(#ilias-dark-ui){visibility:hidden!important}`;
    document.documentElement.appendChild(s);
})();

(async function boot() {
    cacheNukeOld(); // remove old-prefix entries, safe to keep permanently

    const pageType = getPageType();
    const pageUrl = location.href;

    if (pageType === 'dashboard') {
        const cached = cacheLoad(pageUrl);

        if (cached?.data) {
            buildDashboard(cached.data.courses, cached.data.semesters, cached.data.todos || []);
            removeBlackout();
            installLinkInterceptor();

            const freshDoc = await fetchPage(pageUrl);
            if (freshDoc) {
                const courses = getCourses(freshDoc);
                const semesters = getSemesters(freshDoc);
                const todos = getTodos(freshDoc);
                const freshFp = dashboardFingerprint(courses);
                const enrichedCourses = await enrichAndAttach(courses, todos);
                cacheSave(pageUrl, {courses: enrichedCourses, semesters, todos}, freshFp);
                buildDashboard(enrichedCourses, semesters, todos);
                if (freshFp !== cached.fingerprint) {
                    showDashboardStaleBanner(document.getElementById('ilias-dark-ui'));
                }
            }
        } else {
            await waitFor('#il_center_col .il-item.il-std-item');
            const courses = getCourses();
            const semesters = getSemesters();
            const todos = getTodos();
            buildDashboard(courses, semesters, todos);
            removeBlackout();
            installLinkInterceptor();
            const enrichedCourses = await enrichAndAttach(courses, todos);
            buildDashboard(enrichedCourses, semesters, todos);
            cacheSave(pageUrl, {courses: enrichedCourses, semesters, todos}, dashboardFingerprint(courses));
        }

    } else if (pageType === 'course') {
        const cached = cacheLoad(pageUrl);

        if (cached?.data) {
            buildCoursePage(cached.data, {fromCache: true});
            removeBlackout();
            installLinkInterceptor();

            const freshDoc = await fetchPage(pageUrl);
            if (freshDoc) {
                const freshData = getCoursePageData(freshDoc);
                const freshFp = coursefingerprint(freshData);
                cacheSave(pageUrl, freshData, freshFp);
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
            }
        } else {
            await waitFor('#il_center_col .ilContainerBlock, #il_center_col .ilObjListRow, h1');
            await new Promise(r => setTimeout(r, 150));
            const freshData = getCoursePageData();
            buildCoursePage(freshData);
            removeBlackout();
            installLinkInterceptor();
            cacheSave(pageUrl, freshData, coursefingerprint(freshData));
        }

    } else {
        removeBlackout();
        document.body.style.cssText = '';
        document.querySelectorAll('body > *').forEach(el => el.style.visibility = '');
    }
})();