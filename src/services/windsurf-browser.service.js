import { chromium } from 'playwright';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { WindsurfAccountModel, WindsurfAccountStatus } from '../models/windsurf-account.js';

const activeBrowsers = new Map();

export class WindsurfBrowserService {
  static cleanupDeadBrowsers() {
    for (const [id, browserInfo] of activeBrowsers.entries()) {
      try {
        if (browserInfo.type === 'chrome-process' && browserInfo.process) {
          if (browserInfo.process.killed || browserInfo.process.exitCode !== null) {
            logger.info('WindsurfBrowserService.cleanupDeadBrowsers: Removing dead browser', { id });
            activeBrowsers.delete(id);
          }
        } else if (browserInfo.type === 'playwright' && browserInfo.context) {
          activeBrowsers.delete(id);
        }
      } catch (err) {
        logger.warn('WindsurfBrowserService.cleanupDeadBrowsers: Error checking browser', { id, error: err.message });
        activeBrowsers.delete(id);
      }
    }
  }

  static async isBrowserOpen(accountId) {
    if (!activeBrowsers.has(accountId)) {
      return false;
    }

    const browserInfo = activeBrowsers.get(accountId);
    
    if (browserInfo.type === 'chrome-process' && browserInfo.process) {
      if (browserInfo.process.killed || browserInfo.process.exitCode !== null) {
        activeBrowsers.delete(accountId);
        return false;
      }
      return true;
    }
    
    if (browserInfo.type === 'playwright' && browserInfo.context) {
      return true;
    }

    return false;
  }

