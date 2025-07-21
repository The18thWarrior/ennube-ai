// === connect/page.tsx ===
// Created: 2025-07-21 10:20
// Purpose: PostgreSQL connection setup page
// Exports:
//   - PostgresConnect (default)
// Interactions:
//   - Used by: users setting up PostgreSQL integration
// Notes:
//   - Provides connection form and instructions

import CustomLink from "@/components/custom-link"
import { Button } from "@/components/ui/button"
import { auth } from "@/auth"
import PostgresConnectionForm from "./PostgresConnectionForm"

export default async function PostgresConnect() {
  const session = await auth()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Connect to PostgreSQL</h1>

      <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <p className="mb-4">Connect your PostgreSQL database to access and manage your data directly from this application.</p>
        <PostgresConnectionForm />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Benefits of connecting</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Execute SQL queries directly from the interface</li>
            <li>Browse database schema and table structures</li>
            <li>Integrate PostgreSQL data with AI agents</li>
            <li>Automate workflows with your database</li>
            <li>Visualize query results and database metrics</li>
          </ul>
        </div>
        
        <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Connection Requirements</h2>
          <p className="mb-4">To connect your PostgreSQL database:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Ensure your database is accessible from the internet</li>
            <li>Have your connection URL ready (postgres://user:password@host:port/database)</li>
            <li>Verify your database user has necessary permissions</li>
            <li>Consider using SSL for secure connections</li>
          </ol>
        </div>
      </div>

      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Security & Privacy</h2>
        <div className="space-y-2">
          <p>🔒 Your connection credentials are encrypted and stored securely</p>
          <p>🚫 We never log or expose your database passwords</p>
          <p>🔍 All queries are parameterized to prevent SQL injection</p>
          <p>⏰ Connection sessions expire automatically for security</p>
        </div>
      </div>
      
      <div className="mt-8">
        <p className="text-sm text-gray-500">
          Need help? Check our <CustomLink href="/docs">documentation</CustomLink> or contact support.
        </p>
      </div>
    </div>
  )
}

/*
 * === connect/page.tsx ===
 * Updated: 2025-07-21 10:20
 * Summary: PostgreSQL connection setup page with form and instructions
 * Key Components:
 *   - Connection form component
 *   - Benefits and requirements sections
 *   - Security information
 * Dependencies:
 *   - Requires: auth, UI components
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Follows Salesforce connect page pattern
 */
