// === ModernComparisonTable.tsx ===
// Created: 2025-07-19
// Purpose: Modern card-based comparison interface with value chips
// Exports:
//   - ModernComparisonTable (main component)
// Notes:
//   - Full modern design with chips, progress tracking, and resolution controls
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { AnomalyStatus } from '../types';
import { detectAnomalies, similarity } from '../utils/anomalyDetection';
import { LoadingIndicator } from './LoadingIndicator';
import { ValueChip } from './ValueChip';
import { CustomChip } from './CustomChip';
import { ProgressBar } from './ProgressBar';
import { ResolutionFooter } from './ResolutionFooter';
export function ModernComparisonTable({ group, loading = false, threshold = 0.8, onSubmit, showSubmit = true }) {
    const [selectedValues, setSelectedValues] = useState({});
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    if (loading) {
        return _jsx(LoadingIndicator, {});
    }
    const anomalyResults = detectAnomalies(group, threshold);
    const sources = Object.keys(group.records);
    const properties = Object.keys(anomalyResults);
    const getResolutionStatus = (prop) => {
        if (selectedValues[prop])
            return 'resolved';
        const anomaly = anomalyResults[prop];
        if (anomaly.status === AnomalyStatus.Different)
            return 'conflict';
        if (anomaly.status === AnomalyStatus.Similar)
            return 'pending';
        return 'resolved';
    };
    const getStatusConfig = (status) => {
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
    const saveState = () => {
        setUndoStack(prev => [...prev, { ...selectedValues }]);
        setRedoStack([]);
    };
    const handleAttributeSelect = (attribute, value) => {
        saveState();
        setSelectedValues(prev => ({
            ...prev,
            [attribute]: value
        }));
    };
    const handleCustomCreate = (attribute, value) => {
        const customVal = {
            value,
            display: value,
            origin: 'custom',
            valid: true
        };
        handleAttributeSelect(attribute, customVal);
    };
    const handleUndo = () => {
        if (undoStack.length > 0) {
            const previousState = undoStack[undoStack.length - 1];
            setRedoStack(prev => [{ ...selectedValues }, ...prev]);
            setSelectedValues(previousState);
            setUndoStack(prev => prev.slice(0, -1));
        }
    };
    const handleRedo = () => {
        if (redoStack.length > 0) {
            const nextState = redoStack[0];
            setUndoStack(prev => [...prev, { ...selectedValues }]);
            setSelectedValues(nextState);
            setRedoStack(prev => prev.slice(1));
        }
    };
    const handleReset = () => {
        saveState();
        setSelectedValues({});
    };
    const handleSubmit = () => {
        if (!onSubmit)
            return;
        const resolvedRecord = properties.reduce((acc, prop) => {
            const selectedValue = selectedValues[prop];
            const fallbackValue = group.records[sources[0]]?.[prop];
            acc[prop] = (selectedValue?.value !== undefined ? selectedValue.value : fallbackValue);
            return acc;
        }, {});
        onSubmit(resolvedRecord);
    };
    // Calculate stats
    const resolvedCount = Object.values(selectedValues).filter(Boolean).length;
    const conflictCount = properties.filter(prop => getResolutionStatus(prop) === 'conflict').length;
    const isValidForSave = resolvedCount === properties.length;
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-white via-slate-100 to-white text-slate-900 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:text-white", children: [_jsxs("div", { className: "sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-6 py-4 z-10", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsxs("div", { children: [_jsxs("h2", { className: "text-lg font-semibold", children: ["Data Resolution: Record ", group.id] }), _jsxs("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: [properties.length, " attributes \u2022 ", conflictCount, " conflicts \u2022 ", sources.length, " sources"] })] }) }), _jsx(ProgressBar, { resolved: resolvedCount, total: properties.length, conflicts: conflictCount, className: "mt-3" })] }), _jsx("div", { className: "flex flex-col flex-1 px-0 py-8 pb-32 w-full min-h-[calc(100vh-120px)]", children: _jsx("div", { className: "flex-1 w-full space-y-6 px-8", style: { maxWidth: '100vw' }, children: properties.map(prop => {
                        const anomaly = anomalyResults[prop];
                        const status = getResolutionStatus(prop);
                        const statusConfig = getStatusConfig(status);
                        const selected = selectedValues[prop];
                        const isCustomSelected = selected && 'origin' in selected && selected.origin === 'custom';
                        const customValue = isCustomSelected ? selected.display : '';
                        const perfectMatch = sources.reduce((acc, sourceId) => {
                            return acc && group.records[sources[0]]?.[prop] === group.records[sourceId]?.[prop];
                        }, true);
                        const candidates = sources.map(sourceId => ({
                            sourceId,
                            value: group.records[sourceId]?.[prop],
                            display: String(group.records[sourceId]?.[prop] ?? ''),
                            confidence: perfectMatch ? 1 : similarity(String(group.records[sources[0]]?.[prop]), String(group.records[sourceId]?.[prop])),
                            validation: { valid: true }
                        }));
                        return (_jsxs("div", { className: `group relative border-l-4 pl-4 ${statusConfig.color} bg-slate-100/60 dark:bg-slate-800/30 rounded-r-lg p-6 hover:bg-slate-200/60 dark:hover:bg-slate-800/40 transition-colors duration-150 w-full`, style: { minWidth: 0 }, children: [_jsxs("header", { className: "flex items-start justify-between gap-4 mb-3", children: [_jsxs("div", { children: [_jsxs("h4", { className: "text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2", children: [_jsx("span", { className: "text-xs", children: statusConfig.icon }), String(prop)] }), status === 'conflict' && (_jsxs("p", { className: "mt-0.5 text-xs text-purple-600 dark:text-purple-300", children: [candidates.length, " differing values"] }))] }), _jsx("div", { className: "text-xs text-slate-500 dark:text-slate-400", children: selected ? (_jsx("div", { className: "flex items-center gap-2", children: _jsxs("span", { className: "px-2 py-1 bg-green-100 dark:bg-green-600/20 text-green-700 dark:text-green-400 rounded border border-green-200 dark:border-green-600/30", children: ["Selected: ", selected.display] }) })) : (_jsx("span", { className: "text-slate-400 dark:text-slate-500 italic", children: "Unresolved" })) })] }), _jsxs("div", { className: "flex flex-wrap gap-2 mb-3", children: [candidates.map((candidate, index) => (_jsx(ValueChip, { label: candidate.display, meta: candidate.sourceId, confidence: candidate.confidence, selected: !isCustomSelected && selected?.display === candidate.display, status: status === 'conflict' ? 'conflict' : 'default', onClick: () => handleAttributeSelect(prop, candidate) }, `${candidate.sourceId}-${index}`))), _jsx(CustomChip, { selected: isCustomSelected, value: customValue, onCreate: (value) => handleCustomCreate(prop, value), placeholder: "Enter custom value" })] }), status === 'conflict' && (_jsx("div", { className: "mt-3 p-3 bg-purple-100/40 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 rounded-lg", children: _jsxs("p", { className: "text-xs text-purple-600 dark:text-purple-300", children: [candidates.length, " distinct values differ across sources. Choose the correct one, or supply custom."] }) }))] }, String(prop)));
                    }) }) }), showSubmit && onSubmit && (_jsx(ResolutionFooter, { conflictsRemaining: properties.length - resolvedCount, canUndo: undoStack.length > 0, canRedo: redoStack.length > 0, onUndo: handleUndo, onRedo: handleRedo, onReset: handleReset, onSave: handleSubmit, isValidForSave: isValidForSave }))] }));
}
