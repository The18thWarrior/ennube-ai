// === AttributeRow.tsx ===
// Created: 2025-07-19
// Purpose: Modern card-based attribute resolution row with chip interface
// Exports:
//   - AttributeRow (main component)
// Notes:
//   - Card layout with status indicators, value chips, and conflict explanations
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ValueChip } from './ValueChip';
import { CustomChip } from './CustomChip';
export function AttributeRow({ attribute, candidates, selected, status, onSelect, suggestion, onApplySuggestion }) {
    const getStatusConfig = () => {
        switch (status) {
            case 'resolved':
                return { color: 'border-l-gray-400', label: 'Resolved', icon: '✓' };
            case 'conflict':
                return { color: 'border-l-purple-500', label: 'Conflict', icon: '⚠' };
            case 'invalid':
                return { color: 'border-l-red-500', label: 'Invalid', icon: '!' };
            case 'outlier':
                return { color: 'border-l-amber-500', label: 'Outlier', icon: '△' };
            case 'pending':
            default:
                return { color: 'border-l-blue-500', label: 'Pending', icon: '○' };
        }
    };
    const statusConfig = getStatusConfig();
    const isCustomSelected = selected && 'origin' in selected && selected.origin === 'custom';
    const customValue = isCustomSelected ? selected.display : '';
    const handleCustomCreate = (value) => {
        const customVal = {
            value,
            display: value,
            origin: 'custom',
            valid: true // TODO: Add validation logic
        };
        onSelect(customVal);
    };
    const getConflictExplanation = () => {
        if (status === 'conflict' && candidates.length > 1) {
            const uniqueValues = new Set(candidates.map(c => c.display));
            return `${uniqueValues.size} distinct values differ across sources. Choose the correct one, or supply custom.`;
        }
        return null;
    };
    return (_jsxs("div", { className: `group relative border-l-4 pl-4 ${statusConfig.color} bg-slate-800/30 rounded-r-lg p-4 hover:bg-slate-800/40 transition-colors duration-150`, "data-status": status, children: [_jsxs("header", { className: "flex items-start justify-between gap-4 mb-3", children: [_jsxs("div", { children: [_jsxs("h4", { className: "text-sm font-medium text-slate-200 flex items-center gap-2", children: [_jsx("span", { className: "text-xs", children: statusConfig.icon }), attribute] }), status === 'conflict' && (_jsxs("p", { className: "mt-0.5 text-xs text-purple-300", children: [candidates.length, " differing values"] }))] }), _jsx("div", { className: "text-xs text-slate-400", children: selected ? (_jsx("div", { className: "flex items-center gap-2", children: _jsxs("span", { className: "px-2 py-1 bg-green-600/20 text-green-400 rounded border border-green-600/30", children: ["Selected: ", selected.display] }) })) : (_jsx("span", { className: "text-slate-500 italic", children: "Unresolved" })) })] }), _jsxs("div", { className: "flex flex-wrap gap-2 mb-3", children: [candidates.map((candidate, index) => (_jsx(ValueChip, { label: candidate.display, meta: candidate.sourceId, confidence: candidate.confidence, selected: !isCustomSelected && selected?.display === candidate.display, status: status === 'conflict' ? 'conflict' : 'default', onClick: () => onSelect(candidate) }, `${candidate.sourceId}-${index}`))), _jsx(CustomChip, { selected: isCustomSelected, value: customValue, onCreate: handleCustomCreate, placeholder: "Enter custom value" })] }), status === 'conflict' && (_jsxs("div", { className: "mt-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg", children: [_jsx("p", { className: "text-xs text-purple-300", children: getConflictExplanation() }), suggestion && onApplySuggestion && (_jsxs("div", { className: "mt-2 flex items-center gap-2", children: [_jsx("span", { className: "text-xs text-slate-400", children: "Suggestion:" }), _jsxs("button", { onClick: onApplySuggestion, className: "text-xs text-blue-400 hover:text-blue-300 underline", children: ["Apply \"", suggestion.display, "\""] })] }))] }))] }));
}
