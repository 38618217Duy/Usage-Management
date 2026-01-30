import { AccountModel, AccountStatus } from '../models/account.js';
import { SessionHistoryModel } from '../models/session-history.js';
import { CookieAnalyzerService } from './cookie-analyzer.service.js';
import { BrowserService } from './browser.service.js';
import logger from '../utils/logger.js';

export const SessionStatus = {
  HEALTHY: 'HEALTHY',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
  EXPIRED: 'EXPIRED',
  UNKNOWN: 'UNKNOWN',
};

const WARNING_THRESHOLD_DAYS = 3;
const CRITICAL_THRESHOLD_HOURS = 72;
const DEFAULT_SESSION_DAYS = 7;

export class SessionService {
  static calculateSessionStatus(timeRemainingMs) {
    if (timeRemainingMs === null || timeRemainingMs === undefined) {
      return SessionStatus.UNKNOWN;
    }

    if (timeRemainingMs <= 0) {
      return SessionStatus.EXPIRED;
    }

    const hoursRemaining = timeRemainingMs / (1000 * 60 * 60);
    const daysRemaining = hoursRemaining / 24;

    if (hoursRemaining < CRITICAL_THRESHOLD_HOURS) {
      return SessionStatus.CRITICAL;
    }

    if (daysRemaining <= WARNING_THRESHOLD_DAYS) {
      return SessionStatus.WARNING;
    }

    return SessionStatus.HEALTHY;
  }

  static async checkSession(accountId) {
    logger.info('SessionService.checkSession: Starting', { accountId });

    const account = await AccountModel.findById(accountId);
    if (!account) {
      logger.warn('SessionService.checkSession: Account not found', { accountId });
      return { error: 'ERR-SESSION-001', message: 'Không tìm thấy tài khoản' };
    }

    const previousStatus = account.sessionStatus || SessionStatus.UNKNOWN;

    const cookieInfo = await CookieAnalyzerService.getSessionInfo(account.profilePath);
    
    let sessionExpiryAt = cookieInfo.expiryAt;
    let sessionExpirySource = cookieInfo.source;
    let timeRemainingMs = cookieInfo.timeRemaining?.totalMs || null;

    if (!sessionExpiryAt && cookieInfo.source !== 'no_profile') {
      const stats = await SessionHistoryModel.getStatistics(accountId);
      
      if (stats.averageDurationDays) {
        const lastLogin = account.lastLoginAt || account.updatedAt || new Date().toISOString();
        const estimatedExpiry = new Date(
          new Date(lastLogin).getTime() + stats.averageDurationDays * 24 * 60 * 60 * 1000
        );
        sessionExpiryAt = estimatedExpiry.toISOString();
        sessionExpirySource = 'estimated';
        timeRemainingMs = estimatedExpiry.getTime() - Date.now();
        
        logger.info('SessionService.checkSession: Using estimated expiry from history', {
          accountId,
          averageDays: stats.averageDurationDays,
          estimatedExpiry: sessionExpiryAt,
        });
      } else {
        const lastLogin = account.lastLoginAt || account.updatedAt;
        if (lastLogin) {
          const estimatedExpiry = new Date(
            new Date(lastLogin).getTime() + DEFAULT_SESSION_DAYS * 24 * 60 * 60 * 1000
          );
          sessionExpiryAt = estimatedExpiry.toISOString();
          sessionExpirySource = 'estimated';
          timeRemainingMs = estimatedExpiry.getTime() - Date.now();
        }
      }
    }

    const sessionStatus = this.calculateSessionStatus(timeRemainingMs);

    const stats = await SessionHistoryModel.getStatistics(accountId);

    const updates = {
      sessionExpiryAt,
      sessionExpirySource,
      sessionStatus,
      lastSessionCheckAt: new Date().toISOString(),
      averageSessionDays: stats.averageDurationDays,
    };

    if (sessionStatus === SessionStatus.EXPIRED && account.status === AccountStatus.LOGGED_IN) {
      updates.status = AccountStatus.SESSION_EXPIRED;
    }

    await AccountModel.update(accountId, updates);

    logger.info('SessionService.checkSession: Complete', {
      accountId,
      previousStatus,
      currentStatus: sessionStatus,
      expiryAt: sessionExpiryAt,
      source: sessionExpirySource,
    });

    return {
      error: null,
      accountId,
      email: account.email,
      previousStatus,
      currentStatus: sessionStatus,
      sessionExpiryAt,
      sessionExpirySource,
      timeRemaining: timeRemainingMs ? CookieAnalyzerService.formatTimeRemaining(timeRemainingMs) : null,
      checkedAt: new Date().toISOString(),
    };
  }

