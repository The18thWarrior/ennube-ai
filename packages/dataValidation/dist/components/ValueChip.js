// === ValueChip.tsx ===
// Created: 2025-07-19
// Purpose: Modern chip component for value selection with source provenance
// Exports:
//   - ValueChip (main component)
// Notes:
//   - Supports confidence scoring, source badges, and selection states
'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
export function ValueChip({ label, meta, selected = false, confidence, status = 'default', onClick, className = '' }) {
    const getStatusStyles = () => {
        const base = 'inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-all duration-150 ease-out';
        if (selected) {
            return `${base} bg-gradient-to-r from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-400 dark:text-white shadow-[0_0_0_1px_#60A5FA] border-blue-300 dark:border-blue-400`;
        }
        switch (status) {
            case 'conflict':
                return `${base} bg-purple-100/60 dark:bg-slate-800/60 border-purple-300 dark:border-purple-500/40 text-purple-700 dark:text-slate-200 ring-1 ring-purple-200 dark:ring-purple-500/40 hover:border-purple-400`;
            case 'invalid':
                return `${base} bg-red-100/60 dark:bg-slate-800/60 border-red-300 dark:border-red-500 text-red-700 dark:text-red-300 hover:border-red-400`;
            case 'outlier':
                return `${base} bg-amber-100/60 dark:bg-slate-800/60 border-amber-300 dark:border-amber-500/60 text-amber-700 dark:text-amber-200 hover:border-amber-400`;
            default:
                return `${base} bg-slate-100/60 dark:bg-slate-800/60 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:bg-slate-700/60`;
        }
    };
    const confidenceColor = confidence && confidence >= 0.9
        ? 'text-green-700 dark:text-green-400'
        : confidence && confidence >= 0.7
            ? 'text-yellow-700 dark:text-yellow-400'
            : 'text-red-700 dark:text-red-400';
    return (_jsxs("button", { onClick: onClick, className: `${getStatusStyles()} ${className}`, title: `Source: ${meta}${confidence ? ` • ${Math.round(confidence * 100)}% confidence` : ''}`, children: [_jsxs("div", { className: "flex flex-col items-start", children: [_jsx("span", { className: "font-medium truncate max-w-[200px]", children: label }), _jsxs("div", { className: "flex items-center gap-1 text-[10px] opacity-80", children: [_jsx("span", { children: meta }), confidence && (_jsxs(_Fragment, { children: [_jsx("span", { children: "\u2022" }), _jsxs("span", { className: confidenceColor, children: [Math.round(confidence * 100), "%"] })] }))] })] }), selected && (_jsx("svg", { className: "w-3 h-3 flex-shrink-0", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) }))] }));
}
