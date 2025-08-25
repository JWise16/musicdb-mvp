import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { type VenueAnalytics } from '../../../services/venueService';

interface EventAnalyticsProps {
  analytics: VenueAnalytics;
}

// Format currency values
const formatCurrency = (amount: number) => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${amount.toLocaleString()}`;
};

// Custom tooltip component for the performance chart
const PerformanceTooltip = ({ active, payload, label, chartMetric, timeFrame }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px]">
        <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {chartMetric === 'percentage' ? 'Avg. Sold:' : 'Revenue:'}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {chartMetric === 'percentage' ? `${value.toFixed(1)}%` : formatCurrency(value)}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
            {chartMetric === 'percentage' 
              ? `${timeFrame === 'Month' ? 'Monthly' : timeFrame === 'Quarter' ? 'Quarterly' : 'Yearly'} average percentage of tickets sold`
              : `Total gross revenue for this ${timeFrame.toLowerCase()}`
            }
          </div>
        </div>
      </div>
    );
  }
  return null;
};

// Custom tooltip component for the genre chart
const GenreTooltip = ({ active, payload, label, genreMetric, selectedPeriod }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px]">
        <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {genreMetric === 'percentage' ? 'Performance:' : 'Revenue:'}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {genreMetric === 'percentage' ? `${value.toFixed(1)}%` : formatCurrency(value)}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
            {genreMetric === 'percentage' 
              ? `Average percentage sold for ${label} events in ${selectedPeriod}`
              : `Total revenue from ${label} events in ${selectedPeriod}`
            }
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const EventAnalytics = ({ analytics }: EventAnalyticsProps) => {
  const [timeFrame, setTimeFrame] = useState<'Month' | 'Quarter' | 'Year'>('Month');
  const [chartMetric, setChartMetric] = useState<'percentage' | 'revenue'>('percentage');
  const [genreMetric, setGenreMetric] = useState<'percentage' | 'revenue'>('percentage');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');

  const analyticsItems = [
    {
      title: 'Top Month',
      value: analytics.topMonth.month,
      subtitle: `${analytics.topMonth.avgPercentageSold}% avg sold`
    },
    {
      title: 'Top Genre',
      value: analytics.topGenre.genre,
      subtitle: `${analytics.topGenre.avgPercentageSold}% avg sold`
    },
    {
      title: 'Top Artist',
      value: analytics.topArtist.name,
      subtitle: `${analytics.topArtist.avgPercentageSold}% avg sold`
    }
  ];

  // Get data based on selected timeframe and metric
  const getChartData = () => {
    if (chartMetric === 'percentage') {
      switch (timeFrame) {
        case 'Month':
          return analytics.monthlyPercentageSold.map(item => ({
            period: item.month,
            value: item.percentage
          }));
        case 'Quarter':
          return analytics.quarterlyPercentageSold.map(item => ({
            period: item.quarter,
            value: item.percentage
          }));
        case 'Year':
          return analytics.yearlyPercentageSold.map(item => ({
            period: item.year,
            value: item.percentage
          }));
        default:
          return analytics.monthlyPercentageSold.map(item => ({
            period: item.month,
            value: item.percentage
          }));
      }
    } else {
      // Revenue data
      switch (timeFrame) {
        case 'Month':
          return analytics.monthlyRevenue.map(item => ({
            period: item.month,
            value: item.revenue
          }));
        case 'Quarter':
          return analytics.quarterlyRevenue.map(item => ({
            period: item.quarter,
            value: item.revenue
          }));
        case 'Year':
          return analytics.yearlyRevenue.map(item => ({
            period: item.year,
            value: item.revenue
          }));
        default:
          return analytics.monthlyRevenue.map(item => ({
            period: item.month,
            value: item.revenue
          }));
      }
    }
  };

  const chartData = getChartData();

  // Get available periods based on timeframe
  const getAvailablePeriods = () => {
    switch (timeFrame) {
      case 'Month':
        return ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      case 'Quarter':
        return ['Q1', 'Q2', 'Q3', 'Q4'];
      case 'Year': {
        const now = new Date();
        const years = [];
        for (let i = 4; i >= 0; i--) {
          years.push((now.getFullYear() - i).toString());
        }
        return years;
      }
      default:
        return [];
    }
  };

  // Set default selected period when timeframe changes
  useEffect(() => {
    const now = new Date();
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    
    switch (timeFrame) {
      case 'Month':
        setSelectedPeriod(months[now.getMonth()]);
        break;
      case 'Quarter':
        setSelectedPeriod(`Q${Math.ceil((now.getMonth() + 1) / 3)}`);
        break;
      case 'Year':
        setSelectedPeriod(now.getFullYear().toString());
        break;
    }
  }, [timeFrame]);



  // Get genre data based on selected timeframe and metric
  const getGenreChartData = () => {
    let genreBreakdownData;
    
    if (genreMetric === 'revenue') {
      // Handle revenue data
      switch (timeFrame) {
        case 'Month': {
          const monthRevData = analytics.monthlyGenreRevenue?.find(m => m.month === selectedPeriod) || 
                              analytics.monthlyGenreRevenue?.[0];
          genreBreakdownData = monthRevData?.genres || [];
          break;
        }
        case 'Quarter': {
          const quarterRevData = analytics.quarterlyGenreRevenue?.find(q => q.quarter === selectedPeriod) || 
                                analytics.quarterlyGenreRevenue?.[0];
          genreBreakdownData = quarterRevData?.genres || [];
          break;
        }
        case 'Year': {
          const yearRevData = analytics.yearlyGenreRevenue?.find(y => y.year === selectedPeriod) || 
                             analytics.yearlyGenreRevenue?.[analytics.yearlyGenreRevenue?.length - 1];
          genreBreakdownData = yearRevData?.genres || [];
          break;
        }
        default:
          genreBreakdownData = analytics.monthlyGenreRevenue?.[0]?.genres || [];
      }
      
      if (!genreBreakdownData || genreBreakdownData.length === 0) {
        return { data: [], currentPeriod: selectedPeriod };
      }
      
      const data = genreBreakdownData.map((genreData: any) => ({
        genre: genreData.genre,
        value: genreData.revenue
      }));

      return { data, currentPeriod: selectedPeriod };
    } else {
      // Handle percentage data
      switch (timeFrame) {
        case 'Month': {
          const monthData = analytics.monthlyGenreBreakdown.find(m => m.month === selectedPeriod) || 
                           analytics.monthlyGenreBreakdown[0];
          genreBreakdownData = monthData?.genres || [];
          break;
        }
        case 'Quarter': {
          const quarterData = analytics.quarterlyGenreBreakdown.find(q => q.quarter === selectedPeriod) || 
                             analytics.quarterlyGenreBreakdown[0];
          genreBreakdownData = quarterData?.genres || [];
          break;
        }
        case 'Year': {
          const yearData = analytics.yearlyGenreBreakdown.find(y => y.year === selectedPeriod) || 
                          analytics.yearlyGenreBreakdown[analytics.yearlyGenreBreakdown.length - 1];
          genreBreakdownData = yearData?.genres || [];
          break;
        }
        default:
          genreBreakdownData = analytics.monthlyGenreBreakdown[0]?.genres || [];
      }
      
      if (!genreBreakdownData || genreBreakdownData.length === 0) {
        return { data: [], currentPeriod: selectedPeriod };
      }
      
      const data = genreBreakdownData.map(genreData => ({
        genre: genreData.genre,
        value: genreData.percentage
      }));

      return { data, currentPeriod: selectedPeriod };
    }
  };

  return (
    <div className="mb-6 lg:mb-8 overflow-hidden">
      <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6 truncate">Event Analytics</h3>
      
      {/* Three cards inline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 overflow-hidden mb-6 lg:mb-8">
        {analyticsItems.map((item, index) => (
          <div key={index} className="card p-5 lg:p-6 min-w-0 hover:shadow-medium transition-shadow duration-200">
            <div className="min-w-0">
              <h4 className="text-sm lg:text-sm font-medium text-gray-600 mb-2 truncate">{item.title}</h4>
              <p className="text-base lg:text-lg font-semibold text-gray-900 mb-1 break-words">{item.value}</p>
              <p className="text-sm text-gray-500 break-words">{item.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Performance Chart */}
      <div className="card p-6 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-bold text-gray-900">
            {chartMetric === 'percentage' ? 'Average Percentage Sold' : 'Total Gross Revenue'} {timeFrame === 'Month' ? '(Monthly)' : timeFrame === 'Quarter' ? '(Quarterly)' : '(Yearly)'}
          </h4>
          <div className="flex items-center space-x-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setChartMetric('percentage')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  chartMetric === 'percentage' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Percentage Sold
              </button>
              <button
                onClick={() => setChartMetric('revenue')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  chartMetric === 'revenue' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Revenue
              </button>
            </div>
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
        </div>
        
        <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis 
                  dataKey="period" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                />
                <YAxis 
                  domain={chartMetric === 'percentage' ? [0, 100] : [0, 'dataMax']}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickFormatter={(value) => chartMetric === 'percentage' ? `${value}%` : formatCurrency(value)}
                />
                <Bar 
                  dataKey="value" 
                  fill="#EF4444" 
                  radius={[4, 4, 0, 0]}
                  opacity={0.8}
                />
                <Tooltip 
                  content={<PerformanceTooltip chartMetric={chartMetric} timeFrame={timeFrame} />}
                  cursor={false}
                />
              </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Genre Performance Breakdown Chart */}
      <div className="card p-6 min-w-0 mt-6 lg:mt-8">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-bold text-gray-900">
            Genre {genreMetric === 'percentage' ? 'Performance' : 'Revenue'} Breakdown {timeFrame === 'Month' ? '(Monthly)' : timeFrame === 'Quarter' ? '(Quarterly)' : '(Yearly)'}
          </h4>
          <div className="flex items-center space-x-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setGenreMetric('percentage')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  genreMetric === 'percentage' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Percentage Sold
              </button>
              <button
                onClick={() => setGenreMetric('revenue')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  genreMetric === 'revenue' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Revenue
              </button>
            </div>
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
        </div>
        
        <div className="h-80 w-full">
          {(() => {
            const genreData = getGenreChartData();
            

            
            if (genreData.data.length === 0) {
              return (
                <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <p className="text-gray-600">No genre data available</p>
                    <p className="text-sm text-gray-500 mt-1">Add events with artist genres to see this {genreMetric === 'percentage' ? 'performance' : 'revenue'} breakdown</p>
                  </div>
                </div>
              );
            }
            
            return (
              <div className="h-full">
                {/* Period Selector */}
                <div className="mb-4 flex items-center justify-center">
                  <span className="text-sm text-gray-600 mr-2">Showing data for:</span>
                  <div className="relative">
                    <select 
                      value={selectedPeriod} 
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-1 pr-8 text-sm font-semibold text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {getAvailablePeriods().map(period => (
                        <option key={period} value={period}>{period}</option>
                      ))}
                    </select>
                    <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-500 pointer-events-none" />
                  </div>
                </div>
                
                {/* Chart */}
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={genreData.data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <XAxis 
                        dataKey="genre" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6B7280' }}
                      />
                      <YAxis 
                        domain={genreMetric === 'percentage' ? [0, 100] : [0, 'dataMax']}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6B7280' }}
                        tickFormatter={(value) => genreMetric === 'percentage' ? `${value}%` : formatCurrency(value)}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#14B8A6" 
                        radius={[4, 4, 0, 0]}
                        opacity={0.8}
                      />
                      <Tooltip 
                        content={<GenreTooltip genreMetric={genreMetric} selectedPeriod={selectedPeriod} />}
                        cursor={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default EventAnalytics; 