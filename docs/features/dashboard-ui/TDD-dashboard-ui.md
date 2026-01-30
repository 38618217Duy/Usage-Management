# TDD: Dashboard UI

> **Feature**: Dashboard UI | **Version**: 1.0 | **Complexity**: Medium
> **Created**: 2026-01-29 | **Updated**: 2026-01-29

---

## 1. Kiến trúc tổng quan

### 1.1 Component Tree

```
App
 └── Dashboard
      ├── Header
      │    ├── Title
      │    ├── CDP Status Indicator
      │    ├── Refresh Button
      │    └── Download All Button
      │
      ├── Statistics Cards
      │    ├── Total Accounts Card
      │    ├── Logged In Card
      │    └── Need Attention Card
      │
      ├── CDP Warning Banner (conditional)
      │
      ├── Download Results (conditional)
      │
      ├── Content Grid
      │    ├── AddAccountForm
      │    └── DownloadHistory
      │
      └── Account Grid
           └── AccountCard (multiple)
                ├── StatusBadge
                └── Action Buttons
```

---

## 2. Frontend Implementation

### 2.1 Dashboard Component (`client/src/components/Dashboard.tsx`)

#### State

```typescript
const [runningAll, setRunningAll] = useState(false);
const [runResult, setRunResult] = useState<RunAllResult | null>(null);
const [cdpConnected, setCdpConnected] = useState(false);
const [checkingCdp, setCheckingCdp] = useState(false);
```

#### Effects

```typescript
// Check CDP status on mount
useEffect(() => {
  checkCdpStatus();
}, []);
```

#### Computed Values

```typescript
const loggedInCount = accounts.filter(a => a.status === 'LOGGED_IN').length;
const expiredCount = accounts.filter(a => a.status === 'SESSION_EXPIRED').length;
const notLoggedInCount = accounts.filter(a => a.status === 'NOT_LOGGED_IN').length;
```

### 2.2 AccountCard Component (`client/src/components/AccountCard.tsx`)

#### Props

```typescript
interface AccountCardProps {
  account: Account;
  onOpenBrowser: (id: string) => Promise<ApiResponse>;
  onVerify: (id: string) => Promise<ApiResponse>;
  onDownload: (id: string) => Promise<ApiResponse>;
  onDelete: (id: string) => Promise<ApiResponse>;
}
```

#### State

```typescript
const [loading, setLoading] = useState<string | null>(null);
// loading = 'browser' | 'verify' | 'download' | 'delete' | null
```

### 2.3 AddAccountForm Component (`client/src/components/AddAccountForm.tsx`)

#### Props

```typescript
interface AddAccountFormProps {
  onAdd: (email: string) => Promise<ApiResponse>;
}
```

#### State

