import { Router } from 'express';
import logger from '../utils/logger.js';
import { WindsurfAccountModel, WindsurfAccountStatus } from '../models/windsurf-account.js';
import { WindsurfBrowserService } from '../services/windsurf-browser.service.js';
import { WindsurfAutomationService } from '../services/windsurf-automation.service.js';

const router = Router();

router.get('/accounts', async (req, res) => {
  logger.info('GET /api/windsurf/accounts: Request received');
  
  try {
    const accounts = await WindsurfAccountModel.readAll();
    logger.info('GET /api/windsurf/accounts: Success', { count: accounts.length });
    res.json({ 
      success: true, 
      data: accounts 
    });
  } catch (err) {
    logger.error('GET /api/windsurf/accounts: Error', { error: err.message });
    res.status(500).json({ 
      success: false, 
      error: { code: 'ERR-SYS-001', message: 'Internal server error' } 
    });
  }
});

router.get('/accounts/:id', async (req, res) => {
  const { id } = req.params;
  logger.info('GET /api/windsurf/accounts/:id: Request received', { id });
  
  try {
    const account = await WindsurfAccountModel.findById(id);
    
    if (!account) {
      logger.warn('GET /api/windsurf/accounts/:id: Account not found', { id });
      return res.status(404).json({ 
        success: false, 
        error: { code: 'ERR-WS-001', message: 'Windsurf account not found' } 
      });
    }

    logger.info('GET /api/windsurf/accounts/:id: Success', { id });
    res.json({ 
      success: true, 
      data: account 
    });
  } catch (err) {
    logger.error('GET /api/windsurf/accounts/:id: Error', { id, error: err.message });
    res.status(500).json({ 
      success: false, 
      error: { code: 'ERR-SYS-001', message: 'Internal server error' } 
    });
  }
});

router.post('/accounts', async (req, res) => {
  const { email } = req.body;
  logger.info('POST /api/windsurf/accounts: Request received', { email });
  
  if (!email) {
    logger.warn('POST /api/windsurf/accounts: Email is required');
    return res.status(400).json({ 
      success: false, 
      error: { code: 'ERR-VAL-001', message: 'Email is required' } 
    });
  }

  try {
    const { error, account } = await WindsurfAccountModel.create(email);
    
    if (error === 'EMAIL_EXISTS') {
      logger.warn('POST /api/windsurf/accounts: Email already exists', { email });
      return res.status(409).json({ 
        success: false, 
        error: { code: 'ERR-WS-005', message: 'Email already registered' } 
      });
    }

    logger.info('POST /api/windsurf/accounts: Account created', { id: account.id, email });
    res.status(201).json({ 
      success: true, 
      data: account 
    });
  } catch (err) {
    logger.error('POST /api/windsurf/accounts: Error', { email, error: err.message });
    res.status(500).json({ 
      success: false, 
      error: { code: 'ERR-SYS-001', message: 'Internal server error' } 
    });
  }
});

router.delete('/accounts/:id', async (req, res) => {
  const { id } = req.params;
  logger.info('DELETE /api/windsurf/accounts/:id: Request received', { id });
  
  try {
    const deleted = await WindsurfAccountModel.delete(id);
    
    if (!deleted) {
      logger.warn('DELETE /api/windsurf/accounts/:id: Account not found', { id });
      return res.status(404).json({ 
        success: false, 
        error: { code: 'ERR-WS-001', message: 'Windsurf account not found' } 
      });
    }

    logger.info('DELETE /api/windsurf/accounts/:id: Account deleted', { id });
    res.json({ 
      success: true, 
      data: { deleted: true } 
    });
  } catch (err) {
    logger.error('DELETE /api/windsurf/accounts/:id: Error', { id, error: err.message });
    res.status(500).json({ 
      success: false, 
      error: { code: 'ERR-SYS-001', message: 'Internal server error' } 
    });
  }
});

router.post('/accounts/:id/login', async (req, res) => {
  const { id } = req.params;
  logger.info('POST /api/windsurf/accounts/:id/login: Request received', { id });
  
  try {
    const account = await WindsurfAccountModel.findById(id);
    
    if (!account) {
      logger.warn('POST /api/windsurf/accounts/:id/login: Account not found', { id });
      return res.status(404).json({ 
        success: false, 
        error: { code: 'ERR-WS-001', message: 'Windsurf account not found' } 
      });
    }

    const result = await WindsurfBrowserService.openLoginBrowser(account);
    
    if (result.error === 'BROWSER_ALREADY_OPEN') {
      logger.warn('POST /api/windsurf/accounts/:id/login: Browser already open', { id });
      return res.status(409).json({ 
        success: false, 
        error: { code: 'ERR-WS-006', message: 'Browser is currently open for this account' } 
      });
    }

    if (result.error) {
      logger.error('POST /api/windsurf/accounts/:id/login: Failed to open browser', { id, error: result.error });
      return res.status(500).json({ 
        success: false, 
        error: { code: 'ERR-SYS-001', message: result.error } 
      });
    }

    logger.info('POST /api/windsurf/accounts/:id/login: Browser opened', { id });
    res.json({ 
      success: true, 
      data: { 
        message: result.message,
        browserOpened: true 
      } 
    });
  } catch (err) {
    logger.error('POST /api/windsurf/accounts/:id/login: Error', { id, error: err.message });
    res.status(500).json({ 
      success: false, 
      error: { code: 'ERR-SYS-001', message: 'Internal server error' } 
    });
  }
});

