import { type VenueAnalytics } from '../../../services/venueService';

interface EventAnalyticsProps {
  analytics: VenueAnalytics;
}

const EventAnalytics = ({ analytics }: EventAnalyticsProps) => {
  const analyticsItems = [
    {
      title: 'Top Month',
      value: analytics.topMonth.month,
      subtitle: `${analytics.topMonth.count} shows`,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Top Genre',
      value: analytics.topGenre.genre,
      subtitle: `${analytics.topGenre.count} performances`,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      ),
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Top Artist',
      value: analytics.topArtist.name,
      subtitle: `${analytics.topArtist.count} appearances`,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    }
  ];

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Event Analytics</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {analyticsItems.map((item, index) => (
          <div key={index} className="card">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg ${item.color} bg-opacity-10`}>
                <div className={item.textColor}>
                  {item.icon}
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-600 mb-1">{item.title}</h4>
                <p className="text-lg font-semibold text-gray-900 mb-1">{item.value}</p>
                <p className="text-sm text-gray-500">{item.subtitle}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventAnalytics; 