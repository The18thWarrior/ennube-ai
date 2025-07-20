// === ResolutionFooter.tsx ===
// Created: 2025-07-19
// Purpose: Sticky footer with resolution actions and status
// Exports:
//   - ResolutionFooter (main component)
// Notes:
//   - Undo/redo functionality, bulk actions, save controls

'use client'
import React from 'react';

interface ResolutionFooterProps {
  conflictsRemaining: number;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onReset?: () => void;
  onSave?: () => void;
  isValidForSave?: boolean;
  className?: string;
}

export function ResolutionFooter({
  conflictsRemaining,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onReset,
  onSave,
  isValidForSave = false,
  className = ''
}: ResolutionFooterProps) {
  return (
    <div className={`sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 px-6 py-4 ${className}`}>
      {/* Progress indicator */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-700">
        <div 
          className={`h-full transition-all duration-300 ${
            conflictsRemaining === 0 ? 'bg-green-400 dark:bg-green-500 w-full' : 'bg-blue-400 dark:bg-blue-500'
          }`}
          style={{ width: conflictsRemaining === 0 ? '100%' : '60%' }}
        />
      </div>

      <div className="flex items-center justify-between">
        {/* Left side - Status */}
        <div className="flex items-center gap-4">
          <div className="text-sm">
            {conflictsRemaining > 0 ? (
              <span className="text-amber-600 dark:text-amber-400">
                {conflictsRemaining} Conflict{conflictsRemaining !== 1 ? 's' : ''} Remaining
              </span>
            ) : (
              <span className="text-green-700 dark:text-green-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                All Resolved
              </span>
            )}
          </div>

          {/* History Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-2 rounded text-xs flex items-center gap-1 transition-colors ${
                canUndo
                  ? 'text-slate-700 dark:text-slate-300 hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                  : 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
              title="Undo"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Undo
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-2 rounded text-xs flex items-center gap-1 transition-colors ${
                canRedo
                  ? 'text-slate-700 dark:text-slate-300 hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                  : 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
              }`}
              title="Redo"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6" />
              </svg>
              Redo
            </button>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onReset}
            className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:text-white border border-slate-300 dark:border-slate-600 rounded-lg hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
          >
            Reset All
          </button>
          <button
            onClick={onSave}
            disabled={!isValidForSave}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-all ${
              isValidForSave
                ? 'bg-blue-500 dark:bg-blue-600 dark:text-white hover:bg-blue-600 dark:hover:bg-blue-700 shadow-lg'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
            }`}
          >
            Save Master Record
          </button>
        </div>
      </div>
    </div>
  );
}

/*
 * === ResolutionFooter.tsx ===
 * Updated: 2025-07-19
 * Summary: Sticky footer with resolution controls and status
 * Key Components:
 *   - ResolutionFooter: status display and action controls
 *   - Progress indicator
 *   - Undo/redo functionality
 *   - Save validation
 * Dependencies:
 *   - React
 * Version History:
 *   v1.0 – initial
 */
