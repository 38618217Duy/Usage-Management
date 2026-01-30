/**
 * Session History Model Tests
 * 
 * Test Perspective Table:
 * | Case ID | Input / Precondition | Perspective | Expected Result | Notes |
 * |---------|---------------------|-------------|-----------------|-------|
 * | TC-GS-01 | Account with history | Equivalence - normal | Correct statistics | - |
 * | TC-GS-02 | Account with no history | Boundary - empty | Default values | - |
 * | TC-GS-03 | History with null durations | Boundary - NULL | Default 7 days avg | - |
 * | TC-GS-04 | Single session | Boundary - minimum | Stats from 1 session | - |
 * | TC-RS-01 | Valid login/expiry dates | Equivalence - normal | Correct duration calc | - |
 * | TC-RS-02 | Same login and expiry | Boundary - zero | null duration | - |
 * | TC-RS-03 | Expiry before login | Boundary - negative | null duration | - |
 */

import { jest } from '@jest/globals';

// Mock fs/promises
const mockReadFile = jest.fn();
const mockWriteFile = jest.fn();
const mockAccess = jest.fn();

jest.unstable_mockModule('fs/promises', () => ({
  default: {
    readFile: mockReadFile,
    writeFile: mockWriteFile,
    access: mockAccess,
  },
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  access: mockAccess,
}));

// Mock config
jest.unstable_mockModule('../config/index.js', () => ({
  default: {
    paths: {
      root: '/app/root'
    }
  }
}));

// Mock logger
jest.unstable_mockModule('../utils/logger.js', () => ({
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }
}));

// Import after mocking
const { SessionHistoryModel } = await import('../models/session-history.js');

