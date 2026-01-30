import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { AccountModel, AccountStatus } from '../models/account.js';
import { CDPService } from './cdp.service.js';

const activeBrowsers = new Map();

export class BrowserService {
  /**
   * Launch Chrome with remote debugging and connect via CDP
   * This uses REAL Chrome browser to avoid Cloudflare detection
   */
  static async openLoginBrowser(account) {
    const { id, email, profilePath } = account;
    
    logger.info('BrowserService.openLoginBrowser: Opening REAL Chrome browser for login via CDP', { id, email });

    if (activeBrowsers.has(id)) {
      logger.warn('BrowserService.openLoginBrowser: Browser already open for account', { id });
      return { error: 'BROWSER_ALREADY_OPEN', browser: null };
    }

    const fullProfilePath = path.join(config.paths.root, profilePath);
    logger.debug('BrowserService.openLoginBrowser: Profile path', { fullProfilePath });

    // Ensure profile directory exists
    if (!fs.existsSync(fullProfilePath)) {
      fs.mkdirSync(fullProfilePath, { recursive: true });
      logger.info('BrowserService.openLoginBrowser: Created profile directory', { fullProfilePath });
    }

    try {
      // Step 1: Launch real Chrome with remote debugging
      const chromePath = await this.findChromePath();
      if (!chromePath) {
        logger.error('BrowserService.openLoginBrowser: Chrome not found');
        return { 
          error: 'CHROME_NOT_FOUND', 
          browser: null,
          message: 'Chrome browser not found. Please install Google Chrome.'
        };
      }

      const debugPort = config.cdp.defaultPort;
      
      // Launch Chrome with specific profile and debugging port
      const chromeArgs = [
        `--remote-debugging-port=${debugPort}`,
        `--user-data-dir="${fullProfilePath}"`,
        '--no-first-run',
        '--no-default-browser-check',
        '--start-maximized',
        `"${config.cursor.loginUrl}"`
      ].join(' ');

      const command = `"${chromePath}" ${chromeArgs}`;
      logger.info('BrowserService.openLoginBrowser: Launching Chrome', { command });

      // Launch Chrome process (non-blocking)
      const chromeProcess = exec(command, (error) => {
        if (error && !error.killed) {
          logger.warn('BrowserService.openLoginBrowser: Chrome process error', { error: error.message });
        }
      });

      // Store process reference for cleanup
      activeBrowsers.set(id, { type: 'chrome-process', process: chromeProcess, profilePath: fullProfilePath });

      // Wait for Chrome to start and debugging port to be available
      logger.info('BrowserService.openLoginBrowser: Waiting for Chrome to start...', { id });
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Step 2: Connect via CDP (force reconnect since we launched new Chrome)
      let retries = 5;
      let browser = null;
      
      while (retries > 0 && !browser) {
        try {
          // Force reconnect on first attempt since we just launched a new Chrome
          const forceReconnect = retries === 5;
          const { error: connectError, browser: cdpBrowser } = await CDPService.connect(forceReconnect);
          if (!connectError && cdpBrowser) {
            browser = cdpBrowser;
            logger.info('BrowserService.openLoginBrowser: Connected to Chrome via CDP', { id });
          }
        } catch (err) {
          logger.debug('BrowserService.openLoginBrowser: CDP connection attempt failed', { retries, error: err.message });
        }
        
        if (!browser) {
          retries--;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!browser) {
        logger.error('BrowserService.openLoginBrowser: Failed to connect to Chrome via CDP after retries', { id });
        // Cleanup
        if (chromeProcess && !chromeProcess.killed) {
          chromeProcess.kill();
        }
        activeBrowsers.delete(id);
        return { 
          error: 'CDP_CONNECTION_FAILED', 
          browser: null,
          message: 'Failed to connect to Chrome. Please try again.'
        };
      }

      // Update stored reference with CDP browser
      activeBrowsers.set(id, { 
        type: 'cdp', 
        browser, 
        process: chromeProcess, 
        profilePath: fullProfilePath 
      });

      logger.info('BrowserService.openLoginBrowser: Chrome launched successfully with CDP', { 
        id, 
        email,
        url: config.cursor.loginUrl 
      });

      return { error: null, browser, message: 'Chrome launched. Please login manually.' };

    } catch (err) {
      logger.error('BrowserService.openLoginBrowser: Failed to launch Chrome', { 
        id, 
        email, 
        error: err.message 
      });
      activeBrowsers.delete(id);
      return { error: err.message, browser: null };
    }
  }

  /**
   * Find Chrome executable path based on OS
   */
  static async findChromePath() {
    const possiblePaths = [
      // Windows
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
      // macOS
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      // Linux
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
    ];

    for (const chromePath of possiblePaths) {
      if (chromePath && fs.existsSync(chromePath)) {
        logger.info('BrowserService.findChromePath: Found Chrome', { path: chromePath });
        return chromePath;
      }
    }

    logger.warn('BrowserService.findChromePath: Chrome not found in common paths');
    return null;
  }

  /**
   * Legacy method using Playwright (kept as fallback for non-login tasks)
   * WARNING: This will be detected by Cloudflare - use openLoginBrowser() for login
   */
  static async openLoginBrowserPlaywright(account) {
    const { id, email, profilePath } = account;
    
    logger.warn('BrowserService.openLoginBrowserPlaywright: Using Playwright - may be detected by Cloudflare', { id, email });

    if (activeBrowsers.has(id)) {
      logger.warn('BrowserService.openLoginBrowserPlaywright: Browser already open for account', { id });
      return { error: 'BROWSER_ALREADY_OPEN', browser: null };
    }

    const fullProfilePath = path.join(config.paths.root, profilePath);

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

      activeBrowsers.set(id, { type: 'playwright', context });
      logger.info('BrowserService.openLoginBrowserPlaywright: Browser launched', { id, email });

      const page = context.pages()[0] || await context.newPage();
      
      await page.goto(config.cursor.baseUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: config.browser.navigationTimeout 
      });

      context.on('close', async () => {
        logger.info('BrowserService.openLoginBrowserPlaywright: Browser closed by user', { id, email });
        activeBrowsers.delete(id);
      });

      return { error: null, browser: context };
    } catch (err) {
      logger.error('BrowserService.openLoginBrowserPlaywright: Failed to launch browser', { 
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
      const browserInfo = activeBrowsers.get(accountId);
      try {
        // Handle different browser types
        if (browserInfo.type === 'cdp' || browserInfo.type === 'chrome-process') {
          // Kill Chrome process if exists
          if (browserInfo.process && !browserInfo.process.killed) {
            browserInfo.process.kill();
            logger.info('BrowserService.closeBrowser: Chrome process killed', { accountId });
          }
        } else if (browserInfo.type === 'playwright') {
          // Close Playwright context
          if (browserInfo.context) {
            await browserInfo.context.close();
          }
        } else if (browserInfo.close) {
          // Legacy: direct context object
          await browserInfo.close();
        }
        logger.info('BrowserService.closeBrowser: Browser closed', { accountId, type: browserInfo.type });
      } catch (err) {
        logger.warn('BrowserService.closeBrowser: Error closing browser', { accountId, error: err.message });
      }
      activeBrowsers.delete(accountId);
      return true;
    }
    return false;
  }

  static isBrowserOpen(accountId) {
    if (!activeBrowsers.has(accountId)) {
      return false;
    }

    const browserInfo = activeBrowsers.get(accountId);
    
    // Check if Chrome process is actually running
    if (browserInfo.type === 'cdp' || browserInfo.type === 'chrome-process') {
      if (browserInfo.process && browserInfo.process.killed) {
        // Process was killed, cleanup
        logger.info('BrowserService.isBrowserOpen: Process killed, cleaning up', { accountId });
        activeBrowsers.delete(accountId);
        return false;
      }
      
      // Additional check: verify process is still alive
      if (browserInfo.process && browserInfo.process.pid) {
        try {
          // On Windows, this will throw if process doesn't exist
          process.kill(browserInfo.process.pid, 0);
        } catch (err) {
          // Process doesn't exist, cleanup
          logger.info('BrowserService.isBrowserOpen: Process not found, cleaning up', { accountId, pid: browserInfo.process.pid });
          activeBrowsers.delete(accountId);
          return false;
        }
      }
    }
    
    return true;
  }

  static getActiveBrowserCount() {
    return activeBrowsers.size;
  }

  /**
   * Cleanup dead browser processes from activeBrowsers Map
   */
  static cleanupDeadBrowsers() {
    const deadBrowsers = [];
    
    for (const [accountId, browserInfo] of activeBrowsers.entries()) {
      if (browserInfo.type === 'cdp' || browserInfo.type === 'chrome-process') {
        if (browserInfo.process && browserInfo.process.killed) {
          deadBrowsers.push(accountId);
        } else if (browserInfo.process && browserInfo.process.pid) {
          try {
            process.kill(browserInfo.process.pid, 0);
          } catch (err) {
            deadBrowsers.push(accountId);
          }
        }
      }
    }
    
    deadBrowsers.forEach(accountId => {
      logger.info('BrowserService.cleanupDeadBrowsers: Removing dead browser', { accountId });
      activeBrowsers.delete(accountId);
    });
    
    return deadBrowsers.length;
  }
}

export default BrowserService;