router.post('/accounts/:id/verify', async (req, res) => {
  const { id } = req.params;
  logger.info('POST /api/windsurf/accounts/:id/verify: Request received', { id });
  
  try {
    const account = await WindsurfAccountModel.findById(id);
    
    if (!account) {
      logger.warn('POST /api/windsurf/accounts/:id/verify: Account not found', { id });
      return res.status(404).json({ 
        success: false, 
        error: { code: 'ERR-WS-001', message: 'Windsurf account not found' } 
      });
    }

    const result = await WindsurfBrowserService.verifyLogin(id);
    
    logger.info('POST /api/windsurf/accounts/:id/verify: Verification complete', { id, isLoggedIn: result.isLoggedIn });
    res.json({ 
      success: true, 
      data: result 
    });
  } catch (err) {
    logger.error('POST /api/windsurf/accounts/:id/verify: Error', { id, error: err.message });
    res.status(500).json({ 
      success: false, 
      error: { code: 'ERR-SYS-001', message: 'Internal server error' } 
    });
  }
});

router.post('/accounts/:id/scrape', async (req, res) => {
  const { id } = req.params;
  logger.info('POST /api/windsurf/accounts/:id/scrape: Request received', { id });
  
  try {
    const account = await WindsurfAccountModel.findById(id);
    
    if (!account) {
      logger.warn('POST /api/windsurf/accounts/:id/scrape: Account not found', { id });
      return res.status(404).json({ 
        success: false, 
        error: { code: 'ERR-WS-001', message: 'Windsurf account not found' } 
      });
    }

    const result = await WindsurfAutomationService.scrapeUsage(account);
    
    if (result.error === 'NOT_LOGGED_IN') {
      logger.warn('POST /api/windsurf/accounts/:id/scrape: Not logged in', { id });
      return res.status(400).json({ 
        success: false, 
        error: { code: 'ERR-WS-002', message: 'Account is not logged in' } 
      });
    }

    if (result.error === 'SESSION_EXPIRED') {
      logger.warn('POST /api/windsurf/accounts/:id/scrape: Session expired', { id });
      return res.status(401).json({ 
        success: false, 
        error: { code: 'ERR-WS-003', message: 'Session has expired, please re-login' } 
      });
    }

    if (result.error === 'BROWSER_IN_USE') {
      logger.warn('POST /api/windsurf/accounts/:id/scrape: Browser in use', { id });
      return res.status(409).json({ 
        success: false, 
        error: { code: 'ERR-WS-006', message: 'Browser is currently open for this account' } 
      });
    }

    if (result.error) {
      logger.error('POST /api/windsurf/accounts/:id/scrape: Failed', { id, error: result.error });
      return res.status(500).json({ 
        success: false, 
        error: { code: 'ERR-WS-004', message: result.message } 
      });
    }

    logger.info('POST /api/windsurf/accounts/:id/scrape: Success', { id, data: result.data });
    res.json({ 
      success: true, 
      data: result.data
    });
  } catch (err) {
    logger.error('POST /api/windsurf/accounts/:id/scrape: Error', { id, error: err.message });
    res.status(500).json({ 
      success: false, 
      error: { code: 'ERR-SYS-001', message: 'Internal server error' } 
    });
  }
});

router.post('/scrape-all', async (req, res) => {
  logger.info('POST /api/windsurf/scrape-all: Request received');
  
  try {
    const result = await WindsurfAutomationService.scrapeAll();
    
    logger.info('POST /api/windsurf/scrape-all: Completed', { 
      total: result.total,
      successful: result.successful,
      failed: result.failed,
      skipped: result.skipped
    });
    
    res.json({ 
      success: true, 
      data: result
    });
  } catch (err) {
    logger.error('POST /api/windsurf/scrape-all: Error', { error: err.message });
    res.status(500).json({ 
      success: false, 
      error: { code: 'ERR-SYS-001', message: 'Internal server error' } 
    });
  }
});

router.post('/accounts/:id/close-browser', async (req, res) => {
  const { id } = req.params;
  logger.info('POST /api/windsurf/accounts/:id/close-browser: Request received', { id });
  
  try {
    const closed = await WindsurfBrowserService.closeBrowser(id);
    
    logger.info('POST /api/windsurf/accounts/:id/close-browser: Result', { id, closed });
    res.json({ 
      success: true, 
      data: { closed } 
    });
  } catch (err) {
    logger.error('POST /api/windsurf/accounts/:id/close-browser: Error', { id, error: err.message });
    res.status(500).json({ 
      success: false, 
      error: { code: 'ERR-SYS-001', message: 'Internal server error' } 
    });
  }
});

export default router;
