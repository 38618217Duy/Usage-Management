import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { AccountModel, AccountStatus } from '../models/account.js';

const activeBrowsers = new Map();

export class BrowserService {
  static async openLoginBrowser(account) {
    const { id, email, profilePath } = account;
    
    logger.info('BrowserService.openLoginBrowser: Opening browser for login', { id, email });

    if (activeBrowsers.has(id)) {
      logger.warn('BrowserService.openLoginBrowser: Browser already open for account', { id });
      return { error: 'BROWSER_ALREADY_OPEN', browser: null };
    }

    const fullProfilePath = path.join(config.paths.root, profilePath);
    logger.debug('BrowserService.openLoginBrowser: Profile path', { fullProfilePath });

    try {
      const context = await chromium.launchPersistentContext(fullProfilePath, {
        headless: false,
        viewport: { width: 1280, height: 720 },
        args: [
          '--start-maximized',
          '--disable-blink-features=AutomationControlled',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-dev-shm-usage',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-extensions-except',
          '--disable-extensions',
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ],
        ignoreDefaultArgs: ['--enable-automation'],
      });

      activeBrowsers.set(id, context);
      logger.info('BrowserService.openLoginBrowser: Browser launched', { id, email });

      const page = context.pages()[0] || await context.newPage();
      
      // Set additional properties to avoid detection
      try {
        await page.evaluateOnNewDocument(() => {
          Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
          });
          
          // Remove automation indicators
          delete window.navigator.webdriver;
          
          // Override plugins
          Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5],
          });
          
          // Override languages
          Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en'],
          });
        });
      } catch (err) {
        logger.warn('BrowserService.openLoginBrowser: Could not set anti-detection properties', { 
          id, 
          error: err.message 
        });
      }
      
      await page.goto(config.cursor.baseUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: config.browser.navigationTimeout 
      });
      
      logger.info('BrowserService.openLoginBrowser: Navigated to Cursor', { id, url: config.cursor.baseUrl });

      context.on('close', async () => {
        logger.info('BrowserService.openLoginBrowser: Browser closed by user', { id, email });
        activeBrowsers.delete(id);
      });

      return { error: null, browser: context };
    } catch (err) {
      logger.error('BrowserService.openLoginBrowser: Failed to launch browser', { 
        id, 
        email, 
        error: err.message 
      });
      activeBrowsers.delete(id);
      return { error: err.message, browser: null };
    }
  }

  static async verifyLogin(id) {
    logger.info('BrowserService.verifyLogin: Starting verification', { id });

    const account = await AccountModel.findById(id);
    if (!account) {
      logger.error('BrowserService.verifyLogin: Account not found', { id });
      throw new Error('Account not found');
    }

    const fullProfilePath = path.resolve(account.profilePath);
    
    if (!fs.existsSync(fullProfilePath)) {
      logger.warn('BrowserService.verifyLogin: Profile directory not found', { id, profilePath: fullProfilePath });
      await AccountModel.updateStatus(id, AccountStatus.NOT_LOGGED_IN);
      return { isLoggedIn: false, message: 'Profile not found, please login first' };
    }

    let context;
    try {
      context = await chromium.launchPersistentContext(fullProfilePath, {
        headless: true,
        timeout: config.browser.timeout,
      });

      const page = context.pages()[0] || await context.newPage();
      
      // Test dashboard access instead of base URL
      logger.info('BrowserService.verifyLogin: Testing dashboard access', { id });
      await page.goto(config.cursor.dashboardUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: config.browser.navigationTimeout 
      });

      await page.waitForTimeout(3000); // Wait for potential redirects

      const currentUrl = page.url();
      logger.info('BrowserService.verifyLogin: Dashboard URL check', { id, url: currentUrl });

      if (currentUrl.includes('/login') || currentUrl.includes('/signin')) {
        logger.info('BrowserService.verifyLogin: Session expired - redirected to login', { id });
        await AccountModel.updateStatus(id, AccountStatus.SESSION_EXPIRED);
        await context.close();
        return { isLoggedIn: false, message: 'Session expired, please login again' };
      }

      // Additional check: try to access usage page
      logger.info('BrowserService.verifyLogin: Testing usage page access', { id });
      await page.goto(config.cursor.usageUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: config.browser.navigationTimeout 
      });

      await page.waitForTimeout(2000);
      const usageUrl = page.url();
      logger.info('BrowserService.verifyLogin: Usage URL check', { id, url: usageUrl });

      if (usageUrl.includes('/login') || usageUrl.includes('/signin')) {
        logger.info('BrowserService.verifyLogin: Cannot access usage page - session expired', { id });
        await AccountModel.updateStatus(id, AccountStatus.SESSION_EXPIRED);
        await context.close();
        return { isLoggedIn: false, message: 'Cannot access usage page, session expired' };
      }

      // Check if usage content is actually loaded - be more flexible with selectors
      const hasUsageContent = await page.$('table, .usage-table, [data-testid*="usage"], .dashboard, [class*="usage"], [class*="dashboard"], main, .content');
      if (!hasUsageContent) {
        logger.warn('BrowserService.verifyLogin: Usage page loaded but no specific content found, checking for general page structure', { id });
        
        // More lenient check - if we can access the page and it's not a login page, consider it valid
        const pageTitle = await page.title();
        const bodyText = await page.textContent('body');
        
        if (bodyText && !bodyText.toLowerCase().includes('sign in') && !bodyText.toLowerCase().includes('log in')) {
          logger.info('BrowserService.verifyLogin: Page accessible and not login page, considering valid', { id, title: pageTitle });
        } else {
          logger.warn('BrowserService.verifyLogin: Page appears to be login page or empty', { id });
          await AccountModel.updateStatus(id, AccountStatus.SESSION_EXPIRED);
          await context.close();
          return { isLoggedIn: false, message: 'Usage page accessible but appears to be login page' };
        }
      }

      logger.info('BrowserService.verifyLogin: Login and usage access verified', { id });
      await AccountModel.updateStatus(id, AccountStatus.LOGGED_IN);
      await context.close();
      return { isLoggedIn: true, message: 'Login and usage access verified successfully' };

    } catch (error) {
      logger.error('BrowserService.verifyLogin: Error during verification', { id, error: error.message });
      if (context) await context.close();
      await AccountModel.updateStatus(id, AccountStatus.SESSION_EXPIRED);
      return { isLoggedIn: false, message: 'Verification failed: ' + error.message };
    }
  }

  static async closeBrowser(accountId) {
    if (activeBrowsers.has(accountId)) {
      const context = activeBrowsers.get(accountId);
      try {
        await context.close();
        logger.info('BrowserService.closeBrowser: Browser closed', { accountId });
      } catch (err) {
        logger.warn('BrowserService.closeBrowser: Error closing browser', { accountId, error: err.message });
      }
      activeBrowsers.delete(accountId);
      return true;
    }
    return false;
  }

  static isBrowserOpen(accountId) {
    return activeBrowsers.has(accountId);
  }

  static getActiveBrowserCount() {
    return activeBrowsers.size;
  }
}

export default BrowserService;
