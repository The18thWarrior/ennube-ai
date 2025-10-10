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
      {/*<div className="  shadow">
        <div className="container mx-auto py-4">
          <nav className="flex space-x-4">
            <Link 
              href="/dashboard"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/dashboard'
                  ? 'bg-gray-900 text-white'
                  : 'text-muted-foreground  hover:bg-muted '
              }`}
            >
              Agents
            </Link>
            <Link 
              href="/dashboard/usage-logs"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/dashboard/usage-logs'
                  ? 'bg-gray-900 text-white'
                  : 'text-muted-foreground  hover:bg-muted '
              }`}
            >
              Usage Logs
            </Link>
          </nav>
        </div>
      </div>*/}
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}