```typescript
const [email, setEmail] = useState('');
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### 2.4 StatusBadge Component (`client/src/components/StatusBadge.tsx`)

#### Props

```typescript
interface StatusBadgeProps {
  status: AccountStatus;
}
```

#### Styling

```typescript
const statusStyles = {
  LOGGED_IN: 'bg-green-100 text-green-800',
  NOT_LOGGED_IN: 'bg-gray-100 text-gray-800',
  SESSION_EXPIRED: 'bg-red-100 text-red-800',
};
```

---

## 3. Custom Hook: useAccounts

### 3.1 Implementation (`client/src/hooks/useAccounts.ts`)

```typescript
export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    const result = await api.accounts.getAll();
    if (result.success) {
      setAccounts(result.data);
    } else {
      setError(result.error?.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const addAccount = async (email: string) => {
    const result = await api.accounts.create(email);
    if (result.success) {
      await refresh();
    }
    return result;
  };

  // ... other methods

  return {
    accounts,
    loading,
    error,
    refresh,
    addAccount,
    deleteAccount,
    openBrowser,
    verifyLogin,
    downloadCSV,
    runAll,
  };
}
```

---

## 4. API Client (`client/src/lib/api.ts`)

### 4.1 Structure

```typescript
const BASE_URL = 'http://localhost:3000/api';

export const api = {
  accounts: {
    getAll: () => fetch(`${BASE_URL}/accounts`),
    getById: (id: string) => fetch(`${BASE_URL}/accounts/${id}`),
    create: (email: string) => fetch(`${BASE_URL}/accounts`, { method: 'POST', body: { email } }),
    delete: (id: string) => fetch(`${BASE_URL}/accounts/${id}`, { method: 'DELETE' }),
    openBrowser: (id: string) => fetch(`${BASE_URL}/accounts/${id}/open-browser`, { method: 'POST' }),
    verify: (id: string) => fetch(`${BASE_URL}/accounts/${id}/verify`, { method: 'POST' }),
    download: (id: string) => fetch(`${BASE_URL}/accounts/${id}/download`, { method: 'POST' }),
  },
  automation: {
    runAll: () => fetch(`${BASE_URL}/automation/run-all`, { method: 'POST' }),
    getStatus: () => fetch(`${BASE_URL}/automation/status`),
    getCdpStatus: () => fetch(`${BASE_URL}/automation/cdp/status`),
    connectCdp: () => fetch(`${BASE_URL}/automation/cdp/connect`, { method: 'POST' }),
  },
};
```

---

## 5. TypeScript Types (`client/src/types/account.ts`)

```typescript
export type AccountStatus = 'NOT_LOGGED_IN' | 'LOGGED_IN' | 'SESSION_EXPIRED';

export interface Account {
  id: string;
  email: string;
  profilePath: string;
  status: AccountStatus;
  lastRunAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RunAllResult {
  total: number;
  successful: number;
  failed: number;
  skipped: number;
  results: {
    id: string;
    email: string;
    success: boolean;
    error: string | null;
    filePath: string | null;
  }[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

---

## 6. Data Flow

### 6.1 Load Accounts Flow

```
Dashboard mounts
       │
       ▼
useAccounts hook
       │
       ▼
useEffect → refresh()
       │
       ▼
api.accounts.getAll()
       │
       ▼
setAccounts(data)
       │
       ▼
Render AccountCard for each account
```

### 6.2 Add Account Flow

```
User enters email
       │
       ▼
Click "Add Account"
       │
       ▼
AddAccountForm.handleSubmit()
       │
       ▼
onAdd(email) → useAccounts.addAccount()
       │
       ▼
api.accounts.create(email)
       │
       ▼
Success? → refresh() → Clear form
       │
Error? → Show error message
```

### 6.3 Download All Flow

```
User clicks "Download All"
       │
       ▼
handleRunAll()
       │
       ▼
setRunningAll(true)
       │
       ▼
runAll() → api.automation.runAll()
       │
       ▼
setRunResult(result)
       │
       ▼
setRunningAll(false)
       │
       ▼
Display results summary
```

---

## 7. Styling

### 7.1 TailwindCSS Classes

| Element | Classes |
|---------|---------|
| Container | `min-h-screen bg-gray-50` |
| Header | `bg-white border-b border-gray-200` |
| Card | `bg-white rounded-xl shadow-sm border border-gray-200 p-5` |
| Button Primary | `bg-green-600 text-white rounded-lg hover:bg-green-700` |
| Button Secondary | `bg-white border border-gray-300 text-gray-700 rounded-lg` |
| Grid | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4` |

### 7.2 Icons (Lucide React)

| Icon | Usage |
|------|-------|
| RefreshCw | Refresh button |
| Loader2 | Loading spinner |
| Users | Total accounts |
| CheckCircle | Logged in |
| AlertTriangle | Need attention |
| Download | Download button |
| Wifi / WifiOff | CDP status |
| Trash2 | Delete button |
| ExternalLink | Open browser |

---

## 8. Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.x | UI framework |
| lucide-react | ^0.x | Icons |
| tailwindcss | ^3.x | Styling |
| typescript | ^5.x | Type safety |
| vite | ^5.x | Build tool |
