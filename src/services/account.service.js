import { AccountModel, AccountStatus } from '../models/account.js';
import logger from '../utils/logger.js';

export class AccountService {
  static async getAll() {
    logger.info('AccountService.getAll: Fetching all accounts');
    const accounts = await AccountModel.readAll();
    logger.info('AccountService.getAll: Retrieved accounts', { count: accounts.length });
    return accounts;
  }

  static async getById(id) {
    logger.info('AccountService.getById: Fetching account', { id });
    const account = await AccountModel.findById(id);
    if (!account) {
      logger.warn('AccountService.getById: Account not found', { id });
    }
    return account;
  }

  static async create(email) {
    logger.info('AccountService.create: Creating new account', { email });
    
    if (!email || !email.trim()) {
      logger.warn('AccountService.create: Email is required');
      return { error: 'EMAIL_REQUIRED', account: null };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logger.warn('AccountService.create: Invalid email format', { email });
      return { error: 'INVALID_EMAIL', account: null };
    }

    const result = await AccountModel.create(email.trim());
    
    if (result.error) {
      logger.warn('AccountService.create: Failed to create account', { email, error: result.error });
    } else {
      logger.info('AccountService.create: Account created successfully', { 
        id: result.account.id, 
        email: result.account.email 
      });
    }
    
    return result;
  }

  static async delete(id) {
    logger.info('AccountService.delete: Deleting account', { id });
    const deleted = await AccountModel.delete(id);
    
    if (deleted) {
      logger.info('AccountService.delete: Account deleted successfully', { id });
    } else {
      logger.warn('AccountService.delete: Account not found', { id });
    }
    
    return deleted;
  }

  static async updateStatus(id, status, error = null) {
    logger.info('AccountService.updateStatus: Updating account status', { id, status, error });
    const account = await AccountModel.updateStatus(id, status, error);
    
    if (account) {
      logger.info('AccountService.updateStatus: Status updated', { 
        id, 
        newStatus: status,
        previousStatus: account.status 
      });
    }
    
    return account;
  }

  static async updateLastRun(id, error = null) {
    logger.info('AccountService.updateLastRun: Updating last run time', { id, hasError: !!error });
    return AccountModel.updateLastRun(id, error);
  }

  static async getLoggedInAccounts() {
    logger.info('AccountService.getLoggedInAccounts: Fetching logged in accounts');
    const accounts = await AccountModel.readAll();
    const loggedIn = accounts.filter(acc => acc.status === AccountStatus.LOGGED_IN);
    logger.info('AccountService.getLoggedInAccounts: Found logged in accounts', { 
      total: accounts.length, 
      loggedIn: loggedIn.length 
    });
    return loggedIn;
  }
}

export default AccountService;
