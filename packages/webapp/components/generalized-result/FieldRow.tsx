// === FieldRow.tsx ===
// Created: 2025-08-10 00:00
// Purpose: Present a single read-only JSON field label/value pair styled similarly to CRM detail fields.
// Exports:
//   - FieldRow
// Notes:
//   - Value may contain interactive children (links / chips) for drill-down.

"use client";

import React from "react";

/**
 * OVERVIEW
 * - Purpose: Uniform layout for key-value display.
 * - Assumptions: label is string, children renders value; handles wrapping.
 * - Edge Cases: Long content wraps; empty values show placeholder.
 * - Future Improvements: Add copy-to-clipboard button.
 */

export interface FieldRowProps {
  label: string;
  children: React.ReactNode;
  className?: string;
}

export const FieldRow: React.FC<FieldRowProps> = ({ label, children, className }) => {
  return (
    <div className={`flex items-start group ${className || ""}`}>
      <div className="mr-3 h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="text-sm font-medium break-words leading-5">
          {children ?? <span className="text-muted-foreground">(empty)</span>}
        </div>
      </div>
    </div>
  );
};

/*
 * === FieldRow.tsx ===
 * Updated: 2025-08-10 00:00
 * Summary: Reusable label/value row with styling parity to CRM record detail fields.
 * Key Components:
 *   - FieldRow: functional component.
 * Dependencies: none
 * Version History:
 *   v1.0 – initial
 */
