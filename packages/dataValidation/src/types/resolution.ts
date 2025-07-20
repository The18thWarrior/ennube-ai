// === resolution.ts ===
// Created: 2025-07-19
// Purpose: Extended types for modern data resolution UI
// Exports:
//   - SourceValue, AttributeResolution, ResolutionStatus, CustomValue
// Notes:
//   - Enhanced types for chip-based resolution interface

export interface SourceValue {
  sourceId: string;
  value: unknown;
  display: string;
  confidence?: number;     // 0..1
  updatedAt?: string;
  meta?: Record<string, any>;
  validation?: { valid: boolean; message?: string };
}

export interface CustomValue { 
  value: unknown; 
  display: string; 
  origin: 'custom'; 
  valid: boolean;
}

export type ResolutionStatus = 'pending' | 'resolved' | 'conflict' | 'invalid' | 'outlier';

export interface AttributeResolution {
  attribute: string;
  type: 'string' | 'number' | 'email' | 'date' | 'enum';
  candidates: SourceValue[];
  selected?: SourceValue | CustomValue;
  status: ResolutionStatus;
  suggestion?: SourceValue | CustomValue;
  stats?: { mean?: number; stddev?: number; distributionHint?: string };
}

/*
 * === resolution.ts ===
 * Updated: 2025-07-19
 * Summary: Modern data resolution types for chip-based UI
 * Key Components:
 *   - SourceValue: represents a value from a specific source
 *   - AttributeResolution: complete resolution state for an attribute
 *   - ResolutionStatus: conflict status enumeration
 * Dependencies:
 *   - None
 * Version History:
 *   v1.0 – initial
 */
