// === components/data/Timeline.tsx ===
// Created: 2025-07-19 15:30
// Purpose: Timeline component for displaying chronological data
// Exports:
//   - Timeline: Main timeline component
// Interactions:
//   - Used by: VisualizerRenderer, LLM-generated configurations
// Notes:
//   - Animated timeline with customizable items
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { clsx } from 'clsx';
export const Timeline = ({ items, className }) => {
    return (_jsx("div", { className: clsx('timeline', className), children: items.map((item) => (_jsxs("div", { className: "timeline-item p-4 border-l-2 border-primary", children: [_jsx("div", { className: "font-bold", children: item.title }), _jsx("div", { className: "text-sm text-muted-foreground", children: item.date }), item.description && _jsx("div", { className: "mt-2", children: item.description })] }, item.id))) }));
};
