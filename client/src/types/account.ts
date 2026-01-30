export type AccountStatus = 'NOT_LOGGED_IN' | 'LOGGED_IN' | 'SESSION_EXPIRED';

export interface Account {
  id: string;
  email: string;
  profilePath: string;
  status: AccountStatus;
  lastRunAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

export interface RunAllResult {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  results: {
    id: string;
    email: string;
    success: boolean;
    error?: string;
    filePath?: string;
  }[];
}

export interface DownloadResult {
  filePath: string;
  fileName: string;
  downloadedAt: string;
}

export interface VerifyResult {
  status: AccountStatus;
  previousStatus: AccountStatus;
  isLoggedIn: boolean;
}
