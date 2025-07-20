// === index.ts ===
// Created: 2025-07-19
// Purpose: Entry point for data-validation package, exporting utilities and components.

import { matchRows } from './utils/matchRows';
import { detectAnomalies } from './utils/anomalyDetection';
import { SingleRecordValidator } from './components/SingleRecordValidator';
import { MultiRowValidator } from './components/MultiRowValidator';
import { ValueChip } from './components/ValueChip';
import { CustomChip } from './components/CustomChip';
import { AttributeRow } from './components/AttributeRow';
import { ProgressBar } from './components/ProgressBar';
import { ResolutionFooter } from './components/ResolutionFooter';
import { ModernComparisonTable } from './components/ModernComparisonTable';

export {
  matchRows,
  detectAnomalies,
  SingleRecordValidator,
  MultiRowValidator,
  ValueChip,
  CustomChip,
  AttributeRow,
  ProgressBar,
  ResolutionFooter,
  ModernComparisonTable
};

export * from './types';
export * from './types/resolution';

/*
 * === index.ts ===
 * Updated: 2025-07-19
 * Summary: Exports package API including modern UI components
 * Key Components:
 *   - Utilities: matchRows, detectAnomalies
 *   - Components: SingleRecordValidator, MultiRowValidator, ValueChip, CustomChip, AttributeRow, ProgressBar, ResolutionFooter, ModernComparisonTable
 * Dependencies:
 *   - types.ts, resolution.ts
 * Version History:
 *   v1.0 – initial
 *   v2.0 – added modern UI components
 */
