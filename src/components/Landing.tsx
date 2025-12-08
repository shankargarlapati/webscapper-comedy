import { useState } from 'react';
import { Laugh } from 'lucide-react';

interface LandingProps {
  onFindComedy: (latitude: number, longitude: number) => void;
}

function Landing({ onFindComedy }: LandingProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
    onFindComedy(34.0522, -118.2437);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-md w-full">
        <div className="mb-8">
          <Laugh className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
          <h1 className="text-4xl font-bold mb-3">Comedy Scrapper 2028</h1>
          <p className="text-gray-400 text-lg">
            Discover the best comedy happening tonight in Los Angeles
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleSearchLA}
            disabled={isLoading}
            className="w-full px-8 py-4 bg-yellow-400 text-gray-950 rounded-lg font-semibold text-lg hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Finding Comedy...' : 'Search LA Comedy'}
          </button>
          <button
            onClick={handleGeolocation}
            disabled={isLoading}
            className="w-full px-8 py-4 bg-gray-800 text-white rounded-lg font-semibold text-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Getting Location...' : 'Use My Location'}
          </button>
        </div>

        {error && (
          <p className="mt-4 text-red-400 text-sm">{error}</p>
        )}
      </div>
    </div>
  );
}

export default Landing;
