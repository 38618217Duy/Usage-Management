import type { Account, ApiResponse, RunAllResult, DownloadResult, VerifyResult } from '../types/account';

const API_BASE = '/api';

async function fetchApi<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  return response.json();
}

export const api = {
  accounts: {
    getAll: () => fetchApi<Account[]>('/accounts'),
    
    getById: (id: string) => fetchApi<Account>(`/accounts/${id}`),
    
    create: (email: string) => 
      fetchApi<Account>('/accounts', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    
    delete: (id: string) => 
      fetchApi<void>(`/accounts/${id}`, {
        method: 'DELETE',
      }),
    
    openBrowser: (id: string) => 
      fetchApi<{ message: string }>(`/accounts/${id}/open-browser`, {
        method: 'POST',
      }),
    
    verify: (id: string) => 
      fetchApi<VerifyResult>(`/accounts/${id}/verify`, {
        method: 'POST',
      }),
    
    download: (id: string) => 
      fetchApi<DownloadResult>(`/accounts/${id}/download`, {
        method: 'POST',
      }),
  },
  
  automation: {
    runAll: () => 
      fetchApi<RunAllResult>('/automation/run-all', {
        method: 'POST',
      }),
    
    runAllLegacy: () => 
      fetchApi<RunAllResult>('/automation/run-all-legacy', {
        method: 'POST',
      }),
    
    getStatus: () => 
      fetchApi<{ activeBrowsers: number; isRunning: boolean }>('/automation/status'),
    
    getCdpStatus: () => 
      fetchApi<{ connected: boolean; endpoint: string }>('/automation/cdp/status'),
    
    connectCdp: () => 
      fetchApi<{ message: string }>('/automation/cdp/connect', {
        method: 'POST',
      }),
  },
  
  health: () => fetchApi<{ status: string; timestamp: string }>('/health'),
};

export default api;
