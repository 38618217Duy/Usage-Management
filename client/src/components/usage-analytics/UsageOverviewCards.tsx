import { Users, Zap, DollarSign, AlertTriangle } from 'lucide-react';
import type { UsageOverview } from '../../hooks/useUsageAnalytics';

interface UsageOverviewCardsProps {
  overview: UsageOverview | null;
  loading?: boolean;
}

export function UsageOverviewCards({ overview, loading }: UsageOverviewCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const cards = [
    {
      title: 'Total Accounts',
      value: overview.totalAccounts.toString(),
      subtitle: 'Active accounts',
      icon: Users,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-900'
    },
    {
      title: 'Total Usage (30d)',
      value: formatNumber(overview.totalTokens30d),
      subtitle: 'tokens',
      icon: Zap,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      textColor: 'text-green-900'
    },
    {
      title: 'Total Cost (30d)',
      value: formatCurrency(overview.totalCost30d),
      subtitle: 'USD spent',
      icon: DollarSign,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-900'
    },
    {
      title: 'High Risk Accounts',
      value: overview.highRiskAccounts.toString(),
      subtitle: 'near limit (>80%)',
      icon: AlertTriangle,
      color: overview.highRiskAccounts > 0 ? 'red' : 'gray',
      bgColor: overview.highRiskAccounts > 0 ? 'bg-red-50' : 'bg-gray-50',
      iconColor: overview.highRiskAccounts > 0 ? 'text-red-600' : 'text-gray-600',
      textColor: overview.highRiskAccounts > 0 ? 'text-red-900' : 'text-gray-900'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <Icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
              {card.title === 'High Risk Accounts' && overview.highRiskAccounts > 0 && (
                <div className="flex items-center text-red-500">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-xs font-medium">Alert</span>
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className={`text-3xl font-bold ${card.textColor}`}>
                {card.value}
              </p>
              <p className="text-sm text-gray-500">{card.subtitle}</p>
            </div>

            {card.title === 'Total Usage (30d)' && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Usage</span>
                  <span>2M limit</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min((overview.totalTokens30d / 2000000) * 100, 100)}%`
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {((overview.totalTokens30d / 2000000) * 100).toFixed(1)}% of limit
                </p>
              </div>
            )}

            {card.title === 'Total Accounts' && overview.averageUsagePerAccount > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Avg: {formatNumber(overview.averageUsagePerAccount)} tokens/account
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
