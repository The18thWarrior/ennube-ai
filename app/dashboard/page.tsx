'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const router = useRouter();

  // Redirect to the usage logs page by default
  useEffect(() => {
    router.push('/dashboard/usage-logs');
  }, [router]);

  return (
    <div className="container mx-auto py-8 flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <p className="mb-6 text-gray-600 dark:text-gray-300">Redirecting to Usage Logs...</p>
      <Button 
        onClick={() => router.push('/dashboard/usage-logs')}
        variant="default"
      >
        Go to Usage Logs
      </Button>
    </div>
  );
}
