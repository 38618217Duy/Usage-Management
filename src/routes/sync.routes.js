import { Router } from 'express';
import { AccountSyncService } from '../services/account-sync.service.js';
import logger from '../utils/logger.js';

const router = Router();

/**
 * POST /api/sync/accounts
 * Đồng bộ tất cả accounts - kiểm tra email thực từ dashboard và cập nhật nếu sai
 * Query params:
 *   - dryRun: boolean (default: false) - Nếu true, chỉ kiểm tra mà không cập nhật
 */
router.post('/accounts', async (req, res) => {
  const dryRun = req.query.dryRun === 'true';
  
  logger.info('POST /api/sync/accounts: Request received', { dryRun });

  try {
    const result = await AccountSyncService.syncAllAccounts({ dryRun });

    logger.info('POST /api/sync/accounts: Completed', {
      total: result.total,
      checked: result.checked,
      updated: result.updated,
      errors: result.errors,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    logger.error('POST /api/sync/accounts: Error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'ERR-SYS-001', message: 'Internal server error' },
    });
  }
});

/**
 * POST /api/sync/accounts/:id
 * Đồng bộ một account cụ thể
 * Query params:
 *   - dryRun: boolean (default: false)
 */
router.post('/accounts/:id', async (req, res) => {
  const { id } = req.params;
  const dryRun = req.query.dryRun === 'true';

  logger.info('POST /api/sync/accounts/:id: Request received', { id, dryRun });

  try {
    const result = await AccountSyncService.syncAccount(id, { dryRun });

    if (result.error === 'ACCOUNT_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: { code: 'ERR-ACC-001', message: 'Account not found' },
      });
    }

    logger.info('POST /api/sync/accounts/:id: Completed', { id, result });

    res.json({ success: true, data: result });
  } catch (err) {
    logger.error('POST /api/sync/accounts/:id: Error', { id, error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'ERR-SYS-001', message: 'Internal server error' },
    });
  }
});

/**
 * GET /api/sync/status
 * Kiểm tra trạng thái sync (dry run) - không cập nhật, chỉ báo cáo sự khác biệt
 */
router.get('/status', async (req, res) => {
  logger.info('GET /api/sync/status: Request received');

  try {
    const result = await AccountSyncService.syncAllAccounts({ dryRun: true });

    const needsUpdate = result.results.filter(r => r.needsUpdate);

    logger.info('GET /api/sync/status: Completed', {
      total: result.total,
      needsUpdate: needsUpdate.length,
      errors: result.errors,
    });

    res.json({
      success: true,
      data: {
        total: result.total,
        inSync: result.total - needsUpdate.length - result.errors,
        needsUpdate: needsUpdate.length,
        errors: result.errors,
        details: result.results,
      },
    });
  } catch (err) {
    logger.error('GET /api/sync/status: Error', { error: err.message });
    res.status(500).json({
      success: false,
      error: { code: 'ERR-SYS-001', message: 'Internal server error' },
    });
  }
});

export default router;
