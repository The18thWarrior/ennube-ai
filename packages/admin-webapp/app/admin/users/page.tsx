// === page.tsx ===
// Created: 2025-08-30 13:10
// Purpose: Admin page to manage Auth0 users (list, edit, delete)
// Exports: UsersAdminPage component

'use client'

import * as React from 'react'
import { AdminLayout } from '#/components/admin-layout'
import { DataTable, type Column } from '#/components/data-table'
import { UsersForm } from './users-form'
import { formatDate, getErrorMessage } from '#/lib/utils'

type Auth0User = {
  user_id?: string
  email?: string
  name?: string
  given_name?: string
  family_name?: string
  created_at?: string
  app_metadata?: Record<string, any>
  user_metadata?: Record<string, any>
  [key: string]: any
}

export default function UsersAdminPage() {
  const [data, setData] = React.useState<Auth0User[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isCreating, setIsCreating] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [pagination, setPagination] = React.useState({ page: 1, limit: 50, total: 0, totalPages: 0 })

  const [formOpen, setFormOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<Auth0User | null>(null)

  const columns: Column<Auth0User>[] = [
    { key: 'user_id', header: 'ID', render: (u) => u.user_id ?? '' },
    { key: 'name', header: 'Name', sortable: true, searchable: true },
    { key: 'email', header: 'Email', sortable: true, searchable: true },
    { key: 'last_login', header: 'Last Login', render: (u) => formatDate(u.last_login ?? '') },
    { key: 'actions', header: 'Actions' }
  ]

  const fetchData = async (params?: { page?: number; search?: string }) => {
    setLoading(true)
    setError(null)
    try {
      const sp = new URLSearchParams({
        page: String((params?.page ?? pagination.page) - 1), // server uses 0-based page
        perPage: String(pagination.limit),
        ...(params?.search ? { q: params.search } : {})
      })

      const res = await fetch(`/api/users?${sp.toString()}`)
      if (!res.ok) throw new Error(`Failed to fetch users (${res.status})`)
      const body = await res.json()
      const users = Array.isArray(body.users) ? body.users : body.data ?? []
      setData(users)

      if (body.total != null) {
        setPagination((p) => ({ ...p, total: body.total, totalPages: Math.ceil(body.total / p.limit) }))
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
    setPagination((p) => ({ ...p, page }))
    fetchData({ page })
  }

  const handleEdit = (user: Auth0User) => { console.log('edit user called');setEditingUser(user); setIsCreating(false); setFormOpen(true) }

  const handleDelete = async (user: Auth0User) => {
    try {
      if (!user.user_id) throw new Error('Missing user id')
      const res = await fetch(`/api/users/${encodeURIComponent(user.user_id)}`, { method: 'DELETE' })
      if (res.status !== 204) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || `Delete failed (${res.status})`)
      }
      await fetchData()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const createUser = async (formData: any) => {
    try {
      const res = await fetch(`/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || `Create failed (${res.status})`)
      }
      await fetchData()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  const updateUser = async (formData: any) => {
    try {
      if (!editingUser) throw new Error('No editing user')

      const res = await fetch(`/api/users/${encodeURIComponent(editingUser.user_id || '')}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || `Update failed (${res.status})`)
      }
      await fetchData()
      setFormOpen(false)
    } catch (err) {
      setError(getErrorMessage(err))
      throw err
    }
  }

  const handleFormSubmit = async (formData: any) => {
    try {
      if (!editingUser) {
        await createUser(formData)
      } else {
        // Updating existing user
        await updateUser(formData)
      }
      await fetchData()
      setFormOpen(false)
    } catch (err) {
      throw err
    }
  }

  const handleCreate = () => {
    // For now, this admin page only supports edit/delete. Creating new Auth0 users often requires a password.
    // Could open a create flow in future.
    setEditingUser(null)
    setIsCreating(true)
    setFormOpen(true)
  }

  const handleResetPassword = async (userId: string) => {
    try {
      if (!userId) throw new Error('No user ID provided for password reset')
      const res = await fetch(`/api/users/${encodeURIComponent(userId)}/reset`, { method: 'GET' })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || `Password reset failed (${res.status})`)
      }
      alert('Password reset email sent')
    } catch (err) {
      setError(getErrorMessage(err))
      throw err
    }
  }

  return (
    <AdminLayout>
      <DataTable
        title="Auth0 Users"
        data={data}
        columns={columns}
        loading={loading}
        error={error}
        pagination={pagination}
        onPageChange={handlePageChange}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        searchPlaceholder="Search users..."
        createButtonText="Create User"
      />

      <UsersForm
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editingUser}
        onSubmit={handleFormSubmit}
        onResetPassword={handleResetPassword}
      />
    </AdminLayout>
  )
}

/*
 * === page.tsx ===
 * Updated: 2025-08-30 13:10
 * Summary: Admin page to list and manage Auth0 users
 */
