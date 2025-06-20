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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const cards = [
    {
      title: 'Shows Reported',
      value: analytics.showsReported.toString(),
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Ticket Sales',
      value: formatCurrency(analytics.ticketSales),
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Bar Sales',
      value: formatCurrency(analytics.barSales),
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'Avg. Sellout Rate',
      value: formatPercentage(analytics.avgSelloutRate),
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Avg Ticket Price',
      value: formatCurrency(analytics.avgTicketPrice),
      color: 'bg-red-500',
      textColor: 'text-red-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      {cards.map((card, index) => (
        <div key={index} className="card">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnalyticsCards; 