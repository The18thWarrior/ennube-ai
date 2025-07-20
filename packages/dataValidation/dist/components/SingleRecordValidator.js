// === SingleRecordValidator.tsx ===
// Created: 2025-07-19  
// Purpose: Validate and compare a single record across multiple data sources.
'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { matchRows } from '../utils/matchRows';
import { ComparisonTable } from './ComparisonTable';
import { LoadingIndicator } from './LoadingIndicator';
/**
 * SINGLE RECORD VALIDATOR
 * Renders the comparison for the first matched record group.
 */
export function SingleRecordValidator({ sources, idKey, threshold = 0.8, loading = false, onSubmit }) {
    if (loading) {
        return _jsx(LoadingIndicator, {});
    }
    const groups = matchRows(sources, idKey);
    const group = groups[0];
    if (!group) {
        return _jsx("p", { className: "p-4 text-gray-600", children: "No matching record found." });
    }
    return _jsx(ComparisonTable, { group: group, threshold: threshold, onSubmit: onSubmit });
}
