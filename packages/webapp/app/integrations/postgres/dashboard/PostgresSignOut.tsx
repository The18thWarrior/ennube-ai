// === PostgresSignOut.tsx ===
// Created: 2025-07-21 10:20
// Purpose: Component to handle PostgreSQL connection removal
// Exports:
//   - PostgresSignOut (default)
// Interactions:
//   - Used by: dashboard page
// Notes:
//   - Removes stored connection and redirects to connect page

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function PostgresSignOut() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleDisconnect = async () => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/postgres/credentials', {
        method: 'DELETE',
      })

      if (response.ok) {
        // Redirect to connect page after successful disconnection
        router.push('/integrations/postgres/connect')
      } else {
        console.log('Failed to disconnect from PostgreSQL')
        // You might want to show a toast notification here
      }
    } catch (error) {
      console.log('Error disconnecting from PostgreSQL:', error)
      // You might want to show a toast notification here
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="destructive"
      onClick={handleDisconnect}
      disabled={isLoading}
      className="w-full sm:w-auto"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Disconnecting...
        </>
      ) : (
        'Disconnect Database'
      )}
    </Button>
  )
}

/*
 * === PostgresSignOut.tsx ===
 * Updated: 2025-07-21 10:20
 * Summary: Component to handle PostgreSQL connection removal
 * Key Components:
 *   - Disconnect button with loading state
 *   - API call to remove credentials
 *   - Redirect to connect page
 * Dependencies:
 *   - Requires: UI components, router
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Client-side component with API integration
 */
