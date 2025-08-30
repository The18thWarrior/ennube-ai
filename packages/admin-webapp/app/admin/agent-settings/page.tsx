// === page.tsx ===
// Created: 2025-08-29 11:00
// Purpose: Agent settings admin page with CRUD operations
// Exports: AgentSettingsPage component
// Interactions: List, create, update, and delete agent settings
// Notes: Mirrors user-profiles admin page structure

'use client'

import * as React from 'react'
import { AdminLayout } from '@/components/admin-layout'
import { DataTable, type Column } from '@/components/data-table'
import { AgentSettingsForm } from './agent-settings-form'
import type { AgentSettings, CreateAgentSettingsData, PaginatedResponse, ApiResponse } from '@/lib/types'
import { formatTimestamp, getErrorMessage } from '@/lib/utils'

/**
 * OVERVIEW
 *
 * - Purpose: CRUD interface for AgentSettings
 * - Assumptions: API endpoints at /api/agent-settings
 * - Edge Cases: Network failures, validation errors, empty states
 * - How it fits: Admin UI for configuring agent sync/settings
 * - Future Improvements: add bulk enable/disable, export/import
 */

export default function AgentSettingsPage() {
  const [data, setData] = React.useState<AgentSettings[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [pagination, setPagination] = React.useState({ page: 1, limit: 10, total: 0, totalPages: 0 })

  // Form state
  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<AgentSettings | null>(null)

  const columns: Column<AgentSettings>[] = [
    { key: 'id', header: 'ID', render: (item) => item.id },
    { key: 'agent', header: 'Agent', sortable: true, searchable: true },
    { key: 'provider', header: 'Provider', sortable: true },
    { key: 'batch_size', header: 'Batch Size' },
    { key: 'active', header: 'Active', render: (item) => (item.active ? 'Yes' : 'No') },
    { key: 'frequency', header: 'Frequency' },
  { key: 'created_at', header: 'Created', render: (item) => formatTimestamp(item.created_at) },
    { key: 'actions', header: 'Actions' }
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

      const response = await fetch(`/api/agent-settings?${searchParams}`)
      const result: ApiResponse<PaginatedResponse<AgentSettings>> = await response.json()

      if (!result.success) throw new Error(result.error || 'Failed to fetch agent settings')

      if (result.data) {
        // Support two shapes: { data: T[] , pagination } or data: T[] directly
        const items: AgentSettings[] = Array.isArray((result as any).data) ? (result as any).data : (result as any).data?.data || []
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

  const handleCreate = () => { setEditing(null); setFormOpen(true) }
  const handleEdit = (item: AgentSettings) => { setEditing(item); setFormOpen(true) }

  const handleDelete = async (item: AgentSettings) => {
    try {
      const response = await fetch(`/api/agent-settings/${item.id}`, { method: 'DELETE' })
      const result: ApiResponse = await response.json()
      if (!result.success) throw new Error(result.error || 'Failed to delete agent setting')
      await fetchData()
    } catch (err) {
      console.error('Delete error:', err)
      setError(getErrorMessage(err))
    }
  }

  const handleFormSubmit = async (formData: CreateAgentSettingsData) => {
    try {
      const url = editing ? `/api/agent-settings/${editing.id}` : '/api/agent-settings'
      const method = editing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result: ApiResponse<AgentSettings> = await response.json()
      if (!result.success) throw new Error(result.error || `Failed to ${editing ? 'update' : 'create'} agent setting`)
      await fetchData()
    } catch (err) {
      console.error('Form submit error:', err)
      throw err
    }
  }

  return (
    <AdminLayout>
      <DataTable
        title="Agent Settings"
        data={data}
        columns={columns}
        loading={loading}
        error={error}
        pagination={pagination}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Search by agent or provider..."
        createButtonText="Create Agent Setting"
      />

      <AgentSettingsForm
        open={formOpen}
        onOpenChange={setFormOpen}
        agentSettings={editing}
        onSubmit={handleFormSubmit}
      />
    </AdminLayout>
  )
}

/*
 * === page.tsx ===
 * Updated: 2025-08-29 11:00
 * Summary: Admin page for AgentSettings mirroring user-profiles
 */
