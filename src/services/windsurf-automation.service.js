import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs/promises';
import config from '../config/index.js';
import logger from '../utils/logger.js';
import { WindsurfAccountModel, WindsurfAccountStatus } from '../models/windsurf-account.js';
import { WindsurfBrowserService } from './windsurf-browser.service.js';

export class WindsurfAutomationService {
  static async scrapeUsage(account) {
    const { id, email, profilePath, status } = account;
    
    logger.info('WindsurfAutomationService.scrapeUsage: Starting usage scrape', { id, email });

    if (status !== WindsurfAccountStatus.LOGGED_IN) {
      logger.warn('WindsurfAutomationService.scrapeUsage: Account not logged in', { id, email, status });
      return { 
        error: 'NOT_LOGGED_IN', 
        message: 'Account is not logged in',
        data: null 
      };
    }

    WindsurfBrowserService.cleanupDeadBrowsers();
    
    if (await WindsurfBrowserService.isBrowserOpen(id)) {
      logger.warn('WindsurfAutomationService.scrapeUsage: Browser is currently open', { id });
      return { 
        error: 'BROWSER_IN_USE', 
        message: 'Browser is currently open for this account',
        data: null 
      };
    }

    const fullProfilePath = path.join(config.paths.root, profilePath);
    let context = null;

    try {
      await fs.mkdir(config.paths.windsurfDownload, { recursive: true });

      context = await chromium.launchPersistentContext(fullProfilePath, {
        headless: true,
        timeout: config.browser.timeout,
      });

      const page = context.pages()[0] || await context.newPage();
      
      logger.info('WindsurfAutomationService.scrapeUsage: CHECKPOINT 1 - Navigating to profile page', { id });
      await page.goto(config.windsurf.profileUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: config.browser.navigationTimeout 
      });

      logger.info('WindsurfAutomationService.scrapeUsage: CHECKPOINT 2 - Verifying login status', { id });
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      logger.info('WindsurfAutomationService.scrapeUsage: Current URL', { id, url: currentUrl });
      
      if (currentUrl.includes('/login') || currentUrl.includes('/signin') || currentUrl.includes('/auth')) {
        logger.error('WindsurfAutomationService.scrapeUsage: Not logged in, redirected to login page', { id, url: currentUrl });
        await WindsurfAccountModel.updateStatus(id, WindsurfAccountStatus.SESSION_EXPIRED);
        await context.close();
        return { 
          error: 'SESSION_EXPIRED', 
          message: 'Session expired, please login through browser first',
          data: null 
        };
      }

      logger.info('WindsurfAutomationService.scrapeUsage: CHECKPOINT 3 - Navigating to Usage page', { id });
      
      // Navigate to the actual Usage page at /subscription/usage
      await page.goto(config.windsurf.usageUrl, { 
        waitUntil: 'networkidle',
        timeout: config.browser.navigationTimeout 
      });
      
      // Wait for the Usage content to fully render (look for "User Prompt credits" text)
      try {
        await page.waitForSelector('text=User Prompt credits', { timeout: 10000 });
        logger.info('WindsurfAutomationService.scrapeUsage: Usage content loaded', { id });
      } catch (e) {
        logger.warn('WindsurfAutomationService.scrapeUsage: Could not find User Prompt credits text, waiting longer', { id });
        await page.waitForTimeout(5000);
      }
      
      const usagePageTitle = await page.title();
      const usagePageUrl = page.url();
      logger.info('WindsurfAutomationService.scrapeUsage: Usage page loaded', { id, title: usagePageTitle, url: usagePageUrl });

      logger.info('WindsurfAutomationService.scrapeUsage: CHECKPOINT 4 - Extracting usage data from specific elements', { id });
      
      const usageData = await this.extractUsageDataFromElements(page, id);
      
      if (!usageData) {
        logger.error('WindsurfAutomationService.scrapeUsage: Could not extract usage data', { id });
        await context.close();
        return { 
          error: 'SCRAPE_FAILED', 
          message: 'Could not extract usage data from the page',
          data: null 
        };
      }

      logger.info('WindsurfAutomationService.scrapeUsage: CHECKPOINT 5 - Generating CSV', { id });
      
      const csvResult = await this.generateCsv(email, usageData);
      
      await WindsurfAccountModel.updateUsageData(id, usageData);
      await context.close();

      logger.info('WindsurfAutomationService.scrapeUsage: Scrape completed successfully', { 
        id, 
        email, 
        usageData,
        filePath: csvResult.filePath
      });
      
      return { 
        error: null, 
        message: 'Usage data scraped successfully',
        data: {
          ...usageData,
          email,
          filePath: csvResult.filePath,
          fileName: csvResult.fileName,
          scrapedAt: new Date().toISOString()
        }
      };

    } catch (err) {
      logger.error('WindsurfAutomationService.scrapeUsage: Scrape failed', { 
        id, 
        email, 
        error: err.message 
      });
      
      await WindsurfAccountModel.updateLastRun(id, err.message);
      
      if (context) {
        try {
          await context.close();
        } catch (closeErr) {
          logger.warn('WindsurfAutomationService.scrapeUsage: Failed to close context', { error: closeErr.message });
        }
      }
      
      return { 
        error: 'SCRAPE_FAILED', 
        message: err.message,
        data: null 
      };
    }
  }

  /**
   * NEW: Extract usage data from specific UI elements on Usage page
   * Based on actual UI structure:
   * - "392.00 / 500 used" 
   * - "108.00 left"
   * - "Next billing cycle is in 12 days on Feb 23, 2026"
   */
  static async extractUsageDataFromElements(page, id) {
    logger.info('WindsurfAutomationService.extractUsageDataFromElements: Starting element-based extraction', { id });
    
    try {
      let creditsRemaining = null;
      let creditsUsed = null;
      let creditsTotal = null;
      let resetDate = null;

      // Wait for page to fully load
      await page.waitForTimeout(2000);

      // Strategy 0: Find "Total credits used" followed by number (Windsurf Profile page format)
      // Example: "Total credits used316" or "Total credits used367,50"
      const totalCreditsPattern = await page.evaluate(() => {
        const bodyText = document.body.innerText;
        
        // Look for "Total credits used" followed by a number (may have comma as decimal separator)
        const match = bodyText.match(/Total credits used\s*(\d+(?:[,.]\d+)?)/i);
        if (match) {
          const matchIndex = bodyText.indexOf(match[0]);
          const contextStart = Math.max(0, matchIndex - 30);
          const contextEnd = Math.min(bodyText.length, matchIndex + match[0].length + 50);
          const context = bodyText.substring(contextStart, contextEnd);
          
          // Handle comma as decimal separator (European format)
          const value = parseFloat(match[1].replace(',', '.'));
          
          return {
            value: value,
            fullMatch: match[0],
            context: context
          };
        }
        return null;
      });

      if (totalCreditsPattern) {
        creditsUsed = totalCreditsPattern.value;
        logger.info('WindsurfAutomationService.extractUsageDataFromElements: Found Total credits used', { 
          id, 
          creditsUsed,
          fullMatch: totalCreditsPattern.fullMatch,
          context: totalCreditsPattern.context
        });
      }

      // Strategy 1: Find "User Prompt credits" section and extract "X / Y used" pattern
      const usedPattern = await page.evaluate(() => {
        const bodyText = document.body.innerText;
        
        // Look for "X.XX / Y used" or "X,XX / Y used" pattern (supports both . and , as decimal separator)
        // e.g., "392.00 / 500 used" or "311,00 / 500 used"
        const usedMatch = bodyText.match(/(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)\s*used/i);
        if (usedMatch) {
          // Get context around the match (50 chars before and after)
          const matchIndex = bodyText.indexOf(usedMatch[0]);
          const contextStart = Math.max(0, matchIndex - 50);
          const contextEnd = Math.min(bodyText.length, matchIndex + usedMatch[0].length + 50);
          const context = bodyText.substring(contextStart, contextEnd);
          
          // Replace comma with dot for parseFloat
          return {
            used: parseFloat(usedMatch[1].replace(',', '.')),
            total: parseFloat(usedMatch[2].replace(',', '.')),
            fullMatch: usedMatch[0],
            context: context
          };
        }
        return null;
      })

      if (usedPattern && !creditsUsed) {
        creditsUsed = usedPattern.used;
        creditsTotal = usedPattern.total;
        logger.info('WindsurfAutomationService.extractUsageDataFromElements: Found used/total pattern', { 
          id, 
          creditsUsed, 
          creditsTotal,
          fullMatch: usedPattern.fullMatch,
          context: usedPattern.context
        });
      }

      // Strategy 2: Find "X.XX left" or "X,XX left" pattern
      const leftPattern = await page.evaluate(() => {
        const bodyText = document.body.innerText;
        
        // Look for "X.XX left" or "X,XX left" pattern (supports both . and , as decimal separator)
        // e.g., "108.00 left" or "189,00 left"
        const leftMatch = bodyText.match(/(\d+(?:[.,]\d+)?)\s*left/i);
        if (leftMatch) {
          // Get context around the match
          const matchIndex = bodyText.indexOf(leftMatch[0]);
          const contextStart = Math.max(0, matchIndex - 50);
          const contextEnd = Math.min(bodyText.length, matchIndex + leftMatch[0].length + 50);
          const context = bodyText.substring(contextStart, contextEnd);
          
          // Replace comma with dot for parseFloat
          return {
            value: parseFloat(leftMatch[1].replace(',', '.')),
            fullMatch: leftMatch[0],
            context: context
          };
        }
        return null;
      });

      if (leftPattern !== null) {
        creditsRemaining = leftPattern.value;
        logger.info('WindsurfAutomationService.extractUsageDataFromElements: Found remaining pattern', { 
          id, 
          creditsRemaining,
          fullMatch: leftPattern.fullMatch,
          context: leftPattern.context
        });
      }

      // Strategy 3: Find reset date from "on Feb 23, 2026" pattern
      const datePattern = await page.evaluate(() => {
        const bodyText = document.body.innerText;
        
        // Look for "on Month DD, YYYY" pattern
        const dateMatch = bodyText.match(/(?:on|On)\s+(\w+\s+\d+,?\s*\d{4})/);
        if (dateMatch) {
          return dateMatch[1].trim();
        }
        
        // Fallback: Look for any "Month DD, YYYY" pattern
        const fallbackMatch = bodyText.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+,?\s*\d{4}/i);
        if (fallbackMatch) {
          return fallbackMatch[0].trim();
        }
        
        return null;
      });

      if (datePattern) {
        resetDate = datePattern;
        logger.info('WindsurfAutomationService.extractUsageDataFromElements: Found reset date', { 
          id, resetDate 
        });
      }

      // Set default creditsTotal for Windsurf Pro if not found
      // Windsurf Pro plan has 500 credits/month
      if (creditsTotal === null && creditsUsed !== null) {
        creditsTotal = 500; // Default for Pro plan
        logger.info('WindsurfAutomationService.extractUsageDataFromElements: Using default creditsTotal for Pro plan', { 
          id, creditsTotal 
        });
      }

      // Calculate remaining if we have used and total but not remaining
      if (creditsRemaining === null && creditsUsed !== null && creditsTotal !== null) {
        creditsRemaining = Math.round((creditsTotal - creditsUsed) * 100) / 100;
        logger.info('WindsurfAutomationService.extractUsageDataFromElements: Calculated remaining', { 
          id, creditsRemaining 
        });
      }

      // Validate results
      if (creditsUsed === null && creditsRemaining === null && creditsTotal === null) {
        logger.warn('WindsurfAutomationService.extractUsageDataFromElements: No usage data found, falling back to old method', { id });
        return await this.extractUsageData(page, id);
      }

      const result = {
        creditsRemaining,
        creditsUsed,
        creditsTotal,
        resetDate,
      };

      logger.info('WindsurfAutomationService.extractUsageDataFromElements: Extraction complete', { id, result });
      
      return result;
      
    } catch (err) {
      logger.error('WindsurfAutomationService.extractUsageDataFromElements: Error during extraction', { id, error: err.message });
      // Fallback to old method
      return await this.extractUsageData(page, id);
    }
  }

  static async extractUsageData(page, id) {
    logger.info('WindsurfAutomationService.extractUsageData: Starting extraction (fallback method)', { id });
    
    try {
      // Get both text content and HTML for better analysis
      const bodyText = await page.textContent('body');
      const bodyHTML = await page.innerHTML('body');
      
      // Log full content for analysis
      logger.info('WindsurfAutomationService.extractUsageData: Full page content', { 
        id, 
        textLength: bodyText.length,
        fullContent: bodyText
      });
      
      let creditsRemaining = null;
      let creditsUsed = null;
      let creditsTotal = null;
      let resetDate = null;

      // Credit limit is max 500/month, so any number > 1000 is likely encoded/invalid
      const MAX_REASONABLE_CREDITS = 1000;

      // Enhanced patterns for credits remaining - support decimal numbers
      const remainingPatterns = [
        /(\d+(?:\.\d+)?(?:,\d+)*)\s*(?:credits?)?\s*(?:left|remaining|available)/i,
        /remaining[:\s]*(\d+(?:\.\d+)?(?:,\d+)*)/i,
        /available[:\s]*(\d+(?:\.\d+)?(?:,\d+)*)/i,
        /(\d+(?:\.\d+)?(?:,\d+)*)\s*left/i,
        /balance[:\s]*(\d+(?:\.\d+)?(?:,\d+)*)/i,
        /(\d+(?:\.\d+)?(?:,\d+)*)\s*credits?\s*(?:left|remaining)/i,
      ];
      
      for (const pattern of remainingPatterns) {
        const match = bodyText.match(pattern);
        if (match) {
          const value = parseFloat(match[1].replace(/,/g, ''));
          if (value <= MAX_REASONABLE_CREDITS) {
            creditsRemaining = value;
            logger.info('WindsurfAutomationService.extractUsageData: Found credits remaining', { id, creditsRemaining, pattern: pattern.toString() });
            break;
          } else {
            logger.debug('WindsurfAutomationService.extractUsageData: Skipped large remaining value', { id, value, pattern: pattern.toString() });
          }
        }
      }

      // Enhanced patterns for credits used - support decimal and "X.XX / Y used" format
      const usedPatterns = [
        /(\d+(?:\.\d+)?(?:,\d+)*)\s*\/\s*\d+(?:\.\d+)?(?:,\d+)*\s*used/i,
        /(\d+(?:\.\d+)?(?:,\d+)*)\s*(?:credits?)?\s*(?:used|consumed|spent)/i,
        /used[:\s]*(\d+(?:\.\d+)?(?:,\d+)*)/i,
        /consumed[:\s]*(\d+(?:\.\d+)?(?:,\d+)*)/i,
        /spent[:\s]*(\d+(?:\.\d+)?(?:,\d+)*)/i,
        /usage[:\s]*(\d+(?:\.\d+)?(?:,\d+)*)/i,
      ];
      
      for (const pattern of usedPatterns) {
        const match = bodyText.match(pattern);
        if (match) {
          const value = parseFloat(match[1].replace(/,/g, ''));
          if (value <= MAX_REASONABLE_CREDITS) {
            creditsUsed = value;
            logger.info('WindsurfAutomationService.extractUsageData: Found credits used', { id, creditsUsed, pattern: pattern.toString() });
            break;
          } else {
            logger.debug('WindsurfAutomationService.extractUsageData: Skipped large used value', { id, value, pattern: pattern.toString() });
          }
        }
      }

      // Enhanced patterns for total credits - support decimal and "X / Y used" format
      const totalPatterns = [
        /\d+(?:\.\d+)?(?:,\d+)*\s*\/\s*(\d+(?:\.\d+)?(?:,\d+)*)\s*used/i,
        /(?:total|limit|allowance)[:\s]*(\d+(?:\.\d+)?(?:,\d+)*)/i,
        /(\d+(?:\.\d+)?(?:,\d+)*)\s*(?:total\s*)?credits?\s*(?:limit|allowance|total)/i,
        /monthly[:\s]*(\d+(?:\.\d+)?(?:,\d+)*)/i,
        /plan[:\s]*(\d+(?:\.\d+)?(?:,\d+)*)/i,
      ];
      
      for (const pattern of totalPatterns) {
        const match = bodyText.match(pattern);
        if (match) {
          const value = parseFloat(match[1].replace(/,/g, ''));
          if (value <= MAX_REASONABLE_CREDITS && value > (creditsUsed || 0)) {
            creditsTotal = value;
            logger.info('WindsurfAutomationService.extractUsageData: Found credits total', { id, creditsTotal, pattern: pattern.toString() });
            break;
          } else {
            logger.debug('WindsurfAutomationService.extractUsageData: Skipped large total value', { id, value, pattern: pattern.toString() });
          }
        }
      }

      // Enhanced patterns for reset date - specifically for "Feb 23, 2026" format
      const resetPatterns = [
        /(?:next|billing|reset)\s*(?:cycle|period|date)?\s*(?:is)?\s*(?:in\s*\d+\s*days\s*)?(?:on\s*)?(\w+\s+\d+,?\s*\d{4})/i,
        /(?:resets?|renews?)\s*(?:on)?\s*(\w+\s+\d+,?\s*\d{4})/i,
        /(\w+\s+\d+,\s*\d{4})/,
        /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
        /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
        /(?:expires?|ends?)[:\s]*(\w+\s+\d+(?:,?\s*\d{4})?)/i,
      ];
      
      for (const pattern of resetPatterns) {
        const match = bodyText.match(pattern);
        if (match) {
          resetDate = match[1].trim();
          logger.info('WindsurfAutomationService.extractUsageData: Found reset date', { id, resetDate, pattern: pattern.toString() });
          break;
        }
      }

      // Try to extract from specific UI elements
      try {
        const elements = await page.$$eval('[class*="usage"], [class*="credit"], [class*="billing"], [data-testid*="usage"], [data-testid*="credit"]', 
          elements => elements.map(el => ({ 
            text: el.textContent?.trim(), 
            className: el.className,
            id: el.id 
          }))
        );
        
        if (elements.length > 0) {
          logger.debug('WindsurfAutomationService.extractUsageData: Found usage elements', { id, elements });
          
          for (const element of elements) {
            if (element.text) {
              // Try to extract numbers from specific elements
              const numbers = element.text.match(/\d+(?:,\d+)*/g);
              if (numbers) {
                logger.debug('WindsurfAutomationService.extractUsageData: Numbers in element', { 
                  id, 
                  elementText: element.text,
                  numbers 
                });
              }
            }
          }
        }
      } catch (elemErr) {
        logger.debug('WindsurfAutomationService.extractUsageData: Could not extract from specific elements', { id, error: elemErr.message });
      }

      // Log all numbers found for debugging with better filtering - support decimals
      const allNumbers = bodyText.match(/\d+(?:\.\d+)?(?:,\d+)*/g) || [];
      const reasonableNumbers = allNumbers
        .map(n => parseFloat(n.replace(/,/g, '')))
        .filter(n => n > 0 && n <= MAX_REASONABLE_CREDITS) // Only reasonable credit values
        .sort((a, b) => b - a); // Sort descending
      
      const allNumbersForDebug = allNumbers
        .map(n => parseFloat(n.replace(/,/g, '')))
        .filter(n => n > 0)
        .sort((a, b) => b - a);
      
      logger.info('WindsurfAutomationService.extractUsageData: All numbers analysis', { 
        id, 
        reasonableNumbers: reasonableNumbers,
        allNumbers: allNumbersForDebug.slice(0, 20),
        maxReasonable: MAX_REASONABLE_CREDITS
      });

      // If we still don't have data, try alternative extraction
      if (creditsRemaining === null && creditsUsed === null && creditsTotal === null) {
        logger.warn('WindsurfAutomationService.extractUsageData: No usage data found with patterns, trying alternative extraction', { id });
        
        // Look for number patterns in context with reasonable limits - support decimals
        const contextPatterns = [
          /(\d+(?:\.\d+)?(?:,\d+)*)\s*(?:of|\/)\s*(\d+(?:\.\d+)?(?:,\d+)*)/g,
          /(\d+(?:\.\d+)?(?:,\d+)*)\s*(?:credits?|tokens?|requests?)/gi,
        ];
        
        for (const pattern of contextPatterns) {
          let match;
          while ((match = pattern.exec(bodyText)) !== null) {
            const num1 = parseFloat(match[1].replace(/,/g, ''));
            const num2 = match[2] ? parseFloat(match[2].replace(/,/g, '')) : null;
            
            if (num1 <= MAX_REASONABLE_CREDITS) {
              logger.debug('WindsurfAutomationService.extractUsageData: Found number pattern', { 
                id, 
                num1, 
                num2, 
                context: match[0] 
              });
              
              if (num2 && num2 <= MAX_REASONABLE_CREDITS && num2 > num1) {
                creditsUsed = num1;
                creditsTotal = num2;
                creditsRemaining = num2 - num1;
                logger.info('WindsurfAutomationService.extractUsageData: Extracted from pattern', { 
                  id, creditsUsed, creditsRemaining, creditsTotal 
                });
                break;
              }
            }
          }
          if (creditsUsed !== null) break;
        }
        
        // Do NOT make educated guesses - numbers from CSS/JS can be misleading
        if (creditsRemaining === null && creditsUsed === null && creditsTotal === null) {
          logger.warn('WindsurfAutomationService.extractUsageData: Could not extract usage data from page', { id });
        }
      }

      // Calculate missing values if possible
      if (creditsTotal === null && creditsRemaining !== null && creditsUsed !== null) {
        creditsTotal = creditsRemaining + creditsUsed;
        logger.info('WindsurfAutomationService.extractUsageData: Calculated total', { id, creditsTotal });
      }
      
      if (creditsRemaining === null && creditsTotal !== null && creditsUsed !== null) {
        creditsRemaining = creditsTotal - creditsUsed;
        logger.info('WindsurfAutomationService.extractUsageData: Calculated remaining', { id, creditsRemaining });
      }

      const result = {
        creditsRemaining,
        creditsUsed,
        creditsTotal,
        resetDate,
      };

      logger.info('WindsurfAutomationService.extractUsageData: Final extraction result', { id, result });
      
      return result;
      
    } catch (err) {
      logger.error('WindsurfAutomationService.extractUsageData: Error during extraction', { id, error: err.message });
      return null;
    }
  }

  static async generateCsv(email, usageData) {
    const sanitizedEmail = email.replace(/[^a-zA-Z0-9@._-]/g, '_');
    const fileName = `${sanitizedEmail}.csv`;
    const filePath = path.join(config.paths.windsurfDownload, fileName);
    
    const header = 'email,credits_remaining,credits_used,credits_total,reset_date,scraped_at';
    const row = [
      email,
      usageData.creditsRemaining ?? '',
      usageData.creditsUsed ?? '',
      usageData.creditsTotal ?? '',
      usageData.resetDate ?? '',
      new Date().toISOString()
    ].join(',');
    
    const csvContent = `${header}\n${row}\n`;
    
    await fs.writeFile(filePath, csvContent, 'utf-8');
    
    logger.info('WindsurfAutomationService.generateCsv: CSV file created', { filePath, fileName });
    
    return { filePath, fileName };
  }

  static async scrapeAll() {
    logger.info('WindsurfAutomationService.scrapeAll: Starting batch scrape for all logged-in accounts');
    
    const accounts = await WindsurfAccountModel.readAll();
    const loggedInAccounts = accounts.filter(acc => acc.status === WindsurfAccountStatus.LOGGED_IN);
    
    logger.info('WindsurfAutomationService.scrapeAll: Found logged-in accounts', { 
      total: accounts.length, 
      loggedIn: loggedInAccounts.length 
    });

    if (loggedInAccounts.length === 0) {
      logger.warn('WindsurfAutomationService.scrapeAll: No logged-in accounts to process');
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
      logger.info('WindsurfAutomationService.scrapeAll: Processing account', { 
        id: account.id, 
        email: account.email,
        index: results.length + 1,
        total: loggedInAccounts.length
      });

      const result = await this.scrapeUsage(account);
      
      const accountResult = {
        id: account.id,
        email: account.email,
        success: !result.error,
        error: result.error ? result.message : null,
        data: result.data,
      };

      results.push(accountResult);

      if (result.error) {
        failed++;
        logger.warn('WindsurfAutomationService.scrapeAll: Account scrape failed', { 
          id: account.id, 
          email: account.email, 
          error: result.error 
        });
      } else {
        successful++;
        logger.info('WindsurfAutomationService.scrapeAll: Account scrape succeeded', { 
          id: account.id, 
          email: account.email 
        });
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const skipped = accounts.length - loggedInAccounts.length;

    if (successful > 0) {
      await this.generateAllAccountsCsv(results.filter(r => r.success));
    }

    logger.info('WindsurfAutomationService.scrapeAll: Batch scrape completed', { 
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

  static async generateAllAccountsCsv(successfulResults) {
    const date = new Date().toISOString().split('T')[0];
    const fileName = `all-accounts-${date}.csv`;
    const filePath = path.join(config.paths.windsurfDownload, fileName);
    
    const header = 'email,credits_remaining,credits_used,credits_total,reset_date,scraped_at';
    const rows = successfulResults.map(r => [
      r.email,
      r.data?.creditsRemaining ?? '',
      r.data?.creditsUsed ?? '',
      r.data?.creditsTotal ?? '',
      r.data?.resetDate ?? '',
      r.data?.scrapedAt ?? new Date().toISOString()
    ].join(','));
    
    const csvContent = `${header}\n${rows.join('\n')}\n`;
    
    await fs.writeFile(filePath, csvContent, 'utf-8');
    
    logger.info('WindsurfAutomationService.generateAllAccountsCsv: Combined CSV file created', { 
      filePath, 
      fileName,
      accountCount: successfulResults.length
    });
    
    return { filePath, fileName };
  }
}

export default WindsurfAutomationService;
