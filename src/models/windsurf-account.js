import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/index.js';
import logger from '../utils/logger.js';

export const WindsurfAccountStatus = {
  NOT_LOGGED_IN: 'NOT_LOGGED_IN',
  LOGGED_IN: 'LOGGED_IN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
};

export class WindsurfAccountModel {
  static async ensureFileExists() {
    try {
      await fs.access(config.paths.windsurfAccountsFile);
    } catch {
      logger.info('Creating windsurf-accounts.json file');
      await fs.writeFile(config.paths.windsurfAccountsFile, JSON.stringify({ accounts: [] }, null, 2));
    }
  }

  static async ensureDirectoriesExist() {
    await fs.mkdir(config.paths.windsurfProfiles, { recursive: true });
    await fs.mkdir(config.paths.windsurfDownload, { recursive: true });
  }

  static async readAll() {
    await this.ensureFileExists();
    const data = await fs.readFile(config.paths.windsurfAccountsFile, 'utf-8');
    const parsed = JSON.parse(data);
    logger.debug('WindsurfAccountModel.readAll: Read accounts from file', { count: parsed.accounts.length });
    return parsed.accounts;
  }

  static async writeAll(accounts) {
    await fs.writeFile(config.paths.windsurfAccountsFile, JSON.stringify({ accounts }, null, 2));
    logger.debug('WindsurfAccountModel.writeAll: Wrote accounts to file', { count: accounts.length });
  }

  static async findById(id) {
    const accounts = await this.readAll();
    return accounts.find(acc => acc.id === id) || null;
  }

  static async findByEmail(email) {
    const accounts = await this.readAll();
    return accounts.find(acc => acc.email.toLowerCase() === email.toLowerCase()) || null;
  }

  static async create(email) {
    await this.ensureDirectoriesExist();
    const accounts = await this.readAll();
    
    const existing = accounts.find(acc => acc.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      logger.warn('WindsurfAccountModel.create: Attempted to create account with existing email', { email });
      return { error: 'EMAIL_EXISTS', account: null };
    }

    const id = uuidv4();
    const profilePath = path.join('profiles', 'windsurf', `acc-${id}`);
    const now = new Date().toISOString();

    const account = {
      id,
      email,
      profilePath,
      platform: 'windsurf',
      status: WindsurfAccountStatus.NOT_LOGGED_IN,
      lastRunAt: null,
      lastError: null,
      lastLoginAt: null,
      lastUsageData: null,
      createdAt: now,
      updatedAt: now,
    };

    const fullProfilePath = path.join(config.paths.root, profilePath);
    await fs.mkdir(fullProfilePath, { recursive: true });
    logger.info('WindsurfAccountModel.create: Created profile directory', { profilePath: fullProfilePath });

    accounts.push(account);
    await this.writeAll(accounts);
    
    logger.info('WindsurfAccountModel.create: Account created', { id, email, status: account.status });
    return { error: null, account };
  }

  static async update(id, updates) {
    const accounts = await this.readAll();
    const index = accounts.findIndex(acc => acc.id === id);
    
    if (index === -1) {
      logger.warn('WindsurfAccountModel.update: Attempted to update non-existent account', { id });
      return null;
    }

    const updatedAccount = {
      ...accounts[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    accounts[index] = updatedAccount;
    await this.writeAll(accounts);
    
    logger.info('WindsurfAccountModel.update: Account updated', { id, updates: Object.keys(updates) });
    return updatedAccount;
  }

  static async updateStatus(id, status, error = null) {
    return this.update(id, { 
      status, 
      lastError: error,
    });
  }

  static async updateLastRun(id, error = null) {
    return this.update(id, { 
      lastRunAt: new Date().toISOString(),
      lastError: error,
    });
  }

  static async updateUsageData(id, usageData) {
    return this.update(id, { 
      lastUsageData: usageData,
      lastRunAt: new Date().toISOString(),
      lastError: null,
    });
  }

  static async delete(id) {
    const accounts = await this.readAll();
    const account = accounts.find(acc => acc.id === id);
    
    if (!account) {
      logger.warn('WindsurfAccountModel.delete: Attempted to delete non-existent account', { id });
      return false;
    }

    const fullProfilePath = path.join(config.paths.root, account.profilePath);
    try {
      await fs.rm(fullProfilePath, { recursive: true, force: true });
      logger.info('WindsurfAccountModel.delete: Deleted profile directory', { profilePath: fullProfilePath });
    } catch (err) {
      logger.warn('WindsurfAccountModel.delete: Failed to delete profile directory', { profilePath: fullProfilePath, error: err.message });
    }

    const filtered = accounts.filter(acc => acc.id !== id);
    await this.writeAll(filtered);
    
    logger.info('WindsurfAccountModel.delete: Account deleted', { id, email: account.email });
    return true;
  }
}

export default WindsurfAccountModel;
