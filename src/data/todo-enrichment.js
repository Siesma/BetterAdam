// =============================================================
// data/todo-enrichment.js
// Fetches each exercise page to find which course a todo belongs
// to, then attaches matched todos onto their course objects.
// =============================================================

/**
 * For each unique excId in todos, fetches the exercise page and
 * reads the breadcrumb to find the parent course's ref_id.
 * Returns a new array with courseRefId added to each todo.
 */
async function enrichTodosWithCourseRef(todos) {
    // Group todos by excId — only fetch each exercise page once
    const byExcId = {};
    todos.forEach(t => {
        if (!t.excId) return;
        (byExcId[t.excId] = byExcId[t.excId] || []).push(t);
    });

    const enriched = [...todos];

    await Promise.all(Object.entries(byExcId).map(async ([excId, group]) => {
        try {
            const res = await fetch(`https://adam.unibas.ch/go/exc/${excId}`, {credentials: 'include'});
            if (!res.ok) return;
            const doc = new DOMParser().parseFromString(await res.text(), 'text/html');

            // Walk breadcrumb links looking for /go/crs/XXXXXXX
            let courseRefId = null;
            doc.querySelectorAll('#il_breadcrumbs a, .breadcrumb a, .breadcrumb .crumb a').forEach(a => {
                const m = a.href.match(/\/go\/crs\/(\d+)/);
                if (m) courseRefId = m[1];
            });

            group.forEach(t => {
                const idx = enriched.findIndex(e => e === t);
                if (idx !== -1) enriched[idx] = {...t, courseRefId};
            });
        } catch { /* network error — skip silently */
        }
    }));

    return enriched;
}

/**
 * Returns a new courses array where each course has a `todos` property
 * containing all matching to-do items.
 *
 * Matching order:
 *   1. courseRefId from enrichment matches course link ref_id
 *   2. Fallback: course number prefix (e.g. "10904") found in todo label
 */
function attachTodosToCourses(courses, todos) {
    return courses.map(course => {
        const refMatch = course.link.match(/\/go\/crs\/(\d+)/) || course.link.match(/ref_id=(\d+)/);
        const courseRef = refMatch ? refMatch[1] : null;

        const myTodos = todos.filter(t => {
            if (!courseRef) return false;
            if (t.courseRefId === courseRef) return true;
            // Fallback: match on the numeric course-number prefix
            if (course.id) {
                const prefix = course.id.split('-')[0];
                if (t.label.includes(prefix)) return true;
            }
            return false;
        });

        return {...course, todos: myTodos};
    });
}