// === page.tsx ===
// Created: 2025-08-29 11:10
// Purpose: Credentials admin page with CRUD operations
// Exports: CredentialsPage component
// Interactions: Full CRUD interface for credentials

'use client'

import * as React from "react"
import { AdminLayout } from "#/components/admin-layout"
import { DataTable, type Column } from "#/components/data-table"
import { CredentialsForm } from "./credentials-form"
import type { Credential, CreateCredentialData, PaginatedResponse, ApiResponse } from "#/lib/types"
import { formatDate, getErrorMessage } from "#/lib/utils"

export default function CredentialsPage() {
  const [data, setData] = React.useState<Credential[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [pagination, setPagination] = React.useState({ page: 1, limit: 10, total: 0, totalPages: 0 })

  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Credential | null>(null)

  const columns: Column<Credential>[] = [
    { key: 'id', header: 'ID', render: (item) => item.id },
    { key: 'type', header: 'Type', sortable: true },
    { key: 'user_info_display_name', header: 'Display Name', searchable: true },
    { key: 'user_info_email', header: 'Email' },
    { key: 'instance_url', header: 'Instance' },
    { key: 'created_at', header: 'Created', render: (item) => formatDate(item.created_timestamp) },
    { key: 'actions', header: 'Actions' }
  ]

  const fetchData = async (params?: { page?: number; search?: string }) => {
    setLoading(true)
    setError(null)

    try {
      const searchParams = new URLSearchParams({ page: String(params?.page || pagination.page), limit: String(pagination.limit), ...(params?.search && { search: params.search }) })
      const response = await fetch(`/api/credentials?${searchParams}`)
      const result: ApiResponse<PaginatedResponse<Credential>> = await response.json()
      
      if (!result.success) throw new Error(result.error || 'Failed to fetch credentials')
      
      if (result.data) {
        const items: Credential[] = Array.isArray((result as any).data) ? (result as any).data : (result as any).data?.data || []
        setData(items)
        const paginationFromRoot = (result as any).pagination
        const paginationFromData = (result as any).data?.pagination
        if (paginationFromRoot || paginationFromData) setPagination(prev => ({ ...prev, ...(paginationFromRoot || paginationFromData) }))
      }
    } catch (err) {
      console.log(err);
      setError(getErrorMessage(err))
      setData([])
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => { fetchData() }, [])

  const handlePageChange = (page: number) => { setPagination(prev => ({ ...prev, page })); fetchData({ page }) }
  const handleSearch = (search: string) => { setPagination(prev => ({ ...prev, page: 1 })); /*fetchData({ page:1, search })*/ }

  const handleCreate = () => { setEditing(null); setFormOpen(true) }
  const handleEdit = (item: Credential) => { setEditing(item); setFormOpen(true) }

  const handleDelete = async (item: Credential) => {
    try {
      const response = await fetch(`/api/credentials/${item.id}`, { method: 'DELETE' })
      const result: ApiResponse = await response.json()
      if (!result.success) throw new Error(result.error || 'Failed to delete credential')
      await fetchData()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleFormSubmit = async (formData: CreateCredentialData) => {
    try {
      const url = editing ? `/api/credentials/${editing.id}` : '/api/credentials'
      const method = editing ? 'PUT' : 'POST'
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      const result: ApiResponse<Credential> = await response.json()
      if (!result.success) throw new Error(result.error || `Failed to ${editing ? 'update' : 'create'} credential`)
      await fetchData()
    } catch (err) {
      throw err
    }
  }

  return (
    <AdminLayout>
      <DataTable
        title="Credentials"
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
        searchPlaceholder="Search by email, display name, or instance..."
        createButtonText="Create Credential"
      />

      <CredentialsForm open={formOpen} onOpenChange={setFormOpen} credential={editing} onSubmit={handleFormSubmit} />
    </AdminLayout>
  )
}
