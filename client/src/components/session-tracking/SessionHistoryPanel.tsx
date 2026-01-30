import { useSessionHistory } from '../../hooks/useSessionStatus';

interface SessionHistoryPanelProps {
  accountId: string;
  onClose: () => void;
}

export function SessionHistoryPanel({ accountId, onClose }: SessionHistoryPanelProps) {
  const { data, loading, error } = useSessionHistory(accountId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Lịch sử Session</h3>
            {data && <p className="text-sm text-gray-400">{data.email}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
          {loading && (
            <div className="text-center text-gray-400 py-8">
              <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mb-2"></div>
              <p>Đang tải...</p>
            </div>
          )}

          {error && (
            <div className="text-center text-red-400 py-8">
              <p>Lỗi: {error}</p>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              {/* Statistics */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-white font-medium mb-3">📊 Thống kê</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard 
                    label="Tổng sessions" 
                    value={data.statistics.totalSessions.toString()} 
                  />
                  <StatCard 
                    label="TB thời gian" 
                    value={data.statistics.averageDurationDays 
                      ? `${data.statistics.averageDurationDays} ngày` 
                      : 'N/A'} 
                  />
                  <StatCard 
                    label="Ngắn nhất" 
                    value={data.statistics.minDurationDays 
                      ? `${data.statistics.minDurationDays} ngày` 
                      : 'N/A'} 
                  />
                  <StatCard 
                    label="Dài nhất" 
                    value={data.statistics.maxDurationDays 
                      ? `${data.statistics.maxDurationDays} ngày` 
                      : 'N/A'} 
                  />
                </div>
                {data.statistics.predictedNextExpiry && (
                  <div className="mt-3 p-2 bg-blue-900/30 border border-blue-700 rounded">
                    <p className="text-blue-300 text-sm">
                      🔮 Dự đoán hết hạn tiếp theo: {' '}
                      <span className="font-medium">
                        {new Date(data.statistics.predictedNextExpiry).toLocaleString('vi-VN')}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              {/* History List */}
              <div>
                <h4 className="text-white font-medium mb-3">📜 Lịch sử đăng nhập</h4>
                {data.history.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">Chưa có lịch sử</p>
                ) : (
                  <div className="space-y-2">
                    {data.history.map((record) => (
                      <div 
                        key={record.id}
                        className="bg-gray-700/30 rounded p-3 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-white text-sm">
                            <span className="text-gray-400">Login:</span>{' '}
                            {new Date(record.loginAt).toLocaleString('vi-VN')}
                          </p>
                          <p className="text-gray-400 text-sm">
                            <span>Hết hạn:</span>{' '}
                            {new Date(record.expiryAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                        <div className="text-right">
                          {record.durationDays && (
                            <span className="text-green-400 text-sm font-medium">
                              {record.durationDays} ngày
                            </span>
                          )}
                          <p className="text-xs text-gray-500">
                            {record.expirySource === 'cookie' ? '📍 Cookie' : '📐 Ước tính'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

export default SessionHistoryPanel;
