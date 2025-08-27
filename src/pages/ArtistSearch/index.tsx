import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/layout/Sidebar';
import { Button } from '../../components/common/Button';
import { VibrateService, type VibrateArtist } from '../../services/vibrateService';

// Default featured artists to show before search
const FEATURED_ARTISTS: VibrateArtist[] = [
  {
    uuid: '48eda2b7-29d2-483b-8c7b-b2945fa9a2d5',
    name: 'Tyler, The Creator',
    slug: 'tyler-the-creator',
    image: 'https://viberate-upload.ams3.cdn.digitaloceanspaces.com/prod/entity/artist/tyler-the-creator-nHDdk',
    rank: 1,
    verified: true,
    country: {
      name: 'United States',
      alpha2: 'US',
      continent_code: 'NA'
    },
    genre: {
      id: 1,
      name: 'Hip Hop',
      slug: 'hip-hop'
    },
    subgenres: [
      { id: 1, name: 'Alternative Hip Hop', slug: 'alternative-hip-hop' },
      { id: 2, name: 'Conscious Hip Hop', slug: 'conscious-hip-hop' }
    ]
  },
  {
    uuid: '51ea2de0-6294-4f2b-bb83-7abab5cb3aca',
    name: 'Tame Impala',
    slug: 'tame-impala',
    image: 'https://viberate-upload.ams3.cdn.digitaloceanspaces.com/prod/entity/artist/tame-impala-EK5pl',
    rank: 2,
    verified: true,
    country: {
      name: 'Australia',
      alpha2: 'AU',
      continent_code: 'OC'
    },
    genre: {
      id: 2,
      name: 'Psychedelic Rock',
      slug: 'psychedelic-rock'
    },
    subgenres: [
      { id: 3, name: 'Indie Rock', slug: 'indie-rock' },
      { id: 4, name: 'Dream Pop', slug: 'dream-pop' }
    ]
  },
  {
    uuid: '7a801821-bd5b-4686-9c2a-5a020a17e854',
    name: 'Don Toliver',
    slug: 'don-toliver',
    image: 'https://viberate-upload.ams3.cdn.digitaloceanspaces.com/prod/entity/artist/don-toliver-PJ7G2',
    rank: 3,
    verified: true,
    country: {
      name: 'United States',
      alpha2: 'US',
      continent_code: 'NA'
    },
    genre: {
      id: 3,
      name: 'R&B',
      slug: 'rnb'
    },
    subgenres: [
      { id: 5, name: 'Trap', slug: 'trap' },
      { id: 6, name: 'Contemporary R&B', slug: 'contemporary-rnb' }
    ]
  },
  {
    uuid: '2cbd7e47-e0b6-4144-a807-bf2a4189b96b',
    name: 'Morgan Wallen',
    slug: 'morgan-wallen',
    image: 'https://viberate-upload.ams3.cdn.digitaloceanspaces.com/prod/entity/artist/morgan-wallen-i1t43',
    rank: 4,
    verified: true,
    country: {
      name: 'United States',
      alpha2: 'US',
      continent_code: 'NA'
    },
    genre: {
      id: 4,
      name: 'Country',
      slug: 'country'
    },
    subgenres: [
      { id: 7, name: 'Country Pop', slug: 'country-pop' },
      { id: 8, name: 'Contemporary Country', slug: 'contemporary-country' }
    ]
  },
  {
    uuid: 'd17312ee-1a08-4d6a-9c94-67e4a9062927',
    name: 'Hugel',
    slug: 'hugel',
    image: 'https://viberate-upload.ams3.cdn.digitaloceanspaces.com/prod/entity/artist/hugel-eAnLu',
    rank: 5,
    verified: false,
    country: {
      name: 'France',
      alpha2: 'FR',
      continent_code: 'EU'
    },
    genre: {
      id: 5,
      name: 'House',
      slug: 'house'
    },
    subgenres: [
      { id: 9, name: 'Deep House', slug: 'deep-house' },
      { id: 10, name: 'Tech House', slug: 'tech-house' }
    ]
  },
  {
    uuid: '98ff8787-8848-4188-932f-21665019e6e2',
    name: 'Sublime',
    slug: 'sublime',
    image: 'https://viberate-upload.ams3.cdn.digitaloceanspaces.com/prod/entity/artist/sublime-PNEgQ',
    rank: 6,
    verified: true,
    country: {
      name: 'United States',
      alpha2: 'US',
      continent_code: 'NA'
    },
    genre: {
      id: 6,
      name: 'Ska Punk',
      slug: 'ska-punk'
    },
    subgenres: [
      { id: 11, name: 'Reggae Rock', slug: 'reggae-rock' },
      { id: 12, name: 'Alternative Rock', slug: 'alternative-rock' }
    ]
  }
];

const ArtistSearch = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VibrateArtist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const result = await VibrateService.searchArtists(searchQuery);
      if (result && result.success) {
        setSearchResults(result.artists);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching for artists:', error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleArtistClick = (artistUuid: string) => {
    navigate(`/artist/${artistUuid}`);
  };

  // Show featured artists when no search has been performed, otherwise show search results
  const displayArtists = !hasSearched ? FEATURED_ARTISTS : searchResults;
  const displayTitle = !hasSearched ? "Featured Artists" : `Found ${searchResults.length} artist${searchResults.length !== 1 ? 's' : ''} for "${searchQuery}"`;

  return (
    <div className="min-h-screen bg-[#F6F6F3] flex">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
        <div className="rounded-3xl bg-white shadow-soft p-4 lg:p-8 min-h-[90vh] max-w-full">
          {/* Header */}
          <div className="mb-6 lg:mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">Artist Search</h2>
            <p className="text-gray-600">
              Search for artists and discover new talent
            </p>
          </div>

          {/* Search Section */}
          <div className="max-w-2xl mb-8">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search for artists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={isLoading || !searchQuery.trim()}
                className="px-6 py-3 bg-black hover:bg-gray-800 text-white focus:ring-gray-500"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Searching...
                  </div>
                ) : (
                  'Search'
                )}
              </Button>
            </div>
          </div>

          {/* Results Section */}
          <div>
            {hasSearched && !isLoading && searchResults.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg mb-2">No results found</div>
                <p className="text-gray-500">Try adjusting your search terms</p>
              </div>
            )}
            
            {/* Featured Artists or Search Results */}
            {displayArtists.length > 0 && (
              <div>
                <div className="mb-4">
                  <p className="text-gray-600">
                    {displayTitle}
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {displayArtists.map((artist) => (
                  <div
                    key={artist.uuid}
                    onClick={() => handleArtistClick(artist.uuid)}
                    className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <div className="flex items-center gap-4">
                      {artist.image && (
                        <img
                          src={artist.image}
                          alt={artist.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate flex items-center gap-2">
                          {artist.name}
                          {artist.verified && (
                            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {artist.genre?.name}
                          {artist.country?.name && ` • ${artist.country.name}`}
                        </p>
                        {artist.subgenres && artist.subgenres.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {artist.subgenres.slice(0, 2).map((subgenre) => (
                              <span
                                key={subgenre.id}
                                className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full"
                              >
                                {subgenre.name}
                              </span>
                            ))}
                            {artist.subgenres.length > 2 && (
                              <span className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded-full">
                                +{artist.subgenres.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                                 ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ArtistSearch; 