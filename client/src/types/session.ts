/**
 * Session Types
 * 
 * Shared type definitions for session expiry tracking feature.
 * These types are used across components and hooks.
 */

// Session status enum values
export type SessionStatusType = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'EXPIRED' | 'UNKNOWN';

// Time remaining information
export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  totalMs: number;
  formatted: string;
  isExpired?: boolean;
}

// Account session status from API
export interface AccountSessionStatus {
  id: string;
  email: string;
  status: string;
  sessionStatus: SessionStatusType;
  sessionExpiryAt: string | null;
  sessionExpirySource: 'cookie' | 'estimated' | null;
  timeRemaining: TimeRemaining | null;
  lastSessionCheckAt: string | null;
  averageSessionDays: number | null;
}

// Session summary counts
export interface SessionSummary {
  total: number;
  healthy: number;
  warning: number;
  critical: number;
  expired: number;
  unknown: number;
}

// Response from GET /api/sessions/status
export interface SessionStatusResponse {
  accounts: AccountSessionStatus[];
  summary: SessionSummary;
}

// Grouped accounts by status
export interface SessionGroups {
  EXPIRED: AccountSessionStatus[];
  CRITICAL: AccountSessionStatus[];
  WARNING: AccountSessionStatus[];
  HEALTHY: AccountSessionStatus[];
  UNKNOWN: AccountSessionStatus[];
}

// Response from GET /api/sessions/summary
export interface SessionSummaryResponse {
  groups: SessionGroups;
  needsAttention: number;
  lastCheckedAt: string | null;
}

// Individual session history record
export interface SessionHistory {
  id: string;
  loginAt: string;
  expiryAt: string;
  expirySource: string;
  durationDays: number | null;
}

// Session statistics for an account
export interface SessionStatistics {
  totalSessions: number;
  averageDurationDays: number | null;
  minDurationDays: number | null;
  maxDurationDays: number | null;
  predictedNextExpiry: string | null;
}

// Response from GET /api/sessions/history/:accountId
export interface SessionHistoryResponse {
  accountId: string;
  email: string;
  history: SessionHistory[];
  statistics: SessionStatistics;
}

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Batch login account info
export interface BatchLoginAccount {
  id: string;
  email: string;
  sessionStatus: SessionStatusType;
}

// Response from POST /api/sessions/batch-login
export interface BatchLoginResponse {
  accounts: BatchLoginAccount[];
  totalAccounts: number;
  message: string;
}
