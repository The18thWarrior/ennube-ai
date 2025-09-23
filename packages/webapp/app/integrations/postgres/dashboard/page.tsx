export const dynamic = "force-dynamic";
// === dashboard/page.tsx ===
// Created: 2025-07-21 10:20
// Purpose: PostgreSQL integration dashboard page
// Exports:
//   - PostgresDashboard (default)
// Interactions:
//   - Used by: connected users to manage PostgreSQL integration
// Notes:
//   - Shows connection status, database info, and management options

import { auth } from "@/auth"
import { Button } from "@/components/ui/button"
import CustomLink from "@/components/custom-link"
import { redirect } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import PostgresSignOut from "./PostgresSignOut"
import { getPostgresUrlById, parsePostgresConfigFromUrl } from "@/lib/db/postgres-storage"
import { connectToPostgres } from "@/lib/postgres"
import Link from "next/link"

export default async function PostgresDashboard() {
  const session = await auth()

  // Check if we have PostgreSQL credentials
  const urlData = await getPostgresUrlById()
  if (!urlData) {
    console.log('No PostgreSQL credentials found, redirecting to connect page')
    redirect("/integrations/postgres/connect")
  }

  // Parse connection config
  let config;
  let connectionError = null;
  let dbInfo = null;

  try {
    config = parsePostgresConfigFromUrl(urlData.instanceUrl)
    
    // Test connection and get database info
    const client = connectToPostgres(config)
    try {
      const result = await client.query('SELECT version(), current_database(), current_user, now() as current_time')
      dbInfo = result.rows[0]
    } catch (err) {
      connectionError = err instanceof Error ? err.message : 'Connection failed'
    } finally {
      await client.close()
    }
  } catch (err) {
    connectionError = err instanceof Error ? err.message : 'Invalid connection URL'
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <img src={"/postgres.svg"} alt={'PostgreSQL Logo'} className="h-10 w-10 object-contain" />
        PostgreSQL Dashboard
      </h1>

      {connectionError ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <p className="text-red-700">
              Connection Error: {connectionError}. Please check your connection settings.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Connection Status */}
          <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-green-700 dark:text-green-400 font-medium">
                Connected to PostgreSQL Database
              </p>
            </div>
          </div>
          
          {/* Database Info */}
          {dbInfo && config && (
            <div className="p-6 bg-popover  rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Database Information</h2>
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-medium">{dbInfo.current_database}</p>
                  <p className="text-muted-foreground">User: {dbInfo.current_user}</p>
                  <p className="text-sm text-muted">Host: {config.host}:{config.port}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">PostgreSQL Version</h3>
                  <p className="text-sm">{dbInfo.version}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Connection Time</h3>
                  <p className="text-sm">{new Date(dbInfo.current_time).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Quick Actions */}
          <div className="p-6 bg-popover  rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button asChild variant="outline" className="h-auto py-4 px-6 flex flex-col items-center justify-center gap-2">
                <CustomLink href="/integrations/postgres/query">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Execute Queries</span>
                </CustomLink>
              </Button>

              <Button asChild variant="outline" className="h-auto py-4 px-6 flex flex-col items-center justify-center gap-2">
                <CustomLink href="/integrations/postgres/schema">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>Browse Schema</span>
                </CustomLink>
              </Button>

              <Button asChild variant="outline" className="h-auto py-4 px-6 flex flex-col items-center justify-center gap-2">
                <CustomLink href="/integrations/postgres/analytics">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>View Analytics</span>
                </CustomLink>
              </Button>
            </div>
          </div>
        </>
      )}
      
      {/* Administration Section */}
      <div className="p-6 bg-muted  rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Administration</h2>
        <div className="flex flex-col space-y-4">
          <div className="flex flex-row space-x-4">
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <CustomLink href="/integrations/postgres/connect">Reconnect Database</CustomLink>
            </Button>
            
            <div className="w-full sm:w-auto">
              <PostgresSignOut />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/*
 * === dashboard/page.tsx ===
 * Updated: 2025-07-21 10:20
 * Summary: PostgreSQL integration dashboard with connection status and quick actions
 * Key Components:
 *   - Connection status display
 *   - Database information panel
 *   - Quick action buttons
 *   - Administration controls
 * Dependencies:
 *   - Requires: auth, postgres-storage, postgres client
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Tests connection on page load and displays results
 */
