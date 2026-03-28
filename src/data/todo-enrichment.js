// src/data/todo-enrichment.js

async function enrichTodosWithCourseRef(todos) {
    const byExcId = {};
    todos.forEach(t => {
        if (!t.excId) return;
        (byExcId[t.excId] = byExcId[t.excId] || []).push(t);
    });

    // Work on a shallow copy so we don't mutate the originals
    const enriched = todos.map(t => ({...t}));

    await Promise.all(Object.entries(byExcId).map(async ([excId, group]) => {
        try {
            const res = await fetch(`https://adam.unibas.ch/go/exc/${excId}`, {credentials: 'include'});
            if (!res.ok) return;
            const doc = new DOMParser().parseFromString(await res.text(), 'text/html');

            let courseRefId = null;
            doc.querySelectorAll('.breadcrumb .crumb a').forEach(a => {
                const m = (a.href || '').match(/\/go\/crs\/(\d+)/);
                if (m) courseRefId = m[1];
            });

            // Match by href+label (not object identity, which breaks on copies)
            group.forEach(orig => {
                const idx = enriched.findIndex(e => e.href === orig.href && e.label === orig.label);
                if (idx !== -1) enriched[idx].courseRefId = courseRefId;
            });
        } catch {
        }
    }));

    return enriched;
}

function attachTodosToCourses(courses, todos) {
    return courses.map(course => {
        const refMatch = (course.link || '').match(/\/go\/crs\/(\d+)/) ||
            (course.link || '').match(/ref_id=(\d+)/);
        const courseRef = refMatch ? refMatch[1] : null;

        const myTodos = todos.filter(t => {
            if (!courseRef) return false;
            if (t.courseRefId && t.courseRefId === courseRef) return true;
            if (course.id) {
                const prefix = course.id.split('-')[0];
                if (t.label && t.label.includes(prefix)) return true;
            }
            return false;
        });

        return {...course, todos: myTodos};
    });
}

async function enrichAndAttach(courses, todos) {
    if (!todos.length) return courses.map(c => ({...c, todos: []}));
    const enriched = await enrichTodosWithCourseRef(todos);
    return attachTodosToCourses(courses, enriched);
}