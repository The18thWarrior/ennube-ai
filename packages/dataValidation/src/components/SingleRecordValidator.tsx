// === SingleRecordValidator.tsx ===
// Created: 2025-07-19  
// Purpose: Validate and compare a single record across multiple data sources.
'use client'
import React from 'react';
import { matchRows } from '../utils/matchRows';
import { ComparisonTable } from './ComparisonTable';
import { LoadingIndicator } from './LoadingIndicator';
import { MatchedGroup } from '../types';

interface SingleRecordValidatorProps<T> {
  /** Array of datasets; each dataset contains records of type T */
  sources: T[][];
  /** Key used to identify and match records */
  idKey: keyof T;
  /** Similarity threshold for flagging similar values */
  threshold?: number;
  /** Loading state indicator */
  loading?: boolean;
  /** Callback function for when user submits a resolved record */
  onSubmit?: (resolvedRecord: T) => void;
}

/**
 * SINGLE RECORD VALIDATOR
 * Renders the comparison for the first matched record group.
 */
export function SingleRecordValidator<T extends Record<string, any>>({
  sources,
  idKey,
  threshold = 0.8,
  loading = false,
  onSubmit
}: SingleRecordValidatorProps<T>) {
  if (loading) {
    return <LoadingIndicator />;
  }

  const groups = matchRows(sources, idKey);
  const group: MatchedGroup<T> | undefined = groups[0];

  if (!group) {
    return <p className="p-4 text-gray-600">No matching record found.</p>;
  }

  return <ComparisonTable group={group} threshold={threshold} onSubmit={onSubmit} />;
}

/*
 * === SingleRecordValidator.tsx ===
 * Updated: 2025-07-19
 * Summary: Single record comparison component
 * Key Components:
 *   - SingleRecordValidator: main component
 * Dependencies:
 *   - React, matchRows, ComparisonTable
 * Version History:
 *   v1.0 – initial
 */
