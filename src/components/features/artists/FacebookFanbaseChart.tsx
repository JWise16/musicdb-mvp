import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { VibrateFacebookFanbaseData } from '../../../services/vibrateService';
import { processTimeSeriesData, formatNumber, calculateGrowth } from './chartUtils';

interface FacebookFanbaseChartProps {
  data: VibrateFacebookFanbaseData;
  loading?: boolean;
}

const FacebookFanbaseChart = ({ data, loading = false }: FacebookFanbaseChartProps) => {
  const chartData = processTimeSeriesData(data.facebookFanbase?.data || {});
  const growth = calculateGrowth(chartData);
  const currentValue = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;

  if (loading) {
    return (
      <div className="card p-4 h-64">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Facebook Followers</h3>
            <div className="w-20 h-4 bg-gray-200 rounded animate-pulse mt-1"></div>
          </div>
          <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-32 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="card p-4 h-64">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Facebook Followers</h3>
            <p className="text-xs text-gray-500">No data available</p>
          </div>
        </div>
        <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
          No fanbase data available
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4 h-64">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <h3 className="text-sm font-medium text-gray-900">Facebook Followers</h3>
          </div>
          <p className="text-lg font-semibold text-gray-900">{formatNumber(currentValue)}</p>
        </div>
        <div className={`text-xs px-2 py-1 rounded ${
          growth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
        </div>
      </div>
      
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <XAxis 
              dataKey="formattedDate" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#6B7280' }}
              interval="preserveStartEnd"
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#6B7280' }}
              tickFormatter={formatNumber}
              width={35}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-2 rounded shadow-lg border text-xs">
                      <div className="font-medium">{label}</div>
                      <div className="text-blue-600">
                        Followers: {formatNumber(payload[0].value as number)}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#1877F2"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: '#1877F2' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FacebookFanbaseChart;
