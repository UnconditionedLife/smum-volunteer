export function prepareActivitiesList(rawActivities, lang) {
    const sorted = [...rawActivities].sort((a, b) => {
        // Sort core activities first
        if (a.CoreActivity !== b.CoreActivity) {
            return a.CoreActivity ? -1 : 1;
        }
        
        // Then alphabetically by language
        const nameA = a[`ActivityName_${lang}`]?.toLowerCase() || '';
        const nameB = b[`ActivityName_${lang}`]?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
        })

        const label = lang === 'es' ? '- Seleccione Uno -' : '- Select One -';
        const localized = [
            {
                ActivityId: "0",
                [`ActivityName_${lang}`]: label,
                CoreActivity: false
            },
            ...sorted
        ]

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