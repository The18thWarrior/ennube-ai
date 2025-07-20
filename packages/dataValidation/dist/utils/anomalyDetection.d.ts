import { MatchedGroup, AnomalyResults } from '../types';
/**
 * Computes similarity between two values (string, number, or date).
 * - Strings: normalized Levenshtein similarity
 * - Numbers: 1 if equal, else 1 - normalized absolute diff
 * - Dates: 1 if equal, else 1 - normalized diff in ms (capped)
 * - Null/undefined: 1 if both nullish, else 0
 * @param a First value
 * @param b Second value
 * @returns Similarity score [0,1]
 */
export declare function similarity(a: unknown, b: unknown): number;
/**
 * Detect anomalies for a matched group across sources for each property.
 * @param group Matched group of records
 * @param threshold Similarity threshold (0-1) for "Similar"
 * @returns AnomalyResults for each property
 */
export declare function detectAnomalies<T extends Record<string, any>>(group: MatchedGroup<T>, threshold?: number): AnomalyResults<T>;
