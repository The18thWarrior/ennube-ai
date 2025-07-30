// === components/data/MetricCard.tsx ===
// Created: 2025-07-19 15:30
// Purpose: Metric card component for displaying key metrics
// Exports:
//   - MetricCard: Main metric display component
// Interactions:
//   - Used by: VisualizerRenderer, LLM-generated configurations
// Notes:
//   - Animated metric cards with trend indicators
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { clsx } from 'clsx';
export const MetricCard = ({ value, label, className }) => {
    return (_jsxs("div", { className: clsx('metric-card p-4 border rounded-lg', className), children: [_jsx("div", { className: "text-2xl font-bold", children: value }), _jsx("div", { className: "text-sm text-muted-foreground", children: label })] }));
};
