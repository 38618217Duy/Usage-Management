import path from 'path';
import fs from 'fs/promises';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { AccountModel, AccountStatus } from '../models/account.js';
import { CDPService } from './cdp.service.js';

export class AutomationCDPService {
  static async downloadCSV(account) {
    const { id, email, status } = account;
    
    logger.info('AutomationCDPService.downloadCSV: Starting CSV download via CDP', { id, email });

    if (status !== AccountStatus.LOGGED_IN) {
      logger.warn('AutomationCDPService.downloadCSV: Account not logged in', { id, email, status });
      return { 
        error: 'NOT_LOGGED_IN', 
        message: 'Account is not logged in',
        filePath: null 
      };
    }

    try {
      await fs.mkdir(config.paths.download, { recursive: true });

      // CHECKPOINT 1: Connect to Chrome via CDP
      logger.info('AutomationCDPService.downloadCSV: CHECKPOINT 1 - Connecting to Chrome via CDP', { id });
      
      const { error: connectError, browser } = await CDPService.connect();
      if (connectError) {
        logger.error('AutomationCDPService.downloadCSV: Failed to connect to Chrome', { 
          id, 
          error: connectError 
        });
        return { 
          error: 'CDP_CONNECTION_FAILED', 
          message: `Failed to connect to Chrome: ${connectError}. Make sure Chrome is running with --remote-debugging-port=9222`,
          filePath: null 
        };
      }

      // CHECKPOINT 2: Get browser context and page
      logger.info('AutomationCDPService.downloadCSV: CHECKPOINT 2 - Getting browser context', { id });
      
      const { error: contextError, context } = await CDPService.getDefaultContext();
      if (contextError) {
        logger.error('AutomationCDPService.downloadCSV: Failed to get context', { id, error: contextError });
        return { 
          error: 'NO_BROWSER_CONTEXT', 
          message: 'No browser context found. Make sure Chrome has at least one window open.',
          filePath: null 
        };
      }

      // Get or create a page
      const pages = context.pages();
      let page = pages.length > 0 ? pages[0] : await context.newPage();
      
      logger.info('AutomationCDPService.downloadCSV: Using page', { 
        id, 
        currentUrl: page.url(),
        pageCount: pages.length 
      });

      // CHECKPOINT 3: Navigate to dashboard
      logger.info('AutomationCDPService.downloadCSV: CHECKPOINT 3 - Navigating to dashboard', { id });
      await page.goto(config.cursor.dashboardUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: config.browser.navigationTimeout 
      });

      // CHECKPOINT 4: Verify we're logged in
      logger.info('AutomationCDPService.downloadCSV: CHECKPOINT 4 - Verifying login status', { id });
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      logger.info('AutomationCDPService.downloadCSV: Current URL', { id, url: currentUrl });
      
      if (currentUrl.includes('/login') || currentUrl.includes('/signin')) {
        logger.error('AutomationCDPService.downloadCSV: Not logged in', { id, url: currentUrl });
        await AccountModel.updateStatus(id, AccountStatus.SESSION_EXPIRED);
        return { 
          error: 'SESSION_EXPIRED', 
          message: 'Session expired. Please login in Chrome first.',
          filePath: null 
        };
      }

      // CHECKPOINT 5: Navigate to Usage tab
      logger.info('AutomationCDPService.downloadCSV: CHECKPOINT 5 - Navigating to Usage tab', { id });
      
      const usageMenuSelectors = [
        'a[href*="usage"]',
        'button:has-text("Usage")',
        '[data-testid*="usage"]',
        'nav a:has-text("Usage")',
        '.menu a:has-text("Usage")'
      ];
      
      let usageClicked = false;
      for (const selector of usageMenuSelectors) {
        try {
          const usageMenu = await page.$(selector);
          if (usageMenu) {
            await usageMenu.click();
            usageClicked = true;
            logger.info('AutomationCDPService.downloadCSV: Clicked Usage menu', { id, selector });
            await page.waitForTimeout(3000);
            break;
          }
        } catch (err) {
          logger.debug('AutomationCDPService.downloadCSV: Usage menu selector not found', { selector });
        }
      }
      
      if (!usageClicked) {
        logger.info('AutomationCDPService.downloadCSV: Fallback - navigating directly to usage URL', { id });
        await page.goto(config.cursor.usageUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: config.browser.navigationTimeout 
        });
      }

      // CHECKPOINT 6: Wait for usage page to load
      logger.info('AutomationCDPService.downloadCSV: CHECKPOINT 6 - Waiting for usage page to load', { id });
      await page.waitForTimeout(5000);
      
      const usageUrl = page.url();
      logger.info('AutomationCDPService.downloadCSV: Usage page URL', { id, url: usageUrl });

      // Log page content for debugging
      const pageTitle = await page.title();
      const menuItems = await page.$$eval('nav a, .menu a, [role="menuitem"]', elements => 
        elements.map(el => ({ text: el.textContent?.trim(), href: el.href })).filter(item => item.text)
      );
      
      logger.info('AutomationCDPService.downloadCSV: Page analysis', { 
        id, 
        title: pageTitle,
        url: usageUrl,
        menuItems: menuItems.slice(0, 10)
      });

      // CHECKPOINT 7: Select 30 days range
      logger.info('AutomationCDPService.downloadCSV: CHECKPOINT 7 - Selecting 30 days range', { id });
      
      const dateSelectors = [
        'button:has-text("30d")',
        'button:has-text("30")',
        'button:has-text("30 days")', 
        'button:has-text("Last 30")'
      ];
      
