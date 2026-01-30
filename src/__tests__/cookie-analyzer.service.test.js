/**
 * Cookie Analyzer Service Tests
 * 
 * Test Perspective Table:
 * | Case ID | Input / Precondition | Perspective | Expected Result | Notes |
 * |---------|---------------------|-------------|-----------------|-------|
 * | TC-VP-01 | Valid profile path | Equivalence - normal | Path validation passes | - |
 * | TC-VP-02 | Path with ../ | Boundary - security | PATH_TRAVERSAL_DENIED error | Security test |
 * | TC-VP-03 | Null path | Boundary - NULL | INVALID_PATH error | - |
 * | TC-VP-04 | Empty string path | Boundary - empty | INVALID_PATH error | - |
 * | TC-VP-05 | Non-string path | Boundary - type | INVALID_PATH error | - |
 * | TC-WK-01 | Valid webkit timestamp | Equivalence - normal | Correct Date object | - |
 * | TC-WK-02 | Zero timestamp | Boundary - zero | Date at webkit epoch | - |
 * | TC-WK-03 | Current time | Equivalence - normal | Current date | - |
 * | TC-FT-01 | 2 days in ms | Equivalence - normal | "2 ngày X giờ" format | - |
 * | TC-FT-02 | 5 hours in ms | Equivalence - normal | "5 giờ X phút" format | - |
 * | TC-FT-03 | 30 minutes in ms | Equivalence - normal | "30 phút" format | - |
 * | TC-FT-04 | 0 ms | Boundary - zero | "0 phút" format | - |
 */

import { jest } from '@jest/globals';

// Mock config and logger using unstable_mockModule for ESM
jest.unstable_mockModule('../config/index.js', () => ({
  default: {
    paths: {
      root: '/app/root'
    }
  }
}));

jest.unstable_mockModule('../utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }
}));

// Import after mocking
const { CookieAnalyzerService } = await import('../services/cookie-analyzer.service.js');

