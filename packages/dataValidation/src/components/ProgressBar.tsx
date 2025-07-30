// === ProgressBar.tsx ===
// Created: 2025-07-19
// Purpose: Modern progress indicator for resolution completion
// Exports:
//   - ProgressBar (main component)
// Notes:
//   - Animated progress with conflict indicators

'use client'
import React from 'react';

interface ProgressBarProps {
  resolved: number;
  total: number;
  conflicts: number;
  className?: string;
}

export function ProgressBar({ resolved, total, conflicts, className = '' }: ProgressBarProps) {
  const progress = total > 0 ? (resolved / total) * 100 : 0;
  const hasConflicts = conflicts > 0;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{total} attributes 2 {conflicts} conflicts 2 {total - resolved} remaining</span>
        <span>{Math.round(progress)}% resolved</span>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`absolute left-0 top-0 h-full transition-all duration-300 ease-out ${
            hasConflicts
              ? 'bg-gradient-to-r from-amber-400 to-blue-400 dark:from-amber-500 dark:to-blue-500'
              : 'bg-gradient-to-r from-blue-400 to-green-400 dark:from-blue-500 dark:to-green-500'
          }`}
          style={{ width: `${progress}%` }}
        />
        {progress > 0 && progress < 100 && (
          <div className="absolute right-0 top-0 h-full w-1 bg-slate-400/40 dark:bg-white/40 animate-pulse" />
        )}
      </div>
    </div>
  );
}

/*
 * === ProgressBar.tsx ===
 * Updated: 2025-07-19
 * Summary: Animated progress indicator for data resolution
 * Key Components:
 *   - ProgressBar: visual progress with stats
 *   - Conflict-aware styling
 *   - Animated progress transitions
 * Dependencies:
 *   - React
 * Version History:
 *   v1.0 – initial
 */
