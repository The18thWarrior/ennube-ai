// === page.tsx ===
// Created: 2025-08-29 11:20
// Purpose: Usage log admin page with list and basic interactions
// Exports: UsageLogPage component
// Interactions: Read/list usage_log entries with pagination and search
// Notes: Mirrors the user-profiles admin page structure

'use client'

import * as React from "react"
import { AdminLayout } from "#/components/admin-layout"
import { DataTable, type Column } from "#/components/data-table"
import type { UsageLog, PaginatedResponse, ApiResponse } from "#/lib/types"
import { formatTimestamp, getErrorMessage } from "#/lib/utils"

export default function UsageLogPage() {
  const [data, setData] = React.useState<UsageLog[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const columns: Column<UsageLog>[] = [
    { key: 'id', header: 'ID', render: (item) => `${item.id}` },
  { key: 'timestamp', header: 'Timestamp', render: (item) => formatTimestamp(item.timestamp) },
    { key: 'user_sub', header: 'User' },
    { key: 'agent', header: 'Agent', sortable: true, searchable: true },
    { key: 'records_updated', header: 'Updated' },
    { key: 'records_created', header: 'Created' },
    { key: 'meetings_booked', header: 'Meetings' },
    { key: 'queries_executed', header: 'Queries' },
    { key: 'usage', header: 'Usage' },
    { key: 'status', header: 'Status' },
    { key: 'created_at', header: 'Created', render: (item) => item.created_at }
  ]

  const fetchData = async (params?: { page?: number; search?: string }) => {
    setLoading(true)
    setError(null)

    try {
      const searchParams = new URLSearchParams({
        page: String(params?.page || pagination.page),
        limit: String(pagination.limit),
        ...(params?.search && { search: params.search })
      })

      const response = await fetch(`/api/usage-log?${searchParams}`)
      const result: ApiResponse<PaginatedResponse<UsageLog>> = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch usage log')
      }

      if (result.data) {
        const items: UsageLog[] = Array.isArray((result as any).data) ? (result as any).data : (result as any).data?.data || []
        setData(items)

        const paginationFromRoot = (result as any).pagination
        const paginationFromData = (result as any).data?.pagination
        if (paginationFromRoot || paginationFromData) {
          setPagination(prev => ({ ...prev, ...(paginationFromRoot || paginationFromData) }))
        }
      }
    } catch (err) {
      setError(getErrorMessage(err))
      setData([])
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => { fetchData() }, [])

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
    fetchData({ page })
  }

  const handleSearch = (search: string) => {
    setPagination(prev => ({ ...prev, page: 1 }))
    // fetchData({ page: 1, search })
  }

  return (
    <AdminLayout>
      <DataTable
        title="Usage Log"
        data={data}
        columns={columns}
        loading={loading}
        error={error}
        pagination={pagination}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        searchPlaceholder="Search by agent or user..."
      />
    </AdminLayout>
  )
}

/*
 * === page.tsx ===
 * Updated: 2025-08-29 11:20
 * Summary: Admin page to view usage_log entries
 */
