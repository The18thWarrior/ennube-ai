"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Settings, FilterIcon, ChevronDown, GripVertical, X, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { cn, truncateText } from "@/lib/utils"

interface CrmRecord {
  id: string
  fields: {
    icon: React.ElementType
    label: string
    value: React.ReactNode
  }[],
  objectType: string
}

export interface Column {
  id: string
  label: string
  field: string
  width: number
  visible: boolean
  sortable: boolean
  filterable: boolean
  type: "text" | "email" | "phone" | "date" | "currency" | "picklist" | "url"
}

interface SortConfig {
  field: string
  direction: "asc" | "desc"
}

interface CrmRecordListTableProps {
  title: string
  records: CrmRecord[]
  initialColumns: Column[]
  onRecordSelect?: (recordId: string) => void
  onRecordsSelect?: (recordIds: string[]) => void
}

export function CrmRecordListTable({
  title,
  records,
  initialColumns,
  onRecordSelect,
  onRecordsSelect,
}: CrmRecordListTableProps) {
  const [columns, setColumns] = useState<Column[]>(initialColumns)
  const [filters, setFilters] = useState<{ field: string; operator: string; value: string }[]>([])
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null)
  const [selectedRecords, setSelectedRecords] = useState<string[]>([])
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [resizeStartWidth, setResizeStartWidth] = useState(0)
  const tableRef = useRef<HTMLDivElement>(null)

  const visibleColumns = columns.filter((col) => col.visible)

  // Filter records based on active filters
  const filteredRecords = records.filter((record) => {
    return filters.every((filter) => {
      const value = record.fields.find(field => field.label === filter.field)?.value?.toString().toLowerCase() || ""
      const filterValue = filter.value.toLowerCase()

      switch (filter.operator) {
        case "contains":
          return value.includes(filterValue)
        case "equals":
          return value === filterValue
        case "starts_with":
          return value.startsWith(filterValue)
        case "ends_with":
          return value.endsWith(filterValue)
        case "not_equals":
          return value !== filterValue
        default:
          return true
      }
    })
  })

  // Sort records
  const sortedRecords = sortConfig
    ? [...filteredRecords].sort((a, b) => {
        const aValue = a.fields.find(field => field.label === sortConfig.field)?.value?.toString() || ""
        const bValue = b.fields.find(field => field.label === sortConfig.field)?.value?.toString() || ""

        if (sortConfig.direction === "asc") {
          return aValue.localeCompare(bValue)
        } else {
          return bValue.localeCompare(aValue)
        }
      })
    : filteredRecords

  // Handle column reordering
  const handleColumnDragStart = (columnId: string) => {
    setDraggedColumn(columnId)
  }

  const handleColumnDragOver = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault()
    if (!draggedColumn || draggedColumn === targetColumnId) return

    const draggedIndex = columns.findIndex((col) => col.id === draggedColumn)
    const targetIndex = columns.findIndex((col) => col.id === targetColumnId)

    const newColumns = [...columns]
    const [draggedCol] = newColumns.splice(draggedIndex, 1)
    newColumns.splice(targetIndex, 0, draggedCol)

    setColumns(newColumns)
  }

  const handleColumnDragEnd = () => {
    setDraggedColumn(null)
  }

  // Handle column resizing
  const handleResizeStart = (e: React.MouseEvent, columnId: string) => {
    e.preventDefault()
    setResizingColumn(columnId)
    setResizeStartX(e.clientX)
    const column = columns.find((col) => col.id === columnId)
    setResizeStartWidth(column?.width || 150)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingColumn) return

      const diff = e.clientX - resizeStartX
      const newWidth = Math.max(80, resizeStartWidth + diff)

      setColumns((prev) => prev.map((col) => (col.id === resizingColumn ? { ...col, width: newWidth } : col)))
    }

    const handleMouseUp = () => {
      setResizingColumn(null)
    }

    if (resizingColumn) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [resizingColumn, resizeStartX, resizeStartWidth])

  // Handle sorting
  const handleSort = (field: string) => {
    setSortConfig((prev) => {
      if (prev?.field === field) {
        return prev.direction === "asc" ? { field, direction: "desc" } : null
      }
      return { field, direction: "asc" }
    })
  }

  // // Handle record selection
  const handleRecordSelect = (recordId: string) => {
    const newSelection = selectedRecords.includes(recordId)
      ? selectedRecords.filter((id) => id !== recordId)
      : [...selectedRecords, recordId]

    setSelectedRecords(newSelection)
    onRecordsSelect?.(newSelection)
  }

  // const handleSelectAll = () => {
  //   const allSelected = selectedRecords.length === sortedRecords.length
  //   const newSelection = allSelected ? [] : sortedRecords.map((r) => r.id)
  //   setSelectedRecords(newSelection)
  //   onRecordsSelect?.(newSelection)
  // }

  // // Add filter
  // const addFilter = (field: string, operator: string, value: string) => {
  //   const existingFilterIndex = filters.findIndex((f) => f.field === field)
  //   if (existingFilterIndex >= 0) {
  //     const newFilters = [...filters]
  //     newFilters[existingFilterIndex] = { field, operator, value }
  //     setFilters(newFilters)
  //   } else {
  //     setFilters([...filters, { field, operator, value }])
  //   }
  // }

  // const removeFilter = (field: string) => {
  //   setFilters(filters.filter((f) => f.field !== field))
  // }

  const getSortIcon = (field: string) => {
    if (sortConfig?.field !== field) return <ArrowUpDown className="h-3 w-3" />
    return sortConfig.direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
  }

  return (
    <Card className="w-full" style={{scrollbarWidth: 'none'}}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          {title.length > 0 && <CardTitle className="text-lg">{title}</CardTitle>}
          <div className="flex items-center gap-2">
            {/* <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <FilterIcon className="h-4 w-4 mr-2" />
                  Filters {filters.length > 0 && `(${filters.length})`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium">Add Filter</h4>
                  {visibleColumns
                    .filter((col) => col.filterable)
                    .map((column) => (
                      <FilterRow
                        key={column.id}
                        column={column}
                        existingFilter={filters.find((f) => f.field === column.field)}
                        onAddFilter={addFilter}
                        onRemoveFilter={removeFilter}
                      />
                    ))}
                </div>
              </PopoverContent>
            </Popover> */}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {columns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.visible}
                    onCheckedChange={(checked) => {
                      setColumns((prev) =>
                        prev.map((col) => (col.id === column.id ? { ...col, visible: !!checked } : col)),
                      )
                    }}
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* {filters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {filters.map((filter) => {
              const column = columns.find((col) => col.field === filter.field)
              return (
                <div
                  key={filter.field}
                  className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs"
                >
                  <span>
                    {column?.label}: {filter.value}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-blue-200"
                    onClick={() => removeFilter(filter.field)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )
            })}
          </div>
        )} */}
      </CardHeader>

      <CardContent className="p-0" style={{scrollbarWidth: 'none'}}>
        <div className="overflow-auto" style={{scrollbarWidth: 'none'}} ref={tableRef}>
          <table className="w-full">
            <thead className="bg-muted/50 border-b">
              <tr>
                {/* <th className="w-12 p-2">
                  <Checkbox
                    checked={selectedRecords.length === sortedRecords.length && sortedRecords.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </th> */}
                <th className="relative text-left p-2 font-medium text-sm border-r border-border/50 select-none">
                  <span className="flex-1 truncate">{`Actions`}</span>
                </th>
                {visibleColumns.map((column) => (
                  <th
                    key={column.id}
                    className="relative text-left p-2 font-medium text-sm border-r border-border/50 select-none"
                    style={{ width: column.width }}
                    draggable
                    onDragStart={() => handleColumnDragStart(column.id)}
                    onDragOver={(e) => handleColumnDragOver(e, column.id)}
                    onDragEnd={handleColumnDragEnd}
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-3 w-3 text-muted-foreground cursor-move" />
                      <span className="flex-1 truncate">{column.label}</span>
                      {column.sortable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleSort(column.field)}
                        >
                          {getSortIcon(column.field)}
                        </Button>
                      )}
                    </div>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors"
                      onMouseDown={(e) => handleResizeStart(e, column.id)}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRecords.map((record, index) => (
                <tr
                  key={record.id}
                  className={cn(
                    "border-b hover:bg-muted/30 cursor-pointer"
                  )}
                  onClick={() => onRecordSelect?.(record.id)}
                >
                  {/* <td className="p-2">
                    <Checkbox
                      checked={selectedRecords.includes(record.id)}
                      onCheckedChange={() => handleRecordSelect(record.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td> */}

                  <td className="p-2 text-sm border-r border-border/20">
                    <Button variant="ghost" size="sm" onClick={() => handleRecordSelect(record.id)}>
                      {`>`}
                    </Button>
                  </td>
                  {visibleColumns.map((column) => (
                    <td
                      key={column.id}
                      className="p-2 text-sm border-r border-border/20 truncate"
                      style={{ width: column.width }}
                    >
                      {formatCellValue(record.fields.find(field => field.label === column.field)?.value, column.type)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {sortedRecords.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No records found matching your criteria.</div>
          )}
        </div>

        <div className="p-4 border-t bg-muted/20 text-sm text-muted-foreground">
          Showing {sortedRecords.length} of {records.length} records
          {selectedRecords.length > 0 && ` • ${selectedRecords.length} selected`}
        </div>
      </CardContent>
    </Card>
  )
}

// Helper component for filter rows
function FilterRow({
  column,
  existingFilter,
  onAddFilter,
  onRemoveFilter,
}: {
  column: Column
  existingFilter?: { field: string; operator: string; value: string }
  onAddFilter: (field: string, operator: string, value: string) => void
  onRemoveFilter: (field: string) => void
}) {
  const [operator, setOperator] = useState(existingFilter?.operator || "contains")
  const [value, setValue] = useState(existingFilter?.value || "")

  const handleApply = () => {
    if (value.trim()) {
      onAddFilter(column.field, operator, value.trim())
    }
  }

  const handleClear = () => {
    setValue("")
    onRemoveFilter(column.field)
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{column.label}</label>
      <div className="flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-32 bg-transparent">
              {operator.replace("_", " ")}
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setOperator("contains")}>Contains</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setOperator("equals")}>Equals</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setOperator("starts_with")}>Starts with</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setOperator("ends_with")}>Ends with</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setOperator("not_equals")}>Not equals</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Input
          placeholder="Enter value..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
          className="flex-1"
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleApply} disabled={!value.trim()}>
          Apply
        </Button>
        {existingFilter && (
          <Button size="sm" variant="outline" onClick={handleClear}>
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}

// Helper function to format cell values
function formatCellValue(value: any, type: Column["type"]): React.ReactNode {
  if (value == null) return ""
  
  switch (type) {
    case "email":
      return (
        <a href={`mailto:${value}`} className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
          {value}
        </a>
      )
    case "phone":
      return (
        <a href={`tel:${value}`} className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
          {value}
        </a>
      )
    case "currency":
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
    case "date":
      return new Date(value).toLocaleDateString()
    default:
      if (isUrl(value.toString())) {
        return (
          <a href={value.toString()} className="text-blue-600 hover:underline" onClick={(e) => e.stopPropagation()}>
            {`Link`}
          </a>
        )
      }
      return truncateText(value.toString(), 40)
  }
}

function isUrl(str: string): boolean {
  const trimmed = str.trim();
  // Check for absolute URLs
  try {
    new URL(trimmed);
    return true;
  } catch {
    // Not an absolute URL, check for partial/relative URLs and common web URL patterns
    // Accepts:
    // - starts with /, ./, ../
    // - starts with www. and has at least one dot after
    // - domain.tld with at least one dot and no spaces
    if (
      /^([./]{0,2}\/[\w\-./?%&=]*)$/.test(trimmed) ||
      /^www\.[\w\-]+(\.[\w\-]+)+([/?#].*)?$/i.test(trimmed) ||
      /^[\w\-]+(\.[\w\-]+)+([/?#].*)?$/i.test(trimmed)
    ) {
      return true;
    }
    return false;
  }
}