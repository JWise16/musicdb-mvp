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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const cards = [
    {
      title: 'Shows Reported',
      value: analytics.showsReported.toString(),
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      chartColor: '#3b82f6',
      trendData: analytics.trends.showsReported
    },
    {
      title: 'Ticket Sales',
      value: formatCurrency(analytics.ticketSales),
      color: 'bg-green-500',
      textColor: 'text-green-600',
      chartColor: '#10b981',
      trendData: analytics.trends.ticketSales
    },
    {
      title: 'Bar Sales',
      value: formatCurrency(analytics.barSales),
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      chartColor: '#8b5cf6',
      trendData: analytics.trends.barSales
    },
    {
      title: 'Avg. Sellout Rate',
      value: formatPercentage(analytics.avgSelloutRate),
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      chartColor: '#f59e0b',
      trendData: analytics.trends.avgSelloutRate
    },
    {
      title: 'Avg Ticket Price',
      value: formatCurrency(analytics.avgTicketPrice),
      color: 'bg-red-500',
      textColor: 'text-red-600',
      chartColor: '#ef4444',
      trendData: analytics.trends.avgTicketPrice
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6 mb-6 lg:mb-8 overflow-hidden">
      {cards.map((card, index) => (
        <div key={index} className="card p-4 lg:p-6 min-w-0">
          <div className="min-w-0">
            <p className="text-xs lg:text-sm font-medium text-gray-600 mb-1 truncate">{card.title}</p>
            <div className="flex items-center justify-between">
              <p className="text-lg lg:text-2xl font-bold text-gray-900 truncate">{card.value}</p>
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