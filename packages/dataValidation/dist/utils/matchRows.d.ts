/**
 * Matches rows from multiple data sources based on a unique identifier.
 * @param sources Array of source datasets.
 * @param idKey The key representing the identifier.
 * @returns Array of matched row groups.
 */
export declare function matchRows<T extends Record<string, any>>(sources: T[][], idKey: keyof T): Array<{
    id: string;
    records: Record<string, T>;
}>;
