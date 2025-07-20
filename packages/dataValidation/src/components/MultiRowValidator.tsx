// === MultiRowValidator.tsx ===
// Created: 2025-07-19
// Purpose: Validate and compare multiple record rows across data sources with pagination.
// Updated: 2025-07-19 - Added pagination and submit functionality
'use client'
import React, { useState } from 'react';
import { matchRows } from '../utils/matchRows';
import { ComparisonTable } from './ComparisonTable';
import { LoadingIndicator } from './LoadingIndicator';
import { MatchedGroup } from '../types';

interface MultiRowValidatorProps<T> {
  sources: T[][];
  idKey: keyof T;
  threshold?: number;
  loading?: boolean;
  /** Callback function for when user submits a resolved record */
  onSubmit?: (resolvedRecord: T) => void;
  /** Number of records to show per page */
  pageSize?: number;
}

/**
 * MULTI ROW VALIDATOR
 * Renders comparison tables for all matched record groups with pagination.
 */
export function MultiRowValidator<T extends Record<string, any>>({
  sources,
  idKey,
  threshold = 0.8,
  loading = false,
  onSubmit,
  pageSize = 5
}: MultiRowValidatorProps<T>) {
  const [currentPage, setCurrentPage] = useState(0);

  if (loading) {
    return <LoadingIndicator />;
  }

  const groups = matchRows(sources, idKey);

  if (groups.length === 0) {
    return <p className="p-4 text-gray-600">No matching records found.</p>;
  }

  const totalPages = Math.ceil(groups.length / pageSize);
  const startIndex = currentPage * pageSize;
  const endIndex = Math.min(startIndex + pageSize, groups.length);
  const currentGroups = groups.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  const handlePageSelect = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="space-y-6">
      {/* Pagination Controls - Top */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing records {startIndex + 1}-{endIndex} of {groups.length}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 0}
              className={`px-3 py-1 rounded text-sm ${
                currentPage === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Previous
            </button>
            
            <div className="flex space-x-1">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageSelect(i)}
                  className={`px-2 py-1 rounded text-sm ${
                    currentPage === i
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages - 1}
              className={`px-3 py-1 rounded text-sm ${
                currentPage === totalPages - 1
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Records */}
      <div className="space-y-8">
        {currentGroups.map(group => (
          <div key={group.id} className="border p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-bold mb-4 text-gray-800">
              Record ID: {group.id}
            </h3>
            <ComparisonTable 
              group={group} 
              threshold={threshold} 
              onSubmit={onSubmit} 
            />
          </div>
        ))}
      </div>

      {/* Pagination Controls - Bottom */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 0}
              className={`px-3 py-1 rounded text-sm ${
                currentPage === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Previous
            </button>
            
            <span className="text-sm text-gray-600">
              Page {currentPage + 1} of {totalPages}
            </span>
            
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages - 1}
              className={`px-3 py-1 rounded text-sm ${
                currentPage === totalPages - 1
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/*
 * === MultiRowValidator.tsx ===
 * Updated: 2025-07-19
 * Summary: Multi-row comparison component with pagination and submit functionality
 * Key Components:
 *   - MultiRowValidator: main component with pagination
 *   - Pagination controls (top and bottom)
 *   - Submit functionality passed to ComparisonTable
 * Dependencies:
 *   - React, useState, matchRows, ComparisonTable
 * Version History:
 *   v1.0 – initial
 *   v1.1 – added pagination and submit functionality
 */
