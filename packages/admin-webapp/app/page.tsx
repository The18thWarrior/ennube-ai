// === page.tsx ===
// Created: 2025-08-29 10:38
// Purpose: Main dashboard page with overview
// Exports: Dashboard component
// Interactions: Entry point for admin interface
// Notes: Provides overview and quick links to all admin functions
'use client'
import { AdminLayout } from "#/components/admin-layout"
import { Button } from "#/components/ui/button"
import Link from "next/link"
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
  Activity
} from "lucide-react"

export default function Dashboard() {
  const quickActions = [
    {
      name: "Users",
      description: "Manage users",
      href: "/admin/users",
      icon: Users,
      color: "bg-red-500"
    },
    {
      name: "User Profiles",
      description: "Manage user information and profiles",
      href: "/admin/user-profiles",
      icon: Award,
      color: "bg-blue-500"
    },
    {
      name: "Customer Profiles",
      description: "Customer segmentation and targeting",
      href: "/admin/customer-profiles",
      icon: UserCheck,
      color: "bg-green-500"
    },
    {
      name: "Agent Settings",
      description: "Configure AI agents and automation",
      href: "/admin/agent-settings",
      icon: Bot,
      color: "bg-purple-500"
    },
    {
      name: "API Keys",
      description: "Manage API access and authentication",
      href: "/admin/api-keys",
      icon: Key,
      color: "bg-yellow-500"
    },
    {
      name: "Outcomes",
      description: "View agent workflow results",
      href: "/admin/outcomes",
      icon: Target,
      color: "bg-red-500"
    },
    {
      name: "Usage Logs",
      description: "Monitor system usage and activity",
      href: "/admin/usage-logs",
      icon: Activity,
      color: "bg-indigo-500"
    }
  ]

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your Ennube AI platform data and configurations
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-card p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-semibold text-foreground">—</p>
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Bot className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Agents</p>
                <p className="text-2xl font-semibold text-foreground">—</p>
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-8 w-8 text-purple-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Outcomes</p>
                <p className="text-2xl font-semibold text-foreground">—</p>
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg shadow border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-8 w-8 text-red-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Usage</p>
                <p className="text-2xl font-semibold text-foreground">—</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className="block p-6 bg-card rounded-lg shadow border hover:shadow-md transition-shadow"
              >
                <div className="flex items-center">
                  <div className={`flex-shrink-0 p-3 rounded-lg ${action.color}`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-foreground">
                      {action.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-6">Recent Activity</h2>
          <div className="bg-card rounded-lg shadow border">
            <div className="p-6">
              <p className="text-muted-foreground text-center py-8">
                No recent activity to display. Start managing your data using the quick actions above.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

/*
 * === page.tsx ===
 * Updated: 2025-08-29 10:38
 * Summary: Main dashboard page with overview and quick actions
 * Key Components:
 *   - Dashboard: Main dashboard component with stats and actions
 *   - quickActions: Navigation shortcuts to admin pages
 *   - Stats overview: Placeholder for key metrics
 * Dependencies:
 *   - Requires: AdminLayout, UI components, Next.js Link
 * Version History:
 *   v1.0 – initial dashboard with navigation
 * Notes:
 *   - Responsive grid layout
 *   - Placeholder stats ready for real data
 */
