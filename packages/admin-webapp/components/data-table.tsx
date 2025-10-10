// === data-table.tsx ===
// Created: 2025-08-29 10:20
// Purpose: Reusable data table with pagination, search, and sorting
// Exports: DataTable component
// Interactions: Used by all admin pages for data display
// Notes: Generic component supporting any data type

'use client'

import * as React from "react"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog"
import { ChevronLeft, ChevronRight, Plus, Edit, Trash, Search } from "lucide-react"
import { cn, debounce } from "#/lib/utils"

/**
 * OVERVIEW
 *
 * - Purpose: Reusable data table with CRUD operations
 * - Assumptions: Generic data type, pagination support
 * - Edge Cases: Empty data, loading states, error handling
 * - How it fits: Core component used by all admin pages
 * - Future Improvements: Add filtering, column sorting, bulk operations
 */

export interface Column<T> {
  key: keyof T | 'actions'
  header: string
  render?: (item: T) => React.ReactNode
  sortable?: boolean
  searchable?: boolean
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  error?: string | null
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onPageChange?: (page: number) => void
  onSearch?: (query: string) => void
  onCreate?: () => void
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  searchPlaceholder?: string
  title?: string
  createButtonText?: string
}

export function DataTable<T extends Record<string, any>>({
  data = [] as T[],
  columns = [] as Column<T>[],
  loading = false,
  error = null,
  pagination,
  onPageChange,
  onSearch,
  onCreate,
  onEdit,
  onDelete,
  searchPlaceholder = "Search...",
  title = "Data",
  createButtonText = "Create New"
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [deleteItem, setDeleteItem] = React.useState<T | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
console.log(data);
  // Debounced search
  const debouncedSearch = React.useMemo(
    () => debounce((query: string) => {
      if (onSearch) {
        onSearch(query)
      }
    }, 300),
    [onSearch]
  )

  React.useEffect(() => {
    debouncedSearch(searchQuery)
  }, [searchQuery])

  const handleDelete = async (item: T) => {
    if (!onDelete) return
    
    setIsDeleting(true)
    try {
      await onDelete(item)
      setDeleteItem(null)
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const renderCell = (item: T, column: Column<T>) => {
    if (column.key === 'actions') {
      return (
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(item)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteItem(item)}
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          )}
        </div>
      )
    }

    if (column.render) {
      return column.render(item)
    }

    const value = item[column.key]
    if (value === null || value === undefined) {
      return <span className="text-muted-foreground">—</span>
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }

    if (typeof value === 'object') {
      return <code className="text-xs bg-muted px-1 py-0.5 rounded">JSON</code>
    }

    return String(value)
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-destructive text-center">
          <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {pagination && (
            <p className="text-sm text-muted-foreground">
              {pagination.total} total records
            </p>
          )}
        </div>
        {onCreate && (
          <Button onClick={onCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {createButtonText}
          </Button>
        )}
      </div>

      {/* Search */}
      {onSearch && (
        <div className="flex items-center gap-2 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length} 
                  className="h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length} 
                  className="h-24 text-center text-muted-foreground"
                >
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow key={index}>
                  {columns.map((column, colIndex) => (
                    <TableCell key={colIndex}>
                      {renderCell(item, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDeleteItem(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteItem && handleDelete(deleteItem)}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/*
 * === data-table.tsx ===
 * Updated: 2025-08-29 10:20
 * Summary: Reusable data table component with CRUD operations
 * Key Components:
 *   - DataTable: Main table component with pagination and search
 *   - Column interface: Defines table columns with render functions
 *   - Actions: Edit and delete buttons with confirmation
 * Dependencies:
 *   - Requires: UI components, lucide-react icons
 * Version History:
 *   v1.0 – initial data table with full CRUD support
 * Notes:
 *   - Generic component supporting any data type
 *   - Includes loading states and error handling
 */
