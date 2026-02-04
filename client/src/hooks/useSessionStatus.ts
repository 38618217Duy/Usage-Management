import { useState, useEffect, useCallback } from 'react';

// Import and re-export shared types from centralized location for backward compatibility
export type {
  TimeRemaining,
  AccountSessionStatus,
  SessionSummary,
  SessionStatusResponse,
  SessionGroups,
  SessionSummaryResponse,
  SessionHistory,
  SessionStatistics,
  SessionHistoryResponse,
  BatchLoginAccount,
} from '../types/session';

// Import types needed for this file
import type {
  SessionStatusResponse,
  SessionSummaryResponse,
  SessionHistoryResponse,
} from '../types/session';

const API_BASE = 'http://localhost:3000/api';
export function useSessionStatus() {
  const [data, setData] = useState<SessionStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/sessions/status`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch session status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { data, loading, error, refetch: fetchStatus };
}

export function useSessionSummary() {
  const [data, setData] = useState<SessionSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/sessions/summary`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch session summary');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { data, loading, error, refetch: fetchSummary };
}

export function useSessionHistory(accountId: string | null) {
  const [data, setData] = useState<SessionHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!accountId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/sessions/history/${accountId}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error?.message || 'Failed to fetch session history');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { data, loading, error, refetch: fetchHistory };
}

export async function checkAllSessions(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/sessions/check`, { method: 'POST' });
    const result = await response.json();
    return { success: result.success, error: result.error?.message };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

export async function checkSession(accountId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/sessions/check/${accountId}`, { method: 'POST' });
    const result = await response.json();
    return { success: result.success, error: result.error?.message };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

export async function startBatchLogin(accountIds: string[]): Promise<{ 
  success: boolean; 
  accounts?: Array<{ id: string; email: string; sessionStatus: string }>;
  error?: string 
}> {
  try {
    const response = await fetch(`${API_BASE}/sessions/batch-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountIds }),
    });
    const result = await response.json();
    return { 
      success: result.success, 
      accounts: result.data?.accounts,
      error: result.error?.message 
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

export async function openBatchLoginBrowser(accountId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/sessions/batch-login/${accountId}/open`, { method: 'POST' });
    const result = await response.json();
    return { success: result.success, error: result.error?.message };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

export async function recordLogin(accountId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE}/sessions/record-login/${accountId}`, { method: 'POST' });
    const result = await response.json();
    return { success: result.success, error: result.error?.message };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}
