import { Router } from 'express';
import { AutomationService } from '../services/automation.service.js';
import { AutomationCDPService } from '../services/automation-cdp.service.js';
import { CDPService } from '../services/cdp.service.js';
import { BrowserService } from '../services/browser.service.js';
import logger from '../utils/logger.js';

const router = Router();

router.post('/run-all', async (req, res) => {
  logger.info('POST /api/automation/run-all: Request received');
  
  try {
    // Try CDP service first (to bypass 403)
    logger.info('POST /api/automation/run-all: Attempting CDP method');
    let result = await AutomationCDPService.runAll();
    
    // If CDP failed due to connection issues, fallback to persistent context method
    if (result.error && result.error.includes('Chrome not connected')) {
      logger.warn('POST /api/automation/run-all: CDP failed, falling back to persistent context method', { 
        cdpError: result.error 
      });
      
      result = await AutomationService.runAll();
      result.method = 'persistent_context_fallback';
    } else {
      result.method = 'cdp';
    }
    
    logger.info('POST /api/automation/run-all: Completed', { 
      method: result.method,
      total: result.total,
      successful: result.successful,
      failed: result.failed,
      skipped: result.skipped
    });
    
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error('POST /api/automation/run-all: Error', { error: err.message });
    res.status(500).json({ 
      success: false, 
      error: { code: 'ERR-SYS-001', message: 'Internal server error' } 
    });
  }
});

router.post('/run-all-legacy', async (req, res) => {
  logger.info('POST /api/automation/run-all-legacy: Request received (using spawn browser)');
  
  try {
    const result = await AutomationService.runAll();
    
    logger.info('POST /api/automation/run-all-legacy: Completed', { 
      total: result.total,
      successful: result.successful,
      failed: result.failed,
      skipped: result.skipped
    });
    
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error('POST /api/automation/run-all-legacy: Error', { error: err.message });
    res.status(500).json({ 
      success: false, 
      error: { code: 'ERR-SYS-001', message: 'Internal server error' } 
    });
  }
});

router.get('/cdp/status', async (req, res) => {
  logger.info('GET /api/automation/cdp/status: Request received');
  
  try {
    const isConnected = CDPService.isConnected();
    
    res.json({ 
      success: true, 
      data: {
        connected: isConnected,
        endpoint: 'http://localhost:9222'
      }
    });
  } catch (err) {
    logger.error('GET /api/automation/cdp/status: Error', { error: err.message });
    res.status(500).json({ 
      success: false, 
      error: { code: 'ERR-SYS-001', message: 'Internal server error' } 
    });
  }
});

router.post('/cdp/connect', async (req, res) => {
  logger.info('POST /api/automation/cdp/connect: Request received');
  
  try {
    const result = await CDPService.connect();
    
    if (result.error) {
      logger.warn('POST /api/automation/cdp/connect: Failed', { error: result.error });
      return res.status(400).json({ 
        success: false, 
        error: { 
          code: 'ERR-CDP-001', 
          message: result.error,
          hint: result.hint || 'Make sure Chrome is running with --remote-debugging-port=9222'
        }
      });
    }
    
    logger.info('POST /api/automation/cdp/connect: Success');
    res.json({ success: true, message: 'Connected to Chrome via CDP' });
  } catch (err) {
    logger.error('POST /api/automation/cdp/connect: Error', { error: err.message });
    res.status(500).json({ 
      success: false, 
      error: { code: 'ERR-SYS-001', message: 'Internal server error' } 
    });
  }
});

router.get('/status', async (req, res) => {
  logger.info('GET /api/automation/status: Request received');
  
  try {
    const activeBrowsers = BrowserService.getActiveBrowserCount();
    
    logger.info('GET /api/automation/status: Success', { activeBrowsers });
    
    res.json({ 
      success: true, 
      data: {
        activeBrowsers,
        isRunning: activeBrowsers > 0
      }
    });
  } catch (err) {
    logger.error('GET /api/automation/status: Error', { error: err.message });
    res.status(500).json({ 
      success: false, 
      error: { code: 'ERR-SYS-001', message: 'Internal server error' } 
    });
  }
});

export default router;
