import { useState, useEffect } from 'react';
import { 
  startBatchLogin, 
  openBatchLoginBrowser,
  recordLogin,
} from '../../hooks/useSessionStatus';

interface BatchLoginModalProps {
  accountIds: string[];
  onClose: () => void;
}

interface BatchAccount {
  id: string;
  email: string;
  sessionStatus: string;
  loginStatus: 'pending' | 'in_progress' | 'completed' | 'failed';
  error?: string;
}

export function BatchLoginModal({ accountIds, onClose }: BatchLoginModalProps) {
  const [accounts, setAccounts] = useState<BatchAccount[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const initBatch = async () => {
      const result = await startBatchLogin(accountIds);
      if (result.success && result.accounts) {
        setAccounts(result.accounts.map(a => ({
          ...a,
          loginStatus: 'pending' as const,
        })));
      } else {
        setError(result.error || 'Failed to initialize batch login');
      }
      setLoading(false);
    };
    initBatch();
  }, [accountIds]);

  const handleStartBatch = async () => {
    setIsRunning(true);
    setCurrentIndex(0);
  };

  const handleOpenBrowser = async () => {
    if (currentIndex < 0 || currentIndex >= accounts.length) return;

    const account = accounts[currentIndex];
    
    setAccounts(prev => prev.map((a, i) => 
      i === currentIndex ? { ...a, loginStatus: 'in_progress' } : a
    ));

    const result = await openBatchLoginBrowser(account.id);
    
    if (!result.success) {
      setAccounts(prev => prev.map((a, i) => 
        i === currentIndex ? { ...a, loginStatus: 'failed', error: result.error } : a
      ));
    }
  };

  const handleLoginComplete = async () => {
    if (currentIndex < 0 || currentIndex >= accounts.length) return;

    const account = accounts[currentIndex];
    
    await recordLogin(account.id);
    
    setAccounts(prev => prev.map((a, i) => 
      i === currentIndex ? { ...a, loginStatus: 'completed' } : a
    ));

    if (currentIndex < accounts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsRunning(false);
    }
  };

  const handleSkip = () => {
    setAccounts(prev => prev.map((a, i) => 
      i === currentIndex ? { ...a, loginStatus: 'failed', error: 'Skipped' } : a
    ));

    if (currentIndex < accounts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsRunning(false);
    }
  };

  const completedCount = accounts.filter(a => a.loginStatus === 'completed').length;
  const failedCount = accounts.filter(a => a.loginStatus === 'failed').length;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div>
          <p className="text-gray-400">Đang chuẩn bị batch login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-xl">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">🔐 Batch Login</h3>
            <p className="text-sm text-gray-400">
              {accounts.length} tài khoản cần login
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-300">
              {error}
            </div>
          )}

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-400 mb-1">
              <span>Tiến độ</span>
              <span>{completedCount}/{accounts.length} hoàn thành</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${(completedCount / accounts.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Account List */}
          <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
            {accounts.map((account, index) => (
              <div 
                key={account.id}
                className={`p-3 rounded border flex items-center justify-between ${
                  index === currentIndex 
                    ? 'bg-blue-900/50 border-blue-600' 
                    : account.loginStatus === 'completed'
                    ? 'bg-green-900/30 border-green-700'
                    : account.loginStatus === 'failed'
                    ? 'bg-red-900/30 border-red-700'
                    : 'bg-gray-700/30 border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {account.loginStatus === 'completed' ? '✅' :
                     account.loginStatus === 'failed' ? '❌' :
                     account.loginStatus === 'in_progress' ? '🔄' :
                     index === currentIndex ? '👉' : '⏳'}
                  </span>
                  <div>
                    <p className="text-white text-sm">{account.email}</p>
                    <p className="text-xs text-gray-400">
                      {account.sessionStatus}
                      {account.error && <span className="text-red-400 ml-2">({account.error})</span>}
                    </p>
                  </div>
                </div>
                {index === currentIndex && account.loginStatus === 'pending' && (
                  <span className="text-blue-400 text-sm">Tiếp theo</span>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          {!isRunning ? (
            <div className="flex gap-2">
              <button
                onClick={handleStartBatch}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
              >
                🚀 Bắt đầu Batch Login
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white"
              >
                Hủy
              </button>
            </div>
          ) : currentIndex < accounts.length ? (
            <div className="space-y-2">
              <div className="p-3 bg-blue-900/30 border border-blue-700 rounded">
                <p className="text-blue-300 text-sm mb-2">
                  📌 Đang xử lý: <span className="font-medium">{accounts[currentIndex]?.email}</span>
                </p>
                <p className="text-gray-400 text-xs">
                  1. Nhấn "Mở Browser" để mở trình duyệt<br/>
                  2. Đăng nhập vào tài khoản Cursor<br/>
                  3. Đóng browser và nhấn "Hoàn thành" để tiếp tục
                </p>
              </div>
              <div className="flex gap-2">
                {accounts[currentIndex]?.loginStatus === 'pending' && (
                  <button
                    onClick={handleOpenBrowser}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
                  >
                    🌐 Mở Browser
                  </button>
                )}
                {accounts[currentIndex]?.loginStatus === 'in_progress' && (
                  <button
                    onClick={handleLoginComplete}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
                  >
                    ✅ Hoàn thành Login
                  </button>
                )}
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-white"
                >
                  ⏭️ Bỏ qua
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-green-400 text-lg mb-4">
                ✅ Batch Login hoàn thành!
              </p>
              <p className="text-gray-400 mb-4">
                Thành công: {completedCount} | Thất bại: {failedCount}
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
              >
                Đóng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BatchLoginModal;
