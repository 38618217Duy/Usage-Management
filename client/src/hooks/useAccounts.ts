import { useState, useEffect, useCallback } from 'react';
import type { Account } from '../types/account';
import api from '../lib/api';

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.accounts.getAll();
      if (response.success && response.data) {
        setAccounts(response.data);
      } else {
        setError(response.error?.message || 'Failed to fetch accounts');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const addAccount = async (email: string) => {
    const response = await api.accounts.create(email);
    if (response.success) {
      await fetchAccounts();
    }
    return response;
  };

  const deleteAccount = async (id: string) => {
    const response = await api.accounts.delete(id);
    if (response.success) {
      await fetchAccounts();
    }
    return response;
  };

  const openBrowser = async (id: string) => {
    return api.accounts.openBrowser(id);
  };

  const verifyLogin = async (id: string) => {
    const response = await api.accounts.verify(id);
    if (response.success) {
      await fetchAccounts();
    }
    return response;
  };

  const downloadCSV = async (id: string) => {
    const response = await api.accounts.download(id);
    if (response.success) {
      await fetchAccounts();
    }
    return response;
  };

  const runAll = async () => {
    const response = await api.automation.runAll();
    if (response.success) {
      await fetchAccounts();
    }
    return response;
  };

  return {
    accounts,
    loading,
    error,
    refresh: fetchAccounts,
    addAccount,
    deleteAccount,
    openBrowser,
    verifyLogin,
    downloadCSV,
    runAll,
  };
}

export default useAccounts;
