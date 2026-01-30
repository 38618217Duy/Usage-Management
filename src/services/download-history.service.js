import fs from 'fs/promises';
import path from 'path';
import config from '../config/index.js';

class DownloadHistoryService {
  /**
   * Get download history from actual files in download folder
   */
  async getDownloadHistory() {
    try {
      console.log('Scanning download folder for CSV files');
      
      // Check if download folder exists
      try {
        await fs.access(config.downloadPath);
      } catch (error) {
        console.warn('Download folder does not exist:', config.downloadPath);
        return [];
      }

      const files = await fs.readdir(config.downloadPath);
      const csvFiles = files.filter(file => file.endsWith('.csv'));
      
      const downloadHistory = [];

      for (const fileName of csvFiles) {
        const filePath = path.join(config.downloadPath, fileName);
        const fileStats = await this.getFileStats(filePath);
        
        if (fileStats) {
          const email = path.basename(fileName, '.csv');
          downloadHistory.push({
            fileName,
            filePath,
            downloadedAt: fileStats.mtime.toISOString(),
            email,
            size: fileStats.size
          });
        }
      }

      // Sort by download date (most recent first)
      downloadHistory.sort((a, b) => new Date(b.downloadedAt) - new Date(a.downloadedAt));

      console.log(`Found ${downloadHistory.length} CSV files in download history`);
      return downloadHistory;
    } catch (error) {
      console.error('Error getting download history:', error);
      throw error;
    }
  }

  /**
   * Get file statistics
   */
  async getFileStats(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        mtime: stats.mtime,
        ctime: stats.ctime,
        isFile: stats.isFile()
      };
    } catch (error) {
      console.error(`Error getting stats for file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Get file content preview (first few lines)
   */
  async getFilePreview(filePath, lines = 5) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const contentLines = content.split('\n').slice(0, lines);
      return contentLines.join('\n');
    } catch (error) {
      console.error(`Error reading file preview ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Check if file is valid CSV format
   */
  async validateCsvFile(filePath) {
    try {
      const preview = await this.getFilePreview(filePath, 2);
      if (!preview) return false;

      const lines = preview.split('\n');
      if (lines.length < 2) return false;

      // Check if first line contains expected headers
      const headers = lines[0].toLowerCase();
      const requiredHeaders = ['date', 'total tokens', 'cost'];
      
      return requiredHeaders.every(header => headers.includes(header));
    } catch (error) {
      console.error(`Error validating CSV file ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Get download folder info
   */
  async getDownloadFolderInfo() {
    try {
      const folderStats = await this.getFileStats(config.downloadPath);
      const files = await fs.readdir(config.downloadPath);
      const csvFiles = files.filter(file => file.endsWith('.csv'));
      
      let totalSize = 0;
      for (const fileName of csvFiles) {
        const filePath = path.join(config.downloadPath, fileName);
        const fileStats = await this.getFileStats(filePath);
        if (fileStats) {
          totalSize += fileStats.size;
        }
      }

      return {
        path: config.downloadPath,
        totalFiles: csvFiles.length,
        totalSize,
        lastModified: folderStats?.mtime?.toISOString() || null
      };
    } catch (error) {
      console.error('Error getting download folder info:', error);
      return {
        path: config.downloadPath,
        totalFiles: 0,
        totalSize: 0,
        lastModified: null
      };
    }
  }
}

export default new DownloadHistoryService();
