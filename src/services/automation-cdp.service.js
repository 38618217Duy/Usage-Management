import path from 'path';
import fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { createInterface } from 'readline';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { AccountModel, AccountStatus } from '../models/account.js';
import { CDPService } from './cdp.service.js';

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

  const tempFilePath = filePath + '.tmp';
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

      // CHECKPOINT 7: Select monthly date range (ngày 1 tháng trước đến ngày 1 tháng hiện tại)
      logger.info('AutomationCDPService.downloadCSV: CHECKPOINT 7 - Selecting monthly date range', { id });
      
      const dateRange = calculateMonthlyDateRange();
      logger.info('AutomationCDPService.downloadCSV: Calculated date range', { 
        id, 
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        startMonth: dateRange.startMonth,
        endMonth: dateRange.endMonth
      });
      
      try {
        await this.selectCustomDateRange(page, dateRange, id);
      } catch (err) {
        logger.warn('AutomationCDPService.downloadCSV: Failed to select custom date range, continuing with default', { 
          id, 
          error: err.message 
        });
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

      // CHECKPOINT 10: Filter CSV to only include data within the monthly date range
      logger.info('AutomationCDPService.downloadCSV: CHECKPOINT 10 - Filtering CSV by date range', { id });
      const filterResult = await filterCsvByDateRange(filePath, dateRange.startDate, dateRange.endDate, id);

      await AccountModel.updateLastRun(id, null);

      logger.info('AutomationCDPService.downloadCSV: Download completed successfully', { 
        id, 
        email, 
        filePath,
        originalRecords: filterResult.originalCount,
        filteredRecords: filterResult.filteredCount
      });
      
      return { 
        error: null, 
        message: 'CSV downloaded and filtered successfully via CDP',
        filePath,
        fileName,
        downloadedAt: new Date().toISOString(),
        originalRecords: filterResult.originalCount,
        filteredRecords: filterResult.filteredCount
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

  /**
   * Chọn custom date range qua calendar picker
   * @param {Page} page - Playwright page object
   * @param {Object} dateRange - { startDate, endDate, startMonth, endMonth, startYear, endYear }
   * @param {string} id - Account ID for logging
   */
  static async selectCustomDateRange(page, dateRange, id) {
    logger.info('AutomationCDPService.selectCustomDateRange: Starting', { 
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
            logger.info('AutomationCDPService.selectCustomDateRange: Opened calendar', { id, buttonText: buttonText.trim() });
            await page.waitForTimeout(1000);
            break;
          }
        }
      } catch (err) {
        // Continue to next selector
      }
    }

    if (!calendarOpened) {
      logger.warn('AutomationCDPService.selectCustomDateRange: Could not find date range button', { id });
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
          logger.info('AutomationCDPService.selectCustomDateRange: Clicked Apply', { id });
          await page.waitForTimeout(2000); // Wait for data to reload
          return;
        }
      } catch (err) {
        // Continue to next selector
      }
    }

    logger.warn('AutomationCDPService.selectCustomDateRange: Could not find Apply button', { id });
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
    
    logger.info('AutomationCDPService.navigateToMonthAndSelectDay: Navigating', { 
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
          logger.info('AutomationCDPService.navigateToMonthAndSelectDay: Found correct month', { 
            id, 
            type,
            headerText 
          });
          break;
        }
        
        // Cần navigate - kiểm tra xem cần đi tới hay lui
        // Đơn giản: click nút previous (<) để đi về tháng trước
        const prevButton = await page.$('button:has-text("<")') || 
                          await page.$('[aria-label*="previous"]') ||
                          await page.$('button[aria-label*="Previous"]');
        
        if (prevButton) {
          await prevButton.click();
          await page.waitForTimeout(300);
        } else {
          logger.warn('AutomationCDPService.navigateToMonthAndSelectDay: Could not find navigation button', { id });
          break;
        }
      } else {
        break;
      }
    }

    // Chọn ngày (day = 1)
    // Tìm cell chứa số 1 trong calendar
    const daySelectors = [
      `td:has-text("${targetDay}")`,
      `button:has-text("${targetDay}")`,
      `[data-day="${targetDay}"]`,
      `div:has-text("${targetDay}")`,
    ];

    // Cần chọn chính xác ngày 1, không phải 10, 11, 12, etc.
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
            logger.info('AutomationCDPService.navigateToMonthAndSelectDay: Selected day', { 
              id, 
              type,
              day: targetDay 
            });
            return;
          }
        }
      }
      
      logger.warn('AutomationCDPService.navigateToMonthAndSelectDay: Could not find day element', { 
        id, 
        type,
        targetDay 
      });
    } catch (err) {
      logger.error('AutomationCDPService.navigateToMonthAndSelectDay: Error selecting day', { 
        id, 
        type,
        error: err.message 
      });
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
