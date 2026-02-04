import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/index.js';
import logger from '../utils/logger.js';

const SESSION_HISTORY_FILE = path.join(config.paths.root, 'session-history.json');

// Maximum number of session history records to keep per account
// Older records will be automatically removed when this limit is exceeded
const MAX_HISTORY_PER_ACCOUNT = 50;

export class SessionHistoryModel {
  static async ensureFileExists() {
    try {
      await fs.access(SESSION_HISTORY_FILE);
    } catch {
      logger.info('Creating session-history.json file');
      await fs.writeFile(SESSION_HISTORY_FILE, JSON.stringify({ history: [] }, null, 2));
    }
  }

  static async readAll() {
    try {
      await this.ensureFileExists();
      const data = await fs.readFile(SESSION_HISTORY_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      return parsed.history || [];
    } catch (err) {
      logger.error('SessionHistoryModel.readAll: Failed to read session history', {
        error: err.message,
        code: err.code,
      });
      // Return empty array to allow graceful degradation
      return [];
    }
  }

  static async writeAll(history) {
    try {
      await fs.writeFile(SESSION_HISTORY_FILE, JSON.stringify({ history }, null, 2));
    } catch (err) {
      logger.error('SessionHistoryModel.writeAll: Failed to write session history', {
        error: err.message,
        code: err.code,
      });
      throw new Error(`Failed to save session history: ${err.message}`);
    }
  }

  static async getByAccountId(accountId) {
    const history = await this.readAll();
    return history
      .filter(h => h.accountId === accountId)
      .sort((a, b) => new Date(b.loginAt) - new Date(a.loginAt));
  }

  static async create(record) {
    const history = await this.readAll();
    
    const newRecord = {
      id: uuidv4(),
      accountId: record.accountId,
      loginAt: record.loginAt || new Date().toISOString(),
      expiryAt: record.expiryAt,
      expirySource: record.expirySource || 'unknown',
      durationDays: record.durationDays || null,
      createdAt: new Date().toISOString(),
    };

    history.push(newRecord);

    const accountHistory = history.filter(h => h.accountId === record.accountId);
    if (accountHistory.length > MAX_HISTORY_PER_ACCOUNT) {
      const oldestRecords = accountHistory
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
        .slice(0, accountHistory.length - MAX_HISTORY_PER_ACCOUNT);
      
      const idsToRemove = new Set(oldestRecords.map(r => r.id));
      const filteredHistory = history.filter(h => !idsToRemove.has(h.id));
      await this.writeAll(filteredHistory);
      logger.info('SessionHistoryModel.create: Removed old records', { 
        accountId: record.accountId, 
        removed: oldestRecords.length 
      });
    } else {
      await this.writeAll(history);
    }

    logger.info('SessionHistoryModel.create: Record created', { 
      id: newRecord.id, 
      accountId: newRecord.accountId 
    });
    return newRecord;
  }

  static async getStatistics(accountId) {
    const history = await this.getByAccountId(accountId);
    
    if (history.length === 0) {
      return {
        totalSessions: 0,
        averageDurationDays: null,
        minDurationDays: null,
        maxDurationDays: null,
        predictedNextExpiry: null,
      };
    }

    const durationsWithValue = history
      .filter(h => h.durationDays !== null && h.durationDays > 0)
      .map(h => h.durationDays);

    if (durationsWithValue.length === 0) {
      return {
        totalSessions: history.length,
        averageDurationDays: 7,
        minDurationDays: null,
        maxDurationDays: null,
        predictedNextExpiry: null,
      };
    }

    const sum = durationsWithValue.reduce((a, b) => a + b, 0);
    const averageDurationDays = sum / durationsWithValue.length;
    const minDurationDays = Math.min(...durationsWithValue);
    const maxDurationDays = Math.max(...durationsWithValue);

    const latestLogin = history[0]?.loginAt;
    let predictedNextExpiry = null;
    if (latestLogin) {
      const loginDate = new Date(latestLogin);
      predictedNextExpiry = new Date(loginDate.getTime() + averageDurationDays * 24 * 60 * 60 * 1000).toISOString();
    }

    return {
      totalSessions: history.length,
      averageDurationDays: Math.round(averageDurationDays * 10) / 10,
      minDurationDays,
      maxDurationDays,
      predictedNextExpiry,
    };
  }

  static async recordSessionExpiry(accountId, loginAt, expiryAt, expirySource) {
    const loginDate = new Date(loginAt);
    const expiryDate = new Date(expiryAt);
    const durationMs = expiryDate.getTime() - loginDate.getTime();
    const durationDays = Math.round((durationMs / (24 * 60 * 60 * 1000)) * 10) / 10;

    return this.create({
      accountId,
      loginAt,
      expiryAt,
      expirySource,
      durationDays: durationDays > 0 ? durationDays : null,
    });
  }
}

export default SessionHistoryModel;
