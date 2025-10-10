// === page.tsx ===
// Created: 2025-08-29 10:50
// Purpose: User profiles admin page with CRUD operations
// Exports: UserProfilesPage component
// Interactions: Full CRUD interface for user profile management
// Notes: Uses DataTable and UserProfileForm for complete functionality

'use client'

import * as React from "react"
import { AdminLayout } from "#/components/admin-layout"
import { DataTable, type Column } from "#/components/data-table"
import { UserProfileForm } from "./user-profiles-form"
import type { UserProfile, CreateUserProfileData, PaginatedResponse, ApiResponse } from "#/lib/types"
import { formatDate, getErrorMessage } from "#/lib/utils"

/**
 * OVERVIEW
 *
 * - Purpose: Complete CRUD interface for user profiles
 * - Assumptions: API endpoints available, proper error handling
 * - Edge Cases: Network failures, validation errors, empty states
 * - How it fits: Admin page for managing user profile data
 * - Future Improvements: Add bulk operations, export functionality
 */

export default function UserProfilesPage() {
  const [data, setData] = React.useState<UserProfile[]>([])
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
  const [editingProfile, setEditingProfile] = React.useState<UserProfile | null>(null)

  // Define table columns
  const columns: Column<UserProfile>[] = [
    {
      key: 'id',
      header: 'ID',
      render: (item) => `#${item.id}`
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      searchable: true
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      searchable: true
    },
    {
      key: 'company',
      header: 'Company',
      sortable: true,
      searchable: true
    },
    {
      key: 'job_role',
      header: 'Job Role'
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

      const response = await fetch(`/api/user-profiles?${searchParams}`)
      
      const result: ApiResponse<PaginatedResponse<UserProfile>> = await response.json()
      console.log(result);
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch user profiles')
      }

      if (result.data) {
        const items: UserProfile[] = Array.isArray((result as any).data) ? (result as any).data : (result as any).data?.data || []
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
  const handleEdit = (profile: UserProfile) => {
    setEditingProfile(profile)
    setFormOpen(true)
  }

  // Handle delete
  const handleDelete = async (profile: UserProfile) => {
    try {
      const response = await fetch(`/api/user-profiles/${profile.id}`, {
        method: 'DELETE'
      })

      const result: ApiResponse = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete user profile')
      }

      // Refresh data
      await fetchData()
    } catch (err) {
      console.error('Delete error:', err)
      setError(getErrorMessage(err))
    }
  }

  // Handle form submit
  const handleFormSubmit = async (formData: CreateUserProfileData) => {
    try {
      const url = editingProfile 
        ? `/api/user-profiles/${editingProfile.id}`
        : '/api/user-profiles'
      
      const method = editingProfile ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const result: ApiResponse<UserProfile> = await response.json()

      if (!result.success) {
        throw new Error(result.error || `Failed to ${editingProfile ? 'update' : 'create'} user profile`)
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
        title="User Profiles"
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
        searchPlaceholder="Search by name, email, or company..."
        createButtonText="Create User Profile"
      />

      <UserProfileForm
        open={formOpen}
        onOpenChange={setFormOpen}
        userProfile={editingProfile}
        onSubmit={handleFormSubmit}
      />
    </AdminLayout>
  )
}

/*
 * === page.tsx ===
 * Updated: 2025-08-29 10:50
 * Summary: Complete user profiles admin page with CRUD operations
 * Key Components:
 *   - UserProfilesPage: Main page component with data management
 *   - DataTable integration: List view with pagination and search
 *   - UserProfileForm integration: Create and edit functionality
 * Dependencies:
 *   - Requires: API endpoints, components, types
 * Version History:
 *   v1.0 – initial CRUD page with full functionality
 * Notes:
 *   - Handles all CRUD operations with proper error handling
 *   - Includes search, pagination, and real-time updates
 */
