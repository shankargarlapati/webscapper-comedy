import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import Landing from './components/Landing';
import Results from './components/Results';
import { ComedyEvent } from './types';
import { useTheme } from './contexts/ThemeContext';

type AppState = 'landing' | 'loading' | 'results' | 'error';

function App() {
  const [state, setState] = useState<AppState>('landing');
  const [events, setEvents] = useState<ComedyEvent[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchedCity, setSearchedCity] = useState<string>('');
  const { theme, toggleTheme } = useTheme();

  const handleFindComedy = async (latitude: number, longitude: number, city?: string) => {
    setState('loading');
    setErrorMessage('');
    setSearchedCity(city || '');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/find-comedy`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ latitude, longitude }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch comedy events');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setEvents(data.events || []);
      setState('results');
    } catch (error) {
      console.error('Error finding comedy:', error);
      const message = error instanceof Error ? error.message : 'Unable to find comedy events. Please try again.';
      setErrorMessage(message);
      setState('error');
    }
  };

  const handleReset = () => {
    setState('landing');
    setEvents([]);
    setErrorMessage('');
  };

  const bgClass = theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50';
  const textClass = theme === 'dark' ? 'text-white' : 'text-gray-900';

  return (
    <div className={`min-h-screen ${bgClass} ${textClass}`}>
      <button
        onClick={toggleTheme}
        className={`fixed top-6 right-6 z-50 p-3 rounded-full shadow-lg transition-colors ${
          theme === 'dark'
            ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400'
            : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-200'
        }`}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {state === 'landing' && (
        <Landing onFindComedy={handleFindComedy} />
      )}

      {state === 'loading' && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
              Finding the best comedy for you...
            </p>
          </div>
        </div>
      )}

      {state === 'results' && (
        <Results events={events} onReset={handleReset} city={searchedCity} />
      )}

      {state === 'error' && (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <p className="text-red-400 mb-6">{errorMessage}</p>
            <button
              onClick={handleReset}
              className="px-8 py-3 bg-yellow-400 text-gray-950 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
