import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { VibrateYouTubeViewsData } from '../../../services/vibrateService';
import { processTimeSeriesData, formatNumber, calculateGrowth } from './chartUtils';

interface YouTubeViewsChartProps {
  data: VibrateYouTubeViewsData;
  loading?: boolean;
}

const YouTubeViewsChart = ({ data, loading = false }: YouTubeViewsChartProps) => {
  const chartData = processTimeSeriesData(data.views);
  const growth = calculateGrowth(chartData);
  const currentValue = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;

  if (loading) {
    return (
      <div className="card p-4 h-64">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900">YouTube Views</h3>
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
            <h3 className="text-sm font-medium text-gray-900">YouTube Views</h3>
            <p className="text-xs text-gray-500">No data available</p>
          </div>
        </div>
        <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
          No views data available
        </div>
      </div>
    );
  }

  return (
    <div className="card p-4 h-64">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-4 h-4 text-red-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            <h3 className="text-sm font-medium text-gray-900">YouTube Views</h3>
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
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
                      <div className="text-red-600">
                        Views: {formatNumber(payload[0].value as number)}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="value"
              fill="#FF0000"
              radius={[2, 2, 0, 0]}
              opacity={0.8}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default YouTubeViewsChart;
