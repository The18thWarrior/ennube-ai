// === matchRows.ts ===
// Created: 2025-07-19  
// Purpose: Automatically match rows across datasets by identifier.
/**
 * Matches rows from multiple data sources based on a unique identifier.
 * @param sources Array of source datasets.
 * @param idKey The key representing the identifier.
 * @returns Array of matched row groups.
 */
export function matchRows(sources, idKey) {
    const groups = {};
    sources.forEach((source, idx) => {
        const name = `source${idx}`;
        source.forEach(item => {
            const id = String(item[idKey]);
            if (!groups[id])
                groups[id] = {};
            groups[id][name] = item;
        });
    });
    return Object.entries(groups).map(([id, group]) => ({ id, records: group }));
}
/*
 * === matchRows.ts ===
 * Updated: 2025-07-19
 * Summary: Groups multi-source rows by identifier
 * Key Components:
 *   - matchRows: Grouping logic
 * Dependencies:
 *   - None
 * Version History:
 *   v1.0 – initial
 */
