// === admin-layout.tsx ===
// Created: 2025-08-29 10:35
// Purpose: Admin layout with navigation sidebar
// Exports: AdminLayout component
// Interactions: Used as wrapper for all admin pages
// Notes: Responsive sidebar with navigation to all CRUD pages

'use client'

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Users,
  UserCheck,
  Bot,
  Key,
  Award,
  Shield,
  Target,
  BarChart,
  FileText,
  Activity,
  Menu,
  X
} from "lucide-react"
import { ThemeSwitcher } from "@/components/theme-switcher"

/**
 * OVERVIEW
 *
 * - Purpose: Provides consistent admin layout with navigation
 * - Assumptions: All admin pages use this layout
 * - Edge Cases: Mobile responsive sidebar, active state management
 * - How it fits: Wrapper component for all admin pages
 * - Future Improvements: Add user authentication, breadcrumbs
 */

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  active?: boolean
}

const navigation: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/",
    icon: BarChart,
    description: "Overview and analytics",
    active: true
  },
  {
    name: "User Profiles",
    href: "/admin/user-profiles",
    icon: Users,
    description: "Manage user profile information",
    active: true
  },
  {
    name: "Customer Profiles",
    href: "/admin/customer-profiles",
    icon: UserCheck,
    description: "Customer segmentation profiles",
    active: true
  },
  {
    name: "Contract Results",
    href: "/admin/contract-results",
    icon: FileText,
    description: "Contract analysis results",
    active: true
  },
  {
    name: "Agent Settings",
    href: "/admin/agent-settings",
    icon: Bot,
    description: "Configure AI agent settings",
    active: true
  },
  {
    name: "API Keys",
    href: "/admin/api-keys",
    icon: Key,
    description: "Manage API access keys",
    active: false
  },
  {
    name: "Licenses",
    href: "/admin/licenses",
    icon: Award,
    description: "License management",
    active: false
  },
  {
    name: "Credentials",
    href: "/admin/credentials",
    icon: Shield,
    description: "Integration credentials",
    active: true
  },
  {
    name: "Outcomes",
    href: "/admin/outcomes",
    icon: Target,
    description: "Agent workflow outcomes",
    active: false
  },
  {
    name: "Usage Logs",
    href: "/admin/usage-log",
    icon: Activity,
    description: "System usage tracking",
    active: true
  }
]

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const STORAGE_KEY = 'connected-user-id'
  const DEFAULT_ID = 'auth0|682a2746a6156e107aff5cde'

  const [connectedUserId, setConnectedUserId] = React.useState<string>(DEFAULT_ID)

  const router = useRouter()

  const handleLogout = React.useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      // ignore network errors
    }
    // Redirect to auth page after logout
    try {
      router.push('/auth')
    } catch (e) {
      // fallback
      window.location.href = '/auth'
    }
  }, [router])

  React.useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY)
      if (v) setConnectedUserId(v)
    } catch (e) {
      // ignore
    }
  }, [])

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, connectedUserId)
    } catch (e) {
      // ignore
    }
  }, [connectedUserId])

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
          </div>
          {/* <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="h-6 w-6" />
          </button> */}
        </div>

        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              if (!item.active) return null
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent/5 hover:text-foreground"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top bar */}
        <div className="bg-card shadow-sm border-b h-16 flex items-center justify-between px-4">
          <div className="flex items-center">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </button>
            {/* <div className="ml-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Connected as:</span>
              <Input
                value={connectedUserId}
                onChange={(e) => setConnectedUserId(e.target.value)}
                className="text-sm w-56"
              />
            </div> */}
          </div>

          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            |
            <Button size="sm" variant="secondary" onClick={handleLogout}>Logout</Button>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}

/*
 * === admin-layout.tsx ===
 * Updated: 2025-08-29 10:35
 * Summary: Admin layout with responsive navigation sidebar
 * Key Components:
 *   - AdminLayout: Main layout wrapper with sidebar
 *   - navigation: Route definitions for all admin pages
 *   - Responsive design with mobile sidebar overlay
 * Dependencies:
 *   - Requires: Next.js navigation, UI components, icons
 * Version History:
 *   v1.0 	6 initial admin layout with full navigation
 * Notes:
 *   - Mobile responsive with hamburger menu
 *   - Active route highlighting
 */