describe('SessionHistoryModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccess.mockResolvedValue(undefined);
  });

  describe('getStatistics', () => {
    // TC-GS-01: Account with history
    test('should calculate correct statistics for account with history', async () => {
      // Given: Account with multiple session records
      const mockHistory = {
        history: [
          { accountId: 'acc-1', loginAt: '2024-01-01', durationDays: 7 },
          { accountId: 'acc-1', loginAt: '2024-01-08', durationDays: 8 },
          { accountId: 'acc-1', loginAt: '2024-01-16', durationDays: 6 },
        ]
      };
      mockReadFile.mockResolvedValue(JSON.stringify(mockHistory));
      
      // When: Get statistics
      const result = await SessionHistoryModel.getStatistics('acc-1');
      
      // Then: Should calculate correct averages
      expect(result.totalSessions).toBe(3);
      expect(result.averageDurationDays).toBe(7); // (7+8+6)/3 = 7
      expect(result.minDurationDays).toBe(6);
      expect(result.maxDurationDays).toBe(8);
    });

    // TC-GS-02: Account with no history
    test('should return default values for account with no history', async () => {
      // Given: Empty history
      const mockHistory = { history: [] };
      mockReadFile.mockResolvedValue(JSON.stringify(mockHistory));
      
      // When: Get statistics
      const result = await SessionHistoryModel.getStatistics('acc-1');
      
      // Then: Should return default values
      expect(result.totalSessions).toBe(0);
      expect(result.averageDurationDays).toBeNull();
      expect(result.minDurationDays).toBeNull();
      expect(result.maxDurationDays).toBeNull();
      expect(result.predictedNextExpiry).toBeNull();
    });

    // TC-GS-03: History with null durations
    test('should return default 7 days when all durations are null', async () => {
      // Given: History with null durations
      const mockHistory = {
        history: [
          { accountId: 'acc-1', loginAt: '2024-01-01', durationDays: null },
          { accountId: 'acc-1', loginAt: '2024-01-08', durationDays: null },
        ]
      };
      mockReadFile.mockResolvedValue(JSON.stringify(mockHistory));
      
      // When: Get statistics
      const result = await SessionHistoryModel.getStatistics('acc-1');
      
      // Then: Should return default 7 days average
      expect(result.totalSessions).toBe(2);
      expect(result.averageDurationDays).toBe(7);
      expect(result.minDurationDays).toBeNull();
      expect(result.maxDurationDays).toBeNull();
    });

    // TC-GS-04: Single session
    test('should calculate statistics from single session', async () => {
      // Given: Single session record
      const mockHistory = {
        history: [
          { accountId: 'acc-1', loginAt: '2024-01-01', durationDays: 10 },
        ]
      };
      mockReadFile.mockResolvedValue(JSON.stringify(mockHistory));
      
      // When: Get statistics
      const result = await SessionHistoryModel.getStatistics('acc-1');
      
      // Then: Should use single value for all stats
      expect(result.totalSessions).toBe(1);
      expect(result.averageDurationDays).toBe(10);
      expect(result.minDurationDays).toBe(10);
      expect(result.maxDurationDays).toBe(10);
    });

    // TC-GS-05: Mixed valid and null durations
    test('should only use valid durations for calculation', async () => {
      // Given: Mix of valid and null durations
      const mockHistory = {
        history: [
          { accountId: 'acc-1', loginAt: '2024-01-01', durationDays: 5 },
          { accountId: 'acc-1', loginAt: '2024-01-06', durationDays: null },
          { accountId: 'acc-1', loginAt: '2024-01-13', durationDays: 10 },
          { accountId: 'acc-1', loginAt: '2024-01-23', durationDays: 0 }, // 0 is filtered out
        ]
      };
      mockReadFile.mockResolvedValue(JSON.stringify(mockHistory));
      
      // When: Get statistics
      const result = await SessionHistoryModel.getStatistics('acc-1');
      
      // Then: Should only use valid durations (5 and 10)
      expect(result.totalSessions).toBe(4);
      expect(result.averageDurationDays).toBe(7.5); // (5+10)/2
      expect(result.minDurationDays).toBe(5);
      expect(result.maxDurationDays).toBe(10);
    });
  });

  describe('getByAccountId', () => {
    // TC-GA-01: Get history for specific account
    test('should return only history for specified account', async () => {
      // Given: History with multiple accounts
      const mockHistory = {
        history: [
          { accountId: 'acc-1', loginAt: '2024-01-01T10:00:00Z' },
          { accountId: 'acc-2', loginAt: '2024-01-02T10:00:00Z' },
          { accountId: 'acc-1', loginAt: '2024-01-03T10:00:00Z' },
        ]
      };
      mockReadFile.mockResolvedValue(JSON.stringify(mockHistory));
      
      // When: Get history for acc-1
      const result = await SessionHistoryModel.getByAccountId('acc-1');
      
      // Then: Should return only acc-1 records, sorted by loginAt desc
      expect(result.length).toBe(2);
      expect(result.every(h => h.accountId === 'acc-1')).toBe(true);
      // Should be sorted by loginAt descending
      expect(new Date(result[0].loginAt) > new Date(result[1].loginAt)).toBe(true);
    });

    // TC-GA-02: Account with no history
    test('should return empty array for account with no history', async () => {
      // Given: History without target account
      const mockHistory = {
        history: [
          { accountId: 'acc-2', loginAt: '2024-01-01' },
        ]
      };
      mockReadFile.mockResolvedValue(JSON.stringify(mockHistory));
      
      // When: Get history for acc-1
      const result = await SessionHistoryModel.getByAccountId('acc-1');
      
      // Then: Should return empty array
      expect(result).toEqual([]);
    });
  });

  describe('recordSessionExpiry', () => {
    beforeEach(() => {
      mockWriteFile.mockResolvedValue(undefined);
    });

    // TC-RS-01: Valid login/expiry dates
    test('should calculate correct duration for valid dates', async () => {
      // Given: Login and expiry 7 days apart
      const mockHistory = { history: [] };
      mockReadFile.mockResolvedValue(JSON.stringify(mockHistory));
      
      const loginAt = '2024-01-01T00:00:00.000Z';
      const expiryAt = '2024-01-08T00:00:00.000Z'; // 7 days later
      
      // When: Record session expiry
      const result = await SessionHistoryModel.recordSessionExpiry(
        'acc-1', 
        loginAt, 
        expiryAt, 
        'cookie'
      );
      
      // Then: Duration should be 7 days
      expect(result.durationDays).toBe(7);
      expect(result.accountId).toBe('acc-1');
      expect(result.expirySource).toBe('cookie');
    });

    // TC-RS-02: Same login and expiry (zero duration)
    test('should return null duration when login equals expiry', async () => {
      // Given: Same login and expiry time
      const mockHistory = { history: [] };
      mockReadFile.mockResolvedValue(JSON.stringify(mockHistory));
      
      const sameTime = '2024-01-01T00:00:00.000Z';
      
      // When: Record session expiry
      const result = await SessionHistoryModel.recordSessionExpiry(
        'acc-1', 
        sameTime, 
        sameTime, 
        'estimated'
      );
      
      // Then: Duration should be null (0 is not > 0)
      expect(result.durationDays).toBeNull();
    });

    // TC-RS-03: Expiry before login (negative duration)
    test('should return null duration when expiry is before login', async () => {
      // Given: Expiry before login (invalid case)
      const mockHistory = { history: [] };
      mockReadFile.mockResolvedValue(JSON.stringify(mockHistory));
      
      const loginAt = '2024-01-08T00:00:00.000Z';
      const expiryAt = '2024-01-01T00:00:00.000Z'; // Before login
      
      // When: Record session expiry
      const result = await SessionHistoryModel.recordSessionExpiry(
        'acc-1', 
        loginAt, 
        expiryAt, 
        'estimated'
      );
      
      // Then: Duration should be null (negative is not > 0)
      expect(result.durationDays).toBeNull();
    });

    // TC-RS-04: Fractional days
    test('should round duration to 1 decimal place', async () => {
      // Given: 7.5 days duration
      const mockHistory = { history: [] };
      mockReadFile.mockResolvedValue(JSON.stringify(mockHistory));
      
      const loginAt = '2024-01-01T00:00:00.000Z';
      const expiryAt = '2024-01-08T12:00:00.000Z'; // 7.5 days later
      
      // When: Record session expiry
      const result = await SessionHistoryModel.recordSessionExpiry(
        'acc-1', 
        loginAt, 
        expiryAt, 
        'cookie'
      );
      
      // Then: Duration should be 7.5
      expect(result.durationDays).toBe(7.5);
    });
  });

  describe('Error handling', () => {
    // TC-EH-01: File read error
    test('should return empty array when file read fails', async () => {
      // Given: File read throws error
      mockReadFile.mockRejectedValue(new Error('ENOENT: file not found'));
      mockAccess.mockRejectedValue(new Error('ENOENT'));
      mockWriteFile.mockResolvedValue(undefined);
      
      // When: Try to read all
      const result = await SessionHistoryModel.readAll();
      
      // Then: Should return empty array (graceful degradation)
      expect(result).toEqual([]);
    });

    // TC-EH-02: File write error
    test('should throw error when file write fails', async () => {
      // Given: File write throws error
      mockWriteFile.mockRejectedValue(new Error('ENOSPC: no space left'));
      
      // When/Then: Should throw error
      await expect(SessionHistoryModel.writeAll([]))
        .rejects
        .toThrow('Failed to save session history');
    });
  });
});
