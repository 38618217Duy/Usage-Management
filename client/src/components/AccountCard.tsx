import { useState } from 'react';
import { 
  Globe, 
  CheckCircle, 
  Download, 
  Trash2, 
  Loader2,
  AlertCircle,
  Clock
} from 'lucide-react';
import type { Account } from '../types/account';
import StatusBadge from './StatusBadge';

interface AccountCardProps {
  account: Account;
  onOpenBrowser: (id: string) => Promise<{ success: boolean; error?: { message: string } }>;
  onVerify: (id: string) => Promise<{ success: boolean; error?: { message: string } }>;
  onDownload: (id: string) => Promise<{ success: boolean; error?: { message: string } }>;
  onDelete: (id: string) => Promise<{ success: boolean; error?: { message: string } }>;
}

type ActionType = 'browser' | 'verify' | 'download' | 'delete' | null;

export function AccountCard({ 
  account, 
  onOpenBrowser, 
  onVerify, 
  onDownload, 
  onDelete 
}: AccountCardProps) {
  const [loadingAction, setLoadingAction] = useState<ActionType>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAction = async (
    action: ActionType, 
    handler: () => Promise<{ success: boolean; error?: { message: string }; message?: string; data?: any }>
  ) => {
    setLoadingAction(action);
    setMessage(null);
    
    const result = await handler();
    
    if (result.success) {
      let successMessage = result.message || 'Action completed successfully';
      
      // Special handling for download success
      if (action === 'download' && result.data?.filePath) {
        const fileName = result.data.fileName || result.data.filePath.split(/[/\\]/).pop();
        successMessage = `✅ CSV downloaded: ${fileName}`;
      }
      
      setMessage({ type: 'success', text: successMessage });
    } else {
      setMessage({ type: 'error', text: result.error?.message || 'Action failed' });
    }
    
    setLoadingAction(null);
    
    setTimeout(() => setMessage(null), 3000);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{account.email}</h3>
          <div className="mt-1">
            <StatusBadge status={account.status} />
          </div>
        </div>
        <button
          onClick={() => handleAction('delete', () => onDelete(account.id))}
          disabled={loadingAction !== null}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          title="Delete account"
        >
          {loadingAction === 'delete' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Trash2 className="w-5 h-5" />
          )}
        </button>
      </div>

      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Last run: {formatDate(account.lastRunAt)}</span>
        </div>
        {account.lastError && (
          <div className="flex items-start gap-2 text-red-600">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="break-all">{account.lastError}</span>
          </div>
        )}
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleAction('browser', () => onOpenBrowser(account.id))}
          disabled={loadingAction !== null}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          {loadingAction === 'browser' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Globe className="w-4 h-4" />
          )}
          Open Browser
        </button>

        <button
          onClick={() => handleAction('verify', () => onVerify(account.id))}
          disabled={loadingAction !== null}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 transition-colors"
        >
          {loadingAction === 'verify' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          Verify Login
        </button>

        <button
          onClick={() => handleAction('download', () => onDownload(account.id))}
          disabled={loadingAction !== null || account.status !== 'LOGGED_IN'}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loadingAction === 'download' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Download CSV
        </button>
      </div>
    </div>
  );
}

export default AccountCard;
