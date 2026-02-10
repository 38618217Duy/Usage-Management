import { useState } from 'react';
import { RefreshCw, Loader2, Users, CheckCircle, AlertTriangle, Download, Wind } from 'lucide-react';
import { useWindsurfAccounts } from '../hooks/useWindsurfAccounts';
import { WindsurfAccountCard } from './WindsurfAccountCard';
import { WindsurfAddAccountForm } from './WindsurfAddAccountForm';
import type { WindsurfRunAllResult } from '../types/windsurf';

export function WindsurfDashboard() {
  const {
    accounts,
    loading,
    error,
    refresh,
    addAccount,
    deleteAccount,
    openBrowser,
    verifyLogin,
    scrapeUsage,
    runAll,
  } = useWindsurfAccounts();

  const [runningAll, setRunningAll] = useState(false);
  const [runResult, setRunResult] = useState<WindsurfRunAllResult | null>(null);

  const handleRunAll = async () => {
    setRunningAll(true);
    setRunResult(null);
    
    const result = await runAll();
    
    if (result.success && result.data) {
      setRunResult(result.data);
    }
    
    setRunningAll(false);
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
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Wind className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Windsurf Usage Scraper</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage Windsurf accounts and scrape usage data
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
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
                disabled={runningAll || loggedInCount === 0}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {runningAll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Scrape All ({loggedInCount})
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
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

        {/* Run All Results */}
        {runResult && (
          <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Scrape All Results</h3>
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

        {/* Add Account Form */}
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Windsurf Account</h2>
          <WindsurfAddAccountForm onAdd={addAccount} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800">
            {error}
          </div>
        )}

        {/* Accounts Grid */}
        {loading && accounts.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Wind className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No Windsurf accounts yet. Add your first account above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <WindsurfAccountCard
                key={account.id}
                account={account}
                onOpenBrowser={openBrowser}
                onVerify={verifyLogin}
                onScrape={scrapeUsage}
                onDelete={deleteAccount}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            Windsurf Usage Scraper v1.0.0
          </p>
        </div>
      </footer>
    </div>
  );
}

export default WindsurfDashboard;
