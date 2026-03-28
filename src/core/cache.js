// =============================================================
// core/cache.js
// localStorage-based cache for instant re-renders.
// =============================================================

const CACHE_PREFIX = 'ilias_cache_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

// Bump this number any time the cached data shape changes.
// All entries with an older version are ignored and evicted.
const CACHE_VERSION = 3;

/** Stable cache key from URL (strips fragment). */
function cacheKey(url) {
    try {
        const u = new URL(url);
        return CACHE_PREFIX + u.pathname + u.search;
    } catch {
        return CACHE_PREFIX + url;
    }
}

/** Returns { data, fingerprint, ts } or null if missing/expired/stale-version. */
function cacheLoad(url) {
    try {
        const raw = localStorage.getItem(cacheKey(url));
        if (!raw) return null;
        const entry = JSON.parse(raw);
        // Evict if wrong version or expired
        if (entry.v !== CACHE_VERSION || Date.now() - entry.ts > CACHE_TTL_MS) {
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
    const value = JSON.stringify({data, fingerprint: fp, ts: Date.now(), v: CACHE_VERSION});
    try {
        localStorage.setItem(cacheKey(url), value);
    } catch {
        try {
            // Quota exceeded — evict 5 oldest BetterAdam entries and retry
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

/** Wipes every BetterAdam cache entry. Call when data shape changes. */
function cacheNuke() {
    Object.keys(localStorage)
        .filter(k => k.startsWith(CACHE_PREFIX))
        .forEach(k => localStorage.removeItem(k));
}

/** Fingerprint of course-page data. */
function coursefingerprint(data) {
    return JSON.stringify(data).length + '|' + (data.sections || []).map(s => s.items.length).join(',');
}

/** Fingerprint of the dashboard course list (ignores todos so todo changes don't force a re-render banner). */
function dashboardFingerprint(courses) {
    return courses.map(c => c.id + c.title).join('|');
}