/**
 * Session Service Tests
 * 
 * Test Perspective Table:
 * | Case ID | Input / Precondition | Perspective | Expected Result | Notes |
 * |---------|---------------------|-------------|-----------------|-------|
 * | TC-N-01 | timeRemainingMs > 3 days | Equivalence - normal | HEALTHY status | - |
 * | TC-N-02 | timeRemainingMs 1-3 days | Equivalence - normal | WARNING status | - |
 * | TC-N-03 | timeRemainingMs < 24h | Equivalence - normal | CRITICAL status | - |
 * | TC-N-04 | timeRemainingMs <= 0 | Equivalence - normal | EXPIRED status | - |
 * | TC-B-01 | timeRemainingMs = null | Boundary - NULL | UNKNOWN status | - |
 * | TC-B-02 | timeRemainingMs = undefined | Boundary - NULL | UNKNOWN status | - |
 * | TC-B-03 | timeRemainingMs = 0 | Boundary - zero | EXPIRED status | Edge case |
 * | TC-B-04 | timeRemainingMs = 24h exactly | Boundary - threshold | WARNING status | At CRITICAL boundary |
 * | TC-B-05 | timeRemainingMs = 3 days exactly | Boundary - threshold | HEALTHY status | At WARNING boundary |
 * | TC-B-06 | timeRemainingMs = negative | Boundary - negative | EXPIRED status | - |
 */

import { SessionService, SessionStatus } from '../services/session.service.js';

