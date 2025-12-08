import { MapPin, Star, ExternalLink, RefreshCw, DollarSign } from 'lucide-react';
import { ComedyEvent, ComedyCategory } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface ResultsProps {
  events: ComedyEvent[];
  onReset: () => void;
  city?: string;
}

const CATEGORIES: ComedyCategory[] = [
  'Comedy Workshop',
  'Comedy Podcasts',
  'Stand-Up Comedy Club',
  'Improv Comedy Leaders',
];

function Results({ events, onReset, city }: ResultsProps) {
  const { theme } = useTheme();

  const getEventsForCategory = (category: ComedyCategory): ComedyEvent[] => {
    return events.filter((e) => e.category === category);
  };

  const getGoogleMapsUrl = (placeId?: string) => {
    if (!placeId) return null;
    return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
  };

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img
              src="/comedyclub_logo2.png"
              alt="Comedy Scrapper 2028"
              className="w-16 h-16 object-contain"
            />
            <div>
              <h2 className="text-3xl font-bold mb-1">
                Tonight's Best Comedy{city && ` in ${city}`}
              </h2>
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                Top venues by ratings in each category
              </p>
            </div>
          </div>
          <button
            onClick={onReset}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 hover:bg-gray-700'
                : 'bg-white hover:bg-gray-100 border border-gray-300'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">New Search</span>
          </button>
        </div>

        <div className="space-y-8">
          {CATEGORIES.map((category) => {
            const categoryEvents = getEventsForCategory(category);

            return (
              <div key={category}>
                <h3 className="text-xl font-semibold text-yellow-400 uppercase tracking-wide mb-4">
                  {category}
                </h3>

                {categoryEvents.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {categoryEvents.map((event, index) => (
                      <div
                        key={`${event.placeId}-${index}`}
                        className={`rounded-lg p-5 transition-colors ${
                          theme === 'dark'
                            ? 'bg-gray-900 border border-gray-800 hover:border-gray-700'
                            : 'bg-white border border-gray-200 hover:border-gray-300 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className={`text-lg font-bold flex-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            {event.venueName}
                          </h4>
                          {event.rating && event.rating > 0 && (
                            <div className="flex items-center gap-1 ml-3 bg-yellow-400/10 px-2 py-1 rounded">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-yellow-400 font-semibold text-sm">
                                {event.rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>

                        {event.eventTitle && (
                          <p className={`mb-2 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            {event.eventTitle}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 mb-3 text-sm">
                          <div className={`flex items-center gap-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            <MapPin className="w-4 h-4" />
                            <span>{event.distance.toFixed(1)} mi</span>
                          </div>

                          {event.price && (
                            <div className="flex items-center gap-1 text-green-400">
                              <DollarSign className="w-4 h-4" />
                              <span className="font-medium">{event.price}</span>
                            </div>
                          )}

                          {event.userRatingsTotal && (
                            <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                              {event.userRatingsTotal} reviews
                            </span>
                          )}
                        </div>

                        <p className={`text-sm mb-3 italic line-clamp-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {event.aiReasoning}
                        </p>

                        {event.placeId && (
                          <a
                            href={getGoogleMapsUrl(event.placeId) || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors text-sm font-medium"
                          >
                            <span>View on Maps</span>
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`rounded-lg p-8 text-center ${
                    theme === 'dark'
                      ? 'bg-gray-900 border border-gray-800'
                      : 'bg-white border border-gray-200'
                  }`}>
                    <p className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>
                      No events found in this category
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Results;
