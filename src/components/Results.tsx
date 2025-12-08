import { MapPin, Star, ExternalLink, RefreshCw } from 'lucide-react';
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
  const getEventForCategory = (category: ComedyCategory): ComedyEvent | null => {
    return events.find((e) => e.category === category) || null;
  };

  const getGoogleMapsUrl = (placeId?: string) => {
    if (!placeId) return null;
    return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
  };

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-1">Tonight's Best Comedy</h2>
            <p className="text-gray-400">One top pick per category</p>
          </div>
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">New Search</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CATEGORIES.map((category) => {
            const event = getEventForCategory(category);

            return (
              <div
                key={category}
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors"
              >
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-yellow-400 uppercase tracking-wide mb-2">
                    {category}
                  </h3>
                </div>

                {event ? (
                  <div>
                    <h4 className="text-xl font-bold mb-2 text-white">
                      {event.venueName}
                    </h4>

                    {event.eventTitle && (
                      <p className="text-gray-300 mb-3">{event.eventTitle}</p>
                    )}

                    <div className="flex items-center gap-4 mb-3 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{event.distance.toFixed(1)} mi</span>
                      </div>

                      {event.rating && event.rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>{event.rating.toFixed(1)}</span>
                          {event.userRatingsTotal && (
                            <span className="text-gray-500">
                              ({event.userRatingsTotal})
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="text-gray-400 text-sm mb-4 italic">
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
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No event found tonight</p>
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