  static async checkAllSessions() {
    logger.info('SessionService.checkAllSessions: Starting');

    const accounts = await AccountModel.readAll();
    const results = [];

    for (const account of accounts) {
      const result = await this.checkSession(account.id);
      results.push(result);
    }

    const summary = this.calculateSummary(results);

    logger.info('SessionService.checkAllSessions: Complete', { summary });

    return {
      accounts: results,
      summary,
      checkedAt: new Date().toISOString(),
    };
  }

  static async getSessionStatus() {
    const accounts = await AccountModel.readAll();
    
    const accountsWithStatus = accounts.map(account => ({
      id: account.id,
      email: account.email,
      status: account.status,
      sessionStatus: account.sessionStatus || SessionStatus.UNKNOWN,
      sessionExpiryAt: account.sessionExpiryAt,
      sessionExpirySource: account.sessionExpirySource,
      timeRemaining: account.sessionExpiryAt ? this.getTimeRemaining(account.sessionExpiryAt) : null,
      lastSessionCheckAt: account.lastSessionCheckAt,
      averageSessionDays: account.averageSessionDays,
    }));

    const summary = {
      total: accounts.length,
      healthy: accountsWithStatus.filter(a => a.sessionStatus === SessionStatus.HEALTHY).length,
      warning: accountsWithStatus.filter(a => a.sessionStatus === SessionStatus.WARNING).length,
      critical: accountsWithStatus.filter(a => a.sessionStatus === SessionStatus.CRITICAL).length,
      expired: accountsWithStatus.filter(a => a.sessionStatus === SessionStatus.EXPIRED).length,
      unknown: accountsWithStatus.filter(a => a.sessionStatus === SessionStatus.UNKNOWN).length,
    };

    return {
      accounts: accountsWithStatus,
      summary,
    };
  }

  static async getSessionSummary() {
    const accounts = await AccountModel.readAll();
    
    const groups = {
      [SessionStatus.EXPIRED]: [],
      [SessionStatus.CRITICAL]: [],
      [SessionStatus.WARNING]: [],
      [SessionStatus.HEALTHY]: [],
      [SessionStatus.UNKNOWN]: [],
    };

    for (const account of accounts) {
      const status = account.sessionStatus || SessionStatus.UNKNOWN;
      groups[status].push({
        id: account.id,
        email: account.email,
        timeRemaining: account.sessionExpiryAt ? this.getTimeRemaining(account.sessionExpiryAt) : null,
        sessionExpiryAt: account.sessionExpiryAt,
        lastSessionCheckAt: account.lastSessionCheckAt,
      });
    }

    for (const status of Object.keys(groups)) {
      if (status === SessionStatus.EXPIRED || status === SessionStatus.CRITICAL) {
        groups[status].sort((a, b) => {
          if (!a.sessionExpiryAt) return -1;
          if (!b.sessionExpiryAt) return 1;
          return new Date(a.sessionExpiryAt) - new Date(b.sessionExpiryAt);
        });
      } else {
        groups[status].sort((a, b) => {
          if (!a.sessionExpiryAt) return 1;
          if (!b.sessionExpiryAt) return -1;
          return new Date(a.sessionExpiryAt) - new Date(b.sessionExpiryAt);
        });
      }
    }

    const needsAttention = 
      groups[SessionStatus.EXPIRED].length + 
      groups[SessionStatus.CRITICAL].length + 
      groups[SessionStatus.WARNING].length;

    const lastChecked = accounts
      .filter(a => a.lastSessionCheckAt)
      .map(a => new Date(a.lastSessionCheckAt))
      .sort((a, b) => b - a)[0];

    return {
      groups,
      needsAttention,
      lastCheckedAt: lastChecked?.toISOString() || null,
    };
  }

