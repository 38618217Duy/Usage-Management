import { useState } from 'react';
import { ChevronUp, ChevronDown, Mail, Zap, DollarSign, AlertTriangle } from 'lucide-react';
import type { AccountUsageAnalytics } from '../../hooks/useUsageAnalytics';

interface AccountRankingTableProps {
  accounts: AccountUsageAnalytics[] | undefined;
  onAccountSelect?: (email: string) => void;
  loading?: boolean;
}

type SortField = 'email' | 'totalTokens30d' | 'usagePercentage' | 'totalCost30d' | 'riskLevel';
type SortDirection = 'asc' | 'desc';

export function AccountRankingTable({ accounts, onAccountSelect, loading }: AccountRankingTableProps) {
  const [sortField, setSortField] = useState<SortField>('totalTokens30d');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedAccounts = accounts ? [...accounts].sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    // Special handling for risk level
    if (sortField === 'riskLevel') {
      const riskOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      aValue = riskOrder[a.riskLevel];
      bValue = riskOrder[b.riskLevel];
    }

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  }) : [];

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  const getRiskBadge = (riskLevel: string, usagePercentage: number) => {
    const configs = {
      critical: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertTriangle },
      high: { bg: 'bg-orange-100', text: 'text-orange-800', icon: AlertTriangle },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertTriangle },
      low: { bg: 'bg-green-100', text: 'text-green-800', icon: Zap }
    };

    const config = configs[riskLevel as keyof typeof configs] || configs.low;
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {riskLevel}
        <span className="ml-1 text-gray-500">({usagePercentage.toFixed(1)}%)</span>
      </div>
    );
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 text-left font-medium text-gray-900 hover:text-gray-600 transition-colors"
    >
      {children}
      {sortField === field ? (
        sortDirection === 'asc' ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )
      ) : (
        <div className="w-4 h-4" />
      )}
    </button>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Ranking</h3>
        <div className="text-center py-8 text-gray-500">
          <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No account data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Account Ranking</h3>
        <div className="text-sm text-gray-500">
          {accounts.length} account{accounts.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4">
                <SortButton field="email">
                  <Mail className="w-4 h-4" />
                  Email
                </SortButton>
              </th>
              <th className="text-right py-3 px-4">
                <SortButton field="totalTokens30d">
                  <Zap className="w-4 h-4" />
                  Usage (30d)
                </SortButton>
              </th>
              <th className="text-right py-3 px-4">
                <SortButton field="totalCost30d">
                  <DollarSign className="w-4 h-4" />
                  Cost
                </SortButton>
              </th>
              <th className="text-center py-3 px-4">
                <SortButton field="riskLevel">
                  <AlertTriangle className="w-4 h-4" />
                  Risk Level
                </SortButton>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedAccounts.map((account, index) => (
              <tr
                key={account.email}
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  onAccountSelect ? 'cursor-pointer' : ''
                }`}
                onClick={() => onAccountSelect?.(account.email)}
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      index === 0 ? 'bg-yellow-100 text-yellow-800' :
                      index === 1 ? 'bg-gray-100 text-gray-800' :
                      index === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{account.email}</p>
                      <p className="text-sm text-gray-500">
                        Trend: {account.usageTrend === 'increasing' ? '📈' : 
                               account.usageTrend === 'decreasing' ? '📉' : '➡️'} 
                        {account.usageTrend}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <div>
                    <p className="font-medium text-gray-900">
                      {formatNumber(account.totalTokens30d)}
                    </p>
                    <div className="w-20 bg-gray-200 rounded-full h-1.5 ml-auto mt-1">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          account.usagePercentage >= 95 ? 'bg-red-500' :
                          account.usagePercentage >= 80 ? 'bg-orange-500' :
                          account.usagePercentage >= 60 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(account.usagePercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <div>
                    <p className="font-medium text-gray-900">
                      ${account.totalCost30d.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      ${account.averageCostPerDay.toFixed(2)}/day
                    </p>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  {getRiskBadge(account.riskLevel, account.usagePercentage)}
                  {account.daysUntilLimit < 30 && account.daysUntilLimit > 0 && (
                    <p className="text-xs text-orange-600 mt-1">
                      ~{account.daysUntilLimit} days to limit
                    </p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedAccounts.length > 5 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Showing top {Math.min(10, sortedAccounts.length)} accounts
          </p>
        </div>
      )}
    </div>
  );
}
