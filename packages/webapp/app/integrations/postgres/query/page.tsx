export const dynamic = "force-dynamic";
// === query/page.tsx ===
// Created: 2025-07-21 10:25
// Purpose: PostgreSQL query execution page
// Exports:
//   - PostgresQueryPage (default)
// Interactions:
//   - Used by: users wanting to execute SQL queries
// Notes:
//   - Placeholder page for future query interface

import { auth } from "@/auth"
import CustomLink from "@/components/custom-link"
import { Button } from "@/components/ui/button"
import { getPostgresUrlById } from "@/lib/db/postgres-storage"
import { redirect } from "next/navigation"

export default async function PostgresQueryPage() {
  const urlData = await getPostgresUrlById()
  
  if (!urlData) {
    redirect("/integrations/postgres/connect")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">SQL Query Interface</h1>
      
      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Coming Soon</h2>
        <p className="mb-4">
          The interactive SQL query interface is currently under development. 
          You can already execute queries via the API endpoints.
        </p>
        <Button asChild>
          <CustomLink href="/integrations/postgres/dashboard">
            Back to Dashboard
          </CustomLink>
        </Button>
      </div>
    </div>
  )
}

/*
 * === query/page.tsx ===
 * Updated: 2025-07-21 10:25
 * Summary: Placeholder page for PostgreSQL query interface
 * Key Components:
 *   - Connection check and redirect
 *   - Coming soon message
 * Dependencies:
 *   - Requires: auth, postgres-storage
 * Version History:
 *   v1.0 – initial placeholder
 * Notes:
 *   - Future implementation will include query editor
 */
