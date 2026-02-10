import { useState, useEffect, useCallback } from 'react';
import { windsurfApi } from '../lib/windsurf-api';
import type { WindsurfAccount, WindsurfRunAllResult } from '../types/windsurf';

export function useWindsurfAccounts() {
  const [accounts, setAccounts] = useState<WindsurfAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await windsurfApi.getAccounts();
      if (result.success && result.data) {
        setAccounts(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch accounts');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const addAccount = useCallback(async (email: string) => {
    try {
      const result = await windsurfApi.createAccount(email);
      if (result.success && result.data) {
        setAccounts(prev => [...prev, result.data!]);
        return { success: true, data: result.data };
      } else {
        const errorMsg = result.error?.message || 'Failed to create account';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  const deleteAccount = useCallback(async (id: string) => {
    try {
      const result = await windsurfApi.deleteAccount(id);
      if (result.success) {
        setAccounts(prev => prev.filter(acc => acc.id !== id));
        return { success: true };
      } else {
        const errorMsg = result.error?.message || 'Failed to delete account';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  const openBrowser = useCallback(async (id: string) => {
    try {
      const result = await windsurfApi.openLoginBrowser(id);
      if (result.success) {
        return { success: true, message: result.data?.message };
      } else {
        const errorMsg = result.error?.message || 'Failed to open browser';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  const verifyLogin = useCallback(async (id: string) => {
    try {
      const result = await windsurfApi.verifyLogin(id);
      if (result.success) {
        // Update account status in local state
        setAccounts(prev => prev.map(acc => 
          acc.id === id 
            ? { 
                ...acc, 
                status: result.data?.isLoggedIn ? 'LOGGED_IN' : 'SESSION_EXPIRED',
                lastLoginAt: result.data?.isLoggedIn ? new Date().toISOString() : acc.lastLoginAt
              }
            : acc
        ));
        return { success: true, data: result.data };
      } else {
        const errorMsg = result.error?.message || 'Failed to verify login';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  const scrapeUsage = useCallback(async (id: string) => {
    try {
      const result = await windsurfApi.scrapeUsage(id);
      if (result.success && result.data) {
        // Update account with last run info
        setAccounts(prev => prev.map(acc => 
          acc.id === id 
            ? { 
                ...acc, 
                lastRunAt: result.data!.scrapedAt,
                lastError: null,
                lastUsageData: {
                  creditsRemaining: result.data!.creditsRemaining,
                  creditsUsed: result.data!.creditsUsed,
                  creditsTotal: result.data!.creditsTotal,
                  resetDate: result.data!.resetDate,
                }
              }
            : acc
        ));
        return { success: true, data: result.data };
      } else {
        const errorMsg = result.error?.message || 'Failed to scrape usage';
        setError(errorMsg);
        // Update account with error
        setAccounts(prev => prev.map(acc => 
          acc.id === id 
            ? { 
                ...acc, 
                lastRunAt: new Date().toISOString(),
                lastError: errorMsg,
              }
            : acc
        ));
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  const runAll = useCallback(async (): Promise<{ success: boolean; data?: WindsurfRunAllResult; error?: string }> => {
    try {
      const result = await windsurfApi.scrapeAll();
      if (result.success && result.data) {
        // Refresh accounts to get updated status
        await refresh();
        return { success: true, data: result.data };
      } else {
        const errorMsg = result.error?.message || 'Failed to run all';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    accounts,
    loading,
    error,
    refresh,
    addAccount,
    deleteAccount,
    openBrowser,
    verifyLogin,
    scrapeUsage,
    runAll,
  };
}

export default useWindsurfAccounts;
