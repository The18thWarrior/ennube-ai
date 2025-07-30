// === components/forms/DynamicInput.tsx ===
// Created: 2025-07-19 15:30
// Purpose: Dynamic input component with multiple input types
// Exports:
//   - DynamicInput: Main dynamic input component
// Interactions:
//   - Used by: VisualizerRenderer, LLM-generated configurations
// Notes:
//   - Supports multiple input types and validation
'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { clsx } from 'clsx';
export const DynamicInput = ({ type, className }) => {
    return (_jsx("input", { type: type, className: clsx('dynamic-input border rounded px-3 py-2', className) }));
};
