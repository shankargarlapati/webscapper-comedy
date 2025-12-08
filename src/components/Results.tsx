import { MapPin, Star, ExternalLink, RefreshCw, DollarSign } from 'lucide-react';
import { ComedyEvent, ComedyCategory } from '../types';

interface ResultsProps {
  events: ComedyEvent[];
  onReset: () => void;
}

const CATEGORIES: ComedyCategory[] = [
  'Comedy Workshop',
  'Comedy Podcasts',
  'Stand-Up Comedy Club',
  'Improv Comedy Leaders',
];

function Results({ events, onReset }: ResultsProps) {
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
          <div>
            <h2 className="text-3xl font-bold mb-1">Tonight's Best Comedy</h2>
            <p className="text-gray-400">Top venues by ratings in each category</p>
          </div>
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
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
                        className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-gray-700 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-lg font-bold text-white flex-1">
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
                          <p className="text-gray-300 mb-2 font-medium">{event.eventTitle}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 mb-3 text-sm">
                          <div className="flex items-center gap-1 text-gray-400">
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
                            <span className="text-gray-500 text-xs">
                              {event.userRatingsTotal} reviews
                            </span>
                          )}
                        </div>

                        <p className="text-gray-400 text-sm mb-3 italic line-clamp-2">
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
                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
                    <p className="text-gray-500">No events found in this category</p>
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
