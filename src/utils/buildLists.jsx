  export function prepareActivitiesList(rawActivities, lang, paramActivity) {
    // Normalize ActivityId comparison (string/number tolerant)
    const normalizeId = (v) => (v != null ? String(v) : "");

    const paramId = normalizeId(paramActivity);

    // Find the selected activity (if any)
    const selected = rawActivities.find(a => normalizeId(a.ActivityId) === paramId);

    // Get core activities
    const byId = new Map();
    for (const a of rawActivities) {
        if (a.CoreActivity) byId.set(normalizeId(a.ActivityId), a);
    }

    // If selected exists and is non-core, include it too
    if (selected && !selected.CoreActivity) {
        byId.set(normalizeId(selected.ActivityId), selected);
    }

    // Build list and sort (core first, then alpha by localized name)
    const list = Array.from(byId.values()).sort((a, b) => {
        if (a.CoreActivity !== b.CoreActivity) return a.CoreActivity ? -1 : 1;
        const nameA = a[`ActivityName_${lang}`]?.toLowerCase() || "";
        const nameB = b[`ActivityName_${lang}`]?.toLowerCase() || "";
        return nameA.localeCompare(nameB);
    });

    const label = lang === "es" ? "- Seleccione Uno -" : "- Select One -";
    const localized = [
        {
        ActivityId: "0",
        [`ActivityName_${lang}`]: label,
        CoreActivity: false,
        },
        ...list,
    ];

    return localized;
}

export function prepareProgramsList(rawPrograms, lang) {
      
        const sorted = [...rawPrograms].sort((a, b) => {
            const nameA = a[`ProgramName`]?.toLowerCase() || '';
            const nameB = b[`ProgramName`]?.toLowerCase() || '';
            return nameA.localeCompare(nameB);
        })
      
        const localized = [
            {
                ProgramId: "0",
                ProgramName: lang === 'es' ? "Ninguno" : "None"
            },
            ...sorted
        ]
  
    return localized;
}