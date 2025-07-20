// === ComparisonTable.tsx ===
// Created: 2025-07-19
// Purpose: Table-based comparison interface (compatibility version)
// Updated: 2025-07-19 - Simplified for compatibility

'use client'
import React, { useState } from 'react';
import { MatchedGroup, AnomalyResults } from '../types';
import { detectAnomalies } from '../utils/anomalyDetection';
import { FlagBadge } from './FlagBadge';
import { LoadingIndicator } from './LoadingIndicator';

interface ComparisonTableProps<T> {
  group: MatchedGroup<T>;
  loading?: boolean;
  threshold?: number;
  onSubmit?: (resolvedRecord: T) => void;
  showSubmit?: boolean;
}

export function ComparisonTable<T extends Record<string, any>>({
  group,
  loading = false,
  threshold = 0.8,
  onSubmit,
  showSubmit = true
}: ComparisonTableProps<T>) {
  const [selectedValues, setSelectedValues] = useState<Partial<T>>({});
  const [customValues, setCustomValues] = useState<Partial<T>>({});

  if (loading) {
    return <LoadingIndicator />;
  }

  const anomalyResults: AnomalyResults<T> = detectAnomalies(group, threshold);
  const sources = Object.keys(group.records);
  const properties = Object.keys(anomalyResults) as (keyof T)[];

  const handlePropertySelection = (prop: keyof T, value: T[keyof T], isCustom = false) => {
    if (isCustom) {
      setCustomValues(prev => ({ ...prev, [prop]: value }));
      setSelectedValues(prev => ({ ...prev, [prop]: value }));
    } else {
      setSelectedValues(prev => ({ ...prev, [prop]: value }));
      setCustomValues(prev => {
        const newCustom = { ...prev };
        delete newCustom[prop];
        return newCustom;
      });
    }
  };

  const handleCustomValueChange = (prop: keyof T, value: string) => {
    const typedValue = value as T[keyof T];
    setCustomValues(prev => ({ ...prev, [prop]: typedValue }));
    setSelectedValues(prev => ({ ...prev, [prop]: typedValue }));
  };

  const handleSubmit = () => {
    if (!onSubmit) return;
    
    const resolvedRecord = properties.reduce((acc, prop) => {
      const selectedValue = selectedValues[prop];
      const fallbackValue = group.records[sources[0]]?.[prop];
      acc[prop] = selectedValue !== undefined ? selectedValue : fallbackValue;
      return acc;
    }, {} as T);

    onSubmit(resolvedRecord);
  };

  const isSubmitDisabled = properties.some(prop => selectedValues[prop] === undefined);

  return (
    <div className="space-y-4">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="px-4 py-2 border">Property</th>
            {sources.map(src => (
              <th key={src} className="px-4 py-2 border font-medium text-left">
                {src}
              </th>
            ))}
            <th className="px-4 py-2 border">Status</th>
            <th className="px-4 py-2 border">Selected Value</th>
          </tr>
        </thead>
        <tbody>
          {properties.map(prop => {
            const { status } = anomalyResults[prop];
            const selectedValue = selectedValues[prop];
            const isCustomSelected = customValues[prop] !== undefined;
            
            return (
              <tr key={String(prop)}>
                <td className="px-4 py-2 border font-semibold">{String(prop)}</td>
                {sources.map(src => {
                  const value = group.records[src]?.[prop];
                  const isSelected = !isCustomSelected && selectedValue === value;
                  
                  return (
                    <td key={src} className="px-4 py-2 border">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name={`${String(prop)}-selection`}
                          checked={isSelected}
                          onChange={() => handlePropertySelection(prop, value)}
                          className="w-4 h-4"
                        />
                        <span className={isSelected ? 'font-bold text-blue-600' : ''}>
                          {String(value ?? '')}
                        </span>
                      </div>
                    </td>
                  );
                })}
                <td className="px-4 py-2 border">
                  <FlagBadge status={status} />
                </td>
                <td className="px-4 py-2 border">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={`${String(prop)}-selection`}
                        checked={isCustomSelected}
                        onChange={() => {
                          const currentCustom = customValues[prop] || ('' as T[keyof T]);
                          handlePropertySelection(prop, currentCustom, true);
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-600">Custom:</span>
                    </div>
                    <input
                      type="text"
                      value={String(customValues[prop] || '')}
                      onChange={(e) => handleCustomValueChange(prop, e.target.value)}
                      onFocus={() => {
                        const currentValue = customValues[prop] || ('' as T[keyof T]);
                        handlePropertySelection(prop, currentValue, true);
                      }}
                      className="w-full px-2 py-1 border rounded text-sm"
                      placeholder="Enter custom value"
                    />
                    {selectedValue !== undefined && (
                      <div className="text-sm font-medium text-green-600">
                        Selected: {String(selectedValue)}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {showSubmit && onSubmit && (
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => {
              setSelectedValues({});
              setCustomValues({});
            }}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
          >
            Reset
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className={`px-4 py-2 rounded text-sm font-medium ${
              isSubmitDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Submit Resolution
          </button>
        </div>
      )}
    </div>
  );
}

/*
 * === ComparisonTable.tsx ===
 * Updated: 2025-07-19
 * Summary: Simplified table-based comparison interface for compatibility
 * Key Components:
 *   - ComparisonTable: basic table with selection
 * Dependencies:
 *   - React, useState, FlagBadge
 * Version History:
 *   v1.0 – initial
 *   v1.1 – added user selection and submit functionality
 *   v1.2 – simplified for compatibility
 */
