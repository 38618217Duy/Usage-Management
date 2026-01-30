import { chromium } from 'playwright';
import config from '../config/index.js';
import logger from '../utils/logger.js';

let cdpBrowser = null;

export class CDPService {
  static async connect() {
    if (cdpBrowser) {
      logger.info('CDPService.connect: Already connected to Chrome');
      return { error: null, browser: cdpBrowser };
    }

    try {
      logger.info('CDPService.connect: Connecting to Chrome via CDP', { 
        endpoint: config.cdp.endpoint 
      });
      
      cdpBrowser = await chromium.connectOverCDP(config.cdp.endpoint);
      
      logger.info('CDPService.connect: Successfully connected to Chrome');
      
      cdpBrowser.on('disconnected', () => {
        logger.info('CDPService: Chrome disconnected');
        cdpBrowser = null;
      });

      return { error: null, browser: cdpBrowser };
    } catch (err) {
      logger.error('CDPService.connect: Failed to connect', { 
        error: err.message,
        endpoint: config.cdp.endpoint
      });
      return { 
        error: err.message, 
        browser: null,
        hint: 'Make sure Chrome is running with --remote-debugging-port=9222'
      };
    }
  }

  static async disconnect() {
    if (cdpBrowser) {
      try {
        await cdpBrowser.close();
        logger.info('CDPService.disconnect: Disconnected from Chrome');
      } catch (err) {
        logger.warn('CDPService.disconnect: Error disconnecting', { error: err.message });
      }
      cdpBrowser = null;
    }
  }

  static isConnected() {
    return cdpBrowser !== null && cdpBrowser.isConnected();
  }

  static getBrowser() {
    return cdpBrowser;
  }

  static async getDefaultContext() {
    if (!cdpBrowser) {
      const result = await this.connect();
      if (result.error) {
        return { error: result.error, context: null };
      }
    }

    try {
      const contexts = cdpBrowser.contexts();
      if (contexts.length === 0) {
        logger.error('CDPService.getDefaultContext: No browser contexts found');
        return { error: 'No browser contexts found', context: null };
      }

      logger.info('CDPService.getDefaultContext: Found contexts', { count: contexts.length });
      return { error: null, context: contexts[0] };
    } catch (err) {
      logger.error('CDPService.getDefaultContext: Error getting context', { error: err.message });
      return { error: err.message, context: null };
    }
  }

  static async getOrCreatePage() {
    const { error, context } = await this.getDefaultContext();
    if (error) {
      return { error, page: null };
    }

    try {
      const pages = context.pages();
      
      if (pages.length > 0) {
        logger.info('CDPService.getOrCreatePage: Using existing page', { 
          pageCount: pages.length,
          url: pages[0].url()
        });
        return { error: null, page: pages[0], context };
      }

      const newPage = await context.newPage();
      logger.info('CDPService.getOrCreatePage: Created new page');
      return { error: null, page: newPage, context };
    } catch (err) {
      logger.error('CDPService.getOrCreatePage: Error', { error: err.message });
      return { error: err.message, page: null };
    }
  }

  static async findPageByUrl(urlPattern) {
    const { error, context } = await this.getDefaultContext();
    if (error) {
      return { error, page: null };
    }

    try {
      const pages = context.pages();
      
      for (const page of pages) {
        const url = page.url();
        if (url.includes(urlPattern)) {
          logger.info('CDPService.findPageByUrl: Found matching page', { url, pattern: urlPattern });
          return { error: null, page, context };
        }
      }

      logger.info('CDPService.findPageByUrl: No matching page found', { pattern: urlPattern });
      return { error: null, page: null, context };
    } catch (err) {
      logger.error('CDPService.findPageByUrl: Error', { error: err.message });
      return { error: err.message, page: null };
    }
  }
}

export default CDPService;
