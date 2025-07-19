import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { type VenueAnalytics } from '../../../services/venueService';

interface EventAnalyticsProps {
  analytics: VenueAnalytics;
}

const EventAnalytics = ({ analytics }: EventAnalyticsProps) => {
  const [timeFrame, setTimeFrame] = useState<'Month' | 'Quarter' | 'Year'>('Month');

  const analyticsItems = [
    {
      title: 'Top Month',
      value: analytics.topMonth.month,
      subtitle: `${analytics.topMonth.count} shows`
    },
    {
      title: 'Top Genre',
      value: analytics.topGenre.genre,
      subtitle: `${analytics.topGenre.count} performances`
    },
    {
      title: 'Top Artist',
      value: analytics.topArtist.name,
      subtitle: `${analytics.topArtist.count} appearances`
    }
  ];

  // Get data based on selected timeframe
  const getChartData = () => {
    switch (timeFrame) {
      case 'Month':
        return analytics.monthlyPercentageSold;
      case 'Quarter':
        return analytics.quarterlyPercentageSold.map(item => ({
          month: item.quarter,
          percentage: item.percentage
        }));
      case 'Year':
        return analytics.yearlyPercentageSold.map(item => ({
          month: item.year,
          percentage: item.percentage
        }));
      default:
        return analytics.monthlyPercentageSold;
    }
  };

  const chartData = getChartData();

  return (
    <div className="mb-6 lg:mb-8 overflow-hidden">
      <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6 truncate">Event Analytics</h3>
      
      {/* Three cards inline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 overflow-hidden mb-6 lg:mb-8">
        {analyticsItems.map((item, index) => (
          <div key={index} className="card p-5 lg:p-6 min-w-0 hover:shadow-medium transition-shadow duration-200">
            <div className="min-w-0">
              <h4 className="text-sm lg:text-sm font-medium text-gray-600 mb-2 truncate">{item.title}</h4>
              <p className="text-base lg:text-lg font-semibold text-gray-900 mb-1 truncate">{item.value}</p>
              <p className="text-sm text-gray-500 truncate">{item.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Average Percentage Sold Chart */}
      <div className="card p-6 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-bold text-gray-900">
            Average Percentage Sold {timeFrame === 'Month' ? '(Monthly)' : timeFrame === 'Quarter' ? '(Quarterly)' : '(Yearly)'}
          </h4>
          <div className="relative">
            <select 
              value={timeFrame} 
              onChange={(e) => setTimeFrame(e.target.value as 'Month' | 'Quarter' | 'Year')}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Month">Month</option>
              <option value="Quarter">Quarter</option>
              <option value="Year">Year</option>
            </select>
            <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
              />
              <YAxis 
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Bar 
                dataKey="percentage" 
                fill="#EF4444" 
                radius={[4, 4, 0, 0]}
                opacity={0.8}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default EventAnalytics; 