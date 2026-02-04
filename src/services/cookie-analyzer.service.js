import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import initSqlJs from 'sql.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';

// WebKit epoch starts from 1601-01-01, JavaScript epoch from 1970-01-01
// Difference in milliseconds: 11644473600000
const WEBKIT_EPOCH_OFFSET = 11644473600000;

export class CookieAnalyzerService {
  /**
   * Validates and sanitizes profile path to prevent path traversal attacks
   * @param {string} profilePath - The profile path to validate
   * @returns {{ valid: boolean, fullPath: string | null, error: string | null }}
   */
  static validateProfilePath(profilePath) {
    if (!profilePath || typeof profilePath !== 'string') {
      return { valid: false, fullPath: null, error: 'INVALID_PATH' };
    }

    // Normalize and resolve the full path
    const fullProfilePath = path.resolve(config.paths.root, profilePath);
    const normalizedRoot = path.resolve(config.paths.root);

    // Security check: Ensure the resolved path is within the root directory
    if (!fullProfilePath.startsWith(normalizedRoot + path.sep) && fullProfilePath !== normalizedRoot) {
      logger.warn('CookieAnalyzerService.validateProfilePath: Path traversal attempt detected', { 
        profilePath,
        resolvedPath: fullProfilePath,
        rootPath: normalizedRoot
      });
      return { valid: false, fullPath: null, error: 'PATH_TRAVERSAL_DENIED' };
    }

    return { valid: true, fullPath: fullProfilePath, error: null };
  }

  static async analyzeCookies(profilePath) {
    // Validate profile path to prevent path traversal
    const pathValidation = this.validateProfilePath(profilePath);
    if (!pathValidation.valid) {
      logger.warn('CookieAnalyzerService.analyzeCookies: Invalid profile path', { 
        profilePath, 
        error: pathValidation.error 
      });
      return { error: pathValidation.error, cookies: [], expiryAt: null };
    }

    const fullProfilePath = pathValidation.fullPath;
    const cookieDbPath = path.join(fullProfilePath, 'Default', 'Cookies');
    const networkCookieDbPath = path.join(fullProfilePath, 'Default', 'Network', 'Cookies');

    logger.info('CookieAnalyzerService.analyzeCookies: Starting analysis', { profilePath });

    let dbPath = null;
    try {
      await fs.access(cookieDbPath);
      dbPath = cookieDbPath;
    } catch {
      try {
        await fs.access(networkCookieDbPath);
        dbPath = networkCookieDbPath;
      } catch {
        logger.warn('CookieAnalyzerService.analyzeCookies: No cookie database found', { profilePath });
        return { error: 'COOKIE_DB_NOT_FOUND', cookies: [], expiryAt: null };
      }
    }

    // Use crypto.randomUUID() to prevent race condition with concurrent requests
    const tempDbPath = path.join(config.paths.root, `temp_cookies_${crypto.randomUUID()}.db`);
    let db = null;
    
    try {
      await fs.copyFile(dbPath, tempDbPath);
      
      const SQL = await initSqlJs();
      const buffer = await fs.readFile(tempDbPath);
      db = new SQL.Database(buffer);
      
      const cursorCookies = db.exec(`
        SELECT name, host_key, expires_utc, creation_utc, last_access_utc
        FROM cookies 
        WHERE host_key LIKE '%cursor.com%' OR host_key LIKE '%cursor.sh%'
        ORDER BY expires_utc DESC
      `);

      // Cleanup will be handled in finally block
      
      const results = cursorCookies.length > 0 && cursorCookies[0].values 
        ? cursorCookies[0].values.map(row => ({
            name: row[0],
            host_key: row[1],
            expires_utc: row[2],
            creation_utc: row[3],
            last_access_utc: row[4],
          }))
        : [];

      if (results.length === 0) {
        logger.info('CookieAnalyzerService.analyzeCookies: No cursor.com cookies found', { profilePath });
        return { error: null, cookies: [], expiryAt: null, source: 'no_cookies' };
      }

      const sessionCookiePatterns = [
        '__session',
        '__clerk_db_jwt',
        'workos',
        '__client',
        'token',
        'auth',
        'session',
      ];

      let latestExpiry = null;
      let latestLogin = null;
      const relevantCookies = [];

      for (const cookie of results) {
        const isSessionCookie = sessionCookiePatterns.some(pattern => 
          cookie.name.toLowerCase().includes(pattern.toLowerCase())
        );

        if (cookie.expires_utc > 0) {
          const expiryDate = this.webkitToDate(cookie.expires_utc);
          const creationDate = this.webkitToDate(cookie.creation_utc);
          
          relevantCookies.push({
            name: cookie.name,
            host: cookie.host_key,
            expiresAt: expiryDate.toISOString(),
            createdAt: creationDate.toISOString(),
            isSessionCookie,
          });

          if (isSessionCookie || cookie.name.includes('session') || cookie.name.includes('auth')) {
            if (!latestExpiry || expiryDate > latestExpiry) {
              latestExpiry = expiryDate;
            }
            if (!latestLogin || creationDate > latestLogin) {
              latestLogin = creationDate;
            }
          }
        }
      }

      if (!latestExpiry) {
        const allExpiries = results
          .filter(c => c.expires_utc > 0)
          .map(c => this.webkitToDate(c.expires_utc));
        
        if (allExpiries.length > 0) {
          latestExpiry = new Date(Math.max(...allExpiries.map(d => d.getTime())));
        }
      }

      // Log only metadata, not cookie values to prevent sensitive data exposure
      logger.info('CookieAnalyzerService.analyzeCookies: Analysis complete', { 
        profilePath,
        totalCookies: results.length,
        sessionCookiesFound: relevantCookies.filter(c => c.isSessionCookie).length,
        hasExpiry: !!latestExpiry,
      });

      return {
        error: null,
        cookies: relevantCookies,
        expiryAt: latestExpiry?.toISOString() || null,
        loginAt: latestLogin?.toISOString() || null,
        source: 'cookie',
      };

    } catch (err) {
      logger.error('CookieAnalyzerService.analyzeCookies: Analysis failed', { 
        profilePath, 
        error: err.message 
      });
      
      return { error: err.message, cookies: [], expiryAt: null };
    } finally {
      // Ensure database is always closed to prevent memory leaks
      if (db) {
        try {
          db.close();
        } catch (closeErr) {
          logger.warn('CookieAnalyzerService.analyzeCookies: Failed to close database', { 
            error: closeErr.message 
          });
        }
      }
      // Always cleanup temp file
      await fs.unlink(tempDbPath).catch(() => {});
    }
  }

