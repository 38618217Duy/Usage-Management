import { AlertTriangle, Clock, TrendingUp, Mail } from 'lucide-react';
import type { AccountUsageAnalytics } from '../../hooks/useUsageAnalytics';

interface RiskAlertsPanelProps {
  accounts: AccountUsageAnalytics[] | undefined;
  loading?: boolean;
}

export function RiskAlertsPanel({ accounts, loading }: RiskAlertsPanelProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const highRiskAccounts = accounts?.filter(
    account => account.riskLevel === 'high' || account.riskLevel === 'critical'
  ) || [];

  const criticalAccounts = highRiskAccounts.filter(account => account.riskLevel === 'critical');
  const warningAccounts = highRiskAccounts.filter(account => account.riskLevel === 'high');

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  const getRiskIcon = (riskLevel: string) => {
    if (riskLevel === 'critical') {
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
    return <AlertTriangle className="w-5 h-5 text-orange-500" />;
  };

  const getRiskColor = (riskLevel: string) => {
    if (riskLevel === 'critical') {
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-900',
        badge: 'bg-red-100 text-red-800'
      };
    }
    return {
      bg: 'bg-orange-50',
      border: 'border-orange-200', 
      text: 'text-orange-900',
      badge: 'bg-orange-100 text-orange-800'
    };
  };

  if (highRiskAccounts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Risk Alerts</h3>
        </div>
        
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-green-600" />
          </div>
          <h4 className="text-lg font-medium text-green-900 mb-2">All Clear!</h4>
          <p className="text-green-700">
            No accounts are currently at high risk of hitting usage limits.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-900">Risk Alerts</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-red-600">
            {highRiskAccounts.length} alert{highRiskAccounts.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Critical Alerts */}
        {criticalAccounts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h4 className="font-medium text-red-900">Critical ({criticalAccounts.length})</h4>
            </div>
            {criticalAccounts.map((account) => {
              const colors = getRiskColor(account.riskLevel);
              return (
                <div
                  key={account.email}
                  className={`p-4 rounded-lg ${colors.bg} ${colors.border} border`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getRiskIcon(account.riskLevel)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Mail className="w-4 h-4 text-gray-600" />
                          <p className={`font-medium ${colors.text}`}>
                            {account.email}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {formatNumber(account.totalTokens30d)} tokens used ({account.usagePercentage.toFixed(1)}% of limit)
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>Trend: {account.usageTrend}</span>
                          </div>
                          {account.daysUntilLimit < 30 && account.daysUntilLimit > 0 && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>~{account.daysUntilLimit} days to limit</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
                      {account.riskLevel.toUpperCase()}
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Usage</span>
                      <span>2M limit</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(account.usagePercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Warning Alerts */}
        {warningAccounts.length > 0 && (
          <div className="space-y-3">
            {criticalAccounts.length > 0 && <div className="border-t border-gray-200 pt-4"></div>}
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <h4 className="font-medium text-orange-900">Warning ({warningAccounts.length})</h4>
            </div>
            {warningAccounts.map((account) => {
              const colors = getRiskColor(account.riskLevel);
              return (
                <div
                  key={account.email}
                  className={`p-4 rounded-lg ${colors.bg} ${colors.border} border`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getRiskIcon(account.riskLevel)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Mail className="w-4 h-4 text-gray-600" />
                          <p className={`font-medium ${colors.text}`}>
                            {account.email}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {formatNumber(account.totalTokens30d)} tokens used ({account.usagePercentage.toFixed(1)}% of limit)
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>Trend: {account.usageTrend}</span>
                          </div>
                          {account.daysUntilLimit < 30 && account.daysUntilLimit > 0 && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>~{account.daysUntilLimit} days to limit</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
                      {account.riskLevel.toUpperCase()}
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Usage</span>
                      <span>2M limit</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(account.usagePercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            Total high-risk accounts: {highRiskAccounts.length}
          </span>
          <span className="text-gray-500">
            Monitor usage closely
          </span>
        </div>
      </div>
    </div>
  );
}
