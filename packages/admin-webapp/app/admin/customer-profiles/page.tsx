// === page.tsx ===
// Created: 2025-08-29 11:20
// Purpose: Customer profiles admin page with CRUD operations
// Exports: CustomerProfilesPage component
// Interactions: Full CRUD interface for customer profile management
// Notes: Uses DataTable and CustomerProfilesForm for complete functionality

'use client'

import * as React from "react"
import { AdminLayout } from "#/components/admin-layout"
import { DataTable, type Column } from "#/components/data-table"
import { CustomerProfilesForm } from "./customer-profiles-form"
import type { CustomerProfile, CreateCustomerProfileData, PaginatedResponse, ApiResponse } from "#/lib/types"
import { formatDate, getErrorMessage } from "#/lib/utils"

/**
 * OVERVIEW
 *
 * - Purpose: Complete CRUD interface for customer profiles
 * - Assumptions: API endpoints available, proper error handling
 * - Edge Cases: Network failures, validation errors, empty states
 * - How it fits: Admin page for managing customer profile data
 * - Future Improvements: Add bulk operations, export functionality
 */

export default function CustomerProfilesPage() {
  const [data, setData] = React.useState<CustomerProfile[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  
  // Form state
  const [formOpen, setFormOpen] = React.useState(false)
  const [editingProfile, setEditingProfile] = React.useState<CustomerProfile | null>(null)

  // Define table columns
  const columns: Column<CustomerProfile>[] = [
    {
      key: 'id',
      header: 'ID',
      render: (item) => item.id
    },
    {
      key: 'customer_profile_name',
      header: 'Name',
      sortable: true,
      searchable: true
    },
    {
      key: 'user_id',
      header: 'Owner'
    },
    {
      key: 'active',
      header: 'Active',
      render: (item) => item.active ? 'Yes' : 'No'
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (item) => formatDate(item.created_at)
    },
    {
      key: 'actions',
      header: 'Actions'
    }
  ]

  // Fetch data function
  const fetchData = async (params?: {
    page?: number
    search?: string
  }) => {
    setLoading(true)
    setError(null)
    
    try {
      const searchParams = new URLSearchParams({
        page: String(params?.page || pagination.page),
        limit: String(pagination.limit),
        ...(params?.search && { search: params.search })
      })

      const response = await fetch(`/api/customer-profiles?${searchParams}`)
      
      const result: ApiResponse<PaginatedResponse<CustomerProfile>> = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch customer profiles')
      }

      if (result.data) {
        const items: CustomerProfile[] = Array.isArray((result as any).data) ? (result as any).data : (result as any).data?.data || []
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
  };

  // Initial data load
  React.useEffect(() => {
    fetchData()
  }, [])

  // Handle page change
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
    fetchData({ page })
  }

  // Handle search
  const handleSearch = (search: string) => {
    setPagination(prev => ({ ...prev, page: 1 }))
    //fetchData({ page: 1, search })
  }

  // Handle create
  const handleCreate = () => {
    setEditingProfile(null)
    setFormOpen(true)
  }

  // Handle edit
  const handleEdit = (profile: CustomerProfile) => {
    setEditingProfile(profile)
    setFormOpen(true)
  }

  // Handle delete
  const handleDelete = async (profile: CustomerProfile) => {
    try {
      const response = await fetch(`/api/customer-profiles/${profile.id}`, {
        method: 'DELETE'
      })

      const result: ApiResponse = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete customer profile')
      }

      // Refresh data
      await fetchData()
    } catch (err) {
      console.error('Delete error:', err)
      setError(getErrorMessage(err))
    }
  }

  // Handle form submit
  const handleFormSubmit = async (formData: CreateCustomerProfileData) => {
    try {
      const url = editingProfile 
        ? `/api/customer-profiles/${editingProfile.id}`
        : '/api/customer-profiles'
      
      const method = editingProfile ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const result: ApiResponse<CustomerProfile> = await response.json()

      if (!result.success) {
        throw new Error(result.error || `Failed to ${editingProfile ? 'update' : 'create'} customer profile`)
      }

      // Refresh data
      await fetchData()
    } catch (err) {
      console.error('Form submit error:', err)
      throw err // Re-throw to let form handle the error
    }
  }

  return (
    <AdminLayout>
      <DataTable
        title="Customer Profiles"
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
        searchPlaceholder="Search by name or industry..."
        createButtonText="Create Customer Profile"
      />

      <CustomerProfilesForm
        open={formOpen}
        onOpenChange={setFormOpen}
        customerProfile={editingProfile}
        onSubmit={handleFormSubmit}
      />
    </AdminLayout>
  )
}

/*
 * === page.tsx ===
 * Updated: 2025-08-29 11:20
 * Summary: Customer profiles admin page with CRUD operations
 */
