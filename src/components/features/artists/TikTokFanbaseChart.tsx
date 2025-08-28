import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { VibrateTikTokFanbaseData } from '../../../services/vibrateService';
import { processTimeSeriesData, formatNumber, calculateGrowth } from './chartUtils';

interface TikTokFanbaseChartProps {
  data: VibrateTikTokFanbaseData;
  loading?: boolean;
}

const TikTokFanbaseChart = ({ data, loading = false }: TikTokFanbaseChartProps) => {
  const chartData = processTimeSeriesData(data.tiktokFanbase?.data || {});
  const growth = calculateGrowth(chartData);
  const currentValue = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;

  if (loading) {
    return (
      <div className="card p-4 h-64">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900">TikTok Followers</h3>
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
            <h3 className="text-sm font-medium text-gray-900">TikTok Followers</h3>
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
            <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 8.306c-.638 0-1.262-.062-1.863-.182V14.5A6.5 6.5 0 1 1 12 8v2.02a4.5 4.5 0 1 0 4.5 4.48V2h2.02c.12.601.182 1.225.182 1.863 0 2.37 1.92 4.293 4.293 4.443V8.306z"/>
            </svg>
            <h3 className="text-sm font-medium text-gray-900">TikTok Followers</h3>
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
                      <div className="text-black">
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
              stroke="#000000"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: '#000000' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TikTokFanbaseChart;
