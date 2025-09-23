// === PostgresConnectionForm.tsx ===
// Created: 2025-07-21 10:20
// Purpose: Form component for PostgreSQL connection setup
// Exports:
//   - PostgresConnectionForm (default)
// Interactions:
//   - Used by: connect page
// Notes:
//   - Handles connection URL input, validation, and testing

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

export default function PostgresConnectionForm() {
  const [connectionUrl, setConnectionUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTestLoading, setIsTestLoading] = useState(false)
  const [error, setError] = useState('')
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const router = useRouter()

  const handleTest = async () => {
    if (!connectionUrl.trim()) {
      setError('Please enter a connection URL')
      return
    }

    setIsTestLoading(true)
    setError('')
    setTestResult(null)

    try {
      const response = await fetch('/api/postgres/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionUrl }),
      })

      const data = await response.json()

      if (data.success) {
        setTestResult({
          success: true,
          message: `Connection successful! Connected to ${data.database} on ${data.host}`
        })
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Connection failed'
        })
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: 'Failed to test connection'
      })
    } finally {
      setIsTestLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/postgres/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionUrl }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Redirect to dashboard on success
        router.push('/integrations/postgres/dashboard')
      } else {
        setError(data.error || 'Failed to save connection')
      }
    } catch (err) {
      setError('Failed to save connection')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="connectionUrl">PostgreSQL Connection URL</Label>
        <Input
          id="connectionUrl"
          type="text"
          placeholder="postgres://username:password@hostname:5432/database"
          value={connectionUrl}
          onChange={(e) => setConnectionUrl(e.target.value)}
          className="font-mono text-sm"
        />
        <p className="text-sm text-muted-foreground">
          Format: postgres://username:password@hostname:port/database
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {testResult && (
        <div className={`flex items-center gap-2 p-3 rounded-lg ${
          testResult.success 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
        }`}>
          {testResult.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleTest}
          disabled={isTestLoading || !connectionUrl.trim()}
        >
          {isTestLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            'Test Connection'
          )}
        </Button>

        <Button
          type="submit"
          disabled={isLoading || !connectionUrl.trim()}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            'Connect Database'
          )}
        </Button>
      </div>
    </form>
  )
}

/*
 * === PostgresConnectionForm.tsx ===
 * Updated: 2025-07-21 10:20
 * Summary: Form component for PostgreSQL connection setup with test and save functionality
 * Key Components:
 *   - Connection URL input with validation
 *   - Test connection functionality
 *   - Save and redirect to dashboard
 * Dependencies:
 *   - Requires: UI components, API endpoints
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - Client-side form with API integration
 */
