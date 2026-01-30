import express from 'express';
import path from 'path';
import config from '../config/index.js';
import UsageAnalyticsService from '../services/usage-analytics.service.js';
import DownloadHistoryService from '../services/download-history.service.js';

const router = express.Router();

/**
 * GET /api/usage-analytics/overview
 * Get usage overview for all accounts
 */
router.get('/overview', async (req, res) => {
  try {
    console.log('API: Getting usage overview');
    const overview = await UsageAnalyticsService.getUsageOverview();
    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    console.error('API Error - usage overview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get usage overview',
      message: error.message
    });
  }
});

/**
 * GET /api/usage-analytics/account/:email
 * Get detailed analytics for a specific account
 */
router.get('/account/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log(`API: Getting analytics for account: ${email}`);
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email parameter is required'
      });
    }

    const analytics = await UsageAnalyticsService.getAccountAnalytics(email);
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error(`API Error - account analytics for ${req.params.email}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get account analytics',
      message: error.message
    });
  }
});

/**
 * POST /api/usage-analytics/refresh
 * Refresh analytics data (clear cache and recalculate)
 */
router.post('/refresh', async (req, res) => {
  try {
    console.log('API: Refreshing analytics data');
    const overview = await UsageAnalyticsService.refreshAnalytics();
    res.json({
      success: true,
      data: overview,
      message: 'Analytics data refreshed successfully'
    });
  } catch (error) {
    console.error('API Error - refresh analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh analytics data',
      message: error.message
    });
  }
});

/**
 * GET /api/download-history
 * Get download history from actual files
 */
router.get('/download-history', async (req, res) => {
  try {
    console.log('API: Getting download history');
    const history = await DownloadHistoryService.getDownloadHistory();
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('API Error - download history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get download history',
      message: error.message
    });
  }
});

/**
 * GET /api/download-history/folder-info
 * Get download folder information
 */
router.get('/download-history/folder-info', async (req, res) => {
  try {
    console.log('API: Getting download folder info');
    const folderInfo = await DownloadHistoryService.getDownloadFolderInfo();
    res.json({
      success: true,
      data: folderInfo
    });
  } catch (error) {
    console.error('API Error - folder info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get folder info',
      message: error.message
    });
  }
});

/**
 * GET /api/download-history/validate/:filename
 * Validate if a CSV file has correct format
 */
router.get('/download-history/validate/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    console.log(`API: Validating CSV file: ${filename}`);
    
    if (!filename.endsWith('.csv')) {
      return res.status(400).json({
        success: false,
        error: 'File must be a CSV file'
      });
    }

    const filePath = path.join(config.paths.download, filename);
    const isValid = await DownloadHistoryService.validateCsvFile(filePath);
    
    res.json({
      success: true,
      data: {
        filename,
        isValid,
        message: isValid ? 'File format is valid' : 'File format is invalid or corrupted'
      }
    });
  } catch (error) {
    console.error(`API Error - validate file ${req.params.filename}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate file',
      message: error.message
    });
  }
});

export default router;
