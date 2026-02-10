export interface WindsurfAccount {
  id: string;
  email: string;
  profilePath: string;
  platform: 'windsurf';
  status: 'NOT_LOGGED_IN' | 'LOGGED_IN' | 'SESSION_EXPIRED';
  lastRunAt: string | null;
  lastError: string | null;
  lastLoginAt: string | null;
  lastUsageData: WindsurfUsageData | null;
  createdAt: string;
  updatedAt: string;
}

export interface WindsurfUsageData {
  creditsRemaining: number | null;
  creditsUsed: number | null;
  creditsTotal: number | null;
  resetDate: string | null;
}

export interface WindsurfScrapeResult {
  email: string;
  creditsRemaining: number | null;
  creditsUsed: number | null;
  creditsTotal: number | null;
  resetDate: string | null;
  scrapedAt: string;
  filePath: string;
  fileName: string;
}

export interface WindsurfRunAllResult {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  results: Array<{
    id: string;
    email: string;
    success: boolean;
    error: string | null;
    data: WindsurfScrapeResult | null;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
