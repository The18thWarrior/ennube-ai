import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { isAdmin } from '@/lib/admin';

// === layout.tsx ===
// Created: 2025-09-16 00:00
// Purpose: Admin area layout that verifies admin access via the /api/admin route.
// Exports:
//   - default async function AdminLayout({ children })
// Interactions:
//   - Uses: app/api/admin/route.ts
// Notes:
//   - Server layout component that performs a server-side check against the internal admin API.
//   - Will redirect unauthenticated users to /login and show an access-denied page for forbidden users.


type AccessCheckResult = true | 'unauthenticated' | 'forbidden' | 'error';

const ADMIN_API = '/api/admin';

/**
 * checkAdminAccess
 *
 * - Performs a server-side call to the internal admin API route.
 * - Uses credentials: 'include' to forward cookies/session.
 * - Returns a simple discriminated result for the caller to act on.
 */
async function checkAdminAccess(): Promise<AccessCheckResult> {
  const user = await auth();
  if (user?.user?.auth0?.sub === undefined) {
    return 'unauthenticated';
  }
  const checkAdmin = isAdmin(user?.user?.auth0?.sub || '')
  //console.log('isAdmin check:', checkAdmin);
  if (!checkAdmin) {
    return 'forbidden';
  }
  return true;
}

/**
 * AdminLayout (Server Component)
 *
 * - Validates admin access before rendering children.
 * - Redirects unauthenticated users to /login.
 * - Renders a friendly access-denied UI for forbidden users.
 * - Renders a generic error UI if the check fails.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const access = await checkAdminAccess();
  console.log('Admin access check:', access);
  if (access === 'unauthenticated') {
    // Send user to a login page. Adjust path if your app uses a different signin route.
    redirect('/login');
  }

  if (access === 'forbidden') {
    return (
      <div>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Access denied</h1>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              Your account does not have permission to view the admin area.
            </p>
            <div className="mt-6">
              <a href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                Return to home
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (access === true) {
    return (
      <div lang="en">
        <div className="min-h-screen ">
          <div className="max-w-6xl mx-auto py-8 px-4">
            {children}
          </div>
        </div>
      </div>
    );
  }

  // Generic error UI
  return (
    <div lang="en">
      <div className="min-h-screen flex items-center justify-center ">
        <div className="max-w-md w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Unable to verify access</h1>
          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            There was an error checking your permissions. Please try again later.
          </p>
          <div className="mt-6">
            <a href="/" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Return to home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * OVERVIEW
 *
 * - Purpose:
 *   Server layout component for the /admin route that ensures only authorized admins may render admin pages.
 * - Assumptions:
 *   - The app exposes an internal API at /api/admin which returns:
 *     200 (OK) for authorized admin users,
 *     401 (Unauthorized) for unauthenticated users,
 *     403 (Forbidden) for authenticated non-admins.
 *   - Session cookies are used for authentication and must be forwarded on server-side fetch.
 * - Edge Cases:
 *   - Network or unexpected errors result in a generic error UI (no secret info exposed).
 * - How it fits:
 *   - Wraps all admin pages (app/admin) to centralize access control UI/flow.
 * - Future Improvements:
 *   - Customize redirect target for your auth provider (e.g., NextAuth sign-in).
 *   - Replace inline UI with shared components from components/ when available.
 */

/*
 * === layout.tsx ===
 * Updated: 2025-09-16 00:00
 * Summary: Admin layout with server-side access validation via /api/admin.
 * Key Components:
 *   - checkAdminAccess(): performs the API call and returns a discriminated result.
 *   - AdminLayout: renders children or appropriate UI based on access.
 * Dependencies:
 *   - Uses Next.js server fetch and next/navigation.redirect
 * Version History:
 *   v1.0 – initial
 */