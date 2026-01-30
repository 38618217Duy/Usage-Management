import { useState } from 'react';
import { RefreshCw, BarChart3, AlertTriangle } from 'lucide-react';
import { useUsageAnalytics } from '../hooks/useUsageAnalytics';
import { UsageOverviewCards } from './usage-analytics/UsageOverviewCards';
import { AccountRankingTable } from './usage-analytics/AccountRankingTable';
import { RiskAlertsPanel } from './usage-analytics/RiskAlertsPanel';
import { UsageTrendsChart } from './usage-analytics/UsageTrendsChart';
import { AccountDetailModal } from './usage-analytics/AccountDetailModal';

export function UsageAnalyticsDashboard() {
  const { overview, loading, error, refreshing, refreshAnalytics } = useUsageAnalytics();
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const handleRefresh = async () => {
    await refreshAnalytics();
  };

  const handleAccountSelect = (email: string) => {
    setSelectedAccount(email);
  };

  const handleCloseModal = () => {
    setSelectedAccount(null);
  };

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Không thể tải dữ liệu usage analytics
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Usage Analytics</h1>
            <p className="text-gray-600">
              Theo dõi usage và chi phí của tất cả Cursor accounts
            </p>
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Đang cập nhật...' : 'Cập nhật dữ liệu'}
        </button>
      </div>

      {/* Overview Cards */}
      <UsageOverviewCards overview={overview} loading={loading} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Account Ranking */}
        <AccountRankingTable
          accounts={overview?.accounts}
          onAccountSelect={handleAccountSelect}
          loading={loading}
        />

        {/* Risk Alerts */}
        <RiskAlertsPanel
          accounts={overview?.accounts}
          loading={loading}
        />
      </div>

      {/* Usage Trends Chart */}
      <UsageTrendsChart
        accounts={overview?.accounts}
        loading={loading}
      />

      {/* Quick Stats Summary */}
      {overview && !loading && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Tóm tắt nhanh
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {overview.totalAccounts}
              </p>
              <p className="text-sm text-gray-600">Tổng accounts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {((overview.totalTokens30d / 2000000) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-600">Tổng usage vs limit</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                ${overview.totalCost30d.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">Tổng chi phí 30d</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${overview.highRiskAccounts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {overview.highRiskAccounts}
              </p>
              <p className="text-sm text-gray-600">Accounts high risk</p>
            </div>
          </div>
          
          {overview.highRiskAccounts > 0 && (
            <div className="mt-4 p-3 bg-orange-100 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <p className="text-sm text-orange-800">
                  <strong>Cảnh báo:</strong> Có {overview.highRiskAccounts} account{overview.highRiskAccounts > 1 ? 's' : ''} đang sắp chạm trần limit. 
                  Hãy theo dõi usage hoặc consider upgrade plan.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Account Detail Modal */}
      {selectedAccount && (
        <AccountDetailModal
          email={selectedAccount}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
