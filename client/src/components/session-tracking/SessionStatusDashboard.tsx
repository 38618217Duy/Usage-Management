import { useState } from 'react';
import { 
  useSessionSummary, 
  checkAllSessions,
  type AccountSessionStatus,
} from '../../hooks/useSessionStatus';
import { SessionHistoryPanel } from './SessionHistoryPanel';
import { BatchLoginModal } from './BatchLoginModal';

const statusConfig = {
  EXPIRED: {
    label: 'Đã hết hạn',
    color: 'bg-red-900 border-red-700',
    textColor: 'text-red-200',
    badgeColor: 'bg-red-600',
    icon: '🔴',
  },
  CRITICAL: {
<<<<<<< HEAD
    label: 'Cần login ngay (<24h)',
=======
    label: 'Cần login ngay (<72h)',
>>>>>>> e33bf86d37c801511d5e2e71766cfaabfc44e283
    color: 'bg-orange-900 border-orange-700',
    textColor: 'text-orange-200',
    badgeColor: 'bg-orange-600',
    icon: '🟠',
  },
  WARNING: {
    label: 'Sắp hết hạn (1-3 ngày)',
    color: 'bg-yellow-900 border-yellow-700',
    textColor: 'text-yellow-200',
    badgeColor: 'bg-yellow-600',
    icon: '🟡',
  },
  HEALTHY: {
    label: 'Còn hạn (>3 ngày)',
    color: 'bg-green-900 border-green-700',
    textColor: 'text-green-200',
    badgeColor: 'bg-green-600',
    icon: '🟢',
  },
  UNKNOWN: {
    label: 'Chưa kiểm tra',
    color: 'bg-gray-800 border-gray-600',
    textColor: 'text-gray-300',
    badgeColor: 'bg-gray-600',
    icon: '⚪',
  },
};

type StatusKey = keyof typeof statusConfig;

