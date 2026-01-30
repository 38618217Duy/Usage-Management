import { useState, useEffect, useCallback } from 'react';

export interface DailyUsage {
  date: string;
  totalTokens: number;
  cost: number;
  sessions: number;
}

export interface AccountUsageAnalytics {
  email: string;
  totalTokens30d: number;
  totalCost30d: number;
  usagePercentage: number;
  averageCostPerDay: number;
  mostActiveDay: string | null;
  tokenEfficiency: number;
  usageTrend: 'increasing' | 'decreasing' | 'stable';
  daysUntilLimit: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  dailyUsage: DailyUsage[];
}

export interface UsageOverview {
  totalAccounts: number;
  totalTokens30d: number;
  totalCost30d: number;
  averageUsagePerAccount: number;
  highRiskAccounts: number;
  accounts: AccountUsageAnalytics[];
}

export interface DownloadRecord {
  fileName: string;
  filePath: string;
  downloadedAt: string;
  email: string;
  size: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export function useUsageAnalytics() {
  const [overview, setOverview] = useState<UsageOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const apiCall = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
    const response = await fetch(`/api/usage-analytics${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result: ApiResponse<T> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'API call failed');
    }

    return result.data;
  };

  const fetchOverview = useCallback(async () => {
    try {
      setError(null);
      const data = await apiCall<UsageOverview>('/overview');
      setOverview(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch usage overview';
      setError(errorMessage);
      console.error('Error fetching usage overview:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAccountAnalytics = useCallback(async (email: string): Promise<AccountUsageAnalytics | null> => {
    try {
      return await apiCall<AccountUsageAnalytics>(`/account/${encodeURIComponent(email)}`);
    } catch (err) {
      console.error(`Error fetching analytics for ${email}:`, err);
      return null;
    }
  }, []);

  const refreshAnalytics = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(null);
      const data = await apiCall<UsageOverview>('/refresh', { method: 'POST' });
      setOverview(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh analytics';
      setError(errorMessage);
      console.error('Error refreshing analytics:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return {
    overview,
    loading,
    error,
    refreshing,
    fetchOverview,
    fetchAccountAnalytics,
    refreshAnalytics,
  };
}

export function useDownloadHistory() {
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiCall = async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`/api/usage-analytics${endpoint}`);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result: ApiResponse<T> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'API call failed');
    }

    return result.data;
  };

  const fetchDownloadHistory = useCallback(async () => {
    try {
      setError(null);
      const data = await apiCall<DownloadRecord[]>('/download-history');
      setDownloads(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch download history';
      setError(errorMessage);
      console.error('Error fetching download history:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDownloadHistory();
  }, [fetchDownloadHistory]);

  return {
    downloads,
    loading,
    error,
    fetchDownloadHistory,
  };
}
