import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { VibrateInstagramFanbaseData } from '../../../services/vibrateService';
import { processTimeSeriesData, formatNumber, calculateGrowth } from './chartUtils';

interface InstagramFanbaseChartProps {
  data: VibrateInstagramFanbaseData;
  loading?: boolean;
}

const InstagramFanbaseChart = ({ data, loading = false }: InstagramFanbaseChartProps) => {
  const chartData = processTimeSeriesData(data.total);
  const growth = calculateGrowth(chartData);
  const currentValue = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;

  if (loading) {
    return (
      <div className="card p-4 h-64">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Instagram Followers</h3>
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
            <h3 className="text-sm font-medium text-gray-900">Instagram Followers</h3>
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
            <svg className="w-4 h-4 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
            <h3 className="text-sm font-medium text-gray-900">Instagram Followers</h3>
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
                      <div className="text-pink-600">
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
              stroke="#E1306C"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: '#E1306C' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default InstagramFanbaseChart;
