// === components/feedback/ProgressTracker.tsx ===
// Created: 2025-07-19 15:30
// Purpose: Progress tracker component for multi-step processes
// Exports:
//   - ProgressTracker: Main progress tracking component
// Interactions:
//   - Used by: VisualizerRenderer, LLM-generated configurations
// Notes:
//   - Animated progress tracking with steps
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { clsx } from 'clsx';
export const ProgressTracker = ({ steps, currentStep, className }) => {
    return (_jsx("div", { className: clsx('progress-tracker flex items-center space-x-4', className), children: steps.map((step, index) => (_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: clsx('w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium', step.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'), children: index + 1 }), _jsx("span", { className: "ml-2 text-sm", children: step.label })] }, step.id))) }));
};
