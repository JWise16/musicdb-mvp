import { type VenueAnalytics } from '../../../services/venueService';

interface EventAnalyticsProps {
  analytics: VenueAnalytics;
}

const EventAnalytics = ({ analytics }: EventAnalyticsProps) => {
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

  return (
    <div className="mb-6 lg:mb-8 overflow-hidden">
      <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6 truncate">Event Analytics</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 overflow-hidden">
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
    </div>
  );
};

export default EventAnalytics; 