import { useState } from 'react';
import { 
  ExternalLink, 
  Shield, 
  ShieldAlert, 
  ShieldX, 
  Download, 
  Trash2, 
  Loader2,
  CheckCircle,
  AlertTriangle,
  Clock,
  CreditCard
} from 'lucide-react';
import type { WindsurfAccount } from '../types/windsurf';

interface WindsurfAccountCardProps {
  account: WindsurfAccount;
  onOpenBrowser: (id: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  onVerify: (id: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  onScrape: (id: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
}

export function WindsurfAccountCard({ 
  account, 
  onOpenBrowser, 
  onVerify, 
  onScrape, 
  onDelete 
}: WindsurfAccountCardProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAction = async (action: string, fn: () => Promise<any>) => {
    setLoading(action);
    setMessage(null);
    
    try {
      const result = await fn();
      if (result.success) {
        setMessage(result.message || result.data?.message || 'Success');
      } else {
        setMessage(result.error || 'Action failed');
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(null);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const getStatusIcon = () => {
    switch (account.status) {
      case 'LOGGED_IN':
        return <Shield className="w-4 h-4 text-green-600" />;
      case 'SESSION_EXPIRED':
        return <ShieldAlert className="w-4 h-4 text-yellow-600" />;
      default:
        return <ShieldX className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusColor = () => {
    switch (account.status) {
      case 'LOGGED_IN':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'SESSION_EXPIRED':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-red-50 text-red-700 border-red-200';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const formatUsageData = () => {
    if (!account.lastUsageData) return null;
    
    const { creditsRemaining, creditsUsed, creditsTotal, resetDate } = account.lastUsageData;
    
    return (
      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Usage Data</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-600">Remaining:</span>
            <span className="ml-1 font-medium">{creditsRemaining ?? 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-600">Used:</span>
            <span className="ml-1 font-medium">{creditsUsed ?? 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-600">Total:</span>
            <span className="ml-1 font-medium">{creditsTotal ?? 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-600">Reset:</span>
            <span className="ml-1 font-medium">{resetDate || 'N/A'}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {account.email}
          </h3>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border mt-2 ${getStatusColor()}`}>
            {getStatusIcon()}
            {account.status.replace('_', ' ')}
          </div>
        </div>
        <button
          onClick={() => handleAction('delete', () => onDelete(account.id))}
          disabled={loading === 'delete'}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete account"
        >
          {loading === 'delete' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>

      {formatUsageData()}

      <div className="mt-4 space-y-2 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3" />
          <span>Last run: {formatDate(account.lastRunAt)}</span>
        </div>
        {account.lastLoginAt && (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3" />
            <span>Last login: {formatDate(account.lastLoginAt)}</span>
          </div>
        )}
        {account.lastError && (
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-3 h-3" />
            <span className="truncate">Error: {account.lastError}</span>
          </div>
        )}
      </div>

      {message && (
        <div className={`mt-3 p-2 rounded-lg text-xs ${
          message.includes('Success') || message.includes('verified') 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => handleAction('browser', () => onOpenBrowser(account.id))}
          disabled={loading === 'browser'}
          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading === 'browser' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ExternalLink className="w-4 h-4" />
          )}
          Login
        </button>

        <button
          onClick={() => handleAction('verify', () => onVerify(account.id))}
          disabled={loading === 'verify'}
          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading === 'verify' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Shield className="w-4 h-4" />
          )}
          Verify
        </button>

        <button
          onClick={() => handleAction('scrape', () => onScrape(account.id))}
          disabled={loading === 'scrape' || account.status !== 'LOGGED_IN'}
          className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={account.status !== 'LOGGED_IN' ? 'Account must be logged in to scrape' : ''}
        >
          {loading === 'scrape' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Scrape
        </button>
      </div>
    </div>
  );
}

export default WindsurfAccountCard;
