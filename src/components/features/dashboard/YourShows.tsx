import { type VenueEvent } from '../../../services/venueService';

interface YourShowsProps {
  upcoming: VenueEvent[];
  past: VenueEvent[];
  onEventClick: (eventId: string) => void;
}

const YourShows = ({ upcoming, past, onEventClick }: YourShowsProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getHeadliners = (event: VenueEvent) => {
    return event.event_artists
      ?.filter(ea => ea.is_headliner)
      .map(ea => ea.artists?.name)
      .filter(Boolean)
      .join(', ') || 'TBA';
  };

  const getPercentageSoldColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderEventCard = (event: VenueEvent, isUpcoming: boolean) => (
    <div 
      key={event.id}
      className="card hover:shadow-medium transition-all duration-200 cursor-pointer group"
      onClick={() => onEventClick(event.id)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-900 group-hover:text-accent-600 transition-colors line-clamp-2 mb-1">
            {event.name}
          </h4>
          <p className="text-sm text-gray-600 mb-2">
            {formatDate(event.date)}
          </p>
          <p className="text-sm text-gray-600 mb-2">
            {event.venues?.name} • {event.venues?.location}
          </p>
          <p className="text-sm font-medium text-gray-900">
            Artist: {getHeadliners(event)}
          </p>
        </div>
        <div className={`px-2 py-1 text-xs rounded-full ${
          isUpcoming ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {isUpcoming ? 'Upcoming' : 'Past'}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center">
          <span className="text-gray-600">Tickets:</span>
          <span className="ml-1 font-medium">${event.ticket_price}</span>
        </div>
        
        {!isUpcoming && event.tickets_sold && event.total_tickets && (
          <div className="flex items-center">
            <span className="text-gray-600 mr-1">Sold:</span>
            <span className={`font-medium ${getPercentageSoldColor(event.percentage_sold)}`}>
              {event.percentage_sold.toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {!isUpcoming && event.total_revenue > 0 && (
        <div className="mt-2 text-sm">
          <span className="text-gray-600">Revenue: </span>
          <span className="font-medium text-green-600">
            ${event.total_revenue.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Your Shows</h3>
      
      {/* Upcoming Shows */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Upcoming Shows</h4>
          <span className="text-sm text-gray-500">{upcoming.length} show{upcoming.length !== 1 ? 's' : ''}</span>
        </div>
        
        {upcoming.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-600">No upcoming shows scheduled</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcoming.slice(0, 6).map(event => renderEventCard(event, true))}
          </div>
        )}
      </div>

      {/* Past Shows */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Recent Shows</h4>
          <span className="text-sm text-gray-500">{past.length} show{past.length !== 1 ? 's' : ''}</span>
        </div>
        
        {past.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-600">No past shows found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {past.slice(0, 6).map(event => renderEventCard(event, false))}
          </div>
        )}
      </div>
    </div>
  );
};

export default YourShows; 