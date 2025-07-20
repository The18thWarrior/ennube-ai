import React from 'react';
export interface DataTableColumn {
    /** Column key */
    key: string;
    /** Column header */
    header: string;
    /** Column width */
    width?: string | number;
    /** Sortable column */
    sortable?: boolean;
    /** Filterable column */
    filterable?: boolean;
    /** Custom cell renderer */
    render?: (value: any, row: any) => React.ReactNode;
    /** Data type for sorting */
    type?: 'string' | 'number' | 'date' | 'boolean';
}
export interface DataTableProps {
    /** Table data */
    data: any[];
    /** Column definitions */
    columns: DataTableColumn[];
    /** Loading state */
    loading?: boolean;
    /** Enable pagination */
    pagination?: boolean;
    /** Items per page */
    pageSize?: number;
    /** Enable search */
    searchable?: boolean;
    /** Search placeholder */
    searchPlaceholder?: string;
    /** Enable sorting */
    sortable?: boolean;
    /** Enable filtering */
    filterable?: boolean;
    /** Table variant */
    variant?: 'default' | 'striped' | 'bordered' | 'compact';
    /** Additional CSS classes */
    className?: string;
    /** Row click handler */
    onRowClick?: (row: any, index: number) => void;
    /** Selection mode */
    selectable?: boolean;
    /** Selected rows */
    selectedRows?: string[];
    /** Selection change handler */
    onSelectionChange?: (selectedRows: string[]) => void;
    /** Row key field */
    rowKey?: string;
}
/**
 * Main data table component
 */
export declare const DataTable: React.FC<DataTableProps>;
/**
 * OVERVIEW
 *
 * Comprehensive data table component with sorting, filtering, pagination, and selection.
 * Supports responsive design and multiple table variants.
 * Includes advanced features like custom cell renderers and type-aware sorting.
 *
 * Features:
 * - Sorting with type awareness
 * - Search and column filtering
 * - Pagination with configurable page sizes
 * - Row selection (single/multiple)
 * - Custom cell renderers
 * - Responsive design
 * - Loading states
 * - Staggered animations
 *
 * Future Improvements:
 * - Virtual scrolling for large datasets
 * - Column resizing and reordering
 * - Export functionality
 * - Advanced filtering UI
 */
//# sourceMappingURL=DataTable.d.ts.map