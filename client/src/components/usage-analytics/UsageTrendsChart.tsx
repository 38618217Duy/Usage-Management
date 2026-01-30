import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';
import type { AccountUsageAnalytics } from '../../hooks/useUsageAnalytics';

interface UsageTrendsChartProps {
  accounts: AccountUsageAnalytics[] | undefined;
  loading?: boolean;
}

type ChartType = 'line' | 'bar';
type TimeRange = '7d' | '14d' | '30d';

export function UsageTrendsChart({ accounts, loading }: UsageTrendsChartProps) {
  const [chartType, setChartType] = useState<ChartType>('line');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  // Prepare chart data
  const prepareChartData = (): { chartData: any[]; topAccounts: AccountUsageAnalytics[] } => {
    if (!accounts || accounts.length === 0) return { chartData: [], topAccounts: [] };

    // Get date range
    const days = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Create date range array
    const dateRange = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dateRange.push(new Date(d).toISOString().split('T')[0]);
    }

    // Get top accounts to display (max 5 for readability)
    const topAccounts = accounts
      .sort((a, b) => b.totalTokens30d - a.totalTokens30d)
      .slice(0, 5);

    // Prepare data for each date
    const chartData = dateRange.map(date => {
      const dataPoint: any = { date };
      
      topAccounts.forEach(account => {
        const dailyUsage = account.dailyUsage.find(d => d.date === date);
        dataPoint[account.email] = dailyUsage ? dailyUsage.totalTokens : 0;
        dataPoint[`${account.email}_cost`] = dailyUsage ? dailyUsage.cost : 0;
      });

      return dataPoint;
    });

    return { chartData, topAccounts };
  };

  const { chartData, topAccounts } = prepareChartData();

  // Color palette for different accounts
  const colors = [
    '#3B82F6', // blue
    '#EF4444', // red
    '#10B981', // green
    '#F59E0B', // yellow
    '#8B5CF6', // purple
  ];

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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => {
            if (entry.dataKey.includes('_cost')) return null;
            return (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-gray-600">{entry.dataKey}:</span>
                <span className="font-medium">{formatNumber(entry.value)} tokens</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!accounts || accounts.length === 0 || chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Trends</h3>
        <div className="text-center py-8 text-gray-500">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No usage data available for trends</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Usage Trends</h3>
        
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {(['7d', '14d', '30d'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Chart Type Selector */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setChartType('line')}
              className={`p-2 rounded-md transition-colors ${
                chartType === 'line'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Line Chart"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`p-2 rounded-md transition-colors ${
                chartType === 'bar'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Bar Chart"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              <Legend />
              {topAccounts?.map((account, index) => (
                <Line
                  key={account.email}
                  type="monotone"
                  dataKey={account.email}
                  stroke={colors[index]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
              <Legend />
              {topAccounts?.map((account, index) => (
                <Bar
                  key={account.email}
                  dataKey={account.email}
                  fill={colors[index]}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend with account info */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topAccounts?.map((account, index) => (
            <div key={account.email} className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: colors[index] }}
              ></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {account.email}
                </p>
                <p className="text-xs text-gray-500">
                  {formatNumber(account.totalTokens30d)} tokens • 
                  {account.usageTrend === 'increasing' ? ' 📈' : 
                   account.usageTrend === 'decreasing' ? ' 📉' : ' ➡️'} 
                  {account.usageTrend}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {accounts && accounts.length > 5 && (
          <p className="text-xs text-gray-500 mt-3">
            Showing top 5 accounts by usage. Total accounts: {accounts.length}
          </p>
        )}
      </div>
    </div>
  );
}
