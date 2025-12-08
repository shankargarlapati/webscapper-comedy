import { useState } from 'react';
import { Search } from 'lucide-react';

interface LandingProps {
  onFindComedy: (latitude: number, longitude: number, city?: string) => void;
}

function Landing({ onFindComedy }: LandingProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [city, setCity] = useState('');

  const handleGeolocation = () => {
    setIsLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLoading(false);
        onFindComedy(position.coords.latitude, position.coords.longitude);
      },
      () => {
        setIsLoading(false);
        setError('Unable to get your location. Please enable location services.');
      }
    );
  };

  const handleSearchLA = () => {
    setIsLoading(true);
    setError('');
    onFindComedy(34.0522, -118.2437, 'Los Angeles');
  };

  const handleCitySearch = async () => {
    if (!city.trim()) {
      setError('Please enter a city name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

      if (!apiKey) {
        setError('Google API key is not configured. Please check your .env file.');
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${apiKey}`
      );

      const data = await response.json();

      console.log('Geocoding response:', data);

      if (data.status === 'REQUEST_DENIED') {
        setError(`API Error: ${data.error_message || 'Request denied. Check API key restrictions.'}`);
        setIsLoading(false);
        return;
      }

      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        const cityName = data.results[0].address_components.find(
          (component: any) => component.types.includes('locality')
        )?.long_name || city;

        onFindComedy(location.lat, location.lng, cityName);
      } else {
        setError(`City not found. Status: ${data.status}. Please try a different search.`);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      setError(`Failed to search for city: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-md w-full">
        <div className="mb-8">
          <img
            src="/comedyclub_logo.png"
            alt="Comedy Scrapper 2028"
            className="w-32 h-32 mx-auto mb-4 object-contain"
          />
          <h1 className="text-4xl font-bold mb-3">Comedy Scrapper 2028</h1>
          <p className="text-gray-400 text-lg">
            Discover the best comedy happening tonight in any city
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCitySearch()}
                placeholder="Enter city name (e.g., New York, Chicago)"
                className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg border border-gray-700 focus:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 transition-colors"
                disabled={isLoading}
              />
              <button
                onClick={handleCitySearch}
                disabled={isLoading}
                className="px-6 py-3 bg-yellow-400 text-gray-950 rounded-lg font-semibold hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-950 text-gray-500">or</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleSearchLA}
              disabled={isLoading}
              className="w-full px-8 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Finding Comedy...' : 'Search Los Angeles'}
            </button>
            <button
              onClick={handleGeolocation}
              disabled={isLoading}
              className="w-full px-8 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Getting Location...' : 'Use My Location'}
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-4 text-red-400 text-sm">{error}</p>
        )}
      </div>
    </div>
  );
}

export default Landing;
