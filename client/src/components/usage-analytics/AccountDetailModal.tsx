import { useState, useEffect } from 'react';
import { X, Mail, Zap, DollarSign, Calendar, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { AccountUsageAnalytics } from '../../hooks/useUsageAnalytics';
import { useUsageAnalytics } from '../../hooks/useUsageAnalytics';

interface AccountDetailModalProps {
  email: string;
  onClose: () => void;
}

export function AccountDetailModal({ email, onClose }: AccountDetailModalProps) {
  const { fetchAccountAnalytics } = useUsageAnalytics();
  const [analytics, setAnalytics] = useState<AccountUsageAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAccountData = async () => {
      setLoading(true);
      try {
        const data = await fetchAccountAnalytics(email);
        setAnalytics(data);
      } catch (error) {
        console.error('Error loading account analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAccountData();
  }, [email, fetchAccountAnalytics]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toLocaleString();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
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
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-4 h-4 mr-2" />
        {riskLevel.toUpperCase()}
        <span className="ml-2 text-gray-600">({usagePercentage.toFixed(1)}%)</span>
      </div>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{formatDate(label)}</p>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600">Tokens:</span>
              <span className="font-medium">{formatNumber(data.totalTokens)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600">Cost:</span>
              <span className="font-medium">${data.cost.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600">Sessions:</span>
              <span className="font-medium">{data.sessions}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{email}</h2>
              <p className="text-sm text-gray-500">Account Usage Details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {loading ? (
            <div className="animate-pulse space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
                ))}
              </div>
              <div className="bg-gray-200 h-64 rounded-lg"></div>
            </div>
          ) : analytics ? (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Total Usage (30d)</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatNumber(analytics.totalTokens30d)}
                  </p>
                  <p className="text-sm text-blue-700">tokens</p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Total Cost (30d)</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    ${analytics.totalCost30d.toFixed(2)}
                  </p>
                  <p className="text-sm text-green-700">
                    ${analytics.averageCostPerDay.toFixed(2)}/day avg
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">Efficiency</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {analytics.tokenEfficiency.toFixed(2)}
                  </p>
                  <p className="text-sm text-purple-700">output/input ratio</p>
                </div>
              </div>

              {/* Usage Progress */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Usage Limit Progress</h3>
                  {getRiskBadge(analytics.riskLevel, analytics.usagePercentage)}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      analytics.usagePercentage >= 95 ? 'bg-red-500' :
                      analytics.usagePercentage >= 80 ? 'bg-orange-500' :
                      analytics.usagePercentage >= 60 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(analytics.usagePercentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{formatNumber(analytics.totalTokens30d)} tokens used</span>
                  <span>2M limit</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Usage Statistics</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Usage Trend</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium">
                          {analytics.usageTrend === 'increasing' ? '📈' : 
                           analytics.usageTrend === 'decreasing' ? '📉' : '➡️'}
                        </span>
                        <span className="text-sm font-medium capitalize">{analytics.usageTrend}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Most Active Day</span>
                      </div>
                      <span className="text-sm font-medium">
                        {analytics.mostActiveDay ? formatDate(analytics.mostActiveDay) : 'N/A'}
                      </span>
                    </div>

                    {analytics.daysUntilLimit < 30 && analytics.daysUntilLimit > 0 && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-orange-500" />
                          <span className="text-sm text-gray-600">Days Until Limit</span>
                        </div>
                        <span className="text-sm font-medium text-orange-600">
                          ~{analytics.daysUntilLimit} days
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Recent Activity</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {analytics.dailyUsage.slice(-7).reverse().map((day) => (
                      <div key={day.date} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(day.date)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {day.sessions} session{day.sessions !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatNumber(day.totalTokens)}
                          </p>
                          <p className="text-xs text-gray-500">
                            ${day.cost.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Usage Chart */}
              {analytics.dailyUsage.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Usage Trend (Last 30 Days)</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analytics.dailyUsage} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDate}
                          stroke="#6b7280"
                          fontSize={12}
                        />
                        <YAxis 
                          tickFormatter={formatNumber}
                          stroke="#6b7280"
                          fontSize={12}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="totalTokens"
                          stroke="#3B82F6"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Failed to load account analytics</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
