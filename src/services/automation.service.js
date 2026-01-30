import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs/promises';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { AccountModel, AccountStatus } from '../models/account.js';
import { BrowserService } from './browser.service.js';

export class AutomationService {
  static async downloadCSV(account) {
    const { id, email, profilePath, status } = account;
    
    logger.info('AutomationService.downloadCSV: Starting CSV download', { id, email });

    if (status !== AccountStatus.LOGGED_IN) {
      logger.warn('AutomationService.downloadCSV: Account not logged in', { id, email, status });
      return { 
        error: 'NOT_LOGGED_IN', 
        message: 'Account is not logged in',
        filePath: null 
      };
    }

    if (BrowserService.isBrowserOpen(id)) {
      logger.warn('AutomationService.downloadCSV: Browser is currently open', { id });
      return { 
        error: 'BROWSER_IN_USE', 
        message: 'Browser is currently open for this account',
        filePath: null 
      };
    }

    const fullProfilePath = path.join(config.paths.root, profilePath);
    let context = null;

    try {
      await fs.mkdir(config.paths.download, { recursive: true });

      context = await chromium.launchPersistentContext(fullProfilePath, {
        headless: true,
        acceptDownloads: true,
        timeout: config.browser.timeout,
      });

      const page = context.pages()[0] || await context.newPage();
      
      // CHECKPOINT 1: Navigate to dashboard first
      logger.info('AutomationService.downloadCSV: CHECKPOINT 1 - Navigating to dashboard', { id });
      await page.goto(config.cursor.dashboardUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: config.browser.navigationTimeout 
      });

      // CHECKPOINT 2: Verify we're logged in and on dashboard
      logger.info('AutomationService.downloadCSV: CHECKPOINT 2 - Verifying dashboard access', { id });
      const currentUrl = page.url();
      logger.info('AutomationService.downloadCSV: Current URL after dashboard navigation', { id, url: currentUrl });
      
      // If redirected to login, user needs to login first
      if (currentUrl.includes('/login') || currentUrl.includes('/signin')) {
        logger.error('AutomationService.downloadCSV: Not logged in, redirected to login page', { id, url: currentUrl });
        await AccountModel.updateStatus(id, AccountStatus.SESSION_EXPIRED);
        await context.close();
        return { 
          error: 'SESSION_EXPIRED', 
          message: 'Session expired, please login through browser first',
          filePath: null 
        };
      }

      // CHECKPOINT 3: Navigate to Usage tab in dashboard
      logger.info('AutomationService.downloadCSV: CHECKPOINT 3 - Navigating to Usage tab', { id });
      
      // Try to find and click Usage menu item
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
            logger.info('AutomationService.downloadCSV: Clicked Usage menu', { id, selector });
            await page.waitForTimeout(3000); // Wait for navigation
            break;
          }
        } catch (err) {
          logger.debug('AutomationService.downloadCSV: Usage menu selector not found', { selector });
        }
      }
      
      if (!usageClicked) {
        // Fallback: navigate directly to usage URL
        logger.info('AutomationService.downloadCSV: Fallback - navigating directly to usage URL', { id });
        await page.goto(config.cursor.usageUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: config.browser.navigationTimeout 
        });
      }

      // CHECKPOINT 4: Verify we're on usage page
      logger.info('AutomationService.downloadCSV: CHECKPOINT 4 - Verifying usage page', { id });
      const usageUrl = page.url();
      logger.info('AutomationService.downloadCSV: Final URL', { id, url: usageUrl });
      
      if (!usageUrl.includes('usage') && !usageUrl.includes('dashboard')) {
        logger.error('AutomationService.downloadCSV: Not on usage or dashboard page', { id, url: usageUrl });
        await context.close();
        return { 
          error: 'WRONG_PAGE', 
          message: 'Could not navigate to usage page',
          filePath: null 
        };
      }

      // CHECKPOINT 5: Wait for usage page to fully load
      logger.info('AutomationService.downloadCSV: CHECKPOINT 5 - Waiting for usage page to load completely', { id });
      await page.waitForTimeout(5000); // Wait 5s for dynamic content
      
      // Wait for any loading indicators to disappear
      try {
        await page.waitForSelector('[data-loading="false"], body:not(.loading)', { timeout: 10000 });
        logger.info('AutomationService.downloadCSV: Loading indicators disappeared', { id });
      } catch (err) {
        logger.debug('AutomationService.downloadCSV: No loading indicator found, continuing', { id });
      }

      // CHECKPOINT 6: Log detailed page information
      logger.info('AutomationService.downloadCSV: CHECKPOINT 6 - Analyzing page content', { id });
      const pageTitle = await page.title();
      const pageUrl = page.url();
      
      // Log all menu items to understand page structure
      const menuItems = await page.$$eval('nav a, .menu a, [role="menuitem"]', elements => 
        elements.map(el => ({ text: el.textContent?.trim(), href: el.href })).filter(item => item.text)
      );
      
      // Log all visible text content to understand what's on the page
      const headings = await page.$$eval('h1, h2, h3', elements => 
        elements.map(el => el.textContent?.trim()).filter(text => text)
      );
      
      logger.info('AutomationService.downloadCSV: Detailed page analysis', { 
        id, 
        title: pageTitle,
        url: pageUrl,
        menuItems: menuItems.slice(0, 10), // First 10 menu items
        headings: headings.slice(0, 5), // First 5 headings
        totalMenuItems: menuItems.length,
        totalHeadings: headings.length
      });

      // CHECKPOINT 7: Select 30 days range first
      logger.info('AutomationService.downloadCSV: CHECKPOINT 7 - Looking for date range selector', { id });
      await page.waitForTimeout(2000);
      
      // Try to find and select 30 days
      const dateSelectors = [
        'button:has-text("30d")',
        'button:has-text("30")',
        'button:has-text("30 days")', 
        'button:has-text("Last 30")',
        '[data-value="30"]',
        'select option[value="30"]'
      ];
      
      let dateSelected = false;
      for (const selector of dateSelectors) {
        try {
          const dateButton = await page.$(selector);
          if (dateButton) {
            await dateButton.click();
            dateSelected = true;
            logger.info('AutomationService.downloadCSV: Selected 30 days range', { id, selector });
            await page.waitForTimeout(3000); // Wait for data to reload
            break;
          }
        } catch (err) {
          logger.debug('AutomationService.downloadCSV: Date selector not found', { selector });
        }
      }
      
      if (!dateSelected) {
        logger.warn('AutomationService.downloadCSV: Could not find 30 days selector, continuing', { id });
      }

      // CHECKPOINT 8: Scroll to load all content
      logger.info('AutomationService.downloadCSV: CHECKPOINT 8 - Scrolling to load all content', { id });
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(3000);
      
      // Scroll back to top
      await page.evaluate(() => {
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(1000);

      logger.info('AutomationService.downloadCSV: CHECKPOINT 9 - Ready to find export button', { id });

      // Check if still on usage page (session might have expired)
      const finalUrl = page.url();
      
      if (finalUrl.includes('/login') || finalUrl.includes('/signin')) {
        logger.warn('AutomationService.downloadCSV: Session expired during download', { id, email });
        await AccountModel.updateStatus(id, AccountStatus.SESSION_EXPIRED);
        await context.close();
        return { 
          error: 'SESSION_EXPIRED', 
          message: 'Session has expired, please re-login',
          filePath: null 
        };
      }

      logger.info('AutomationService.downloadCSV: On usage page, looking for export button', { id });

      await page.waitForTimeout(2000);

      const downloadPromise = page.waitForEvent('download', { timeout: config.browser.downloadTimeout });

      const exportSelectors = config.selectors.usage.exportButton.split(', ');
      let clicked = false;
      
      for (const selector of exportSelectors) {
        try {
          const button = await page.$(selector);
          if (button) {
            const buttonText = await button.textContent();
            logger.debug('AutomationService.downloadCSV: Found button', { id, selector, text: buttonText?.trim() });
            
            await button.click();
            clicked = true;
            logger.info('AutomationService.downloadCSV: Clicked export button', { id, selector, text: buttonText?.trim() });
            break;
          }
        } catch (err) {
          logger.debug('AutomationService.downloadCSV: Selector not found', { selector, error: err.message });
        }
      }

      if (!clicked) {
        logger.info('AutomationService.downloadCSV: CHECKPOINT 10 - Smart button search with detailed logging', { id });
        
        // Get all interactive elements
        const allElements = await page.$$('button, a, [role="button"], input[type="button"], input[type="submit"]');
        logger.info('AutomationService.downloadCSV: Found interactive elements', { id, count: allElements.length });
        
        // Log all button texts for debugging
        const buttonTexts = [];
        for (const element of allElements) {
          const text = await element.textContent();
          const tagName = await element.evaluate(el => el.tagName);
          const role = await element.getAttribute('role');
          if (text && text.trim()) {
            buttonTexts.push({
              tag: tagName,
              role: role,
              text: text.trim(),
              textLower: text.toLowerCase().trim()
            });
          }
        }
        
        logger.info('AutomationService.downloadCSV: All button texts found', { 
          id, 
          buttons: buttonTexts.slice(0, 10), // Log first 10 for debugging
          totalCount: buttonTexts.length 
        });
        
        // Search for Export CSV button with priority order
        const searchPatterns = [
          { pattern: 'export csv', exact: true, priority: 1 },
          { pattern: 'export', exact: false, priority: 2 },
          { pattern: 'csv', exact: false, priority: 3 },
          { pattern: 'download csv', exact: true, priority: 4 },
          { pattern: 'download', exact: false, priority: 5 }
        ];
        
        let foundButton = null;
        let foundPriority = 999;
        
        for (let i = 0; i < allElements.length; i++) {
          const element = allElements[i];
          const buttonInfo = buttonTexts[i];
          
          if (buttonInfo) {
            for (const search of searchPatterns) {
              let matches = false;
              if (search.exact) {
                matches = buttonInfo.textLower === search.pattern;
              } else {
                matches = buttonInfo.textLower.includes(search.pattern);
              }
              
              if (matches && search.priority < foundPriority) {
                foundButton = element;
                foundPriority = search.priority;
                logger.info('AutomationService.downloadCSV: Found potential export button', { 
                  id, 
                  text: buttonInfo.text, 
                  pattern: search.pattern, 
                  priority: search.priority 
                });
                break;
              }
            }
          }
        }
        
        if (foundButton) {
          try {
            await foundButton.scrollIntoViewIfNeeded();
            await page.waitForTimeout(1000);
            await foundButton.click();
            clicked = true;
            const buttonText = await foundButton.textContent();
            logger.info('AutomationService.downloadCSV: Successfully clicked export button', { 
              id, 
              text: buttonText?.trim(),
              priority: foundPriority 
            });
          } catch (err) {
            logger.error('AutomationService.downloadCSV: Failed to click found button', { 
              id, 
              error: err.message 
            });
          }
        } else {
          logger.warn('AutomationService.downloadCSV: No export button found in any pattern', { id });
        }
      }

      if (!clicked) {
        logger.error('AutomationService.downloadCSV: Could not find export button', { id });
        await context.close();
        return { 
          error: 'EXPORT_BUTTON_NOT_FOUND', 
          message: 'Could not find export/download button on the page',
          filePath: null 
        };
      }

      logger.info('AutomationService.downloadCSV: Waiting for download', { id });
      const download = await downloadPromise;
      
      const sanitizedEmail = email.replace(/[^a-zA-Z0-9@._-]/g, '_');
      const fileName = `${sanitizedEmail}.csv`;
      const filePath = path.join(config.paths.download, fileName);
      
      await download.saveAs(filePath);
      logger.info('AutomationService.downloadCSV: File saved', { id, filePath });

      await AccountModel.updateLastRun(id, null);
      await context.close();

      logger.info('AutomationService.downloadCSV: Download completed successfully', { id, email, filePath });
      
      return { 
        error: null, 
        message: 'CSV downloaded successfully',
        filePath,
        fileName,
        downloadedAt: new Date().toISOString()
      };

    } catch (err) {
      logger.error('AutomationService.downloadCSV: Download failed', { 
        id, 
        email, 
        error: err.message 
      });
      
      await AccountModel.updateLastRun(id, err.message);
      
      if (context) {
        try {
          await context.close();
        } catch (closeErr) {
          logger.warn('AutomationService.downloadCSV: Failed to close context', { error: closeErr.message });
        }
      }
      
      return { 
        error: 'DOWNLOAD_FAILED', 
        message: err.message,
        filePath: null 
      };
    }
  }

  static async runAll() {
    logger.info('AutomationService.runAll: Starting batch download for all logged-in accounts');
    
    const accounts = await AccountModel.readAll();
    const loggedInAccounts = accounts.filter(acc => acc.status === AccountStatus.LOGGED_IN);
    
    logger.info('AutomationService.runAll: Found logged-in accounts', { 
      total: accounts.length, 
      loggedIn: loggedInAccounts.length 
    });

    if (loggedInAccounts.length === 0) {
      logger.warn('AutomationService.runAll: No logged-in accounts to process');
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
      logger.info('AutomationService.runAll: Processing account', { 
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
        logger.warn('AutomationService.runAll: Account download failed', { 
          id: account.id, 
          email: account.email, 
          error: result.error 
        });
      } else {
        successful++;
        logger.info('AutomationService.runAll: Account download succeeded', { 
          id: account.id, 
          email: account.email 
        });
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const skipped = accounts.length - loggedInAccounts.length;

    logger.info('AutomationService.runAll: Batch download completed', { 
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

export default AutomationService;