      for (const selector of dateSelectors) {
        try {
          const dateButton = await page.$(selector);
          if (dateButton) {
            await dateButton.click();
            logger.info('AutomationCDPService.downloadCSV: Selected 30 days range', { id, selector });
            await page.waitForTimeout(3000);
            break;
          }
        } catch (err) {
          logger.debug('AutomationCDPService.downloadCSV: Date selector not found', { selector });
        }
      }

      // CHECKPOINT 8: Find and click Export CSV button
      logger.info('AutomationCDPService.downloadCSV: CHECKPOINT 8 - Finding Export CSV button', { id });
      
      // Scroll to ensure button is visible
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1000);

      // Set up download handler
      const downloadPromise = page.waitForEvent('download', { timeout: config.browser.downloadTimeout });

      // Find Export CSV button
      const exportSelectors = [
        'button:has-text("Export CSV")',
        'a:has-text("Export CSV")',
        'button:has-text("Export")',
        '[data-testid*="export"]'
      ];
      
      let clicked = false;
      for (const selector of exportSelectors) {
        try {
          const button = await page.$(selector);
          if (button) {
            const buttonText = await button.textContent();
            logger.info('AutomationCDPService.downloadCSV: Found export button', { 
              id, 
              selector, 
              text: buttonText?.trim() 
            });
            
            await button.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);
            await button.click();
            clicked = true;
            logger.info('AutomationCDPService.downloadCSV: Clicked export button', { id });
            break;
          }
        } catch (err) {
          logger.debug('AutomationCDPService.downloadCSV: Export selector not found', { selector });
        }
      }

      if (!clicked) {
        // Fallback: search all buttons
        logger.info('AutomationCDPService.downloadCSV: Fallback - searching all buttons', { id });
        
        const allButtons = await page.$$('button, a');
        for (const button of allButtons) {
          const text = await button.textContent();
          if (text && text.toLowerCase().includes('export')) {
            logger.info('AutomationCDPService.downloadCSV: Found export button via text search', { 
              id, 
              text: text.trim() 
            });
            await button.scrollIntoViewIfNeeded();
            await page.waitForTimeout(500);
            await button.click();
            clicked = true;
            break;
          }
        }
      }

      if (!clicked) {
        logger.error('AutomationCDPService.downloadCSV: Could not find export button', { id });
        return { 
          error: 'EXPORT_BUTTON_NOT_FOUND', 
          message: 'Could not find Export CSV button on the page',
          filePath: null 
        };
      }

      // CHECKPOINT 9: Wait for download
      logger.info('AutomationCDPService.downloadCSV: CHECKPOINT 9 - Waiting for download', { id });
      const download = await downloadPromise;
      
      const sanitizedEmail = email.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const fileName = `${sanitizedEmail}.csv`;
      const filePath = path.join(config.paths.download, fileName);
      
      await download.saveAs(filePath);
      logger.info('AutomationCDPService.downloadCSV: File saved', { id, filePath });

      await AccountModel.updateLastRun(id, null);

      logger.info('AutomationCDPService.downloadCSV: Download completed successfully', { id, email, filePath });
      
      return { 
        error: null, 
        message: 'CSV downloaded successfully via CDP',
        filePath,
        fileName,
        downloadedAt: new Date().toISOString()
      };

    } catch (err) {
      logger.error('AutomationCDPService.downloadCSV: Download failed', { 
        id, 
        email, 
        error: err.message 
      });
      
      await AccountModel.updateLastRun(id, err.message);
      
      return { 
        error: 'DOWNLOAD_FAILED', 
        message: err.message,
        filePath: null 
      };
    }
  }

  static async runAll() {
    logger.info('AutomationCDPService.runAll: Starting batch download via CDP');
    
    // First check if Chrome is connected
    const { error: connectError } = await CDPService.connect();
    if (connectError) {
      logger.error('AutomationCDPService.runAll: Chrome not connected', { error: connectError });
      return {
        total: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        results: [],
        error: `Chrome not connected: ${connectError}. Launch Chrome with --remote-debugging-port=9222`
      };
    }

    const accounts = await AccountModel.readAll();
    const loggedInAccounts = accounts.filter(acc => acc.status === AccountStatus.LOGGED_IN);
    
    logger.info('AutomationCDPService.runAll: Found logged-in accounts', { 
      total: accounts.length, 
      loggedIn: loggedInAccounts.length 
    });

    if (loggedInAccounts.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        skipped: accounts.length,
        results: []
      };
    }

    const results = [];
    let successful = 0;
    let failed = 0;

    for (const account of loggedInAccounts) {
      logger.info('AutomationCDPService.runAll: Processing account', { 
        id: account.id, 
        email: account.email,
        index: results.length + 1,
        total: loggedInAccounts.length
      });

      const result = await this.downloadCSV(account);
      
      const accountResult = {
        id: account.id,
        email: account.email,
        success: !result.error,
        error: result.error ? result.message : null,
        filePath: result.filePath,
      };

      results.push(accountResult);

      if (result.error) {
        failed++;
      } else {
        successful++;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const skipped = accounts.length - loggedInAccounts.length;

    logger.info('AutomationCDPService.runAll: Batch download completed', { 
      total: loggedInAccounts.length,
      successful,
      failed,
      skipped
    });

    return {
      total: loggedInAccounts.length,
      successful,
      failed,
      skipped,
      results
    };
  }
}

export default AutomationCDPService;
