// === AttributeRow.tsx ===
// Created: 2025-07-19
// Purpose: Modern card-based attribute resolution row with chip interface
// Exports:
//   - AttributeRow (main component)
// Notes:
//   - Card layout with status indicators, value chips, and conflict explanations
'use client'
import React from 'react';
import { ValueChip } from './ValueChip';
import { CustomChip } from './CustomChip';
import { SourceValue, CustomValue, ResolutionStatus } from '../types/resolution';

interface AttributeRowProps {
  attribute: string;
  candidates: SourceValue[];
  selected?: SourceValue | CustomValue;
  status: ResolutionStatus;
  onSelect: (value: SourceValue | CustomValue) => void;
  suggestion?: SourceValue | CustomValue;
  onApplySuggestion?: () => void;
}

export function AttributeRow({
  attribute,
  candidates,
  selected,
  status,
  onSelect,
  suggestion,
  onApplySuggestion
}: AttributeRowProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'resolved':
        return { color: 'border-l-gray-400', label: 'Resolved', icon: '✓' };
      case 'conflict':
        return { color: 'border-l-purple-500', label: 'Conflict', icon: '⚠' };
      case 'invalid':
        return { color: 'border-l-red-500', label: 'Invalid', icon: '!' };
      case 'outlier':
        return { color: 'border-l-amber-500', label: 'Outlier', icon: '△' };
      case 'pending':
      default:
        return { color: 'border-l-blue-500', label: 'Pending', icon: '○' };
    }
  };

  const statusConfig = getStatusConfig();
  const isCustomSelected = selected && 'origin' in selected && selected.origin === 'custom';
  const customValue = isCustomSelected ? (selected as CustomValue).display : '';

  const handleCustomCreate = (value: string) => {
    const customVal: CustomValue = {
      value,
      display: value,
      origin: 'custom',
      valid: true // TODO: Add validation logic
    };
    onSelect(customVal);
  };

  const getConflictExplanation = () => {
    if (status === 'conflict' && candidates.length > 1) {
      const uniqueValues = new Set(candidates.map(c => c.display));
      return `${uniqueValues.size} distinct values differ across sources. Choose the correct one, or supply custom.`;
    }
    return null;
  };

  return (
    <div 
      className={`group relative border-l-4 pl-4 ${statusConfig.color} bg-slate-800/30 rounded-r-lg p-4 hover:bg-slate-800/40 transition-colors duration-150`}
      data-status={status}
    >
      {/* Header */}
      <header className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h4 className="text-sm font-medium text-slate-200 flex items-center gap-2">
            <span className="text-xs">{statusConfig.icon}</span>
            {attribute}
          </h4>
          {status === 'conflict' && (
            <p className="mt-0.5 text-xs text-purple-300">
              {candidates.length} differing values
            </p>
          )}
        </div>
        <div className="text-xs text-slate-400">
          {selected ? (
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded border border-green-600/30">
                Selected: {selected.display}
              </span>
            </div>
          ) : (
            <span className="text-slate-500 italic">Unresolved</span>
          )}
        </div>
      </header>

      {/* Value Chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {candidates.map((candidate, index) => (
          <ValueChip
            key={`${candidate.sourceId}-${index}`}
            label={candidate.display}
            meta={candidate.sourceId}
            confidence={candidate.confidence}
            selected={!isCustomSelected && selected?.display === candidate.display}
            status={status === 'conflict' ? 'conflict' : 'default'}
            onClick={() => onSelect(candidate)}
          />
        ))}
        <CustomChip
          selected={isCustomSelected}
          value={customValue}
          onCreate={handleCustomCreate}
          placeholder="Enter custom value"
        />
      </div>

      {/* Conflict Explanation */}
      {status === 'conflict' && (
        <div className="mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <p className="text-xs text-purple-300">
            {getConflictExplanation()}
          </p>
          {suggestion && onApplySuggestion && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-slate-400">Suggestion:</span>
              <button
                onClick={onApplySuggestion}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Apply "{suggestion.display}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/*
 * === AttributeRow.tsx ===
 * Updated: 2025-07-19
 * Summary: Modern card-based attribute resolution interface
 * Key Components:
 *   - AttributeRow: card layout with status indicators
 *   - ValueChip integration for candidate selection
 *   - CustomChip for custom value input
 *   - Conflict explanation and suggestion UI
 * Dependencies:
 *   - React, ValueChip, CustomChip, resolution types
 * Version History:
 *   v1.0 – initial
 */
