// === page.tsx ===
// Created: 2025-08-29 11:05
// Purpose: Contract results admin page with CRUD operations
// Exports: ContractResultsPage component
// Interactions: List, create, update, delete contract_results via API

'use client'

import * as React from 'react'
import { AdminLayout } from '@/components/admin-layout'
import { DataTable, type Column } from '@/components/data-table'
import { ContractResultsForm } from './contract-results-form'
import type { ContractResult, CreateContractResultData, PaginatedResponse, ApiResponse } from '@/lib/types'
import { formatDate, getErrorMessage } from '@/lib/utils'

export default function ContractResultsPage() {
  const [data, setData] = React.useState<ContractResult[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [pagination, setPagination] = React.useState({ page: 1, limit: 10, total: 0, totalPages: 0 })

  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<ContractResult | null>(null)

  const columns: Column<ContractResult>[] = [
    { key: 'id', header: 'ID', render: (item) => item.id },
    { key: 'user_id', header: 'User' },
    { key: 'provider', header: 'Provider' },
    { key: 'source_id', header: 'Source ID' },
    { key: 'created_at', header: 'Created', render: (i) => formatDate(i.created_at) },
    { key: 'actions', header: 'Actions' }
  ]

  const fetchData = async (params?: { page?: number; search?: string }) => {
    setLoading(true)
    setError(null)
    try {
      const searchParams = new URLSearchParams({
        page: String(params?.page || pagination.page),
        limit: String(pagination.limit)
      })

      const res = await fetch(`/api/contract-results?${searchParams}`)
      // API may return either a PaginatedResponse<T> or a plain T[] in `data`.
      const result: ApiResponse<PaginatedResponse<ContractResult> | ContractResult[]> = await res.json()
      if (!result.success) throw new Error(result.error || 'Failed to fetch')

      // Normalize items to ContractResult[] regardless of response shape.
      let items: ContractResult[] = []
      if (Array.isArray(result.data)) {
        items = result.data
      } else if (result.data && Array.isArray((result.data as PaginatedResponse<ContractResult>).data)) {
        items = (result.data as PaginatedResponse<ContractResult>).data
      }

      setData(items)

      const paginationFromRoot = (result as any).pagination
      const paginationFromData = (result as any).data?.pagination
      if (paginationFromRoot || paginationFromData) {
        setPagination(prev => ({ ...prev, ...(paginationFromRoot || paginationFromData) }))
      }
    } catch (err) {
      setError(getErrorMessage(err))
      setData([])
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => { fetchData() }, [])

  const handlePageChange = (page: number) => { setPagination(prev => ({ ...prev, page })); fetchData({ page }) }
  const handleCreate = () => { setEditing(null); setFormOpen(true) }
  const handleEdit = (row: ContractResult) => { setEditing(row); setFormOpen(true) }

  const handleDelete = async (row: ContractResult) => {
    try {
      const res = await fetch(`/api/contract-results/${row.id}`, { method: 'DELETE' })
      const result: ApiResponse = await res.json()
      if (!result.success) throw new Error(result.error || 'Failed to delete')
      await fetchData()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const handleFormSubmit = async (formData: CreateContractResultData) => {
    try {
      const url = editing ? `/api/contract-results/${editing.id}` : '/api/contract-results'
      const method = editing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const result: ApiResponse<ContractResult> = await res.json()
      if (!result.success) throw new Error(result.error || 'Failed')
      await fetchData()
    } catch (err) {
      throw err
    }
  }

  return (
    <AdminLayout>
      <DataTable
        title="Contract Results"
        data={data}
        columns={columns}
        loading={loading}
        error={error}
        pagination={pagination}
        onPageChange={handlePageChange}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ContractResultsForm
        open={formOpen}
        onOpenChange={setFormOpen}
        contractResult={editing}
        onSubmit={handleFormSubmit}
      />
    </AdminLayout>
  )
}

/*
 * === page.tsx ===
 */
