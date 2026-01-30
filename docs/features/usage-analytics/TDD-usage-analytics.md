# Technical Design Document (TDD)

# Usage Analytics Dashboard

> **Feature**: Usage Analytics Dashboard
> **Version**: 1.0
> **Created**: 2026-01-30
> **Status**: DRAFT

## 1. Architecture Overview

### 1.1 System Context

```
[Download Folder] -> [UsageAnalyticsService] -> [Cache] -> [API] -> [Dashboard UI]
       |                      |                   |         |          |
   CSV Files            Parse & Calculate    In-Memory   REST API   React UI
```

### 1.2 Technology Stack

- **Backend**: Node.js + Express (existing)
- **CSV Parser**: csv-parser library
- **Caching**: Node.js Map với TTL
- **Frontend**: React + TypeScript + TailwindCSS + shadcn/ui
- **Charts**: Recharts library
- **File System**: fs/promises

## 2. Data Models

### 2.1 CSV Data Structure (Input)

```typescript
interface CursorUsageRecord {
  Date: string; // "2026-01-22T09:14:08.730Z"
  Kind: string; // "free"
  Model: string; // "auto"
  MaxMode: string; // "No"
  InputWithCache: number; // Input tokens with cache write
  InputWithoutCache: number; // Input tokens without cache
  CacheRead: number; // Cache read tokens
  OutputTokens: number; // Output tokens
  TotalTokens: number; // Total tokens
  Cost: number; // Cost in USD
}
```

### 2.2 Analytics Data Structure (Output)

```typescript
interface AccountUsageAnalytics {
  email: string;
  totalTokens30d: number;
  totalCost30d: number;
  usagePercentage: number; // % of 2M limit
  averageCostPerDay: number;
  mostActiveDay: string;
  tokenEfficiency: number; // Output/Input ratio
  usageTrend: "increasing" | "decreasing" | "stable";
  daysUntilLimit: number; // Estimated days until hitting limit
  riskLevel: "low" | "medium" | "high" | "critical";
  dailyUsage: DailyUsage[];
}

interface DailyUsage {
  date: string;
  totalTokens: number;
  cost: number;
  sessions: number;
}

interface UsageOverview {
  totalAccounts: number;
  totalTokens30d: number;
  totalCost30d: number;
  averageUsagePerAccount: number;
  highRiskAccounts: number;
  accounts: AccountUsageAnalytics[];
}
```

## 3. Backend Design

### 3.1 UsageAnalyticsService

**File**: `src/services/usage-analytics.service.js`

```javascript
class UsageAnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Main methods
  async getUsageOverview()
  async getAccountAnalytics(email)
  async refreshAnalytics()

  // Private methods
  async scanDownloadFolder()
  async parseCsvFile(filePath)
  calculateAccountMetrics(records, email)
  calculateUsageTrend(dailyUsage)
  estimateDaysUntilLimit(dailyUsage)
  determineRiskLevel(usagePercentage)
}
```

**Key Algorithms:**

1. **Usage Trend Calculation**:

   ```javascript
   // Compare last 7 days vs previous 7 days
   const recentAvg = last7Days.reduce((sum, day) => sum + day.tokens, 0) / 7;
   const previousAvg =
     previous7Days.reduce((sum, day) => sum + day.tokens, 0) / 7;
   const changePercent = ((recentAvg - previousAvg) / previousAvg) * 100;
   ```

2. **Days Until Limit**:
   ```javascript
   const remainingTokens = 2000000 - totalTokens30d;
   const avgDailyUsage = totalTokens30d / 30;
   const daysUntilLimit = Math.floor(remainingTokens / avgDailyUsage);
   ```

### 3.2 DownloadHistoryService

**File**: `src/services/download-history.service.js`

```javascript
class DownloadHistoryService {
  async getDownloadHistory() {
    // Scan download folder for CSV files
    // Return real file data instead of mock
  }

  async getFileStats(filePath) {
    // Get file size, modified date, etc.
  }
}
```

### 3.3 API Routes

**File**: `src/routes/usage-analytics.routes.js`

```javascript
import express from "express";
import UsageAnalyticsService from "../services/usage-analytics.service.js";
import DownloadHistoryService from "../services/download-history.service.js";

// GET /api/usage-analytics/overview
router.get("/overview", async (req, res) => {
  const overview = await UsageAnalyticsService.getUsageOverview();
});

// GET /api/usage-analytics/account/:email
router.get("/account/:email", async (req, res) => {
  const analytics = await UsageAnalyticsService.getAccountAnalytics(email);
});

// POST /api/usage-analytics/refresh
router.post("/refresh", async (req, res) => {
  const overview = await UsageAnalyticsService.refreshAnalytics();
});

// GET /api/download-history
router.get("/download-history", async (req, res) => {
  const history = await DownloadHistoryService.getDownloadHistory();
});
```

**⚠️ Important**: Service names must match import statements exactly:

- Import: `UsageAnalyticsService` → Usage: `UsageAnalyticsService`
- Import: `DownloadHistoryService` → Usage: `DownloadHistoryService`

## 4. Frontend Design

### 4.1 Component Structure

```
UsageAnalyticsDashboard/
├── UsageOverviewCards/
│   ├── TotalUsageCard
│   ├── HighRiskAccountsCard
│   └── AverageUsageCard
├── AccountRankingTable/
├── UsageTrendsChart/
├── RiskAlertsPanel/
└── AccountDetailModal/
```

### 4.2 UsageAnalyticsDashboard Component

