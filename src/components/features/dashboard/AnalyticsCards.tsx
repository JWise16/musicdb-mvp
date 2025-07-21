import { type VenueAnalytics } from '../../../services/venueService';
import TrendChart from '../../common/TrendChart';

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
      {cards.map((card, index) => (
        <div key={index} className="card p-4 lg:p-6 relative group">
          <div className="flex flex-col h-full">
            <p className="text-xs lg:text-sm font-medium text-gray-600 mb-1 leading-tight">{card.title}</p>
            <div className="flex items-center justify-between flex-1 min-w-0">
              <div className="flex-1 min-w-0 relative">
                <p 
                  className="text-lg lg:text-2xl font-bold text-gray-900 leading-tight cursor-help"
                  title={card.fullValue !== card.value ? card.fullValue : undefined}
                >
                  {card.value}
                </p>
                {/* Tooltip for full value when abbreviated */}
                {card.fullValue !== card.value && (
                  <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 pointer-events-none">
                    {card.fullValue}
                    <div className="absolute top-full left-2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
                  </div>
                )}
              </div>
              <TrendChart 
                data={card.trendData} 
                color={card.chartColor}
                className="flex-shrink-0 ml-2"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnalyticsCards; 