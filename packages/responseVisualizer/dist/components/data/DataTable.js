// === components/data/DataTable.tsx ===
// Created: 2025-07-19 15:25
// Purpose: Data table component with sorting, filtering, and pagination
// Exports:
//   - DataTable: Main data table component
//   - DataTableColumn: Column configuration interface
// Interactions:
//   - Used by: VisualizerRenderer, LLM-generated configurations
// Notes:
//   - Responsive table with advanced features
'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo, useCallback } from 'react';
import { clsx } from 'clsx';
import { ChevronUp, ChevronDown, Search, Filter } from 'lucide-react';
import { LoadingIndicator } from '../core/LoadingIndicator';
import { getAnimationClasses, getStaggeredDelay } from '../../utils/animation-utils';
/**
 * Table pagination component
 */
const TablePagination = ({ currentPage, totalPages, pageSize, totalItems, onPageChange, onPageSizeChange }) => {
    const pageSizeOptions = [10, 25, 50, 100];
    return (_jsxs("div", { className: "flex items-center justify-between px-4 py-3 border-t", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [_jsx("span", { children: "Show" }), _jsx("select", { value: pageSize, onChange: (e) => onPageSizeChange(Number(e.target.value)), className: "border rounded px-2 py-1 text-sm", children: pageSizeOptions.map(size => (_jsx("option", { value: size, children: size }, size))) }), _jsxs("span", { children: ["of ", totalItems, " items"] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => onPageChange(currentPage - 1), disabled: currentPage === 1, className: "px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted", children: "Previous" }), _jsxs("span", { className: "text-sm", children: ["Page ", currentPage, " of ", totalPages] }), _jsx("button", { onClick: () => onPageChange(currentPage + 1), disabled: currentPage === totalPages, className: "px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted", children: "Next" })] })] }));
};
/**
 * Main data table component
 */
