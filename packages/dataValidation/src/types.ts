// === types.ts ===
// Created: 2025-07-19
// Purpose: Shared types and interfaces for data-validation package.

/**
 * A matched group of records from multiple sources identified by a common ID.
 */
export interface MatchedGroup<T> {
  id: string;
  records: Record<string, T>;
}

/**
 * Anomaly status for a given property across sources.
 */
export enum AnomalyStatus {
  Same = 'same',
  Similar = 'similar',
  Different = 'different'
}

export enum AnomalyColor {
  same = 'green',
  similar = 'yellow',
  different = 'red'
}

/**
 * Results of anomaly detection for each property.
 */
export type AnomalyResults<T> = Record<keyof T, {
  status: AnomalyStatus;
  values: (T[keyof T] | undefined)[];
  color?: AnomalyColor;
}>;

/*
 * === types.ts ===
 * Updated: 2025-07-19
 * Summary: Types and interfaces for package
 * Key Components:
 *   - MatchedGroup: identifier grouping
 *   - AnomalyStatus: status enum
 *   - AnomalyResults: detection output
 * Version History:
 *   v1.0 – initial
 */
