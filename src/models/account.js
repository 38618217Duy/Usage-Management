import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import config from '../config/index.js';
import logger from '../utils/logger.js';

export const AccountStatus = {
  NOT_LOGGED_IN: 'NOT_LOGGED_IN',
  LOGGED_IN: 'LOGGED_IN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
};

export class AccountModel {
  static async ensureFileExists() {
    try {
      await fs.access(config.paths.accountsFile);
    } catch {
      logger.info('Creating accounts.json file');
      await fs.writeFile(config.paths.accountsFile, JSON.stringify({ accounts: [] }, null, 2));
    }
  }

  static async readAll() {
    await this.ensureFileExists();
    const data = await fs.readFile(config.paths.accountsFile, 'utf-8');
    const parsed = JSON.parse(data);
    logger.debug('Read accounts from file', { count: parsed.accounts.length });
    return parsed.accounts;
  }

  static async writeAll(accounts) {
    await fs.writeFile(config.paths.accountsFile, JSON.stringify({ accounts }, null, 2));
    logger.debug('Wrote accounts to file', { count: accounts.length });
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
    const accounts = await this.readAll();
    
    const existing = accounts.find(acc => acc.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      logger.warn('Attempted to create account with existing email', { email });
      return { error: 'EMAIL_EXISTS', account: null };
    }

    const id = uuidv4();
    const profilePath = path.join('profiles', `acc-${id}`);
    const now = new Date().toISOString();

    const account = {
      id,
      email,
      profilePath,
      status: AccountStatus.NOT_LOGGED_IN,
      lastRunAt: null,
      lastError: null,
      createdAt: now,
      updatedAt: now,
    };

    const fullProfilePath = path.join(config.paths.root, profilePath);
    await fs.mkdir(fullProfilePath, { recursive: true });
    logger.info('Created profile directory', { profilePath: fullProfilePath });

    accounts.push(account);
    await this.writeAll(accounts);
    
    logger.info('Account created', { id, email, status: account.status });
    return { error: null, account };
  }

  static async update(id, updates) {
    const accounts = await this.readAll();
    const index = accounts.findIndex(acc => acc.id === id);
    
    if (index === -1) {
      logger.warn('Attempted to update non-existent account', { id });
      return null;
    }

    const updatedAccount = {
      ...accounts[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    accounts[index] = updatedAccount;
    await this.writeAll(accounts);
    
    logger.info('Account updated', { id, updates: Object.keys(updates) });
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

  static async delete(id) {
    const accounts = await this.readAll();
    const account = accounts.find(acc => acc.id === id);
    
    if (!account) {
      logger.warn('Attempted to delete non-existent account', { id });
      return false;
    }

    const fullProfilePath = path.join(config.paths.root, account.profilePath);
    try {
      await fs.rm(fullProfilePath, { recursive: true, force: true });
      logger.info('Deleted profile directory', { profilePath: fullProfilePath });
    } catch (err) {
      logger.warn('Failed to delete profile directory', { profilePath: fullProfilePath, error: err.message });
    }

    const filtered = accounts.filter(acc => acc.id !== id);
    await this.writeAll(filtered);
    
    logger.info('Account deleted', { id, email: account.email });
    return true;
  }
}

export default AccountModel;
