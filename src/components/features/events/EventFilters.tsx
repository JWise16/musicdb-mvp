import { type EventFilters } from '../../../services/eventService';

interface EventFiltersProps {
  filters: EventFilters;
  filterOptions: {
    genres: string[];
    cities: string[];
    venueSizes: Array<{ value: string; label: string; count: number }>;
  };
  onFilterChange: (filters: Partial<EventFilters>) => void;
}

const EventFiltersComponent = ({ filters, filterOptions, onFilterChange }: EventFiltersProps) => {
  const handleSearchChange = (value: string) => {
    onFilterChange({ searchQuery: value || undefined });
  };

  const handleGenreChange = (genre: string) => {
    onFilterChange({ genre: genre || undefined });
  };

  const handleCityChange = (city: string) => {
    onFilterChange({ city: city || undefined });
  };

  const handleVenueSizeChange = (size: string) => {
    onFilterChange({ venueSize: size as 'small' | 'medium' | 'large' || undefined });
  };

  const handleTimeFrameChange = (timeFrame: string) => {
    onFilterChange({ timeFrame: timeFrame as 'upcoming' | 'past' | 'all' || undefined });
  };

  const handlePercentageSoldChange = (percentage: string) => {
    onFilterChange({ percentageSold: percentage as 'low' | 'medium' | 'high' || undefined });
  };

  const clearFilter = (filterKey: keyof EventFilters) => {
    onFilterChange({ [filterKey]: undefined });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined);

  return (
    <div className="mb-8">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search events, venues, or artists..."
            value={filters.searchQuery || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
          />
          {filters.searchQuery && (
            <button
              onClick={() => clearFilter('searchQuery')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Genre Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
          <select
            value={filters.genre || ''}
            onChange={(e) => handleGenreChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
          >
            <option value="">All Genres</option>
            {filterOptions.genres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>

        {/* City Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
          <select
            value={filters.city || ''}
            onChange={(e) => handleCityChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
          >
            <option value="">All Cities</option>
            {filterOptions.cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Venue Size Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Venue Size</label>
          <select
            value={filters.venueSize || ''}
            onChange={(e) => handleVenueSizeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
          >
            <option value="">All Sizes</option>
            {filterOptions.venueSizes.map(size => (
              <option key={size.value} value={size.value}>
                {size.label} ({size.count})
              </option>
            ))}
          </select>
        </div>

        {/* Time Frame Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Time Frame</label>
          <select
            value={filters.timeFrame || ''}
            onChange={(e) => handleTimeFrameChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
          >
            <option value="">All Events</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
        </div>

        {/* Percentage Sold Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ticket Sales</label>
          <select
            value={filters.percentageSold || ''}
            onChange={(e) => handlePercentageSoldChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
          >
            <option value="">All Sales</option>
            <option value="low">Low (0-33%)</option>
            <option value="medium">Medium (34-66%)</option>
            <option value="high">High (67-100%)</option>
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.searchQuery && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-accent-100 text-accent-700">
              Search: "{filters.searchQuery}"
              <button
                onClick={() => clearFilter('searchQuery')}
                className="ml-2 text-accent-500 hover:text-accent-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          
          {filters.genre && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">
              Genre: {filters.genre}
              <button
                onClick={() => clearFilter('genre')}
                className="ml-2 text-blue-500 hover:text-blue-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          
          {filters.city && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
              City: {filters.city}
              <button
                onClick={() => clearFilter('city')}
                className="ml-2 text-green-500 hover:text-green-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          
          {filters.venueSize && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700">
              Venue: {filterOptions.venueSizes.find(size => size.value === filters.venueSize)?.label || filters.venueSize}
              <button
                onClick={() => clearFilter('venueSize')}
                className="ml-2 text-purple-500 hover:text-purple-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          
          {filters.timeFrame && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700">
              Time: {filters.timeFrame}
              <button
                onClick={() => clearFilter('timeFrame')}
                className="ml-2 text-yellow-500 hover:text-yellow-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          
          {filters.percentageSold && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-700">
              Sales: {filters.percentageSold === 'low' ? '0-33%' : 
                      filters.percentageSold === 'medium' ? '34-66%' : 
                      filters.percentageSold === 'high' ? '67-100%' : 
                      filters.percentageSold}
              <button
                onClick={() => clearFilter('percentageSold')}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default EventFiltersComponent; 