export const DataTable = ({ data, columns, loading = false, pagination = true, pageSize: initialPageSize = 10, searchable = true, searchPlaceholder = 'Search...', sortable = true, filterable = false, variant = 'default', className, onRowClick, selectable = false, selectedRows = [], onSelectionChange, rowKey = 'id' }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);
    const [filters, setFilters] = useState({});
    // Filter and search data
    const filteredData = useMemo(() => {
        let result = [...data];
        // Apply search
        if (searchTerm) {
            result = result.filter(row => Object.values(row).some(value => String(value).toLowerCase().includes(searchTerm.toLowerCase())));
        }
        // Apply column filters
        Object.entries(filters).forEach(([columnKey, filterValue]) => {
            if (filterValue) {
                result = result.filter(row => String(row[columnKey]).toLowerCase().includes(filterValue.toLowerCase()));
            }
        });
        return result;
    }, [data, searchTerm, filters]);
    // Sort data
    const sortedData = useMemo(() => {
        if (!sortConfig)
            return filteredData;
        const { key, direction } = sortConfig;
        const column = columns.find(col => col.key === key);
        const type = column?.type || 'string';
        return [...filteredData].sort((a, b) => {
            let aVal = a[key];
            let bVal = b[key];
            // Type-specific sorting
            switch (type) {
                case 'number':
                    aVal = Number(aVal) || 0;
                    bVal = Number(bVal) || 0;
                    break;
                case 'date':
                    aVal = new Date(aVal).getTime();
                    bVal = new Date(bVal).getTime();
                    break;
                case 'boolean':
                    aVal = Boolean(aVal);
                    bVal = Boolean(bVal);
                    break;
                default:
                    aVal = String(aVal).toLowerCase();
                    bVal = String(bVal).toLowerCase();
            }
            if (aVal < bVal)
                return direction === 'asc' ? -1 : 1;
            if (aVal > bVal)
                return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortConfig, columns]);
    // Paginate data
    const paginatedData = useMemo(() => {
        if (!pagination)
            return sortedData;
        const startIndex = (currentPage - 1) * pageSize;
        return sortedData.slice(startIndex, startIndex + pageSize);
    }, [sortedData, currentPage, pageSize, pagination]);
    const totalPages = Math.ceil(sortedData.length / pageSize);
    // Handle sorting
    const handleSort = useCallback((columnKey) => {
        if (!sortable)
            return;
        setSortConfig(current => {
            if (current?.key === columnKey) {
                if (current.direction === 'asc') {
                    return { key: columnKey, direction: 'desc' };
                }
                else {
                    return null; // Clear sorting
                }
            }
            else {
                return { key: columnKey, direction: 'asc' };
            }
        });
    }, [sortable]);
    // Handle selection
    const handleRowSelection = useCallback((rowId, selected) => {
        if (!selectable || !onSelectionChange)
            return;
        const newSelection = selected
            ? [...selectedRows, rowId]
            : selectedRows.filter(id => id !== rowId);
        onSelectionChange(newSelection);
    }, [selectable, selectedRows, onSelectionChange]);
    const handleSelectAll = useCallback((selected) => {
        if (!selectable || !onSelectionChange)
            return;
        const allRowIds = paginatedData.map(row => String(row[rowKey]));
        const newSelection = selected ? allRowIds : [];
        onSelectionChange(newSelection);
    }, [selectable, paginatedData, rowKey, onSelectionChange]);
    // Generate table classes
    const tableClasses = useMemo(() => {
        const classes = ['w-full border-collapse'];
        switch (variant) {
            case 'striped':
                classes.push('table-striped');
                break;
            case 'bordered':
                classes.push('border border-border');
                break;
            case 'compact':
                classes.push('text-sm');
                break;
        }
        return clsx(classes);
    }, [variant]);
    if (loading) {
        return _jsx(LoadingIndicator, { config: { enabled: true, type: 'skeleton', text: 'Loading data...' } });
    }
    return (_jsxs("div", { className: clsx('data-table', className), children: [(searchable || filterable) && (_jsxs("div", { className: "flex items-center gap-4 p-4 border-b", children: [searchable && (_jsxs("div", { className: "relative flex-1 max-w-sm", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" }), _jsx("input", { type: "text", placeholder: searchPlaceholder, value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary" })] })), filterable && (_jsxs("button", { className: "flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-muted", children: [_jsx(Filter, { className: "w-4 h-4" }), "Filters"] }))] })), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: tableClasses, children: [_jsx("thead", { className: "bg-muted/50", children: _jsxs("tr", { children: [selectable && (_jsx("th", { className: "w-12 px-4 py-3 text-left", children: _jsx("input", { type: "checkbox", checked: selectedRows.length === paginatedData.length && paginatedData.length > 0, onChange: (e) => handleSelectAll(e.target.checked), className: "rounded border-input" }) })), columns.map((column) => (_jsx("th", { className: clsx('px-4 py-3 text-left font-medium text-muted-foreground', column.sortable && sortable && 'cursor-pointer hover:bg-muted/80 select-none'), style: { width: column.width }, onClick: () => column.sortable && handleSort(column.key), children: _jsxs("div", { className: "flex items-center gap-2", children: [column.header, column.sortable && sortable && (_jsxs("div", { className: "flex flex-col", children: [_jsx(ChevronUp, { className: clsx('w-3 h-3', sortConfig?.key === column.key && sortConfig.direction === 'asc'
                                                                ? 'text-primary'
                                                                : 'text-muted-foreground/50') }), _jsx(ChevronDown, { className: clsx('w-3 h-3 -mt-1', sortConfig?.key === column.key && sortConfig.direction === 'desc'
                                                                ? 'text-primary'
                                                                : 'text-muted-foreground/50') })] }))] }) }, column.key)))] }) }), _jsx("tbody", { children: paginatedData.map((row, index) => {
                                const rowId = String(row[rowKey]);
                                const isSelected = selectedRows.includes(rowId);
                                return (_jsxs("tr", { className: clsx('border-b hover:bg-muted/25 transition-colors', onRowClick && 'cursor-pointer', isSelected && 'bg-primary/10', getAnimationClasses({ type: 'fade', delay: index * 50 }), getStaggeredDelay(index)), onClick: () => onRowClick?.(row, index), children: [selectable && (_jsx("td", { className: "px-4 py-3", children: _jsx("input", { type: "checkbox", checked: isSelected, onChange: (e) => handleRowSelection(rowId, e.target.checked), onClick: (e) => e.stopPropagation(), className: "rounded border-input" }) })), columns.map((column) => (_jsx("td", { className: "px-4 py-3", children: column.render ? column.render(row[column.key], row) : String(row[column.key] || '') }, column.key)))] }, rowId));
                            }) })] }) }), pagination && totalPages > 1 && (_jsx(TablePagination, { currentPage: currentPage, totalPages: totalPages, pageSize: pageSize, totalItems: sortedData.length, onPageChange: setCurrentPage, onPageSizeChange: (size) => {
                    setPageSize(size);
                    setCurrentPage(1);
                } }))] }));
};
