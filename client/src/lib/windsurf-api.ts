import type { WindsurfAccount, WindsurfScrapeResult, WindsurfRunAllResult, ApiResponse } from '../types/windsurf';

const API_BASE = '/api/windsurf';

export const windsurfApi = {
  // Account management
  async getAccounts(): Promise<ApiResponse<WindsurfAccount[]>> {
    const response = await fetch(`${API_BASE}/accounts`);
    return response.json();
  },

  async createAccount(email: string): Promise<ApiResponse<WindsurfAccount>> {
    const response = await fetch(`${API_BASE}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return response.json();
  },

  async deleteAccount(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    const response = await fetch(`${API_BASE}/accounts/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  // Browser management
  async openLoginBrowser(id: string): Promise<ApiResponse<{ message: string; browserOpened: boolean }>> {
    const response = await fetch(`${API_BASE}/accounts/${id}/login`, {
      method: 'POST',
    });
    return response.json();
  },

  async verifyLogin(id: string): Promise<ApiResponse<{ isLoggedIn: boolean; message: string }>> {
    const response = await fetch(`${API_BASE}/accounts/${id}/verify`, {
      method: 'POST',
    });
    return response.json();
  },

  async closeBrowser(id: string): Promise<ApiResponse<{ closed: boolean }>> {
    const response = await fetch(`${API_BASE}/accounts/${id}/close-browser`, {
      method: 'POST',
    });
    return response.json();
  },

  // Usage scraping
  async scrapeUsage(id: string): Promise<ApiResponse<WindsurfScrapeResult>> {
    const response = await fetch(`${API_BASE}/accounts/${id}/scrape`, {
      method: 'POST',
    });
    return response.json();
  },

  async scrapeAll(): Promise<ApiResponse<WindsurfRunAllResult>> {
    const response = await fetch(`${API_BASE}/scrape-all`, {
      method: 'POST',
    });
    return response.json();
  },
};