describe('SessionService', () => {
  describe('calculateSessionStatus', () => {
    // Given: Time remaining values in milliseconds
    const MS_PER_HOUR = 1000 * 60 * 60;
    const MS_PER_DAY = MS_PER_HOUR * 24;

    describe('Normal cases', () => {
      // TC-N-01: HEALTHY status (> 3 days)
      test('should return HEALTHY when time remaining > 3 days', () => {
        // Given: 4 days remaining
        const timeRemainingMs = 4 * MS_PER_DAY;
        
        // When: Calculate session status
        const result = SessionService.calculateSessionStatus(timeRemainingMs);
        
        // Then: Status should be HEALTHY
        expect(result).toBe(SessionStatus.HEALTHY);
      });

      // TC-N-02: WARNING status (1-3 days)
      test('should return WARNING when time remaining is 1-3 days', () => {
        // Given: 2 days remaining
        const timeRemainingMs = 2 * MS_PER_DAY;
        
        // When: Calculate session status
        const result = SessionService.calculateSessionStatus(timeRemainingMs);
        
        // Then: Status should be WARNING
        expect(result).toBe(SessionStatus.WARNING);
      });

      // TC-N-03: CRITICAL status (< 24h)
      test('should return CRITICAL when time remaining < 24 hours', () => {
        // Given: 12 hours remaining
        const timeRemainingMs = 12 * MS_PER_HOUR;
        
        // When: Calculate session status
        const result = SessionService.calculateSessionStatus(timeRemainingMs);
        
        // Then: Status should be CRITICAL
        expect(result).toBe(SessionStatus.CRITICAL);
      });

      // TC-N-04: EXPIRED status (<= 0)
      test('should return EXPIRED when time remaining <= 0', () => {
        // Given: -1 hour (expired)
        const timeRemainingMs = -1 * MS_PER_HOUR;
        
        // When: Calculate session status
        const result = SessionService.calculateSessionStatus(timeRemainingMs);
        
        // Then: Status should be EXPIRED
        expect(result).toBe(SessionStatus.EXPIRED);
      });
    });

    describe('Boundary cases', () => {
      // TC-B-01: NULL input
      test('should return UNKNOWN when time remaining is null', () => {
        // Given: null value
        const timeRemainingMs = null;
        
        // When: Calculate session status
        const result = SessionService.calculateSessionStatus(timeRemainingMs);
        
        // Then: Status should be UNKNOWN
        expect(result).toBe(SessionStatus.UNKNOWN);
      });

      // TC-B-02: undefined input
      test('should return UNKNOWN when time remaining is undefined', () => {
        // Given: undefined value
        const timeRemainingMs = undefined;
        
        // When: Calculate session status
        const result = SessionService.calculateSessionStatus(timeRemainingMs);
        
        // Then: Status should be UNKNOWN
        expect(result).toBe(SessionStatus.UNKNOWN);
      });

      // TC-B-03: Zero boundary
      test('should return EXPIRED when time remaining is exactly 0', () => {
        // Given: 0 ms remaining
        const timeRemainingMs = 0;
        
        // When: Calculate session status
        const result = SessionService.calculateSessionStatus(timeRemainingMs);
        
        // Then: Status should be EXPIRED
        expect(result).toBe(SessionStatus.EXPIRED);
      });

      // TC-B-04: 24 hours boundary (CRITICAL threshold)
      test('should return WARNING when time remaining is exactly 24 hours', () => {
        // Given: exactly 24 hours remaining (at CRITICAL boundary)
        const timeRemainingMs = 24 * MS_PER_HOUR;
        
        // When: Calculate session status
        const result = SessionService.calculateSessionStatus(timeRemainingMs);
        
        // Then: Status should be WARNING (>= 24h is not CRITICAL)
        expect(result).toBe(SessionStatus.WARNING);
      });

      // TC-B-05: 3 days boundary (WARNING threshold)
      test('should return HEALTHY when time remaining is exactly 3 days', () => {
        // Given: exactly 3 days remaining (at WARNING boundary)
        const timeRemainingMs = 3 * MS_PER_DAY;
        
        // When: Calculate session status
        const result = SessionService.calculateSessionStatus(timeRemainingMs);
        
        // Then: Status should be HEALTHY (>= 3 days is HEALTHY)
        expect(result).toBe(SessionStatus.HEALTHY);
      });

      // TC-B-06: Negative value
      test('should return EXPIRED when time remaining is negative', () => {
        // Given: -1 day (expired yesterday)
        const timeRemainingMs = -1 * MS_PER_DAY;
        
        // When: Calculate session status
        const result = SessionService.calculateSessionStatus(timeRemainingMs);
        
        // Then: Status should be EXPIRED
        expect(result).toBe(SessionStatus.EXPIRED);
      });

      // TC-B-07: Just under 24 hours (CRITICAL)
      test('should return CRITICAL when time remaining is just under 24 hours', () => {
        // Given: 23 hours 59 minutes
        const timeRemainingMs = 24 * MS_PER_HOUR - 60000;
        
        // When: Calculate session status
        const result = SessionService.calculateSessionStatus(timeRemainingMs);
        
        // Then: Status should be CRITICAL
        expect(result).toBe(SessionStatus.CRITICAL);
      });

      // TC-B-08: Just under 3 days (WARNING)
      test('should return WARNING when time remaining is just under 3 days', () => {
        // Given: 2 days 23 hours
        const timeRemainingMs = 3 * MS_PER_DAY - MS_PER_HOUR;
        
        // When: Calculate session status
        const result = SessionService.calculateSessionStatus(timeRemainingMs);
        
        // Then: Status should be WARNING
        expect(result).toBe(SessionStatus.WARNING);
      });
    });
  });

  describe('getTimeRemaining', () => {
    // TC-TR-01: Valid expiry date in future
    test('should return formatted time remaining for future date', () => {
      // Given: Expiry date 2 days from now
      const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      const expiryAt = futureDate.toISOString();
      
      // When: Get time remaining
      const result = SessionService.getTimeRemaining(expiryAt);
      
      // Then: Should return valid time remaining object
      expect(result).not.toBeNull();
      expect(result.days).toBeGreaterThanOrEqual(1);
      expect(result.formatted).toBeDefined();
      expect(result.isExpired).toBeFalsy();
    });

    // TC-TR-02: Expired date
    test('should return expired status for past date', () => {
      // Given: Expiry date 1 day ago
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const expiryAt = pastDate.toISOString();
      
      // When: Get time remaining
      const result = SessionService.getTimeRemaining(expiryAt);
      
      // Then: Should indicate expired
      expect(result).not.toBeNull();
      expect(result.isExpired).toBe(true);
      expect(result.days).toBe(0);
      expect(result.hours).toBe(0);
    });

    // TC-TR-03: Null input
    test('should return null for null expiry date', () => {
      // Given: null expiry
      const expiryAt = null;
      
      // When: Get time remaining
      const result = SessionService.getTimeRemaining(expiryAt);
      
      // Then: Should return null
      expect(result).toBeNull();
    });

    // TC-TR-04: Undefined input
    test('should return null for undefined expiry date', () => {
      // Given: undefined expiry
      const expiryAt = undefined;
      
      // When: Get time remaining
      const result = SessionService.getTimeRemaining(expiryAt);
      
      // Then: Should return null
      expect(result).toBeNull();
    });
  });

  describe('calculateSummary', () => {
    // TC-CS-01: Mixed results
    test('should correctly count each status type', () => {
      // Given: Array of results with different statuses
      const results = [
        { currentStatus: SessionStatus.HEALTHY },
        { currentStatus: SessionStatus.HEALTHY },
        { currentStatus: SessionStatus.WARNING },
        { currentStatus: SessionStatus.CRITICAL },
        { currentStatus: SessionStatus.EXPIRED },
        { currentStatus: SessionStatus.UNKNOWN },
        { error: 'Some error' },
      ];
      
      // When: Calculate summary
      const summary = SessionService.calculateSummary(results);
      
      // Then: Should count correctly
      expect(summary.total).toBe(7);
      expect(summary.healthy).toBe(2);
      expect(summary.warning).toBe(1);
      expect(summary.critical).toBe(1);
      expect(summary.expired).toBe(1);
      expect(summary.unknown).toBe(1);
      expect(summary.errors).toBe(1);
    });

    // TC-CS-02: Empty array
    test('should return zeros for empty array', () => {
      // Given: Empty results array
      const results = [];
      
      // When: Calculate summary
      const summary = SessionService.calculateSummary(results);
      
      // Then: All counts should be 0
      expect(summary.total).toBe(0);
      expect(summary.healthy).toBe(0);
      expect(summary.warning).toBe(0);
      expect(summary.critical).toBe(0);
      expect(summary.expired).toBe(0);
      expect(summary.unknown).toBe(0);
      expect(summary.errors).toBe(0);
    });

    // TC-CS-03: All healthy
    test('should count all as healthy when all are healthy', () => {
      // Given: All healthy results
      const results = [
        { currentStatus: SessionStatus.HEALTHY },
        { currentStatus: SessionStatus.HEALTHY },
        { currentStatus: SessionStatus.HEALTHY },
      ];
      
      // When: Calculate summary
      const summary = SessionService.calculateSummary(results);
      
      // Then: All should be healthy
      expect(summary.total).toBe(3);
      expect(summary.healthy).toBe(3);
      expect(summary.warning).toBe(0);
    });
  });
});
