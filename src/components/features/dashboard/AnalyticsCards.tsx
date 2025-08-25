import { LineChart, Line, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { type VenueAnalytics } from '../../../services/venueService';

interface AnalyticsCardsProps {
  analytics: VenueAnalytics;
}

const AnalyticsCards = ({ analytics }: AnalyticsCardsProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyCompact = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}K`;
    }
    return formatCurrency(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatNumberCompact = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const calculateGrowth = (data: { value: number; date: string; formattedDate: string }[]): number => {
    if (data.length < 2) return 0;
    
    const first = data[0].value;
    const last = data[data.length - 1].value;
    
    if (first === 0) return 0;
    
    return ((last - first) / first) * 100;
  };

  const formatTrendData = (data: { value: number; date: string; formattedDate: string }[]) => {
    return data.map((item) => ({
      ...item,
      period: item.formattedDate
    }));
  };

  const cards = [
    {
      title: 'Shows Reported',
      value: formatNumberCompact(analytics.showsReported),
      fullValue: formatNumber(analytics.showsReported),
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      chartColor: '#3b82f6',
      trendData: analytics.trends.showsReported
    },
    {
      title: 'Ticket Sales',
      value: formatCurrencyCompact(analytics.ticketSales),
      fullValue: formatCurrency(analytics.ticketSales),
      color: 'bg-green-500',
      textColor: 'text-green-600',
      chartColor: '#10b981',
      trendData: analytics.trends.ticketSales
    },
    {
      title: 'Bar Sales',
      value: formatCurrencyCompact(analytics.barSales),
      fullValue: formatCurrency(analytics.barSales),
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      chartColor: '#8b5cf6',
      trendData: analytics.trends.barSales
    },
    {
      title: 'Avg. Sellout Rate',
      value: formatPercentage(analytics.avgSelloutRate),
      fullValue: formatPercentage(analytics.avgSelloutRate),
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      chartColor: '#f59e0b',
      trendData: analytics.trends.avgSelloutRate
    },
    {
      title: 'Avg Ticket Price',
      value: formatCurrencyCompact(analytics.avgTicketPrice),
      fullValue: formatCurrency(analytics.avgTicketPrice),
      color: 'bg-red-500',
      textColor: 'text-red-600',
      chartColor: '#ef4444',
      trendData: analytics.trends.avgTicketPrice
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6 mb-6 lg:mb-8">
      {cards.map((card, index) => {
        const growth = calculateGrowth(card.trendData);
        const chartData = formatTrendData(card.trendData);
        
        return (
          <div key={index} className="card p-4 lg:p-6 h-64 flex flex-col">
            {/* Fixed height header section */}
            <div className="flex items-start justify-between mb-4 h-16 flex-shrink-0">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-gray-900 break-words leading-tight">{card.title}</h3>
                <p className="text-lg lg:text-xl font-semibold text-gray-900 mt-1 leading-tight" title={card.fullValue}>
                  {card.value}
                </p>
              </div>
              <div className={`text-xs px-2 py-1 rounded whitespace-nowrap ml-2 flex-shrink-0 h-fit ${
                growth >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
              </div>
            </div>
            
            {/* Chart section with flex-grow to fill remaining space */}
            <div className="flex-grow min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 20 }}>
                  <XAxis 
                    dataKey="period" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#6B7280' }}
                    interval="preserveStartEnd"
                    height={20}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={card.chartColor}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3, fill: card.chartColor }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const value = payload[0].value as number;
                        let formattedValue = '';
                        
                        if (card.title.includes('Sales') || card.title.includes('Price')) {
                          formattedValue = formatCurrency(value);
                        } else if (card.title.includes('Rate')) {
                          formattedValue = formatPercentage(value);
                        } else {
                          formattedValue = formatNumber(value);
                        }
                        
                        return (
                          <div className="bg-white p-2 rounded shadow-lg border text-xs">
                            <div className="font-medium">{label}</div>
                            <div style={{ color: card.chartColor }}>
                              {card.title}: {formattedValue}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AnalyticsCards; 