describe('CookieAnalyzerService', () => {
  describe('validateProfilePath', () => {
    describe('Normal cases', () => {
      // TC-VP-01: Valid profile path
      test('should accept valid profile path within root directory', () => {
        // Given: A valid profile path
        const profilePath = 'profiles/account-123';
        
        // When: Validate the path
        const result = CookieAnalyzerService.validateProfilePath(profilePath);
        
        // Then: Validation should pass
        expect(result.valid).toBe(true);
        expect(result.error).toBeNull();
        expect(result.fullPath).toContain('profiles');
      });
    });

    describe('Security cases - Path Traversal Prevention', () => {
      // TC-VP-02: Path traversal attempt with ../
      test('should reject path traversal attempt with ../', () => {
        // Given: A malicious path with ../
        const profilePath = '../../../etc/passwd';
        
        // When: Validate the path
        const result = CookieAnalyzerService.validateProfilePath(profilePath);
        
        // Then: Should be rejected
        expect(result.valid).toBe(false);
        expect(result.error).toBe('PATH_TRAVERSAL_DENIED');
        expect(result.fullPath).toBeNull();
      });

      // TC-VP-02b: Path traversal with encoded characters
      test('should reject path traversal with absolute path', () => {
        // Given: An absolute path outside root
        const profilePath = '/etc/passwd';
        
        // When: Validate the path
        const result = CookieAnalyzerService.validateProfilePath(profilePath);
        
        // Then: Should be rejected (path resolves outside root)
        expect(result.valid).toBe(false);
        expect(result.error).toBe('PATH_TRAVERSAL_DENIED');
      });
    });

    describe('Boundary cases', () => {
      // TC-VP-03: Null path
      test('should reject null path', () => {
        // Given: null path
        const profilePath = null;
        
        // When: Validate the path
        const result = CookieAnalyzerService.validateProfilePath(profilePath);
        
        // Then: Should return INVALID_PATH error
        expect(result.valid).toBe(false);
        expect(result.error).toBe('INVALID_PATH');
      });

      // TC-VP-04: Empty string path
      test('should reject empty string path', () => {
        // Given: empty string
        const profilePath = '';
        
        // When: Validate the path
        const result = CookieAnalyzerService.validateProfilePath(profilePath);
        
        // Then: Should return INVALID_PATH error
        expect(result.valid).toBe(false);
        expect(result.error).toBe('INVALID_PATH');
      });

      // TC-VP-05: Non-string path (number)
      test('should reject non-string path', () => {
        // Given: number instead of string
        const profilePath = 12345;
        
        // When: Validate the path
        const result = CookieAnalyzerService.validateProfilePath(profilePath);
        
        // Then: Should return INVALID_PATH error
        expect(result.valid).toBe(false);
        expect(result.error).toBe('INVALID_PATH');
      });

      // TC-VP-05b: Non-string path (object)
      test('should reject object as path', () => {
        // Given: object instead of string
        const profilePath = { path: 'profiles/test' };
        
        // When: Validate the path
        const result = CookieAnalyzerService.validateProfilePath(profilePath);
        
        // Then: Should return INVALID_PATH error
        expect(result.valid).toBe(false);
        expect(result.error).toBe('INVALID_PATH');
      });

      // TC-VP-05c: Undefined path
      test('should reject undefined path', () => {
        // Given: undefined
        const profilePath = undefined;
        
        // When: Validate the path
        const result = CookieAnalyzerService.validateProfilePath(profilePath);
        
        // Then: Should return INVALID_PATH error
        expect(result.valid).toBe(false);
        expect(result.error).toBe('INVALID_PATH');
      });
    });
  });

  describe('webkitToDate', () => {
    // WebKit epoch: 1601-01-01 00:00:00 UTC
    // JavaScript epoch: 1970-01-01 00:00:00 UTC
    // Difference: 11644473600000 ms
    
    // TC-WK-01: Valid webkit timestamp
    test('should convert valid webkit timestamp to correct date', () => {
      // Given: A known webkit timestamp (2024-01-01 00:00:00 UTC)
      // JavaScript timestamp: 1704067200000
      // WebKit timestamp: (1704067200000 + 11644473600000) * 1000
      const jsTimestamp = 1704067200000; // 2024-01-01 00:00:00 UTC
      const webkitTimestamp = (jsTimestamp + 11644473600000) * 1000;
      
      // When: Convert to date
      const result = CookieAnalyzerService.webkitToDate(webkitTimestamp);
      
      // Then: Should be correct date
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(1);
    });

    // TC-WK-02: Zero timestamp (webkit epoch)
    test('should handle zero timestamp', () => {
      // Given: Zero webkit timestamp
      const webkitTimestamp = 0;
      
      // When: Convert to date
      const result = CookieAnalyzerService.webkitToDate(webkitTimestamp);
      
      // Then: Should return a valid date (webkit epoch in JS time)
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(-11644473600000);
    });

    // TC-WK-03: Current time conversion
    test('should correctly convert current time', () => {
      // Given: Current time as webkit timestamp
      const now = new Date();
      const webkitTimestamp = CookieAnalyzerService.dateToWebkit(now);
      
      // When: Convert back to date
      const result = CookieAnalyzerService.webkitToDate(webkitTimestamp);
      
      // Then: Should be approximately the same time (within 1 second)
      expect(Math.abs(result.getTime() - now.getTime())).toBeLessThan(1000);
    });
  });

  describe('dateToWebkit', () => {
    // TC-DW-01: Valid date conversion
    test('should convert date to webkit timestamp correctly', () => {
      // Given: A known date
      const date = new Date('2024-01-01T00:00:00.000Z');
      
      // When: Convert to webkit timestamp
      const result = CookieAnalyzerService.dateToWebkit(date);
      
      // Then: Should be a positive number
      expect(result).toBeGreaterThan(0);
      expect(typeof result).toBe('number');
    });

    // TC-DW-02: Round-trip conversion
    test('should maintain date after round-trip conversion', () => {
      // Given: Current date
      const originalDate = new Date();
      
      // When: Convert to webkit and back
      const webkitTimestamp = CookieAnalyzerService.dateToWebkit(originalDate);
      const resultDate = CookieAnalyzerService.webkitToDate(webkitTimestamp);
      
      // Then: Should be the same date (within 1ms tolerance)
      expect(Math.abs(resultDate.getTime() - originalDate.getTime())).toBeLessThan(1);
    });
  });

  describe('formatTimeRemaining', () => {
    const MS_PER_MINUTE = 60 * 1000;
    const MS_PER_HOUR = 60 * MS_PER_MINUTE;
    const MS_PER_DAY = 24 * MS_PER_HOUR;

    // TC-FT-01: Days format
    test('should format days correctly', () => {
      // Given: 2 days and 5 hours in milliseconds
      const ms = 2 * MS_PER_DAY + 5 * MS_PER_HOUR;
      
      // When: Format time remaining
      const result = CookieAnalyzerService.formatTimeRemaining(ms);
      
      // Then: Should show days and hours
      expect(result.days).toBe(2);
      expect(result.hours).toBe(53); // Total hours
      expect(result.formatted).toContain('2 ngày');
      expect(result.formatted).toContain('5 giờ');
    });

    // TC-FT-02: Hours format (less than 1 day)
    test('should format hours correctly when less than 1 day', () => {
      // Given: 5 hours and 30 minutes
      const ms = 5 * MS_PER_HOUR + 30 * MS_PER_MINUTE;
      
      // When: Format time remaining
      const result = CookieAnalyzerService.formatTimeRemaining(ms);
      
      // Then: Should show hours and minutes
      expect(result.days).toBe(0);
      expect(result.hours).toBe(5);
      expect(result.minutes).toBe(30);
      expect(result.formatted).toContain('5 giờ');
      expect(result.formatted).toContain('30 phút');
    });

    // TC-FT-03: Minutes format (less than 1 hour)
    test('should format minutes correctly when less than 1 hour', () => {
      // Given: 30 minutes
      const ms = 30 * MS_PER_MINUTE;
      
      // When: Format time remaining
      const result = CookieAnalyzerService.formatTimeRemaining(ms);
      
      // Then: Should show only minutes
      expect(result.days).toBe(0);
      expect(result.hours).toBe(0);
      expect(result.minutes).toBe(30);
      expect(result.formatted).toBe('30 phút');
    });

    // TC-FT-04: Zero milliseconds
    test('should handle zero milliseconds', () => {
      // Given: 0 ms
      const ms = 0;
      
      // When: Format time remaining
      const result = CookieAnalyzerService.formatTimeRemaining(ms);
      
      // Then: Should show 0 minutes
      expect(result.days).toBe(0);
      expect(result.hours).toBe(0);
      expect(result.minutes).toBe(0);
      expect(result.formatted).toBe('0 phút');
    });

    // TC-FT-05: Large value (30 days)
    test('should handle large values correctly', () => {
      // Given: 30 days
      const ms = 30 * MS_PER_DAY;
      
      // When: Format time remaining
      const result = CookieAnalyzerService.formatTimeRemaining(ms);
      
      // Then: Should show 30 days
      expect(result.days).toBe(30);
      expect(result.hours).toBe(720); // 30 * 24
      expect(result.formatted).toContain('30 ngày');
    });

    // TC-FT-06: totalMs should be preserved
    test('should preserve totalMs in result', () => {
      // Given: Any value
      const ms = 12345678;
      
      // When: Format time remaining
      const result = CookieAnalyzerService.formatTimeRemaining(ms);
      
      // Then: totalMs should match input
      expect(result.totalMs).toBe(ms);
    });
  });
});
