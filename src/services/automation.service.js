import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { AccountModel, AccountStatus } from '../models/account.js';
import { BrowserService } from './browser.service.js';

/**
 * Filter CSV file to only include records within the specified date range
 * @param {string} filePath - Path to the CSV file
 * @param {Date} startDate - Start date (inclusive)
 * @param {Date} endDate - End date (exclusive)
 * @param {string} id - Account ID for logging
 * @returns {Promise<{ originalCount: number, filteredCount: number }>}
 */
async function filterCsvByDateRange(filePath, startDate, endDate, id) {
  logger.info('filterCsvByDateRange: Starting filter', { 
    id, 
    filePath,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  });

  const lines = [];
  let headerLine = null;
  let originalCount = 0;
  let filteredCount = 0;

  // Read and filter the file
  const fileStream = createReadStream(filePath);
  const rl = createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (!headerLine) {
      headerLine = line;
      lines.push(line);
      continue;
    }

    originalCount++;
    
    // Parse the date from the first column (format: "2026-01-26T01:34:27.572Z")
    const match = line.match(/^"([^"]+)"/);
    if (match) {
      const dateStr = match[1];
      const recordDate = new Date(dateStr);
      
      // Check if date is within range [startDate, endDate)
      if (recordDate >= startDate && recordDate < endDate) {
        lines.push(line);
        filteredCount++;
      }
    }
  }

  // Write filtered data back to the file
  await fs.writeFile(filePath, lines.join('\n') + '\n');

  logger.info('filterCsvByDateRange: Filter complete', { 
    id, 
    originalCount, 
    filteredCount,
    removedCount: originalCount - filteredCount
  });

  return { originalCount, filteredCount };
}

/**
 * Tính toán date range theo tháng: từ ngày 1 tháng trước đến ngày 1 tháng hiện tại
 * Ví dụ: Hôm nay 4/2/2026 → startDate: 2026-01-01, endDate: 2026-02-01
 * @returns {{ startDate: Date, endDate: Date, startMonth: string, endMonth: string }}
 */
