import { type EventWithDetails } from '../../../services/eventService';
import { formatEventDate } from '../../../utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';

interface EventTableProps {
  events: EventWithDetails[];
}

const EventTable = ({ events }: EventTableProps) => {
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({
    canScrollLeft: false,
    canScrollRight: false,
    isScrolling: false
  });
  const [showInitialHint, setShowInitialHint] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);
  const scrollbarThumbRef = useRef<HTMLDivElement>(null);

  // Debug: Log the first event to see the data structure (commented out to prevent re-renders)
  // if (events.length > 0) {
  //   console.log('Sample event data:', events[0]);
  //   console.log('Sample event_artists:', events[0].event_artists);
  // }

  // Update scrollbar thumb position directly
  const updateScrollbarThumb = useCallback(() => {
    const container = scrollContainerRef.current;
    const thumb = scrollbarThumbRef.current;
    if (!container || !thumb) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    
    // Only proceed if content is scrollable
    if (scrollWidth <= clientWidth) return;

    // Calculate thumb dimensions and position
    const thumbWidthPercent = Math.max((clientWidth / scrollWidth) * 100, 10);
    const maxScrollLeft = scrollWidth - clientWidth;
    const scrollPercent = scrollLeft / maxScrollLeft;
    const availableTrackSpace = 100 - thumbWidthPercent;
    const thumbLeftPercent = scrollPercent * availableTrackSpace;

    // Update thumb style directly
    thumb.style.left = `${thumbLeftPercent}%`;
    thumb.style.width = `${thumbWidthPercent}%`;
  }, []);

  // Check scroll position and update indicators
  const checkScrollPosition = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const canScrollLeft = scrollLeft > 0;
    const canScrollRight = scrollLeft < scrollWidth - clientWidth - 1; // -1 for rounding
    const hasScrollableContent = scrollWidth > clientWidth;

    setScrollState(prev => ({
      ...prev,
      canScrollLeft,
      canScrollRight
    }));
    
    setIsScrollable(hasScrollableContent);
    
    // Update scrollbar thumb position
    updateScrollbarThumb();
  }, [updateScrollbarThumb]);

  // Handle scroll events
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      setScrollState(prev => ({ ...prev, isScrolling: true }));
      checkScrollPosition(); // This now updates scrollMetrics state
      
      // Clear the scrolling state after scroll ends
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setScrollState(prev => ({ ...prev, isScrolling: false }));
      }, 150);
    };

    const handleResize = () => {
      checkScrollPosition(); // This now updates scrollMetrics state
    };

    // No longer needed since we're using custom scrollbar

    container.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    // Initial check
    checkScrollPosition();

    // Show initial hint if there's content to scroll
    setTimeout(() => {
      checkScrollPosition(); // Ensure scroll position is updated on load
      if (container.scrollWidth > container.clientWidth) {
        setShowInitialHint(true);
        setTimeout(() => setShowInitialHint(false), 3000); // Hide after 3 seconds
      }
    }, 500); // Show hint after 500ms

    return () => {
      container.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      clearTimeout(scrollTimeout);
    };
  }, [events.length]); // Re-run when events change

  const formatTicketPrice = (event: EventWithDetails) => {
    // Check if it's a price range
    if (event.ticket_price_min && event.ticket_price_max) {
      return `$${event.ticket_price_min} - $${event.ticket_price_max}`;
    }
    // Check if it's a single price
    if (event.ticket_price) {
      return `$${event.ticket_price}`;
    }
    // No price set
    return 'TBA';
  };

  const getEventGenres = (event: EventWithDetails) => {
    const genres = Array.from(new Set(
      event.event_artists
        ?.map(ea => ea.artists?.genre)
        .filter(Boolean)
    ));
    return genres.slice(0, 2); // Show max 2 genres
  };

  const getHeadliners = (event: EventWithDetails) => {
    if (!event.event_artists) {
      return [];
    }
    
    return event.event_artists
      ?.filter(ea => ea.is_headliner)
      .map(ea => ({
        id: ea.artists?.id,
        name: ea.artists?.name
      }))
      .filter(artist => artist.id && artist.name) || [];
  };

  const getSupportingActs = (event: EventWithDetails) => {
    return event.event_artists
      ?.filter(ea => !ea.is_headliner)
      .map(ea => ({
        id: ea.artists?.id,
        name: ea.artists?.name
      }))
      .filter(artist => artist.id && artist.name) || [];
  };

  // Navigate to individual artist page
  const handleArtistClick = (artistId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent row click from firing
    navigate(`/artist/${artistId}`);
  };



  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
        <p className="text-gray-600">Try adjusting your filters or add some events to get started.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">
      <div className="relative flex-1 flex flex-col min-h-0">
        {/* Left scroll shadow */}
        <div 
          className={`absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
            scrollState.canScrollLeft ? 'opacity-100' : 'opacity-0'
          }`}
        />
        
        {/* Right scroll shadow */}
        <div 
          className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none transition-opacity duration-300 ${
            scrollState.canScrollRight ? 'opacity-100' : 'opacity-0'
          }`}
        />
        
        {/* Right scroll indicator arrow */}
        <div 
          className={`absolute right-2 top-1/2 transform -translate-y-1/2 z-20 pointer-events-none transition-all duration-300 ${
            scrollState.canScrollRight ? 'opacity-70 translate-x-0' : 'opacity-0 translate-x-2'
          }`}
          title="Scroll right to see more columns"
        >
          <div className="bg-gray-800 text-white p-1 rounded-full shadow-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          
          {/* Tooltip for scroll hint - shows briefly on first load */}
          {showInitialHint && scrollState.canScrollRight && (
            <div className="absolute top-full right-0 mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap animate-pulse">
              Scroll right for more details →
            </div>
          )}
        </div>

        {/* Scroll container - handles both horizontal and vertical scrolling */}
        <div 
          ref={scrollContainerRef}
          className={`flex-1 transition-transform duration-500 events-table-scroll ${
            showInitialHint ? 'transform translate-x-2' : 'transform translate-x-0'
          }`}
          style={{ 
            scrollbarGutter: 'stable'
          }}
          tabIndex={0}
          onKeyDown={(e) => {
            if (!scrollContainerRef.current) return;
            const container = scrollContainerRef.current;
            
            // Add keyboard navigation support
            if (e.key === 'ArrowLeft') {
              e.preventDefault();
              container.scrollLeft -= 50;
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              container.scrollLeft += 50;
            }
          }}
        >
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 relative sticky top-0 z-10">
            {/* Header scroll hint */}
            {scrollState.canScrollRight && (
              <div className="absolute right-1 top-1/2 transform -translate-y-1/2 z-20 pointer-events-none">
                <div className={`flex items-center gap-1 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow-sm border transition-all duration-300 ${
                  showInitialHint ? 'animate-pulse bg-accent-50 border-accent-200 text-accent-600' : 'hover:bg-gray-50'
                }`}>
                  <span>More columns</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            )}
            <tr>
              <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Headliner
              </th>
              <th className="hidden sm:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Supporting
              </th>
              <th className="hidden md:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Genre
              </th>
              <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Venue
              </th>
              <th className="hidden lg:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="hidden xl:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Capacity
              </th>
              <th className="hidden sm:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sold
              </th>
              <th className="px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                % Sold
              </th>
              <th className="hidden md:table-cell px-3 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {events.map((event) => {
              const headliners = getHeadliners(event);
              const supportingActs = getSupportingActs(event);
              const genres = getEventGenres(event);

              return (
                <tr
                  key={event.id}
                  className="hover:bg-gray-50"
                >
                  {/* Date */}
                  <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                    <div className="text-xs lg:text-sm text-gray-900">
                      {formatEventDate(event.date)}
                    </div>
                  </td>

                  {/* Headliners */}
                  <td 
                    className="px-3 lg:px-6 py-4 cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={headliners.length > 0 ? (e) => handleArtistClick(headliners[0].id, e) : undefined}
                    title={headliners.length > 0 ? `View ${headliners[0].name}'s profile` : undefined}
                  >
                    <div className="text-xs lg:text-sm text-gray-900">
                      {headliners.length > 0 ? (
                        <div>
                          {headliners.slice(0, 1).map((artist, index) => (
                            <div key={index} className="font-medium hover:text-accent-600">
                              <span>{artist.name}</span>
                            </div>
                          ))}
                          {headliners.length > 1 && (
                            <div className="text-gray-500 text-xs">
                              +{headliners.length - 1} more
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </td>

                  {/* Supporting Acts - Hidden on small screens */}
                  <td 
                    className="hidden sm:table-cell px-3 lg:px-6 py-4 cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={supportingActs.length > 0 ? (e) => handleArtistClick(supportingActs[0].id, e) : undefined}
                    title={supportingActs.length > 0 ? `View ${supportingActs[0].name}'s profile` : undefined}
                  >
                    <div className="text-xs lg:text-sm text-gray-700">
                      {supportingActs.length > 0 ? (
                        <div>
                          {supportingActs.slice(0, 1).map((artist, index) => (
                            <div key={index} className="hover:text-accent-600">
                              <span>{artist.name}</span>
                            </div>
                          ))}
                          {supportingActs.length > 1 && (
                            <div className="text-gray-500 text-xs">
                              +{supportingActs.length - 1} more
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </td>

                  {/* Genres - Hidden on small/medium screens */}
                  <td className="hidden md:table-cell px-3 lg:px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[100px] lg:max-w-none">
                      {genres.length > 0 ? (
                        genres.slice(0, 1).map((genre, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-accent-100 text-accent-700 rounded-full truncate"
                          >
                            {genre}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </td>

                  {/* Venue Name */}
                  <td className="px-3 lg:px-6 py-4">
                    <div className="text-xs lg:text-sm font-medium text-gray-900 max-w-[120px] lg:max-w-none">
                      <div className="truncate" title={event.venues?.name}>
                        {event.venues?.name || '—'}
                      </div>
                      {/* Show location on small screens where location column is hidden */}
                      <div className="lg:hidden text-xs text-gray-500 truncate">
                        {event.venues?.location || ''}
                      </div>
                    </div>
                  </td>

                  {/* Venue Location - Hidden on small/medium screens */}
                  <td className="hidden lg:table-cell px-3 lg:px-6 py-4">
                    <div className="text-sm text-gray-700 max-w-[120px] truncate" title={event.venues?.location}>
                      {event.venues?.location || '—'}
                    </div>
                  </td>

                  {/* Venue Capacity - Hidden on small/medium/large screens */}
                  <td className="hidden xl:table-cell px-3 lg:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {event.venues?.capacity ? event.venues.capacity.toLocaleString() : '—'}
                    </div>
                  </td>

                  {/* Tickets Sold - Hidden on small screens */}
                  <td className="hidden sm:table-cell px-3 lg:px-6 py-4 whitespace-nowrap">
                    <div className="text-xs lg:text-sm font-medium text-gray-900">
                      {event.tickets_sold !== null ? (
                        <span className="sm:hidden">{Math.round(event.tickets_sold / 1000)}k</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                      <span className="hidden sm:inline">
                        {event.tickets_sold !== null ? (
                          event.tickets_sold.toLocaleString()
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </span>
                    </div>
                  </td>

                  {/* % Sold */}
                  <td className="px-3 lg:px-6 py-4 whitespace-nowrap">
                    <div className="text-xs lg:text-sm font-medium text-gray-900">
                      {event.tickets_sold !== null && event.venues?.capacity ? (
                        `${Math.round((event.tickets_sold / event.venues.capacity) * 100)}%`
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </td>

                  {/* Ticket Price - Hidden on small/medium screens */}
                  <td className="hidden md:table-cell px-3 lg:px-6 py-4 whitespace-nowrap">
                    <div className="text-xs lg:text-sm font-medium text-gray-900">
                      {formatTicketPrice(event)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
      
      {/* Custom horizontal scroll indicator - show when content needs horizontal scrolling */}
      {(isScrollable || scrollState.canScrollLeft || scrollState.canScrollRight) && (
        <div className="mt-3 px-2 flex-shrink-0">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Table columns</span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              Scroll to see more
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </div>
          <div 
            className="relative h-2 bg-gray-100 rounded-full overflow-hidden cursor-pointer"
            onClick={(e) => {
              if (!scrollContainerRef.current) return;
              
              const container = scrollContainerRef.current;
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const clickRatio = clickX / rect.width;
              const targetScrollLeft = clickRatio * (container.scrollWidth - container.clientWidth);
              
              container.scrollTo({
                left: Math.max(0, Math.min(targetScrollLeft, container.scrollWidth - container.clientWidth)),
                behavior: 'smooth'
              });
            }}
          >
            {/* Track */}
            <div className="absolute inset-0 bg-gray-100 rounded-full" />
            
            {/* Scrollbar thumb */}
            <div 
              ref={scrollbarThumbRef}
              className="absolute top-0 h-full bg-gray-400 rounded-full cursor-pointer hover:bg-gray-500 transition-all duration-200 shadow-sm"
              style={{
                left: '0%',
                width: '20%'
              }}
              onMouseDown={(e) => {
                if (!scrollContainerRef.current) return;
                e.preventDefault();
                
                const container = scrollContainerRef.current;
                const rect = e.currentTarget.parentElement!.getBoundingClientRect();
                const startX = e.clientX;
                const startScrollLeft = container.scrollLeft;
                
                const handleMouseMove = (e: MouseEvent) => {
                  const deltaX = e.clientX - startX;
                  const scrollRatio = deltaX / rect.width;
                  const newScrollLeft = startScrollLeft + (scrollRatio * container.scrollWidth);
                  container.scrollLeft = Math.max(0, Math.min(newScrollLeft, container.scrollWidth - container.clientWidth));
                };
                
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            />
          </div>
        </div>
      )}
      
      {/* Mobile-friendly note with scroll hint - outside scrolling area */}
      <div className="mt-3 text-xs text-gray-500 md:hidden flex-shrink-0">
        <p>Some columns are hidden on smaller screens. 
          {scrollState.canScrollRight && <span className="font-medium text-accent-600"> Scroll right to see more details.</span>}
        </p>
      </div>
    </div>
  );
};

export default EventTable; 