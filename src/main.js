// ==UserScript==
// @name         BetterAdam — Dark Dashboard
// @description  Dark-themed ILIAS dashboard for adam.unibas.ch
// @match        https://adam.unibas.ch/*
// @grant        none
// @run-at       document-start
// @require      https://raw.githubusercontent.com/Siesma/BetterAdam/main/src/core/constants.js
// @require      https://raw.githubusercontent.com/Siesma/BetterAdam/main/src/core/utils.js
// @require      https://raw.githubusercontent.com/Siesma/BetterAdam/main/src/core/cache.js
// @require      https://raw.githubusercontent.com/Siesma/BetterAdam/main/src/data/dashboard-data.js
// @require      https://raw.githubusercontent.com/Siesma/BetterAdam/main/src/data/todo-enrichment.js
// @require      https://raw.githubusercontent.com/Siesma/BetterAdam/main/src/data/course-data.js
// @require      https://raw.githubusercontent.com/Siesma/BetterAdam/main/src/ui/dashboard-ui.js
// @require      https://raw.githubusercontent.com/Siesma/BetterAdam/main/src/ui/course-ui.js
// ==/UserScript==

/*
  HOW THE CACHING WORKS
  ─────────────────────
  On first visit to any page:
    1. Nothing in cache → wait for background fetch → render → save to cache.

  On every subsequent visit:
    1. Render from cache INSTANTLY (user sees content immediately, no spinner).
    2. Simultaneously fire a background fetch() of the same URL.
    3. Parse the fetched HTML and extract data — the live page never loads visibly.
    4. Compare fingerprints:
         • Same  → cache is fresh, do nothing.
         • Different → show "🔄 Neue Inhalte" banner so user can reload.
    5. Always save the fresh data to cache for next time.

  The user never sees the ILIAS loading spinner again after the first visit.
*/

// Instant blackout before any pixel paints
(function injectBlackout() {
    const s = document.createElement('style');
    s.id = 'ilias-blackout';
    s.textContent = `html{background:#0a0a0c!important}body>*:not(#ilias-dark-ui){visibility:hidden!important}`;
    document.documentElement.appendChild(s);
})();

(async function boot() {
    const pageType = getPageType();
    const pageUrl = location.href;

    // ── DASHBOARD ─────────────────────────────────────────────
    if (pageType === 'dashboard') {
        const cached = cacheLoad(pageUrl);

        if (cached?.data) {
            // ── CACHE HIT: render instantly, fetch in background ──
            buildDashboard(cached.data.courses, cached.data.semesters, cached.data.todos || []);
            removeBlackout();

            // Fire background fetch — user is already looking at cached content
            const freshDoc = await fetchPage(pageUrl);
            if (freshDoc) {
                const courses = getCourses(freshDoc);
                const semesters = getSemesters(freshDoc);
                const todos = getTodos(freshDoc);
                const freshFp = dashboardFingerprint(courses);

                if (freshFp !== cached.fingerprint) {
                    // Content changed — show banner, re-render with fresh data
                    buildDashboard(courses, semesters, todos);
                    showDashboardStaleBanner(document.getElementById('ilias-dark-ui'));
                }

                cacheSave(pageUrl, {courses, semesters, todos}, freshFp);

                // Still enrich todos even on cache hit
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
            // ── CACHE MISS: must wait for the live DOM this one time ──
            // We use the live DOM here because this is the first-ever visit
            // and there's no cache to show. After this, every visit is instant.
            await waitFor('#il_center_col .il-item.il-std-item');
            const courses = getCourses();
            const semesters = getSemesters();
            const todos = getTodos();

            buildDashboard(courses, semesters, todos);
            removeBlackout();
            cacheSave(pageUrl, {courses, semesters, todos}, dashboardFingerprint(courses));

            if (todos.length) {
                const enriched = await enrichTodosWithCourseRef(todos);
                const enrichedCourses = attachTodosToCourses(courses, enriched);
                enrichedCourses.forEach((ec, i) => {
                    courses[i] = ec;
                });
                buildDashboard(courses, semesters, todos);
                // Update cache with enriched todo data
                cacheSave(pageUrl, {courses, semesters, todos}, dashboardFingerprint(courses));
            }
        }

        // Watch for ILIAS AJAX semester tab switches (they replace the DOM in-place)
        // Only needed on cache-miss path where ILIAS DOM is still alive
        if (!cacheLoad(pageUrl)?.data) {
            let rebuilding = false;
            const bodyObs = new MutationObserver(() => {
                if (rebuilding) return;
                const nc = getCourses();
                if (nc.length > 0) {
                    rebuilding = true;
                    bodyObs.disconnect();
                    buildDashboard(nc, getSemesters(), getTodos());
                }
            });
            bodyObs.observe(document.body, {childList: true, subtree: true});
        }

        // ── COURSE PAGE ───────────────────────────────────────────
    } else if (pageType === 'course') {
        const cached = cacheLoad(pageUrl);

        if (cached?.data) {
            // ── CACHE HIT: render instantly, fetch in background ──
            buildCoursePage(cached.data, {fromCache: true});
            removeBlackout();

            const freshDoc = await fetchPage(pageUrl);
            if (freshDoc) {
                const freshData = getCoursePageData(freshDoc);
                const freshFp = coursefingerprint(freshData);

                if (freshFp !== cached.fingerprint) {
                    // Content changed — re-render and show banner
                    buildCoursePage(freshData);
                    showStaleBanner();
                } else {
                    // Same content — dismiss the "loading" indicator quietly
                    const banner = document.getElementById('cache-banner');
                    if (banner) {
                        banner.innerHTML = `<span>✓ Inhalte sind aktuell</span>`;
                        setTimeout(() => banner.remove(), 2000);
                    }
                }

                cacheSave(pageUrl, freshData, freshFp);
            }

        } else {
            // ── CACHE MISS: wait for live DOM ──
            await waitFor('#il_center_col .ilContainerBlock, #il_center_col .ilObjListRow, h1');
            await new Promise(r => setTimeout(r, 150));

            const freshData = getCoursePageData();
            buildCoursePage(freshData);
            removeBlackout();
            cacheSave(pageUrl, freshData, coursefingerprint(freshData));
        }

        // ── OTHER (login page etc.) ───────────────────────────────
    } else {
        removeBlackout();
        document.body.style.cssText = '';
        document.querySelectorAll('body > *').forEach(el => el.style.visibility = '');
    }
})();