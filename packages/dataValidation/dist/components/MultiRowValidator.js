// === MultiRowValidator.tsx ===
// Created: 2025-07-19
// Purpose: Validate and compare multiple record rows across data sources with pagination.
// Updated: 2025-07-19 - Added pagination and submit functionality
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { matchRows } from '../utils/matchRows';
import { ComparisonTable } from './ComparisonTable';
import { LoadingIndicator } from './LoadingIndicator';
/**
 * MULTI ROW VALIDATOR
 * Renders comparison tables for all matched record groups with pagination.
 */
export function MultiRowValidator({ sources, idKey, threshold = 0.8, loading = false, onSubmit, pageSize = 5 }) {
    const [currentPage, setCurrentPage] = useState(0);
    if (loading) {
        return _jsx(LoadingIndicator, {});
    }
    const groups = matchRows(sources, idKey);
    if (groups.length === 0) {
        return _jsx("p", { className: "p-4 text-gray-600", children: "No matching records found." });
    }
    const totalPages = Math.ceil(groups.length / pageSize);
    const startIndex = currentPage * pageSize;
    const endIndex = Math.min(startIndex + pageSize, groups.length);
    const currentGroups = groups.slice(startIndex, endIndex);
    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(0, prev - 1));
    };
    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
    };
    const handlePageSelect = (page) => {
        setCurrentPage(page);
    };
    return (_jsxs("div", { className: "space-y-6", children: [totalPages > 1 && (_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "text-sm text-gray-600", children: ["Showing records ", startIndex + 1, "-", endIndex, " of ", groups.length] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { onClick: handlePreviousPage, disabled: currentPage === 0, className: `px-3 py-1 rounded text-sm ${currentPage === 0
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'}`, children: "Previous" }), _jsx("div", { className: "flex space-x-1", children: Array.from({ length: totalPages }, (_, i) => (_jsx("button", { onClick: () => handlePageSelect(i), className: `px-2 py-1 rounded text-sm ${currentPage === i
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`, children: i + 1 }, i))) }), _jsx("button", { onClick: handleNextPage, disabled: currentPage === totalPages - 1, className: `px-3 py-1 rounded text-sm ${currentPage === totalPages - 1
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'}`, children: "Next" })] })] })), _jsx("div", { className: "space-y-8", children: currentGroups.map(group => (_jsxs("div", { className: "border p-4 rounded-lg shadow-sm", children: [_jsxs("h3", { className: "text-lg font-bold mb-4 text-gray-800", children: ["Record ID: ", group.id] }), _jsx(ComparisonTable, { group: group, threshold: threshold, onSubmit: onSubmit })] }, group.id))) }), totalPages > 1 && (_jsx("div", { className: "flex justify-center", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { onClick: handlePreviousPage, disabled: currentPage === 0, className: `px-3 py-1 rounded text-sm ${currentPage === 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'}`, children: "Previous" }), _jsxs("span", { className: "text-sm text-gray-600", children: ["Page ", currentPage + 1, " of ", totalPages] }), _jsx("button", { onClick: handleNextPage, disabled: currentPage === totalPages - 1, className: `px-3 py-1 rounded text-sm ${currentPage === totalPages - 1
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'}`, children: "Next" })] }) }))] }));
}
