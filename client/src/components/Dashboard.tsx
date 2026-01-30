import { useState, useEffect } from 'react';
import { RefreshCw, Loader2, Users, CheckCircle, AlertTriangle, Download, Wifi, WifiOff, BarChart3, Settings, Clock } from 'lucide-react';
import useAccounts from '../hooks/useAccounts';
import AccountCard from './AccountCard';
import AddAccountForm from './AddAccountForm';
import DownloadHistory from './DownloadHistory';
import { UsageAnalyticsDashboard } from './UsageAnalyticsDashboard';
import { SessionStatusDashboard } from './session-tracking/SessionStatusDashboard';
import { api } from '../lib/api';
import type { RunAllResult } from '../types/account';

export function Dashboard() {
  const {
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
  } = useAccounts();

  const [runningAll, setRunningAll] = useState(false);
  const [runResult, setRunResult] = useState<RunAllResult | null>(null);
  const [cdpConnected, setCdpConnected] = useState(false);
  const [checkingCdp, setCheckingCdp] = useState(false);
  const [activeTab, setActiveTab] = useState<'accounts' | 'analytics' | 'sessions'>('accounts');

  // Check CDP status on mount
  useEffect(() => {
    checkCdpStatus();
  }, []);

  const checkCdpStatus = async () => {
    try {
      const result = await api.automation.getCdpStatus();
      if (result.success && result.data) {
        setCdpConnected(result.data.connected);
      }
    } catch (err) {
      setCdpConnected(false);
    }
  };

  const handleConnectCdp = async () => {
    setCheckingCdp(true);
    try {
      const result = await api.automation.connectCdp();
      if (result.success) {
        setCdpConnected(true);
      }
    } catch (err) {
      setCdpConnected(false);
    }
    setCheckingCdp(false);
  };

  const handleRunAll = async () => {
    setRunningAll(true);
    setRunResult(null);
    
    const result = await runAll();
    
    if (result.success && result.data) {
      setRunResult(result.data);
    }
    
    setRunningAll(false);
  };

  // Callback để refresh Download History khi có download thành công
  const handleDownloadSuccess = () => {
    // Trigger refresh của DownloadHistory component
    // Sẽ được implement thông qua context hoặc event system
  };

  const loggedInCount = accounts.filter(a => a.status === 'LOGGED_IN').length;
  const expiredCount = accounts.filter(a => a.status === 'SESSION_EXPIRED').length;
  const notLoggedInCount = accounts.filter(a => a.status === 'NOT_LOGGED_IN').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cursor Usage Automation</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage accounts and download usage CSV files
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                {cdpConnected ? (
                  <Wifi className="w-4 h-4 text-green-600" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm font-medium">
                  CDP: {cdpConnected ? 'Connected' : 'Disconnected'}
                </span>
                {!cdpConnected && (
                  <button
                    onClick={handleConnectCdp}
                    disabled={checkingCdp}
                    className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {checkingCdp ? 'Connecting...' : 'Connect'}
                  </button>
                )}
              </div>
              
              <button
                onClick={refresh}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              
              <button
                onClick={handleRunAll}
                disabled={runningAll || loggedInCount === 0 || !cdpConnected}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={!cdpConnected ? 'Chrome CDP connection required' : ''}
              >
                {runningAll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Download All ({loggedInCount})
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('accounts')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'accounts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Account Management
                </div>
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'analytics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Usage Analytics
                </div>
              </button>
              <button
                onClick={() => setActiveTab('sessions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'sessions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Session Status
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'sessions' ? (
          <SessionStatusDashboard />
        ) : activeTab === 'accounts' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Accounts</p>
                <p className="text-2xl font-bold text-gray-900">{accounts.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Logged In</p>
                <p className="text-2xl font-bold text-gray-900">{loggedInCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Need Attention</p>
                <p className="text-2xl font-bold text-gray-900">{expiredCount + notLoggedInCount}</p>
              </div>
            </div>
          </div>
        </div>

        {!cdpConnected && (
          <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-5">
            <div className="flex items-center gap-3">
              <WifiOff className="w-6 h-6 text-yellow-600" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800">Chrome CDP Required</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  To bypass 403 Forbidden errors, you need to launch Chrome with remote debugging:
                </p>
                <code className="block mt-2 p-2 bg-yellow-100 rounded text-xs text-yellow-800">
                [Windows]   "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\chrome-cdp"
                </code>
                <code className="block mt-2 p-2 bg-yellow-100 rounded text-xs text-yellow-800">
                [MacOS] /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --user-data-dir="$HOME/Library/Application Support/Google/Chrome"
                </code>
                <code className="block mt-2 p-2 bg-yellow-100 rounded text-xs text-yellow-800">
                [Linux] google-chrome --remote-debugging-port=9222 --user-data-dir="$HOME/.config/google-chrome"
                </code>
                <p className="text-sm text-yellow-700 mt-2">
                  Then login to Cursor in Chrome and click "Connect" above.
                </p>
              </div>
            </div>
          </div>
        )}

        {runResult && (
          <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Download All Results</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{runResult.total}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{runResult.successful}</p>
                <p className="text-sm text-gray-500">Successful</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{runResult.failed}</p>
                <p className="text-sm text-gray-500">Failed</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{runResult.skipped}</p>
                <p className="text-sm text-gray-500">Skipped</p>
              </div>
            </div>
            {runResult.results.length > 0 && (
              <div className="space-y-2">
                {runResult.results.map((r) => (
                  <div 
                    key={r.id} 
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      r.success ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    <span className="font-medium">{r.email}</span>
                    <span className={r.success ? 'text-green-600' : 'text-red-600'}>
                      {r.success ? 'Success' : r.error}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Account</h2>
            <AddAccountForm onAdd={addAccount} />
          </div>
          <DownloadHistory />
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
            {error}
          </div>
        )}

        {loading && accounts.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No accounts yet. Add your first account above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onOpenBrowser={openBrowser}
                onVerify={verifyLogin}
                onDownload={downloadCSV}
                onDelete={deleteAccount}
                onDownloadSuccess={handleDownloadSuccess}
              />
            ))}
          </div>
        )}
          </>
        ) : (
          <UsageAnalyticsDashboard />
        )}
      </main>

      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            Cursor Usage Automation v1.0.0
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Dashboard;
