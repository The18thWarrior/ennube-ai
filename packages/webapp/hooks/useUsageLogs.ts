import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { UsageLogEntry } from '@/lib/db/usage-logs';

interface UseUsageLogsReturn {
  logs: UsageLogEntry[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  hasMore: boolean;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  refresh: () => Promise<void>;
}

export function useUsageLogs(itemsPerPage: number = 10, filter?: string): UseUsageLogsReturn {
  const [logs, setLogs] = useState<UsageLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  const fetchLogs = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const offset = page * itemsPerPage;
      const response = await fetch(`/api/dashboard/usage?limit=${itemsPerPage}&offset=${offset}${filter ? `&filter=${encodeURIComponent(filter)}` : ''}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log('Error fetching usage logs:', errorData);
        throw new Error(errorData.error || 'Failed to fetch usage logs');
      }
      
      const fetchedLogs = await response.json();
      console.log('Fetched logs:', fetchedLogs);
      setLogs(fetchedLogs);
      setHasMore(fetchedLogs.length === itemsPerPage);
      setError(null);
      
    } catch (err) {
      console.log('Error fetching usage logs:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load usage logs';
      setError(errorMessage);
      enqueueSnackbar('Failed to load usage logs', { 
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage, enqueueSnackbar]);

  useEffect(() => {
    fetchLogs(currentPage);
  }, [currentPage, fetchLogs]);

  const nextPage = useCallback(() => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMore]);

  const prevPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const goToPage = useCallback((page: number) => {
    if (page >= 0) {
      setCurrentPage(page);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchLogs(currentPage);
  }, [currentPage, fetchLogs]);

  return {
    logs,
    loading,
    error,
    currentPage,
    hasMore,
    nextPage,
    prevPage,
    goToPage,
    refresh
  };
}
