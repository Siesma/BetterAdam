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

// Instant blackout — runs before any pixel paints
(function injectBlackout() {
    const s = document.createElement('style');
    s.id = 'ilias-blackout';
    s.textContent = `html{background:#0a0a0c!important}body>*:not(#ilias-dark-ui){visibility:hidden!important}`;
    document.documentElement.appendChild(s);
})();

(async function boot() {
    const pageType = getPageType();
    const pageUrl = location.href;

    if (pageType === 'dashboard') {
        const cached = cacheLoad(pageUrl);

        if (cached?.data) {
            // Instant render from cache
            buildDashboard(cached.data.courses, cached.data.semesters, cached.data.todos || []);
            removeBlackout();
            // Install interceptor NOW so all subsequent clicks are instant
            installLinkInterceptor();

            // Background refresh
            const freshDoc = await fetchPage(pageUrl);
            if (freshDoc) {
                const courses = getCourses(freshDoc);
                const semesters = getSemesters(freshDoc);
                const todos = getTodos(freshDoc);
                const freshFp = dashboardFingerprint(courses);
                if (freshFp !== cached.fingerprint) {
                    buildDashboard(courses, semesters, todos);
                    showDashboardStaleBanner(document.getElementById('ilias-dark-ui'));
                }
                cacheSave(pageUrl, {courses, semesters, todos}, freshFp);
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
            // First ever visit — wait for ILIAS DOM, extract, render, cache
            await waitFor('#il_center_col .il-item.il-std-item');
            const courses = getCourses();
            const semesters = getSemesters();
            const todos = getTodos();
            buildDashboard(courses, semesters, todos);
            removeBlackout();
            installLinkInterceptor();
            cacheSave(pageUrl, {courses, semesters, todos}, dashboardFingerprint(courses));
            if (todos.length) {
                const enriched = await enrichTodosWithCourseRef(todos);
                const enrichedCourses = attachTodosToCourses(courses, enriched);
                enrichedCourses.forEach((ec, i) => {
                    courses[i] = ec;
                });
                buildDashboard(courses, semesters, todos);
                cacheSave(pageUrl, {courses, semesters, todos}, dashboardFingerprint(courses));
            }
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
                cacheSave(pageUrl, freshData, freshFp);
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
        // Login page, other pages — restore normal view
        removeBlackout();
        document.body.style.cssText = '';
        document.querySelectorAll('body > *').forEach(el => el.style.visibility = '');
    }
})();