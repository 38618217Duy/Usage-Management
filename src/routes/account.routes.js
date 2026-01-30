import { Router } from 'express';
import { AccountService } from '../services/account.service.js';
import { BrowserService } from '../services/browser.service.js';
import { AutomationService } from '../services/automation.service.js';
import logger from '../utils/logger.js';

const router = Router();

router.get('/', async (req, res) => {
  logger.info('GET /api/accounts: Request received');
  try {
    const accounts = await AccountService.getAll();
    logger.info('GET /api/accounts: Success', { count: accounts.length });
    res.json({ success: true, data: accounts });
  } catch (err) {
    logger.error('GET /api/accounts: Error', { error: err.message });
    res.status(500).json({ 
      success: false, 
      error: { code: 'ERR-SYS-001', message: 'Internal server error' } 
    });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  logger.info('GET /api/accounts/:id: Request received', { id });
  
  try {
    const account = await AccountService.getById(id);
    
    if (!account) {
      logger.warn('GET /api/accounts/:id: Not found', { id });
      return res.status(404).json({ 
        success: false, 
        error: { code: 'ERR-ACC-002', message: 'Account not found' } 
      });
    }
    
    logger.info('GET /api/accounts/:id: Success', { id });
    res.json({ success: true, data: account });
  } catch (err) {
    logger.error('GET /api/accounts/:id: Error', { id, error: err.message });
    res.status(500).json({ 
      success: false, 
      error: { code: 'ERR-SYS-001', message: 'Internal server error' } 
    });
  }
});

router.post('/', async (req, res) => {
  const { email } = req.body;
  logger.info('POST /api/accounts: Request received', { email });
  
  try {
    if (!email) {
      logger.warn('POST /api/accounts: Email required');
      return res.status(400).json({ 
        success: false, 
        error: { code: 'ERR-ACC-001', message: 'Email is required' } 
      });
    }

    const result = await AccountService.create(email);
    
    if (result.error === 'EMAIL_EXISTS') {
      logger.warn('POST /api/accounts: Email already exists', { email });
      return res.status(409).json({ 
        success: false, 
        error: { code: 'ERR-ACC-003', message: 'Email already exists' } 
      });
    }

    if (result.error === 'INVALID_EMAIL') {
      logger.warn('POST /api/accounts: Invalid email format', { email });
      return res.status(400).json({ 
        success: false, 
        error: { code: 'ERR-ACC-001', message: 'Invalid email format' } 
      });
    }

    if (result.error) {
      logger.error('POST /api/accounts: Unknown error', { email, error: result.error });
      return res.status(500).json({ 
        success: false, 
        error: { code: 'ERR-SYS-001', message: result.error } 
      });
    }

    logger.info('POST /api/accounts: Account created', { id: result.account.id, email });
    res.status(201).json({ success: true, data: result.account });
  } catch (err) {
    logger.error('POST /api/accounts: Error', { email, error: err.message });
    res.status(500).json({ 
      success: false, 
      error: { code: 'ERR-SYS-001', message: 'Internal server error' } 
    });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  logger.info('DELETE /api/accounts/:id: Request received', { id });
  
  try {
    const deleted = await AccountService.delete(id);
    
    if (!deleted) {
      logger.warn('DELETE /api/accounts/:id: Not found', { id });
      return res.status(404).json({ 
        success: false, 
        error: { code: 'ERR-ACC-002', message: 'Account not found' } 
      });
    }

    logger.info('DELETE /api/accounts/:id: Success', { id });
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (err) {
    logger.error('DELETE /api/accounts/:id: Error', { id, error: err.message });
    res.status(500).json({ 
      success: false, 
      error: { code: 'ERR-SYS-001', message: 'Internal server error' } 
    });
  }
});

router.post('/:id/open-browser', async (req, res) => {
  const { id } = req.params;
  logger.info('POST /api/accounts/:id/open-browser: Request received', { id });
  
  try {
    const account = await AccountService.getById(id);
    
    if (!account) {
      logger.warn('POST /api/accounts/:id/open-browser: Account not found', { id });
      return res.status(404).json({ 
        success: false, 
        error: { code: 'ERR-ACC-002', message: 'Account not found' } 
      });
    }

    const result = await BrowserService.openLoginBrowser(account);
    
    if (result.error === 'BROWSER_ALREADY_OPEN') {
      logger.warn('POST /api/accounts/:id/open-browser: Browser already open', { id });
      return res.status(409).json({ 
        success: false, 
        error: { code: 'ERR-AUTO-004', message: 'Browser is already open for this account' } 
      });
    }

    if (result.error) {
      logger.error('POST /api/accounts/:id/open-browser: Failed', { id, error: result.error });
      return res.status(500).json({ 
        success: false, 
        error: { code: 'ERR-SYS-001', message: result.error } 
      });
    }

    logger.info('POST /api/accounts/:id/open-browser: Success', { id });
    res.json({ 
      success: true, 
      message: 'Browser opened. Please login manually and close the browser when done.' 
    });
  } catch (err) {
    logger.error('POST /api/accounts/:id/open-browser: Error', { id, error: err.message });
    res.status(500).json({ 
      success: false, 
      error: { code: 'ERR-SYS-001', message: 'Internal server error' } 
    });
  }
});

router.post('/:id/verify', async (req, res) => {
  const { id } = req.params;
  logger.info('POST /api/accounts/:id/verify: Request received', { id });
  
  try {
    const account = await AccountService.getById(id);
    
    if (!account) {
      logger.warn('POST /api/accounts/:id/verify: Account not found', { id });
      return res.status(404).json({ 
        success: false, 
        error: { code: 'ERR-ACC-002', message: 'Account not found' } 
      });
    }

    const previousStatus = account.status;
    const result = await BrowserService.verifyLogin(id);
    
    if (result.error === 'BROWSER_IN_USE') {
      logger.warn('POST /api/accounts/:id/verify: Browser in use', { id });
      return res.status(409).json({ 
        success: false, 
        error: { code: 'ERR-AUTO-004', message: 'Browser is currently open for this account' } 
      });
    }

    if (result.error) {
      logger.error('POST /api/accounts/:id/verify: Failed', { id, error: result.error });
      return res.status(500).json({ 
        success: false, 
        error: { code: 'ERR-SYS-001', message: result.error } 
      });
    }

    logger.info('POST /api/accounts/:id/verify: Success', { id, status: result.status });
    res.json({ 
      success: true, 
      data: { 
        status: result.status,
        previousStatus,
        isLoggedIn: result.isLoggedIn
      } 
    });
  } catch (err) {
    logger.error('POST /api/accounts/:id/verify: Error', { id, error: err.message });
    res.status(500).json({ 
      success: false, 
      error: { code: 'ERR-SYS-001', message: 'Internal server error' } 
    });
  }
});

router.post('/:id/close-browser', async (req, res) => {
  const { id } = req.params;
  logger.info('POST /api/accounts/:id/close-browser: Request received', { id });
  
  try {
    const closed = await BrowserService.closeBrowser(id);
    
    if (!closed) {
      logger.warn('POST /api/accounts/:id/close-browser: No browser to close', { id });
      return res.status(404).json({ 
        success: false, 
        error: { code: 'ERR-AUTO-005', message: 'No browser is open for this account' } 
      });
    }

    logger.info('POST /api/accounts/:id/close-browser: Success', { id });
    res.json({ 
      success: true, 
      message: 'Browser closed successfully' 
    });
  } catch (err) {
    logger.error('POST /api/accounts/:id/close-browser: Error', { id, error: err.message });
    res.status(500).json({ 
      success: false, 
      error: { code: 'ERR-SYS-001', message: 'Internal server error' } 
    });
  }
});

router.post('/cleanup-browsers', async (req, res) => {
  logger.info('POST /api/accounts/cleanup-browsers: Request received');
  
  try {
    const cleanedCount = BrowserService.cleanupDeadBrowsers();
    
    logger.info('POST /api/accounts/cleanup-browsers: Success', { cleanedCount });
    res.json({ 
      success: true, 
      message: `Cleaned up ${cleanedCount} dead browser(s)`,
      data: { cleanedCount }
    });
  } catch (err) {
    logger.error('POST /api/accounts/cleanup-browsers: Error', { error: err.message });
    res.status(500).json({ 
      success: false, 
      error: { code: 'ERR-SYS-001', message: 'Internal server error' } 
    });
  }
});

router.post('/:id/download', async (req, res) => {
  const { id } = req.params;
  logger.info('POST /api/accounts/:id/download: Request received', { id });
  
  try {
    const account = await AccountService.getById(id);
    
    if (!account) {
      logger.warn('POST /api/accounts/:id/download: Account not found', { id });
      return res.status(404).json({ 
        success: false, 
        error: { code: 'ERR-ACC-002', message: 'Account not found' } 
      });
    }

    const result = await AutomationService.downloadCSV(account);
    
    if (result.error === 'NOT_LOGGED_IN') {
      logger.warn('POST /api/accounts/:id/download: Not logged in', { id });
      return res.status(400).json({ 
        success: false, 
        error: { code: 'ERR-AUTO-001', message: 'Account is not logged in' } 
      });
    }

    if (result.error === 'SESSION_EXPIRED') {
      logger.warn('POST /api/accounts/:id/download: Session expired', { id });
      return res.status(401).json({ 
        success: false, 
        error: { code: 'ERR-AUTO-002', message: 'Session has expired, please re-login' } 
      });
    }

    if (result.error === 'BROWSER_IN_USE') {
      logger.warn('POST /api/accounts/:id/download: Browser in use', { id });
      return res.status(409).json({ 
        success: false, 
        error: { code: 'ERR-AUTO-004', message: 'Browser is currently open for this account' } 
      });
    }

    if (result.error) {
      logger.error('POST /api/accounts/:id/download: Failed', { id, error: result.error });
      return res.status(500).json({ 
        success: false, 
        error: { code: 'ERR-AUTO-003', message: result.message } 
      });
    }

    logger.info('POST /api/accounts/:id/download: Success', { id, filePath: result.filePath });
    res.json({ 
      success: true, 
      data: {
        filePath: result.filePath,
        fileName: result.fileName,
        downloadedAt: result.downloadedAt
      }
    });
  } catch (err) {
    logger.error('POST /api/accounts/:id/download: Error', { id, error: err.message });
    res.status(500).json({ 
      success: false, 
      error: { code: 'ERR-SYS-001', message: 'Internal server error' } 
    });
  }
});

export default router;
