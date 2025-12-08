import { useState } from 'react';
import Landing from './components/Landing';
import Results from './components/Results';
import { ComedyEvent } from './types';

type AppState = 'landing' | 'loading' | 'results' | 'error';

function App() {
  const [state, setState] = useState<AppState>('landing');
  const [events, setEvents] = useState<ComedyEvent[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFindComedy = async (latitude: number, longitude: number) => {
    setState('loading');
    setErrorMessage('');

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

      if (!response.ok) {
        throw new Error('Failed to fetch comedy events');
      }

      const data = await response.json();
      setEvents(data.events || []);
      setState('results');
    } catch (error) {
      console.error('Error finding comedy:', error);
      setErrorMessage('Unable to find comedy events. Please try again.');
      setState('error');
    }
  };

  const handleReset = () => {
    setState('landing');
    setEvents([]);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {state === 'landing' && (
        <Landing onFindComedy={handleFindComedy} />
      )}

      {state === 'loading' && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Finding the best comedy for you...</p>
          </div>
        </div>
      )}

      {state === 'results' && (
        <Results events={events} onReset={handleReset} />
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
