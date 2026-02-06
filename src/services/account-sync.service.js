import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { AccountModel } from '../models/account.js';

/**
 * Service để đồng bộ email thực từ Cursor dashboard với accounts.json
 * Giải quyết vấn đề: tên account trong danh sách không khớp với profile thực tế
 */
export class AccountSyncService {
  /**
   * Đọc email thực từ Cursor dashboard cho một account
   * @param {Object} account - Account object từ accounts.json
   * @returns {Promise<{email: string|null, error: string|null}>}
   */
  static async getActualEmailFromDashboard(account) {
    const { id, profilePath } = account;
    const fullProfilePath = path.join(config.paths.root, profilePath);

    logger.info('AccountSyncService.getActualEmailFromDashboard: Starting', { id, profilePath });

    if (!fs.existsSync(fullProfilePath)) {
      logger.warn('AccountSyncService.getActualEmailFromDashboard: Profile not found', { id, fullProfilePath });
      return { email: null, error: 'PROFILE_NOT_FOUND' };
    }

    let context;
    try {
      context = await chromium.launchPersistentContext(fullProfilePath, {
        headless: true,
        timeout: config.browser.timeout,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--no-sandbox',
          '--disable-setuid-sandbox',
        ],
      });

      const page = context.pages()[0] || await context.newPage();

      // Navigate to dashboard
      logger.info('AccountSyncService.getActualEmailFromDashboard: Navigating to dashboard', { id });
      await page.goto(config.cursor.dashboardUrl, {
        waitUntil: 'domcontentloaded',
        timeout: config.browser.navigationTimeout,
      });

      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      logger.info('AccountSyncService.getActualEmailFromDashboard: Current URL', { id, url: currentUrl });

      // Check if redirected to login
      if (currentUrl.includes('/login') || currentUrl.includes('/signin')) {
        logger.warn('AccountSyncService.getActualEmailFromDashboard: Session expired', { id });
        await context.close();
        return { email: null, error: 'SESSION_EXPIRED' };
      }

      // Try multiple selectors to find email
      const emailSelectors = [
        // Common email display patterns
        '[data-testid*="email"]',
        '[class*="email"]',
        'span:has-text("@")',
        'p:has-text("@")',
        'div:has-text("@jv-it.com")',
        // Account/profile sections
        '[class*="account"] [class*="email"]',
        '[class*="profile"] [class*="email"]',
        '[class*="user"] [class*="email"]',
        // Settings/account dropdown
        'button[class*="account"]',
        '[class*="avatar"]',
        '[class*="dropdown"] span',
      ];

      let actualEmail = null;

      // Method 1: Try specific selectors
      for (const selector of emailSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            const text = await element.textContent();
            if (text && text.includes('@')) {
              // Extract email from text
              const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
              if (emailMatch) {
                actualEmail = emailMatch[0].toLowerCase();
                logger.info('AccountSyncService.getActualEmailFromDashboard: Found email via selector', { 
                  id, 
                  selector, 
                  email: actualEmail 
                });
                break;
              }
            }
          }
        } catch (err) {
          // Continue to next selector
        }
      }

      // Method 2: Search entire page for email pattern
      if (!actualEmail) {
        logger.info('AccountSyncService.getActualEmailFromDashboard: Searching page content for email', { id });
        
        const pageContent = await page.content();
        // Look for jv-it.com emails specifically
        const jvitEmailMatch = pageContent.match(/jvit_cursor\d+@jv-it\.com\.vn/i);
        if (jvitEmailMatch) {
          actualEmail = jvitEmailMatch[0].toLowerCase();
          logger.info('AccountSyncService.getActualEmailFromDashboard: Found email in page content', { 
            id, 
            email: actualEmail 
          });
        }
      }

      // Method 3: Check for email in visible text
      if (!actualEmail) {
        const bodyText = await page.textContent('body');
        const emailMatches = bodyText.match(/[\w.-]+@[\w.-]+\.\w+/g);
        if (emailMatches) {
          // Filter for jv-it.com emails
          const jvitEmail = emailMatches.find(e => e.includes('jv-it.com'));
          if (jvitEmail) {
            actualEmail = jvitEmail.toLowerCase();
            logger.info('AccountSyncService.getActualEmailFromDashboard: Found email in body text', { 
              id, 
              email: actualEmail 
            });
          }
        }
      }

      // Method 4: Try clicking on account/profile menu to reveal email
      if (!actualEmail) {
        logger.info('AccountSyncService.getActualEmailFromDashboard: Trying to open account menu', { id });
        
        const menuSelectors = [
          'button[class*="avatar"]',
          '[class*="account-menu"]',
          '[class*="user-menu"]',
          'button:has([class*="avatar"])',
          '[aria-label*="account"]',
          '[aria-label*="profile"]',
        ];

        for (const selector of menuSelectors) {
          try {
            const menuButton = await page.$(selector);
            if (menuButton) {
              await menuButton.click();
              await page.waitForTimeout(1000);
              
              // Search for email in dropdown
              const dropdownText = await page.textContent('body');
              const emailMatch = dropdownText.match(/jvit_cursor\d+@jv-it\.com\.vn/i);
              if (emailMatch) {
                actualEmail = emailMatch[0].toLowerCase();
                logger.info('AccountSyncService.getActualEmailFromDashboard: Found email after opening menu', { 
                  id, 
                  email: actualEmail 
                });
                break;
              }
            }
          } catch (err) {
            // Continue to next selector
          }
        }
      }

      await context.close();

      if (!actualEmail) {
        logger.warn('AccountSyncService.getActualEmailFromDashboard: Could not find email', { id });
        return { email: null, error: 'EMAIL_NOT_FOUND' };
      }

      return { email: actualEmail, error: null };

    } catch (err) {
      logger.error('AccountSyncService.getActualEmailFromDashboard: Error', { 
        id, 
        error: err.message 
      });
      if (context) await context.close();
      return { email: null, error: err.message };
    }
  }

  /**
   * Đồng bộ tất cả accounts - kiểm tra và cập nhật email nếu sai
   * @param {Object} options - { dryRun: boolean }
   * @returns {Promise<{total: number, checked: number, updated: number, errors: number, results: Array}>}
   */
  static async syncAllAccounts(options = { dryRun: false }) {
    logger.info('AccountSyncService.syncAllAccounts: Starting sync', { options });

    const accounts = await AccountModel.readAll();
    const results = [];
    let checked = 0;
    let updated = 0;
    let errors = 0;

    for (const account of accounts) {
      logger.info('AccountSyncService.syncAllAccounts: Processing account', { 
        id: account.id, 
        currentEmail: account.email,
        index: checked + 1,
        total: accounts.length
      });

      const { email: actualEmail, error } = await this.getActualEmailFromDashboard(account);

      const result = {
        id: account.id,
        currentEmail: account.email,
        actualEmail,
        error,
        needsUpdate: false,
        updated: false,
      };

      if (error) {
        errors++;
        result.error = error;
      } else if (actualEmail && actualEmail !== account.email.toLowerCase()) {
        result.needsUpdate = true;
        
        if (!options.dryRun) {
          // Update the account email
          await AccountModel.updateEmail(account.id, actualEmail);
          result.updated = true;
          updated++;
          logger.info('AccountSyncService.syncAllAccounts: Updated email', { 
            id: account.id, 
            from: account.email, 
            to: actualEmail 
          });
        } else {
          logger.info('AccountSyncService.syncAllAccounts: Would update email (dry run)', { 
            id: account.id, 
            from: account.email, 
            to: actualEmail 
          });
        }
      }

      results.push(result);
      checked++;

      // Small delay between accounts to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    logger.info('AccountSyncService.syncAllAccounts: Sync completed', { 
      total: accounts.length,
      checked,
      updated,
      errors
    });

    return {
      total: accounts.length,
      checked,
      updated,
      errors,
      results,
    };
  }

  /**
   * Đồng bộ một account cụ thể
   * @param {string} accountId - Account ID
   * @param {Object} options - { dryRun: boolean }
   */
  static async syncAccount(accountId, options = { dryRun: false }) {
    logger.info('AccountSyncService.syncAccount: Starting', { accountId, options });

    const account = await AccountModel.findById(accountId);
    if (!account) {
      return { error: 'ACCOUNT_NOT_FOUND' };
    }

    const { email: actualEmail, error } = await this.getActualEmailFromDashboard(account);

    if (error) {
      return { 
        id: accountId,
        currentEmail: account.email,
        error,
        updated: false 
      };
    }

    if (actualEmail && actualEmail !== account.email.toLowerCase()) {
      if (!options.dryRun) {
        await AccountModel.updateEmail(accountId, actualEmail);
        return {
          id: accountId,
          currentEmail: account.email,
          actualEmail,
          updated: true,
        };
      }
      return {
        id: accountId,
        currentEmail: account.email,
        actualEmail,
        needsUpdate: true,
        updated: false,
      };
    }

    return {
      id: accountId,
      currentEmail: account.email,
      actualEmail,
      needsUpdate: false,
      updated: false,
    };
  }
}

export default AccountSyncService;
