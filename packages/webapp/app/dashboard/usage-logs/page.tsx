'use client';

import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useUsageLogs } from '@/hooks/useUsageLogs';

export default function UsageLogs() {
  const ITEMS_PER_PAGE = 10;
  const { 
    logs, 
    loading, 
    error, 
    currentPage,
    hasMore,
    nextPage,
    prevPage
  } = useUsageLogs(ITEMS_PER_PAGE);

  const formatTimestamp = (timestamp: number) => {
    return format(new Date(timestamp), 'PPpp');
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Usage Logs</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="overflow-x-auto   shadow-md rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-muted ">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground  uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground  uppercase tracking-wider">Agent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground  uppercase tracking-wider">Records Updated</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground  uppercase tracking-wider">Records Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground  uppercase tracking-wider">Meetings Booked</th>
            </tr>
          </thead>
          <tbody className="  divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin h-5 w-5 border-2  rounded-full border-t-transparent"></div>
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-muted-foreground ">
                  No usage logs found
                </td>
              </tr>
            ) : (
              logs.map((log, index) => (
                <tr key={`${log.userSub}-${log.timestamp}-${index}`} className="hover:bg-muted ">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground ">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground ">
                    {log.agent}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground ">
                    {log.recordsUpdated}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground ">
                    {log.recordsCreated}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground ">
                    {log.meetingsBooked}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-between mt-4">
        <Button 
          onClick={prevPage} 
          disabled={currentPage === 0 || loading}
          variant="outline"
        >
          Previous
        </Button>
        <span className="py-2">
          Page {currentPage + 1}
        </span>
        <Button 
          onClick={nextPage} 
          disabled={!hasMore || loading}
          variant="outline"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