  static async getSessionHistory(accountId) {
    const account = await AccountModel.findById(accountId);
    if (!account) {
      return { error: 'ERR-SESSION-001', message: 'Không tìm thấy tài khoản' };
    }

    const history = await SessionHistoryModel.getByAccountId(accountId);
    const statistics = await SessionHistoryModel.getStatistics(accountId);

    return {
      error: null,
      accountId,
      email: account.email,
      history,
      statistics,
    };
  }

  static async recordLogin(accountId) {
    const account = await AccountModel.findById(accountId);
    if (!account) {
      return { error: 'ERR-SESSION-001' };
    }

    const cookieInfo = await CookieAnalyzerService.getSessionInfo(account.profilePath);
    
    const loginAt = new Date().toISOString();
    const expiryAt = cookieInfo.expiryAt || new Date(Date.now() + DEFAULT_SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const expirySource = cookieInfo.expiryAt ? 'cookie' : 'estimated';

    await SessionHistoryModel.recordSessionExpiry(accountId, loginAt, expiryAt, expirySource);

    await AccountModel.update(accountId, {
      lastLoginAt: loginAt,
      sessionExpiryAt: expiryAt,
      sessionExpirySource: expirySource,
      sessionStatus: SessionStatus.HEALTHY,
      status: AccountStatus.LOGGED_IN,
    });

    logger.info('SessionService.recordLogin: Login recorded', { accountId, loginAt, expiryAt });

    return { error: null, loginAt, expiryAt, expirySource };
  }

  static async startBatchLogin(accountIds) {
    logger.info('SessionService.startBatchLogin: Starting', { accountIds });

    const accounts = [];
    for (const id of accountIds) {
      const account = await AccountModel.findById(id);
      if (account) {
        accounts.push(account);
      }
    }

    if (accounts.length === 0) {
      return { error: 'NO_ACCOUNTS', message: 'Không có tài khoản nào để login' };
    }

    const statusOrder = {
      [SessionStatus.EXPIRED]: 0,
      [SessionStatus.CRITICAL]: 1,
      [SessionStatus.WARNING]: 2,
      [SessionStatus.UNKNOWN]: 3,
      [SessionStatus.HEALTHY]: 4,
    };

    accounts.sort((a, b) => {
      const statusA = a.sessionStatus || SessionStatus.UNKNOWN;
      const statusB = b.sessionStatus || SessionStatus.UNKNOWN;
      return statusOrder[statusA] - statusOrder[statusB];
    });

    return {
      error: null,
      accounts: accounts.map(a => ({
        id: a.id,
        email: a.email,
        sessionStatus: a.sessionStatus,
      })),
      totalAccounts: accounts.length,
      message: 'Batch login ready. Accounts sorted by urgency.',
    };
  }

  static async openBatchLoginBrowser(accountId) {
    const account = await AccountModel.findById(accountId);
    if (!account) {
      return { error: 'ERR-SESSION-001', message: 'Không tìm thấy tài khoản' };
    }

    if (await BrowserService.isBrowserOpen(accountId)) {
      return { error: 'ERR-SESSION-004', message: 'Browser đang mở cho tài khoản này' };
    }

    const result = await BrowserService.openLoginBrowser(account);
    
    if (result.error) {
      return { error: result.error, message: result.message };
    }

    return {
      error: null,
      accountId,
      email: account.email,
      message: 'Browser opened. Please login manually.',
    };
  }

  static getTimeRemaining(expiryAt) {
    if (!expiryAt) return null;
    
    const now = Date.now();
    const expiry = new Date(expiryAt).getTime();
    const remainingMs = expiry - now;

    if (remainingMs <= 0) {
      return { days: 0, hours: 0, formatted: 'Đã hết hạn', isExpired: true };
    }

    return CookieAnalyzerService.formatTimeRemaining(remainingMs);
  }

  static calculateSummary(results) {
    return {
      total: results.length,
      healthy: results.filter(r => r.currentStatus === SessionStatus.HEALTHY).length,
      warning: results.filter(r => r.currentStatus === SessionStatus.WARNING).length,
      critical: results.filter(r => r.currentStatus === SessionStatus.CRITICAL).length,
      expired: results.filter(r => r.currentStatus === SessionStatus.EXPIRED).length,
      unknown: results.filter(r => r.currentStatus === SessionStatus.UNKNOWN).length,
      errors: results.filter(r => r.error).length,
    };
  }
}

export default SessionService;
