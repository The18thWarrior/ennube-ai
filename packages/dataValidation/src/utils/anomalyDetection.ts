// === anomalyDetection.ts ===
// Created: 2025-07-19
// Purpose: Perform anomaly detection on matched record groups.

import { MatchedGroup, AnomalyResults, AnomalyStatus, AnomalyColor } from '../types';

// Simple Levenshtein distance implementation
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

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
export function similarity(a: unknown, b: unknown): number {
  // Both null/undefined
  if (a == null && b == null) return 1;
  // One null/undefined
  if (a == null || b == null) return 0;

  // Both booleans
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return a === b ? 1 : 0;
  }

  // Both numbers
  if (typeof a === 'number' && typeof b === 'number') {
    if (isNaN(a) && isNaN(b)) return 1;
    if (isNaN(a) || isNaN(b)) return 0;
    if (a === b) return 1;
    // Normalize diff (avoid div by zero)
    const max = Math.max(Math.abs(a), Math.abs(b), 1);
    return 1 - Math.min(Math.abs(a - b) / max, 1);
  }

  // Both dates (Date objects or ISO strings)
  const aDate = isDateLike(a);
  const bDate = isDateLike(b);
  if (aDate && bDate) {
    const aTime = toDate(a).getTime();
    const bTime = toDate(b).getTime();
    if (aTime === bTime) return 1;
    // Cap at 30 days diff for normalization
    const maxMs = 1000 * 60 * 60 * 24 * 30;
    return 1 - Math.min(Math.abs(aTime - bTime) / maxMs, 1);
  }

  // Fallback: string comparison
  const aStr = String(a);
  const bStr = String(b);
  const maxLen = Math.max(aStr.length, bStr.length);
  if (maxLen === 0) return 1;
  const dist = levenshtein(aStr, bStr);
  return (maxLen - dist) / maxLen;
}

function isDateLike(val: unknown): boolean {
  if (val instanceof Date && !isNaN(val.getTime())) return true;
  if (typeof val === 'string') {
    const d = new Date(val);
    return !isNaN(d.getTime());
  }
  return false;
}

function toDate(val: unknown): Date {
  if (val instanceof Date) return val;
  return new Date(val as string);
}

/**
 * Detect anomalies for a matched group across sources for each property.
 * @param group Matched group of records
 * @param threshold Similarity threshold (0-1) for "Similar"
 * @returns AnomalyResults for each property
 */
export function detectAnomalies<T extends Record<string, any>>(
  group: MatchedGroup<T>,
  threshold = 0.8
): AnomalyResults<T> {
  const sources = Object.values(group.records);
  const result = {} as AnomalyResults<T>;

  if (sources.length === 0) {
    return result;
  }

  const keys = Object.keys(sources[0]) as (keyof T)[];

  keys.forEach(key => {
    const values = sources.map(src => src[key]);
    const defined = values.filter(v => v != null) as string[];
    let status: AnomalyStatus;

    if (defined.every(v => v === defined[0])) {
      status = AnomalyStatus.Same;
    } else if (
      defined.every((v, i) => {
        if (i === 0) return true;
        return similarity(String(defined[0]), String(v)) >= threshold;
      })
    ) {
      status = AnomalyStatus.Similar;
    } else {
      status = AnomalyStatus.Different;
    }

    const anomalyColor = AnomalyColor[status as keyof typeof AnomalyColor];

    result[key] = { status, values, color: anomalyColor };
  });

  return result;
}

/*
 * === anomalyDetection.ts ===
 * Updated: 2025-07-19
 * Summary: Provides detectAnomalies utility
 * Key Components:
 *   - detectAnomalies: per-property flags
 * Dependencies:
 *   - types.ts
 * Version History:
 *   v1.0 – initial
 */
