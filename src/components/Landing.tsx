import { useState } from 'react';
import { Laugh } from 'lucide-react';

interface LandingProps {
  onFindComedy: (latitude: number, longitude: number) => void;
}

function Landing({ onFindComedy }: LandingProps) {
  const [showZipInput, setShowZipInput] = useState(false);
  const [zipCode, setZipCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGeolocation = () => {
    setIsLoading(true);
    setError('');

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setShowZipInput(true);
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
        setShowZipInput(true);
      }
    );
  };

  const handleZipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!/^\d{5}$/.test(zipCode)) {
      setError('Please enter a valid 5-digit zip code');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://api.zippopotam.us/us/${zipCode}`
      );

      if (!response.ok) {
        throw new Error('Invalid zip code');
      }

      const data = await response.json();
      const latitude = parseFloat(data.places[0].latitude);
      const longitude = parseFloat(data.places[0].longitude);

      setIsLoading(false);
      onFindComedy(latitude, longitude);
    } catch {
      setError('Unable to find location for this zip code');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-md w-full">
        <div className="mb-8">
          <Laugh className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
          <h1 className="text-4xl font-bold mb-3">Singular</h1>
          <p className="text-gray-400 text-lg">
            Discover the best comedy happening tonight in Los Angeles
          </p>
        </div>

        {!showZipInput ? (
          <button
            onClick={handleGeolocation}
            disabled={isLoading}
            className="w-full px-8 py-4 bg-yellow-400 text-gray-950 rounded-lg font-semibold text-lg hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Getting Location...' : 'Find Comedy Tonight'}
          </button>
        ) : (
          <div>
            <form onSubmit={handleZipSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="Enter zip code"
                  maxLength={5}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-8 py-4 bg-yellow-400 text-gray-950 rounded-lg font-semibold text-lg hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Finding Comedy...' : 'Find Comedy'}
              </button>
            </form>
            <button
              onClick={() => {
                setShowZipInput(false);
                setError('');
                setZipCode('');
              }}
              className="mt-4 text-gray-400 hover:text-white transition-colors text-sm"
            >
              Try location again
            </button>
          </div>
        )}

        {error && (
          <p className="mt-4 text-red-400 text-sm">{error}</p>
        )}
      </div>
    </div>
  );
}

export default Landing;
