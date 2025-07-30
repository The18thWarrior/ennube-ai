import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface UseBillingUsageOptions {
  year?: number;
  month?: number;
}

interface UseBillingUsageReturn {
  usage: number;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  refresh: () => Promise<void>;
}

/**
 * Custom hook to fetch and manage the monthly billing usage data
 * @param options Optional year and month parameters
 * @returns Object containing usage data, loading state, error state, and refresh function
 */
export function useBillingUsage(options: UseBillingUsageOptions = {}): UseBillingUsageReturn {
  const { data: session } = useSession();
  const [usage, setUsage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Set default year and month if not provided
  const currentDate = new Date();
  const year = options.year ?? currentDate.getFullYear();
  const month = options.month ?? currentDate.getMonth(); // 0-indexed (0 = January)

  const fetchUsage = async () => {
    if (!session?.user) return;

    setRefreshing(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/billing/monthly-usage?year=${year}&month=${month}`
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch usage data');
      }
      
      const data = await response.json();
      setUsage(data.total);
    } catch (err) {
      console.error('Error fetching monthly usage:', err);
      setError('Failed to load usage data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch on mount or when dependencies change
  useEffect(() => {
    fetchUsage();
  }, [session, year, month]);

  // Function to manually refresh the data
  const refresh = async () => {
    await fetchUsage();
  };

  return {
    usage,
    loading,
    error,
    refreshing,
    refresh
  };
}