// === signup-error.tsx ===
// Created: 2025-10-03 12:00
// Purpose: Component to display signup errors using the Alert UI component
// Exports:
//   - SignupError: React component for displaying signup errors
// Interactions:
//   - Used by: Signup forms or pages where user registration errors occur
// Notes:
//   - Utilizes shadcn/ui Alert component with destructive variant for error display
//   - Assumes error prop contains error title and details for description

import * as React from "react"
import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface SignupErrorProps {
  signupError: {
    error: string
    details: string
  }
}

const SignupError: React.FC<SignupErrorProps> = ({ signupError }) => {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{signupError.error}</AlertTitle>
      <AlertDescription>{signupError.details}</AlertDescription>
    </Alert>
  )
}

export default SignupError

/**
 * OVERVIEW
 *
 * - Purpose: Displays signup errors in a user-friendly alert format
 * - Assumptions: The signupError prop is provided and contains valid strings for error and details
 * - Edge Cases: Handles empty strings gracefully (Alert will still render but may appear empty)
 * - How it fits into the system: Used in signup-related UI components to show validation or API errors
 * - Future Improvements: Add support for multiple errors or customizable icons
 */

/*
 * === signup-error.tsx ===
 * Updated: 2025-10-03 12:00
 * Summary: React component for displaying signup errors using Alert UI
 * Key Components:
 *   - SignupError: Main component that renders the alert with error and details
 * Dependencies:
 *   - Requires: @/components/ui/alert, lucide-react
 * Version History:
 *   v1.0 – initial creation
 * Notes:
 *   - Follows shadcn/ui patterns for consistent styling
 */