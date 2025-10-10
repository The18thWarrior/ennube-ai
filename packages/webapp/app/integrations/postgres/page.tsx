export const dynamic = "force-dynamic";
// === page.tsx ===
// Created: 2025-07-21 10:20
// Purpose: PostgreSQL integration main page - redirects based on connection status
// Exports:
//   - PostgresPage (default)
// Interactions:
//   - Used by: integration navigation
// Notes:
//   - Redirects to connect or dashboard based on stored credentials

import { auth } from "@/auth"
import { getPostgresUrlById } from "@/lib/db/postgres-storage"
import { redirect } from "next/navigation"

export default async function PostgresPage() {
  const urlData = await getPostgresUrlById()
  
  // Redirect based on connection status
  if (urlData && urlData.instanceUrl) {
    redirect("/integrations/postgres/dashboard")
  } else {
    redirect("/integrations/postgres/connect")
  }
  
  // This won't be reached due to redirects
  return null
}

/*
 * === page.tsx ===
 * Updated: 2025-07-21 10:20
 * Summary: PostgreSQL integration router - redirects to connect or dashboard
 * Key Components:
 *   - Conditional redirect based on stored credentials
 * Dependencies:
 *   - Requires: auth, postgres-storage
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Follows Salesforce integration pattern
 */