  static webkitToDate(webkitTimestamp) {
    const milliseconds = (webkitTimestamp / 1000) - WEBKIT_EPOCH_OFFSET;
    return new Date(milliseconds);
  }

  static dateToWebkit(date) {
    const milliseconds = date.getTime() + WEBKIT_EPOCH_OFFSET;
    return milliseconds * 1000;
  }

  static async getSessionInfo(profilePath) {
    const result = await this.analyzeCookies(profilePath);
    
    if (result.error === 'COOKIE_DB_NOT_FOUND') {
      return {
        hasSession: false,
        expiryAt: null,
        loginAt: null,
        source: 'no_profile',
        timeRemaining: null,
      };
    }

    if (!result.expiryAt) {
      return {
        hasSession: false,
        expiryAt: null,
        loginAt: result.loginAt,
        source: 'no_session_cookie',
        timeRemaining: null,
      };
    }

    const now = new Date();
    const expiryDate = new Date(result.expiryAt);
    const timeRemainingMs = expiryDate.getTime() - now.getTime();

    return {
      hasSession: timeRemainingMs > 0,
      expiryAt: result.expiryAt,
      loginAt: result.loginAt,
      source: result.source,
      timeRemaining: timeRemainingMs > 0 ? this.formatTimeRemaining(timeRemainingMs) : null,
      isExpired: timeRemainingMs <= 0,
    };
  }

  static formatTimeRemaining(ms) {
    const totalHours = ms / (1000 * 60 * 60);
    const days = Math.floor(totalHours / 24);
    const hours = Math.floor(totalHours % 24);
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    let formatted = '';
    if (days > 0) {
      formatted = `${days} ngày ${hours} giờ`;
    } else if (hours > 0) {
      formatted = `${hours} giờ ${minutes} phút`;
    } else {
      formatted = `${minutes} phút`;
    }

    return {
      days,
      hours: Math.floor(totalHours),
      minutes,
      totalMs: ms,
      formatted,
    };
  }
}

export default CookieAnalyzerService;
