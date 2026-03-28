// =============================================================
// core/cache.js
// localStorage-based cache for instant re-renders.
//
// Strategy:
//   1. On page load, render cached data immediately (zero latency).
//   2. Fetch live DOM in the background.
//   3. Fingerprint fresh data — if changed, show a "reload" banner.
//   4. Always persist the fresh data for next visit.
//
// Entries auto-expire after CACHE_TTL_MS (default 1 week).
// If localStorage is full, the oldest BetterAdam entries are evicted.
// =============================================================

const CACHE_PREFIX = 'ilias_cache_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

/** Stable cache key from URL (strips fragment). */
function cacheKey(url) {
    try {
        const u = new URL(url);
        return CACHE_PREFIX + u.pathname + u.search;
    } catch {
        return CACHE_PREFIX + url;
    }
}

/** Returns { data, fingerprint, ts } or null if missing/expired. */
function cacheLoad(url) {
    try {
        const raw = localStorage.getItem(cacheKey(url));
        if (!raw) return null;
        const entry = JSON.parse(raw);
        if (Date.now() - entry.ts > CACHE_TTL_MS) {
            localStorage.removeItem(cacheKey(url));
            return null;
        }
        return entry;
    } catch {
        return null;
    }
}

/** Persists data + fingerprint. Evicts oldest entries on quota errors. */
function cacheSave(url, data, fp) {
    const value = JSON.stringify({data, fingerprint: fp, ts: Date.now()});
    try {
        localStorage.setItem(cacheKey(url), value);
    } catch {
        // Quota exceeded — evict the 5 oldest BetterAdam entries and retry once
        try {
            Object.keys(localStorage)
                .filter(k => k.startsWith(CACHE_PREFIX))
                .sort((a, b) => {
                    const tsA = JSON.parse(localStorage.getItem(a) || '{}').ts || 0;
                    const tsB = JSON.parse(localStorage.getItem(b) || '{}').ts || 0;
                    return tsA - tsB;
                })
                .slice(0, 5)
                .forEach(k => localStorage.removeItem(k));
            localStorage.setItem(cacheKey(url), value);
        } catch { /* give up silently */
        }
    }
}

/** Lightweight fingerprint of course-page data to detect content changes. */
function coursefingerprint(data) {
    return JSON.stringify(data).length + '|' + (data.sections || []).map(s => s.items.length).join(',');
}

/** Lightweight fingerprint of the dashboard course list. */
function dashboardFingerprint(courses) {
    return courses.map(c => c.id + c.title).join('|');
}