**File**: `client/src/components/UsageAnalyticsDashboard.tsx`

```typescript
interface UsageAnalyticsDashboardProps {
  // No props - self-contained
}

export function UsageAnalyticsDashboard() {
  const [overview, setOverview] = useState<UsageOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  // Hooks
  useEffect(() => {
    fetchUsageOverview();
  }, []);

  // Methods
  const fetchUsageOverview = async () => { /* ... */ };
  const handleRefresh = async () => { /* ... */ };
  const handleAccountSelect = (email: string) => { /* ... */ };

  return (
    <div className="space-y-6">
      <UsageOverviewCards overview={overview} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AccountRankingTable
          accounts={overview?.accounts}
          onAccountSelect={handleAccountSelect}
        />
        <RiskAlertsPanel accounts={overview?.accounts} />
      </div>
      <UsageTrendsChart accounts={overview?.accounts} />
      {selectedAccount && (
        <AccountDetailModal
          email={selectedAccount}
          onClose={() => setSelectedAccount(null)}
        />
      )}
    </div>
  );
}
```

### 4.3 Key UI Components

#### UsageOverviewCards

- 4 cards: Total Usage, Total Cost, Active Accounts, High Risk
- Color coding: Green (safe), Yellow (warning), Red (critical)
- Progress bars for visual representation

#### AccountRankingTable

- Sortable table: Email, Usage, %, Cost, Risk Level
- Click to view details
- Risk level badges with colors

#### RiskAlertsPanel

- List of accounts > 80% limit
- Days until limit estimation
- Quick action buttons

#### UsageTrendsChart

- Line chart showing usage over time
- Multiple accounts comparison
- Recharts implementation

## 5. Data Flow

### 5.1 Initial Load

1. Frontend calls `/api/usage-analytics/overview`
2. Backend checks cache, if miss:
   - Scan download folder for CSV files
   - Parse each CSV file
   - Calculate analytics for each account
   - Cache results
3. Return aggregated overview data
4. Frontend renders dashboard

### 5.2 Refresh Flow

1. User clicks refresh button
2. Frontend calls `/api/usage-analytics/refresh`
3. Backend clears cache and re-processes all files
4. Return updated data
5. Frontend updates UI

### 5.3 Account Detail Flow

1. User clicks account in table
2. Frontend calls `/api/usage-analytics/account/:email`
3. Backend returns detailed analytics for that account
4. Frontend shows modal with charts and details

## 6. Implementation Files

### 6.1 Backend Files

- `src/services/usage-analytics.service.js` - Main analytics service
- `src/services/download-history.service.js` - File scanning service
- `src/routes/usage-analytics.routes.js` - API routes
- `package.json` - Add csv-parser dependency

### 6.2 Frontend Files

- `client/src/components/UsageAnalyticsDashboard.tsx` - Main dashboard
- `client/src/components/usage-analytics/UsageOverviewCards.tsx` - Overview cards
- `client/src/components/usage-analytics/AccountRankingTable.tsx` - Ranking table
- `client/src/components/usage-analytics/RiskAlertsPanel.tsx` - Risk alerts
- `client/src/components/usage-analytics/UsageTrendsChart.tsx` - Charts
- `client/src/components/usage-analytics/AccountDetailModal.tsx` - Detail modal
- `client/src/hooks/useUsageAnalytics.ts` - Custom hook
- `client/package.json` - Add recharts dependency

### 6.3 Modified Files

- `src/app.js` - Add usage analytics routes
- `client/src/components/DownloadHistory.tsx` - Fix mock data issue
- `client/src/App.tsx` - Add usage analytics dashboard

## 7. Error Handling

### 7.1 Backend Error Scenarios

- CSV file not found or corrupted
- Invalid CSV format
- File permission issues
- Memory issues with large files

### 7.2 Frontend Error Scenarios

- API call failures
- Network timeouts
- Invalid data format
- Chart rendering errors

### 7.3 Error Recovery

- Graceful degradation when data unavailable
- Retry mechanisms for transient failures
- User-friendly error messages
- Fallback to cached data when possible

## 8. Performance Considerations

### 8.1 Optimization Strategies

- Cache parsed CSV data for 5 minutes
- Lazy load account details
- Pagination for large account lists
- Debounce refresh requests

### 8.2 Memory Management

- Stream large CSV files instead of loading entirely
- Clear old cache entries automatically
- Limit concurrent file processing

### 8.3 UI Performance

- Virtual scrolling for large tables
- Memoize expensive calculations
- Optimize chart re-renders

## 9. Security Considerations

### 9.1 Data Access

- Validate file paths to prevent directory traversal
- Sanitize email parameters
- Rate limiting on refresh endpoint

### 9.2 Data Privacy

- No sensitive data logging
- Secure file access permissions
- Client-side data cleanup on unmount

## 10. Testing Strategy

### 10.1 Unit Tests

- CSV parsing logic
- Analytics calculations
- Error handling scenarios

### 10.2 Integration Tests

- API endpoint responses
- File system interactions
- Cache behavior

### 10.3 UI Tests

- Component rendering
- User interactions
- Error states

## 11. Deployment Considerations

### 11.1 Dependencies

- Add csv-parser to backend package.json
- Add recharts to frontend package.json
- Ensure download folder exists and is writable

### 11.2 Configuration

- Make usage limit configurable
- Cache timeout configurable
- File path configurable

### 11.3 Monitoring

- Log analytics calculation times
- Monitor cache hit rates
- Track API response times
