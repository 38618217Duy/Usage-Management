import { Router } from 'express';
import { SessionService } from '../services/session.service.js';
import logger from '../utils/logger.js';

const router = Router();

router.get('/status', async (req, res) => {
  try {
    logger.info('GET /api/sessions/status');
    const result = await SessionService.getSessionStatus();
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('GET /api/sessions/status failed', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'ERR-SESSION-500', message: error.message } });
  }
});

router.get('/summary', async (req, res) => {
  try {
    logger.info('GET /api/sessions/summary');
    const result = await SessionService.getSessionSummary();
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('GET /api/sessions/summary failed', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'ERR-SESSION-500', message: error.message } });
  }
});

router.get('/status/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    logger.info('GET /api/sessions/status/:accountId', { accountId });
    
    const allStatus = await SessionService.getSessionStatus();
    const account = allStatus.accounts.find(a => a.id === accountId);
    
    if (!account) {
      return res.status(404).json({ 
        success: false, 
        error: { code: 'ERR-SESSION-001', message: 'Không tìm thấy tài khoản' } 
      });
    }
    
    res.json({ success: true, data: account });
  } catch (error) {
    logger.error('GET /api/sessions/status/:accountId failed', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'ERR-SESSION-500', message: error.message } });
  }
});

router.post('/check', async (req, res) => {
  try {
    logger.info('POST /api/sessions/check');
    const result = await SessionService.checkAllSessions();
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('POST /api/sessions/check failed', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'ERR-SESSION-500', message: error.message } });
  }
});

router.post('/check/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    logger.info('POST /api/sessions/check/:accountId', { accountId });
    
    const result = await SessionService.checkSession(accountId);
    
    if (result.error) {
      const statusCode = result.error === 'ERR-SESSION-001' ? 404 : 400;
      return res.status(statusCode).json({ 
        success: false, 
        error: { code: result.error, message: result.message } 
      });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('POST /api/sessions/check/:accountId failed', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'ERR-SESSION-500', message: error.message } });
  }
});

router.get('/history/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    logger.info('GET /api/sessions/history/:accountId', { accountId });
    
    const result = await SessionService.getSessionHistory(accountId);
    
    if (result.error) {
      return res.status(404).json({ 
        success: false, 
        error: { code: result.error, message: result.message } 
      });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('GET /api/sessions/history/:accountId failed', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'ERR-SESSION-500', message: error.message } });
  }
});

router.post('/batch-login', async (req, res) => {
  try {
    const { accountIds } = req.body;
    logger.info('POST /api/sessions/batch-login', { accountIds });
    
    if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: { code: 'ERR-SESSION-400', message: 'accountIds array is required' } 
      });
    }
    
    const result = await SessionService.startBatchLogin(accountIds);
    
    if (result.error) {
      return res.status(400).json({ 
        success: false, 
        error: { code: result.error, message: result.message } 
      });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('POST /api/sessions/batch-login failed', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'ERR-SESSION-500', message: error.message } });
  }
});

router.post('/batch-login/:accountId/open', async (req, res) => {
  try {
    const { accountId } = req.params;
    logger.info('POST /api/sessions/batch-login/:accountId/open', { accountId });
    
    const result = await SessionService.openBatchLoginBrowser(accountId);
    
    if (result.error) {
      const statusCode = result.error === 'ERR-SESSION-001' ? 404 : 
                         result.error === 'ERR-SESSION-004' ? 409 : 400;
      return res.status(statusCode).json({ 
        success: false, 
        error: { code: result.error, message: result.message } 
      });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('POST /api/sessions/batch-login/:accountId/open failed', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'ERR-SESSION-500', message: error.message } });
  }
});

router.post('/record-login/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;
    logger.info('POST /api/sessions/record-login/:accountId', { accountId });
    
    const result = await SessionService.recordLogin(accountId);
    
    if (result.error) {
      return res.status(404).json({ 
        success: false, 
        error: { code: result.error, message: 'Không tìm thấy tài khoản' } 
      });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('POST /api/sessions/record-login/:accountId failed', { error: error.message });
    res.status(500).json({ success: false, error: { code: 'ERR-SESSION-500', message: error.message } });
  }
});

export default router;
