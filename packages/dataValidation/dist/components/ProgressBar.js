// === ProgressBar.tsx ===
// Created: 2025-07-19
// Purpose: Modern progress indicator for resolution completion
// Exports:
//   - ProgressBar (main component)
// Notes:
//   - Animated progress with conflict indicators
'use client';
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
export function ProgressBar({ resolved, total, conflicts, className = '' }) {
    const progress = total > 0 ? (resolved / total) * 100 : 0;
    const hasConflicts = conflicts > 0;
    return (_jsxs("div", { className: `space-y-2 ${className}`, children: [_jsxs("div", { className: "flex items-center justify-between text-xs text-slate-500 dark:text-slate-400", children: [_jsxs("span", { children: [total, " attributes \u00022 ", conflicts, " conflicts \u00022 ", total - resolved, " remaining"] }), _jsxs("span", { children: [Math.round(progress), "% resolved"] })] }), _jsxs("div", { className: "relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden", children: [_jsx("div", { className: `absolute left-0 top-0 h-full transition-all duration-300 ease-out ${hasConflicts
                            ? 'bg-gradient-to-r from-amber-400 to-blue-400 dark:from-amber-500 dark:to-blue-500'
                            : 'bg-gradient-to-r from-blue-400 to-green-400 dark:from-blue-500 dark:to-green-500'}`, style: { width: `${progress}%` } }), progress > 0 && progress < 100 && (_jsx("div", { className: "absolute right-0 top-0 h-full w-1 bg-slate-400/40 dark:bg-white/40 animate-pulse" }))] })] }));
}
