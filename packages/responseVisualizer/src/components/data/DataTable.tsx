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

import React, { useState, useMemo, useCallback } from 'react';
import { clsx } from 'clsx';
import { ChevronUp, ChevronDown, Search, Filter } from 'lucide-react';
import { LoadingIndicator } from '../core/LoadingIndicator';
import { getAnimationClasses, getStaggeredDelay } from '../../utils/animation-utils';

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
 * Table pagination component
 */
const TablePagination: React.FC<{
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}> = ({ currentPage, totalPages, pageSize, totalItems, onPageChange, onPageSizeChange }) => {
  const pageSizeOptions = [10, 25, 50, 100];

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Show</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="border rounded px-2 py-1 text-sm"
        >
          {pageSizeOptions.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
        <span>of {totalItems} items</span>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
        >
          Previous
        </button>
        
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
        >
          Next
        </button>
      </div>
    </div>
  );
};

/**
 * Main data table component
 */
export const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  loading = false,
  pagination = true,
  pageSize: initialPageSize = 10,
  searchable = true,
  searchPlaceholder = 'Search...',
  sortable = true,
  filterable = false,
  variant = 'default',
  className,
  onRowClick,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  rowKey = 'id'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Filter and search data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchTerm) {
      result = result.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply column filters
    Object.entries(filters).forEach(([columnKey, filterValue]) => {
      if (filterValue) {
        result = result.filter(row =>
          String(row[columnKey]).toLowerCase().includes(filterValue.toLowerCase())
        );
      }
    });

    return result;
  }, [data, searchTerm, filters]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

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

      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig, columns]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Handle sorting
  const handleSort = useCallback((columnKey: string) => {
    if (!sortable) return;
    
    setSortConfig(current => {
      if (current?.key === columnKey) {
        if (current.direction === 'asc') {
          return { key: columnKey, direction: 'desc' };
        } else {
          return null; // Clear sorting
        }
      } else {
        return { key: columnKey, direction: 'asc' };
      }
    });
  }, [sortable]);

  // Handle selection
  const handleRowSelection = useCallback((rowId: string, selected: boolean) => {
    if (!selectable || !onSelectionChange) return;
    
    const newSelection = selected
      ? [...selectedRows, rowId]
      : selectedRows.filter(id => id !== rowId);
    
    onSelectionChange(newSelection);
  }, [selectable, selectedRows, onSelectionChange]);

  const handleSelectAll = useCallback((selected: boolean) => {
    if (!selectable || !onSelectionChange) return;
    
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
    return <LoadingIndicator config={{ enabled: true, type: 'skeleton', text: 'Loading data...' }} />;
  }

  return (
    <div className={clsx('data-table', className)}>
      {/* Search and Filters */}
      {(searchable || filterable) && (
        <div className="flex items-center gap-4 p-4 border-b">
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
          
          {filterable && (
            <button className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-muted">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className={tableClasses}>
          <thead className="bg-muted/50">
            <tr>
              {selectable && (
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-input"
                  />
                </th>
              )}
              
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={clsx(
                    'px-4 py-3 text-left font-medium text-muted-foreground',
                    column.sortable && sortable && 'cursor-pointer hover:bg-muted/80 select-none'
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && sortable && (
                      <div className="flex flex-col">
                        <ChevronUp 
                          className={clsx(
                            'w-3 h-3',
                            sortConfig?.key === column.key && sortConfig.direction === 'asc'
                              ? 'text-primary'
                              : 'text-muted-foreground/50'
                          )}
                        />
                        <ChevronDown 
                          className={clsx(
                            'w-3 h-3 -mt-1',
                            sortConfig?.key === column.key && sortConfig.direction === 'desc'
                              ? 'text-primary'
                              : 'text-muted-foreground/50'
                          )}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            {paginatedData.map((row, index) => {
              const rowId = String(row[rowKey]);
              const isSelected = selectedRows.includes(rowId);
              
              return (
                <tr
                  key={rowId}
                  className={clsx(
                    'border-b hover:bg-muted/25 transition-colors',
                    onRowClick && 'cursor-pointer',
                    isSelected && 'bg-primary/10',
                    getAnimationClasses({ type: 'fade', delay: index * 50 }),
                    getStaggeredDelay(index)
                  )}
                  onClick={() => onRowClick?.(row, index)}
                >
                  {selectable && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleRowSelection(rowId, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-input"
                      />
                    </td>
                  )}
                  
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-3">
                      {column.render ? column.render(row[column.key], row) : String(row[column.key] || '')}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={sortedData.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      )}
    </div>
  );
};

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

/*
 * === components/data/DataTable.tsx ===
 * Updated: 2025-07-19 15:25
 * Summary: Feature-rich data table with sorting, filtering, and pagination
 * Key Components:
 *   - DataTable: Main table component with advanced features
 *   - TablePagination: Pagination controls
 * Dependencies:
 *   - Requires: clsx, React, lucide-react icons, loading indicator
 * Version History:
 *   v1.0 – initial data table with comprehensive features
 * Notes:
 *   - Type-aware sorting and filtering
 *   - Responsive and accessible design
 */
