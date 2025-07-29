import { type EventFilters } from '../../../services/eventService';
import VenueSizeDropdown from '../../common/VenueSizeDropdown';
import PercentSoldDropdown from '../../common/PercentSoldDropdown';

interface EventFiltersProps {
  filters: EventFilters;
  filterOptions: {
    genres: string[];
    cities: string[];
    venueSizes: Array<{ value: string; label: string; count: number }>;
    venueHistogram: number[];
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

  const handleVenueSizeRangeChange = (range: [number, number]) => {
    onFilterChange({ venueSizeRange: range });
  };

  const handlePercentageSoldRangeChange = (range: [number, number]) => {
    onFilterChange({ percentageSoldRange: range });
  };

  const handleSortByChange = (sortBy: string) => {
    onFilterChange({ sortBy: sortBy as any || undefined });
  };

  const handleDateFromChange = (date: string) => {
    onFilterChange({ dateFrom: date || undefined });
  };

  const handleDateToChange = (date: string) => {
    onFilterChange({ dateTo: date || undefined });
  };

  const clearFilter = (filterKey: keyof EventFilters) => {
    onFilterChange({ [filterKey]: undefined });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined);

  return (
    <div className="mb-6 lg:mb-8">
      {/* Search Bar */}
      <div className="mb-4 lg:mb-6">
        <div className="relative max-w-full">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search events, venues, or artists..."
            value={filters.searchQuery || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-10 py-2 lg:py-3 text-sm lg:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
          />
          {filters.searchQuery && (
            <button
              onClick={() => clearFilter('searchQuery')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
        {/* Genre Filter */}
        <div className="min-w-0">
          <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">Genre</label>
          <select
            value={filters.genre || ''}
            onChange={(e) => handleGenreChange(e.target.value)}
            className="w-full px-2 lg:px-3 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
          >
            <option value="">All Genres</option>
            {filterOptions.genres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>

        {/* City Filter */}
        <div className="min-w-0">
          <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">City</label>
          <select
            value={filters.city || ''}
            onChange={(e) => handleCityChange(e.target.value)}
            className="w-full px-2 lg:px-3 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
          >
            <option value="">All Cities</option>
            {filterOptions.cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Percentage Sold Filter */}
        <div className="min-w-0">
          <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">Percentage Sold</label>
          <PercentSoldDropdown
            value={filters.percentageSoldRange || [0, 100]}
            onChange={handlePercentageSoldRangeChange}
          />
        </div>

        {/* Sort By Filter */}
        <div className="min-w-0">
          <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">Sort By</label>
          <select
            value={filters.sortBy || ''}
            onChange={(e) => handleSortByChange(e.target.value)}
            className="w-full px-2 lg:px-3 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
          >
            <option value="">Default</option>
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="percent_sold_desc">% Sold (High-Low)</option>
            <option value="percent_sold_asc">% Sold (Low-High)</option>
            <option value="capacity_desc">Capacity (High-Low)</option>
            <option value="capacity_asc">Capacity (Low-High)</option>
            <option value="price_desc">Price (High-Low)</option>
            <option value="price_asc">Price (Low-High)</option>
          </select>
        </div>
      </div>

      {/* Venue Size and Date Range Filters */}
      <div className="mt-3 lg:mt-4 grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
        <div className="min-w-0">
          <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">Venue Size</label>
          <VenueSizeDropdown
            min={1}
            max={1000}
            value={filters.venueSizeRange || [1, 1000]}
            onChange={handleVenueSizeRangeChange}
            histogram={filterOptions.venueHistogram}
          />
        </div>
        <div className="min-w-0">
          <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">From Date</label>
          <input
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => handleDateFromChange(e.target.value)}
            className="w-full px-2 lg:px-3 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
          />
        </div>
        <div className="min-w-0">
          <label className="block text-xs lg:text-sm font-medium text-gray-700 mb-2">To Date</label>
          <input
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => handleDateToChange(e.target.value)}
            className="w-full px-2 lg:px-3 py-2 text-sm lg:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
          />
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-3 lg:mt-4 flex flex-wrap gap-1 lg:gap-2">
          {filters.searchQuery && (
            <span className="inline-flex items-center px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm bg-accent-100 text-accent-700">
              <span className="truncate max-w-[120px] lg:max-w-none">Search: "{filters.searchQuery}"</span>
              <button
                onClick={() => clearFilter('searchQuery')}
                className="ml-1 lg:ml-2 text-accent-500 hover:text-accent-700 flex-shrink-0"
              >
                <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          
          {filters.genre && (
            <span className="inline-flex items-center px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm bg-blue-100 text-blue-700">
              <span className="truncate max-w-[100px] lg:max-w-none">Genre: {filters.genre}</span>
              <button
                onClick={() => clearFilter('genre')}
                className="ml-1 lg:ml-2 text-blue-500 hover:text-blue-700 flex-shrink-0"
              >
                <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          
          {filters.city && (
            <span className="inline-flex items-center px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm bg-green-100 text-green-700">
              <span className="truncate max-w-[100px] lg:max-w-none">City: {filters.city}</span>
              <button
                onClick={() => clearFilter('city')}
                className="ml-1 lg:ml-2 text-green-500 hover:text-green-700 flex-shrink-0"
              >
                <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          
          {filters.venueSizeRange && (filters.venueSizeRange[0] !== 1 || filters.venueSizeRange[1] !== 1000) && (
            <span className="inline-flex items-center px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm bg-purple-100 text-purple-700">
              Venue: {filters.venueSizeRange[0]}-{filters.venueSizeRange[1] >= 1000 ? '1000+' : filters.venueSizeRange[1]}
              <button
                onClick={() => clearFilter('venueSizeRange')}
                className="ml-1 lg:ml-2 text-purple-500 hover:text-purple-700 flex-shrink-0"
              >
                <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          
          {filters.venueSize && (
            <span className="inline-flex items-center px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm bg-purple-100 text-purple-700">
              <span className="truncate max-w-[120px] lg:max-w-none">Venue: {filterOptions.venueSizes.find(size => size.value === filters.venueSize)?.label || filters.venueSize}</span>
              <button
                onClick={() => clearFilter('venueSize')}
                className="ml-1 lg:ml-2 text-purple-500 hover:text-purple-700 flex-shrink-0"
              >
                <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          
          
          {filters.percentageSoldRange && (filters.percentageSoldRange[0] !== 0 || filters.percentageSoldRange[1] !== 100) && (
            <span className="inline-flex items-center px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm bg-red-100 text-red-700">
              % Sold: {filters.percentageSoldRange[0]}%-{filters.percentageSoldRange[1]}%
              <button
                onClick={() => clearFilter('percentageSoldRange')}
                className="ml-1 lg:ml-2 text-red-500 hover:text-red-700 flex-shrink-0"
              >
                <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          
          {filters.percentageSold && (
            <span className="inline-flex items-center px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm bg-red-100 text-red-700">
              Sales: {filters.percentageSold === 'low' ? '0-33%' : 
                      filters.percentageSold === 'medium' ? '34-66%' : 
                      filters.percentageSold === 'high' ? '67-100%' : 
                      filters.percentageSold}
              <button
                onClick={() => clearFilter('percentageSold')}
                className="ml-1 lg:ml-2 text-red-500 hover:text-red-700 flex-shrink-0"
              >
                <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}

          {filters.dateFrom && (
            <span className="inline-flex items-center px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm bg-indigo-100 text-indigo-700">
              From: {new Date(filters.dateFrom).toLocaleDateString()}
              <button
                onClick={() => clearFilter('dateFrom')}
                className="ml-1 lg:ml-2 text-indigo-500 hover:text-indigo-700 flex-shrink-0"
              >
                <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}

          {filters.dateTo && (
            <span className="inline-flex items-center px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm bg-indigo-100 text-indigo-700">
              To: {new Date(filters.dateTo).toLocaleDateString()}
              <button
                onClick={() => clearFilter('dateTo')}
                className="ml-1 lg:ml-2 text-indigo-500 hover:text-indigo-700 flex-shrink-0"
              >
                <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}

          {filters.sortBy && (
            <span className="inline-flex items-center px-2 lg:px-3 py-1 rounded-full text-xs lg:text-sm bg-yellow-100 text-yellow-700">
              <span className="truncate max-w-[120px] lg:max-w-none">
                Sort: {filters.sortBy === 'date_desc' ? 'Newest First' :
                       filters.sortBy === 'date_asc' ? 'Oldest First' :
                       filters.sortBy === 'percent_sold_desc' ? '% Sold (High-Low)' :
                       filters.sortBy === 'percent_sold_asc' ? '% Sold (Low-High)' :
                       filters.sortBy === 'capacity_desc' ? 'Capacity (High-Low)' :
                       filters.sortBy === 'capacity_asc' ? 'Capacity (Low-High)' :
                       filters.sortBy === 'price_desc' ? 'Price (High-Low)' :
                       filters.sortBy === 'price_asc' ? 'Price (Low-High)' :
                       filters.sortBy}
              </span>
              <button
                onClick={() => clearFilter('sortBy')}
                className="ml-1 lg:ml-2 text-yellow-500 hover:text-yellow-700 flex-shrink-0"
              >
                <svg className="w-3 h-3 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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