function calculateMonthlyDateRange() {
  const now = new Date();
  
  // End date: ngày 1 của tháng hiện tại
  const endDate = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Start date: ngày 1 của tháng trước
  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  
  // Format month names for logging
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  
  return {
    startDate,
    endDate,
    startMonth: monthNames[startDate.getMonth()],
    endMonth: monthNames[endDate.getMonth()],
    startYear: startDate.getFullYear(),
    endYear: endDate.getFullYear(),
  };
}

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

    // Cleanup dead browsers first
    BrowserService.cleanupDeadBrowsers();
    
    if (await BrowserService.isBrowserOpen(id)) {
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

      // CHECKPOINT 7: Select monthly date range (ngày 1 tháng trước đến ngày 1 tháng hiện tại)
      logger.info('AutomationService.downloadCSV: CHECKPOINT 7 - Selecting monthly date range', { id });
      await page.waitForTimeout(2000);
      
      const dateRange = calculateMonthlyDateRange();
      logger.info('AutomationService.downloadCSV: Calculated date range', { 
        id, 
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        startMonth: dateRange.startMonth,
        endMonth: dateRange.endMonth
      });
      
      try {
        await this.selectCustomDateRange(page, dateRange, id);
      } catch (err) {
        logger.warn('AutomationService.downloadCSV: Failed to select custom date range, continuing with default', { 
          id, 
          error: err.message 
        });
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

      // Filter CSV to only include data within the monthly date range
      logger.info('AutomationService.downloadCSV: Filtering CSV by date range', { id });
      const filterResult = await filterCsvByDateRange(filePath, dateRange.startDate, dateRange.endDate, id);

      await AccountModel.updateLastRun(id, null);
      await context.close();

      logger.info('AutomationService.downloadCSV: Download completed successfully', { 
        id, 
        email, 
        filePath,
        originalRecords: filterResult.originalCount,
        filteredRecords: filterResult.filteredCount
      });
      
      return { 
        error: null, 
        message: 'CSV downloaded and filtered successfully',
        filePath,
        fileName,
        downloadedAt: new Date().toISOString(),
        originalRecords: filterResult.originalCount,
        filteredRecords: filterResult.filteredCount
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

  /**
   * Chọn custom date range qua calendar picker
   * @param {Page} page - Playwright page object
   * @param {Object} dateRange - { startDate, endDate, startMonth, endMonth, startYear, endYear }
   * @param {string} id - Account ID for logging
   */
  static async selectCustomDateRange(page, dateRange, id) {
    logger.info('AutomationService.selectCustomDateRange: Starting', { 
      id, 
      startDate: dateRange.startDate.toISOString().split('T')[0],
      endDate: dateRange.endDate.toISOString().split('T')[0]
    });

    // Step 1: Click vào date range button để mở calendar
    const dateRangeButtonSelectors = [
      'button:has-text("Jan")', 
      'button:has-text("Feb")',
      'button:has-text("Mar")',
      'button:has-text("Apr")',
      'button:has-text("May")',
      'button:has-text("Jun")',
      'button:has-text("Jul")',
      'button:has-text("Aug")',
      'button:has-text("Sep")',
      'button:has-text("Oct")',
      'button:has-text("Nov")',
      'button:has-text("Dec")',
      '[data-testid="date-range-button"]',
      'button:has-text(" - ")',
    ];

    let calendarOpened = false;
    for (const selector of dateRangeButtonSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          const buttonText = await button.textContent();
          // Kiểm tra xem button có chứa date range pattern không (e.g., "Jan 01 - Feb 04")
          if (buttonText && buttonText.includes(' - ')) {
            await button.click();
            calendarOpened = true;
            logger.info('AutomationService.selectCustomDateRange: Opened calendar', { id, buttonText: buttonText.trim() });
            await page.waitForTimeout(1000);
            break;
          }
        }
      } catch (err) {
        // Continue to next selector
      }
    }

    if (!calendarOpened) {
      logger.warn('AutomationService.selectCustomDateRange: Could not find date range button', { id });
      return;
    }

    // Step 2: Navigate đến tháng của startDate và chọn ngày 1
    await this.navigateToMonthAndSelectDay(page, dateRange.startDate, id, 'start');
    await page.waitForTimeout(500);

    // Step 3: Navigate đến tháng của endDate và chọn ngày 1
    await this.navigateToMonthAndSelectDay(page, dateRange.endDate, id, 'end');
    await page.waitForTimeout(500);

    // Step 4: Click Apply button
    const applySelectors = [
      'button:has-text("Apply")',
      'button:has-text("apply")',
      '[data-testid="apply-date-range"]',
      'button.apply',
    ];

    for (const selector of applySelectors) {
      try {
        const applyButton = await page.$(selector);
        if (applyButton) {
          await applyButton.click();
          logger.info('AutomationService.selectCustomDateRange: Clicked Apply', { id });
          await page.waitForTimeout(2000); // Wait for data to reload
          return;
        }
      } catch (err) {
        // Continue to next selector
      }
    }

    logger.warn('AutomationService.selectCustomDateRange: Could not find Apply button', { id });
  }

  /**
   * Navigate đến tháng cụ thể và chọn ngày
   * @param {Page} page - Playwright page object
   * @param {Date} targetDate - Ngày cần chọn
   * @param {string} id - Account ID for logging
   * @param {string} type - 'start' hoặc 'end' để log
   */
  static async navigateToMonthAndSelectDay(page, targetDate, id, type) {
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();
    const targetDay = targetDate.getDate();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    
    logger.info('AutomationService.navigateToMonthAndSelectDay: Navigating', { 
      id, 
      type,
      targetMonth: monthNames[targetMonth],
      targetYear,
      targetDay
    });

    // Tìm header hiển thị tháng hiện tại của calendar
    const maxAttempts = 12; // Tối đa 12 lần navigate (1 năm)
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Kiểm tra xem đã đúng tháng chưa
      const calendarHeader = await page.$eval(
        'text=/January|February|March|April|May|June|July|August|September|October|November|December/',
        el => el.textContent
      ).catch(() => null);
      
      if (calendarHeader) {
        const headerText = calendarHeader.trim();
        const currentMonthName = monthNames[targetMonth];
        
        // Kiểm tra xem header có chứa đúng tháng và năm không
        if (headerText.includes(currentMonthName) && headerText.includes(String(targetYear))) {
          logger.info('AutomationService.navigateToMonthAndSelectDay: Found correct month', { 
            id, 
            type,
            headerText 
          });
          break;
        }
        
        // Cần navigate - click nút previous (<) để đi về tháng trước
        const prevButton = await page.$('button:has-text("<")') || 
                          await page.$('[aria-label*="previous"]') ||
                          await page.$('button[aria-label*="Previous"]');
        
        if (prevButton) {
          await prevButton.click();
          await page.waitForTimeout(300);
        } else {
          logger.warn('AutomationService.navigateToMonthAndSelectDay: Could not find navigation button', { id });
          break;
        }
      } else {
        break;
      }
    }

    // Chọn ngày (day = 1)
    try {
      // Tìm tất cả elements có text là số ngày
      const dayElements = await page.$$('td, button, div[role="gridcell"]');
      
      for (const el of dayElements) {
        const text = await el.textContent().catch(() => '');
        // Chỉ match chính xác số 1 (không phải 10, 11, 12...)
        if (text && text.trim() === String(targetDay)) {
          const isVisible = await el.isVisible().catch(() => false);
          if (isVisible) {
            await el.click();
            logger.info('AutomationService.navigateToMonthAndSelectDay: Selected day', { 
              id, 
              type,
              day: targetDay 
            });
            return;
          }
        }
      }
      
      logger.warn('AutomationService.navigateToMonthAndSelectDay: Could not find day element', { 
        id, 
        type,
        targetDay 
      });
    } catch (err) {
      logger.error('AutomationService.navigateToMonthAndSelectDay: Error selecting day', { 
        id, 
        type,
        error: err.message 
      });
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