export function SessionStatusDashboard() {
  const { data, loading, error, refetch } = useSessionSummary();
  const [checking, setChecking] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showBatchLogin, setShowBatchLogin] = useState(false);
  const [selectedForBatch, setSelectedForBatch] = useState<Set<string>>(new Set());

  const handleCheckAll = async () => {
    setChecking(true);
    await checkAllSessions();
    await refetch();
    setChecking(false);
  };

  const handleSelectForBatch = (accountId: string) => {
    setSelectedForBatch(prev => {
      const next = new Set(prev);
      if (next.has(accountId)) {
        next.delete(accountId);
      } else {
        next.add(accountId);
      }
      return next;
    });
  };

  const handleSelectAllNeedingAttention = () => {
    if (!data) return;
    const needingAttention = [
      ...data.groups.EXPIRED,
      ...data.groups.CRITICAL,
      ...data.groups.WARNING,
    ].map(a => a.id);
    setSelectedForBatch(new Set(needingAttention));
  };

  const handleStartBatchLogin = () => {
    if (selectedForBatch.size > 0) {
      setShowBatchLogin(true);
    }
  };

  if (loading && !data) {
    return (
      <div className="p-6 text-center text-gray-400">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div>
        <p>Đang tải thông tin session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-400">
        <p>Lỗi: {error}</p>
        <button 
          onClick={refetch}
          className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!data) return null;

  const statusOrder: StatusKey[] = ['EXPIRED', 'CRITICAL', 'WARNING', 'HEALTHY', 'UNKNOWN'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Session Status</h2>
          <p className="text-gray-400 text-sm">
            {data.lastCheckedAt 
              ? `Kiểm tra lần cuối: ${new Date(data.lastCheckedAt).toLocaleString('vi-VN')}`
              : 'Chưa kiểm tra'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCheckAll}
            disabled={checking}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed rounded text-white flex items-center gap-2"
          >
            {checking ? (
              <>
                <span className="animate-spin">⟳</span>
                Đang kiểm tra...
              </>
            ) : (
              <>
                🔍 Kiểm tra tất cả
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        {statusOrder.map(status => {
          const config = statusConfig[status];
          const count = data.groups[status]?.length || 0;
          return (
            <div 
              key={status}
              className={`p-4 rounded-lg border ${config.color} text-center`}
            >
              <div className="text-3xl mb-1">{config.icon}</div>
              <div className="text-2xl font-bold text-white">{count}</div>
              <div className={`text-sm ${config.textColor}`}>{config.label}</div>
            </div>
          );
        })}
      </div>

      {/* Needs Attention Alert */}
      {data.needsAttention > 0 && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-white font-semibold">
                {data.needsAttention} tài khoản cần login lại
              </p>
              <p className="text-red-300 text-sm">
                Bạn nên login tập trung để tránh phải login nhiều ngày
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSelectAllNeedingAttention}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-white text-sm"
            >
              Chọn tất cả ({data.needsAttention})
            </button>
            <button
              onClick={handleStartBatchLogin}
              disabled={selectedForBatch.size === 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-white text-sm"
            >
              Batch Login ({selectedForBatch.size})
            </button>
          </div>
        </div>
      )}

      {/* Account Groups */}
      <div className="space-y-6">
        {statusOrder.map(status => {
          const accounts = data.groups[status] || [];
          if (accounts.length === 0) return null;

          const config = statusConfig[status];
          
          return (
            <div key={status} className="space-y-2">
              <h3 className={`text-lg font-semibold ${config.textColor} flex items-center gap-2`}>
                {config.icon} {config.label} ({accounts.length})
              </h3>
              <div className="grid gap-2">
                {accounts.map((account: AccountSessionStatus) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    config={config}
                    isSelected={selectedForBatch.has(account.id)}
                    onSelect={() => handleSelectForBatch(account.id)}
                    onViewHistory={() => setSelectedAccountId(account.id)}
                    showCheckbox={status !== 'HEALTHY' && status !== 'UNKNOWN'}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Session History Panel */}
      {selectedAccountId && (
        <SessionHistoryPanel
          accountId={selectedAccountId}
          onClose={() => setSelectedAccountId(null)}
        />
      )}

      {/* Batch Login Modal */}
      {showBatchLogin && (
        <BatchLoginModal
          accountIds={Array.from(selectedForBatch)}
          onClose={() => {
            setShowBatchLogin(false);
            setSelectedForBatch(new Set());
            refetch();
          }}
        />
      )}
    </div>
  );
}

interface AccountCardProps {
  account: AccountSessionStatus;
  config: {
    label: string;
    color: string;
    textColor: string;
    badgeColor: string;
    icon: string;
  };
  isSelected: boolean;
  onSelect: () => void;
  onViewHistory: () => void;
  showCheckbox: boolean;
}

function AccountCard({ account, config, isSelected, onSelect, onViewHistory, showCheckbox }: AccountCardProps) {
  return (
    <div className={`p-3 rounded border ${config.color} flex items-center justify-between`}>
      <div className="flex items-center gap-3">
        {showCheckbox && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="w-5 h-5 rounded border-gray-500 bg-gray-700 text-blue-600 focus:ring-blue-500"
          />
        )}
        <div>
          <p className="text-white font-medium">{account.email}</p>
          <p className={`text-sm ${config.textColor}`}>
            {account.timeRemaining?.formatted || 'Không có thông tin'}
            {account.sessionExpirySource && (
              <span className="ml-2 text-gray-500">
                ({account.sessionExpirySource === 'cookie' ? 'từ cookie' : 'ước tính'})
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {account.averageSessionDays && (
          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
            TB: {account.averageSessionDays} ngày
          </span>
        )}
        <button
          onClick={onViewHistory}
          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300"
        >
          📊 Lịch sử
        </button>
      </div>
    </div>
  );
}

export default SessionStatusDashboard;
