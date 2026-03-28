// src/core/cache.js

const CACHE_PREFIX = 'ba_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CACHE_VERSION = 4;

function cacheKey(url) {
    try {
        const u = new URL(url);
        return CACHE_PREFIX + u.pathname + u.search;
    } catch {
        return CACHE_PREFIX + url;
    }
}

function cacheLoad(url) {
    try {
        const raw = localStorage.getItem(cacheKey(url));
        if (!raw) return null;
        const entry = JSON.parse(raw);
        if (entry.v !== CACHE_VERSION || Date.now() - entry.ts > CACHE_TTL_MS) {
            localStorage.removeItem(cacheKey(url));
            return null;
        }
        return entry;
    } catch {
        return null;
    }
}

function cacheSave(url, data, fp) {
    const value = JSON.stringify({data, fingerprint: fp, ts: Date.now(), v: CACHE_VERSION});
    try {
        localStorage.setItem(cacheKey(url), value);
    } catch {
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
        } catch {
        }
    }
}

function cacheNukeOld() {
    ['ilias_cache_', 'ba_cache_'].forEach(prefix => {
        Object.keys(localStorage)
            .filter(k => k.startsWith(prefix))
            .forEach(k => localStorage.removeItem(k));
    });
}

function coursefingerprint(data) {
    return (data.sections || [])
        .map(s => s.heading + '|' + s.items.map(i => i.label).join(','))
        .join('\n');
}

function dashboardFingerprint(courses) {
    return courses.map(c => c.id + '|' + c.link).join('\n');
}