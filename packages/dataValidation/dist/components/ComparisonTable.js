// === ComparisonTable.tsx ===
// Created: 2025-07-19
// Purpose: Table-based comparison interface (compatibility version)
// Updated: 2025-07-19 - Simplified for compatibility
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { detectAnomalies } from '../utils/anomalyDetection';
import { FlagBadge } from './FlagBadge';
import { LoadingIndicator } from './LoadingIndicator';
export function ComparisonTable({ group, loading = false, threshold = 0.8, onSubmit, showSubmit = true }) {
    const [selectedValues, setSelectedValues] = useState({});
    const [customValues, setCustomValues] = useState({});
    if (loading) {
        return _jsx(LoadingIndicator, {});
    }
    const anomalyResults = detectAnomalies(group, threshold);
    const sources = Object.keys(group.records);
    const properties = Object.keys(anomalyResults);
    const handlePropertySelection = (prop, value, isCustom = false) => {
        if (isCustom) {
            setCustomValues(prev => ({ ...prev, [prop]: value }));
            setSelectedValues(prev => ({ ...prev, [prop]: value }));
        }
        else {
            setSelectedValues(prev => ({ ...prev, [prop]: value }));
            setCustomValues(prev => {
                const newCustom = { ...prev };
                delete newCustom[prop];
                return newCustom;
            });
        }
    };
    const handleCustomValueChange = (prop, value) => {
        const typedValue = value;
        setCustomValues(prev => ({ ...prev, [prop]: typedValue }));
        setSelectedValues(prev => ({ ...prev, [prop]: typedValue }));
    };
    const handleSubmit = () => {
        if (!onSubmit)
            return;
        const resolvedRecord = properties.reduce((acc, prop) => {
            const selectedValue = selectedValues[prop];
            const fallbackValue = group.records[sources[0]]?.[prop];
            acc[prop] = selectedValue !== undefined ? selectedValue : fallbackValue;
            return acc;
        }, {});
        onSubmit(resolvedRecord);
    };
    const isSubmitDisabled = properties.some(prop => selectedValues[prop] === undefined);
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("table", { className: "min-w-full border-collapse", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-2 border", children: "Property" }), sources.map(src => (_jsx("th", { className: "px-4 py-2 border font-medium text-left", children: src }, src))), _jsx("th", { className: "px-4 py-2 border", children: "Status" }), _jsx("th", { className: "px-4 py-2 border", children: "Selected Value" })] }) }), _jsx("tbody", { children: properties.map(prop => {
                            const { status } = anomalyResults[prop];
                            const selectedValue = selectedValues[prop];
                            const isCustomSelected = customValues[prop] !== undefined;
                            return (_jsxs("tr", { children: [_jsx("td", { className: "px-4 py-2 border font-semibold", children: String(prop) }), sources.map(src => {
                                        const value = group.records[src]?.[prop];
                                        const isSelected = !isCustomSelected && selectedValue === value;
                                        return (_jsx("td", { className: "px-4 py-2 border", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "radio", name: `${String(prop)}-selection`, checked: isSelected, onChange: () => handlePropertySelection(prop, value), className: "w-4 h-4" }), _jsx("span", { className: isSelected ? 'font-bold text-blue-600' : '', children: String(value ?? '') })] }) }, src));
                                    }), _jsx("td", { className: "px-4 py-2 border", children: _jsx(FlagBadge, { status: status }) }), _jsx("td", { className: "px-4 py-2 border", children: _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "radio", name: `${String(prop)}-selection`, checked: isCustomSelected, onChange: () => {
                                                                const currentCustom = customValues[prop] || '';
                                                                handlePropertySelection(prop, currentCustom, true);
                                                            }, className: "w-4 h-4" }), _jsx("span", { className: "text-sm text-gray-600", children: "Custom:" })] }), _jsx("input", { type: "text", value: String(customValues[prop] || ''), onChange: (e) => handleCustomValueChange(prop, e.target.value), onFocus: () => {
                                                        const currentValue = customValues[prop] || '';
                                                        handlePropertySelection(prop, currentValue, true);
                                                    }, className: "w-full px-2 py-1 border rounded text-sm", placeholder: "Enter custom value" }), selectedValue !== undefined && (_jsxs("div", { className: "text-sm font-medium text-green-600", children: ["Selected: ", String(selectedValue)] }))] }) })] }, String(prop)));
                        }) })] }), showSubmit && onSubmit && (_jsxs("div", { className: "flex justify-end space-x-2", children: [_jsx("button", { onClick: () => {
                            setSelectedValues({});
                            setCustomValues({});
                        }, className: "px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm", children: "Reset" }), _jsx("button", { onClick: handleSubmit, disabled: isSubmitDisabled, className: `px-4 py-2 rounded text-sm font-medium ${isSubmitDisabled
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'}`, children: "Submit Resolution" })] }))] }));
}
