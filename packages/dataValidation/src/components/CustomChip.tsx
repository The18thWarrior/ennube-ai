// === CustomChip.tsx ===
// Created: 2025-07-19
// Purpose: Custom value input chip with inline editor
// Exports:
//   - CustomChip (main component)
// Notes:
//   - Inline editor activation, validation support

'use client'
import React, { useState } from 'react';

interface CustomChipProps {
  selected?: boolean;
  value?: string;
  onCreate: (value: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  className?: string;
}

export function CustomChip({
  selected = false,
  value = '',
  onCreate,
  onCancel,
  placeholder = 'Enter custom value',
  className = ''
}: CustomChipProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const handleSave = () => {
    if (inputValue.trim()) {
      onCreate(inputValue.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setInputValue(value);
    setIsEditing(false);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          autoFocus
          className="px-3 py-1.5 border border-blue-300 dark:border-blue-400 rounded-full text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 min-w-[120px]"
          placeholder={placeholder}
        />
        <button
          onClick={handleSave}
          className="px-2 py-1 bg-blue-400 dark:bg-blue-600 text-white rounded text-xs hover:bg-blue-500 dark:hover:bg-blue-700 transition-colors"
        >
          Save
        </button>
        <button
          onClick={handleCancel}
          className="px-2 py-1 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-white rounded text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  const chipStyles = selected
    ? 'bg-gradient-to-r from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-400 text-white shadow-[0_0_0_1px_#60A5FA] border-blue-300 dark:border-blue-400'
    : 'bg-slate-100/40 dark:bg-slate-800/40 border-slate-300 dark:border-slate-500 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-400 hover:bg-slate-200/40 dark:hover:bg-slate-700/40';

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-all duration-150 ease-out ${chipStyles} ${className}`}
    >
      {selected && value ? (
        <div className="flex flex-col items-start">
          <span className="font-medium truncate max-w-[150px]">{value}</span>
          <span className="text-[10px] opacity-80">Custom</span>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Custom…</span>
        </div>
      )}
    </button>
  );
}

/*
 * === CustomChip.tsx ===
 * Updated: 2025-07-19
 * Summary: Custom value input chip with inline editing capabilities
 * Key Components:
 *   - CustomChip: toggle between display and edit modes
 *   - Inline input field with keyboard shortcuts
 *   - Save/cancel actions
 * Dependencies:
 *   - React, useState
 * Version History:
 *   v1.0 – initial
 */
