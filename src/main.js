// ==UserScript==
// @name         BetterAdam — Dark Dashboard
// @description  Dark-themed ILIAS dashboard for adam.unibas.ch
// @match        https://adam.unibas.ch/*
// @grant        none
// @run-at       document-start
// @require      https://raw.githubusercontent.com/Siesma/BetterAdam/main/core/constants.js
// @require      https://raw.githubusercontent.com/Siesma/BetterAdam/main/core/utils.js
// @require      https://raw.githubusercontent.com/Siesma/BetterAdam/main/core/cache.js
// @require      https://raw.githubusercontent.com/Siesma/BetterAdam/main/data/dashboard-data.js
// @require      https://raw.githubusercontent.com/Siesma/BetterAdam/main/data/todo-enrichment.js
// @require      https://raw.githubusercontent.com/Siesma/BetterAdam/main/data/course-data.js
// @require      https://raw.githubusercontent.com/Siesma/BetterAdam/main/ui/dashboard-ui.js
// @require      https://raw.githubusercontent.com/Siesma/BetterAdam/main/ui/course-ui.js
// ==/UserScript==

/*
Removes flashbang when attempting to load
Runs at document-start before any pixel paints.
All required modules are loaded before this executes.
*/
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
            buildDashboard(cached.data.courses, cached.data.semesters, cached.data.todos || []);
            removeBlackout();
        }

        await waitFor('#il_center_col .il-item.il-std-item');
        const courses = getCourses();
        const semesters = getSemesters();
        const todos = getTodos();

        if (!cached?.data) {
            buildDashboard(courses, semesters, todos);
            removeBlackout();
        } else {
            const newFp = dashboardFingerprint(courses);
            if (newFp !== cached.fingerprint) {
                showDashboardStaleBanner(document.getElementById('ilias-dark-ui'));
            }
        }

        cacheSave(pageUrl, {courses, semesters, todos}, dashboardFingerprint(courses));

        if (todos.length) {
            const enriched = await enrichTodosWithCourseRef(todos);
            const enrichedCourses = attachTodosToCourses(courses, enriched);
            enrichedCourses.forEach((ec, i) => {
                courses[i] = ec;
            });
            buildDashboard(courses, semesters, todos);
        }

        const bodyObs = new MutationObserver(() => {
            const nc = getCourses();
            if (nc.length > 0) {
                bodyObs.disconnect();
                buildDashboard(nc, getSemesters(), getTodos());
            }
        });
        if (document.getElementById('ilias-dark-ui')) {
            bodyObs.observe(document.body, {childList: true, subtree: true});
        }

    } else if (pageType === 'course') {

        const cached = cacheLoad(pageUrl);
        if (cached?.data) {
            buildCoursePage(cached.data, {fromCache: true});
            removeBlackout();
        }

        await waitFor('#il_center_col .ilContainerBlock, #il_center_col .ilObjListRow, h1');
        await new Promise(r => setTimeout(r, 150));

        const freshData = getCoursePageData();
        const freshFp = coursefingerprint(freshData);

        if (!cached?.data) {
            buildCoursePage(freshData);
            removeBlackout();
        } else if (freshFp !== cached.fingerprint) {
            showStaleBanner();
        } else {
            const banner = document.getElementById('cache-banner');
            if (banner) {
                banner.innerHTML = `<span>✓ Inhalte sind aktuell</span>`;
                setTimeout(() => banner.remove(), 2000);
            }
        }

        cacheSave(pageUrl, freshData, freshFp);

    } else {
        removeBlackout();
        document.body.style.cssText = '';
        document.querySelectorAll('body > *').forEach(el => el.style.visibility = '');
    }
})();