  static async openLoginBrowser(account) {
    const { id, email, profilePath } = account;
    
    logger.info('WindsurfBrowserService.openLoginBrowser: Opening browser for login', { id, email });

    if (activeBrowsers.has(id)) {
      const existing = activeBrowsers.get(id);
      if (existing.process && !existing.process.killed) {
        logger.warn('WindsurfBrowserService.openLoginBrowser: Browser already open for account', { id });
        return { error: 'BROWSER_ALREADY_OPEN', browser: null };
      }
      activeBrowsers.delete(id);
    }

    const fullProfilePath = path.join(config.paths.root, profilePath);

    if (!fs.existsSync(fullProfilePath)) {
      fs.mkdirSync(fullProfilePath, { recursive: true });
      logger.info('WindsurfBrowserService.openLoginBrowser: Created profile directory', { fullProfilePath });
    }

    try {
      const chromePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.CHROME_PATH,
      ].filter(Boolean);

      let chromePath = null;
      for (const p of chromePaths) {
        if (fs.existsSync(p)) {
          chromePath = p;
          break;
        }
      }

      if (!chromePath) {
        logger.error('WindsurfBrowserService.openLoginBrowser: Chrome not found');
        return { error: 'CHROME_NOT_FOUND', browser: null };
      }

      const args = [
        `--user-data-dir=${fullProfilePath}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-default-apps',
        config.windsurf.loginUrl,
      ];

      logger.info('WindsurfBrowserService.openLoginBrowser: Launching Chrome', { 
        id, 
        chromePath,
        profilePath: fullProfilePath 
      });

      const chromeProcess = spawn(chromePath, args, {
        detached: true,
        stdio: 'ignore',
      });

      chromeProcess.unref();

      activeBrowsers.set(id, { 
        type: 'chrome-process', 
        process: chromeProcess,
        profilePath: fullProfilePath
      });

      chromeProcess.on('exit', (code) => {
        logger.info('WindsurfBrowserService.openLoginBrowser: Chrome process exited', { id, code });
        activeBrowsers.delete(id);
      });

      logger.info('WindsurfBrowserService.openLoginBrowser: Browser launched successfully', { id, email });
      
      return { error: null, browser: chromeProcess, message: 'Browser opened. Please login to Windsurf manually.' };

    } catch (err) {
      logger.error('WindsurfBrowserService.openLoginBrowser: Failed to launch browser', { 
        id, 
        email, 
        error: err.message 
      });
      activeBrowsers.delete(id);
      return { error: err.message, browser: null };
    }
  }

  static async verifyLogin(id) {
    logger.info('WindsurfBrowserService.verifyLogin: Starting verification', { id });

    const account = await WindsurfAccountModel.findById(id);
    if (!account) {
      logger.error('WindsurfBrowserService.verifyLogin: Account not found', { id });
      throw new Error('Account not found');
    }

    const fullProfilePath = path.join(config.paths.root, account.profilePath);
    
    if (!fs.existsSync(fullProfilePath)) {
      logger.warn('WindsurfBrowserService.verifyLogin: Profile directory not found', { id, profilePath: fullProfilePath });
      await WindsurfAccountModel.updateStatus(id, WindsurfAccountStatus.NOT_LOGGED_IN);
      return { isLoggedIn: false, message: 'Profile not found, please login first' };
    }

    let context;
    try {
      context = await chromium.launchPersistentContext(fullProfilePath, {
        headless: true,
        timeout: config.browser.timeout,
      });

      const page = context.pages()[0] || await context.newPage();
      
      logger.info('WindsurfBrowserService.verifyLogin: Testing profile page access', { id });
      await page.goto(config.windsurf.profileUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: config.browser.navigationTimeout 
      });

      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      logger.info('WindsurfBrowserService.verifyLogin: Profile URL check', { id, url: currentUrl });

      if (currentUrl.includes('/login') || currentUrl.includes('/signin') || currentUrl.includes('/auth')) {
        logger.info('WindsurfBrowserService.verifyLogin: Session expired - redirected to login', { id });
        await WindsurfAccountModel.updateStatus(id, WindsurfAccountStatus.SESSION_EXPIRED);
        await context.close();
        return { isLoggedIn: false, message: 'Session expired, please login again' };
      }

      const pageTitle = await page.title();
      const bodyText = await page.textContent('body');
      
      if (bodyText && !bodyText.toLowerCase().includes('sign in') && !bodyText.toLowerCase().includes('log in')) {
        logger.info('WindsurfBrowserService.verifyLogin: Login verified', { id, title: pageTitle });
        await WindsurfAccountModel.updateStatus(id, WindsurfAccountStatus.LOGGED_IN);
        await WindsurfAccountModel.update(id, { lastLoginAt: new Date().toISOString() });
        await context.close();
        return { isLoggedIn: true, message: 'Login verified successfully' };
      } else {
        logger.warn('WindsurfBrowserService.verifyLogin: Page appears to be login page', { id });
        await WindsurfAccountModel.updateStatus(id, WindsurfAccountStatus.SESSION_EXPIRED);
        await context.close();
        return { isLoggedIn: false, message: 'Page appears to be login page' };
      }

    } catch (error) {
      logger.error('WindsurfBrowserService.verifyLogin: Error during verification', { id, error: error.message });
      if (context) await context.close();
      await WindsurfAccountModel.updateStatus(id, WindsurfAccountStatus.SESSION_EXPIRED);
      return { isLoggedIn: false, message: 'Verification failed: ' + error.message };
    }
  }

  static async closeBrowser(accountId) {
    if (activeBrowsers.has(accountId)) {
      const browserInfo = activeBrowsers.get(accountId);
      try {
        if (browserInfo.type === 'chrome-process' && browserInfo.process && !browserInfo.process.killed) {
          browserInfo.process.kill();
          logger.info('WindsurfBrowserService.closeBrowser: Chrome process killed', { accountId });
        } else if (browserInfo.type === 'playwright' && browserInfo.context) {
          await browserInfo.context.close();
          logger.info('WindsurfBrowserService.closeBrowser: Playwright context closed', { accountId });
        }
      } catch (err) {
        logger.warn('WindsurfBrowserService.closeBrowser: Error closing browser', { accountId, error: err.message });
      }
      activeBrowsers.delete(accountId);
      return true;
    }
    return false;
  }

  static getActiveBrowsers() {
    return Array.from(activeBrowsers.keys());
  }
}

export default WindsurfBrowserService;
