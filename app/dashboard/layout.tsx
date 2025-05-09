'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto py-4">
          <nav className="flex space-x-4">
            <Link 
              href="/dashboard"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/dashboard'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Agents
            </Link>
            <Link 
              href="/dashboard/usage-logs"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/dashboard/usage-logs'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Usage Logs
            </Link>
            {/* Add more dashboard links here as needed */}
          </nav>
        </div>
      </div>
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}
