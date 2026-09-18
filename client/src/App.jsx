import { useState } from 'react';
import axios from 'axios';
import SearchBar from './components/SearchBar';
import CardDeck from './components/CardDeck';
import SavedPlaylist from './components/SavedPlaylist';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState('search');
  const [seedTrack, setSeedTrack] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (query) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post('/api/search', { query });
      setSeedTrack(response.data.seedTrack);
      setRecommendations(response.data.recommendations);
      setScreen('cards');
    } catch (err) {
      setError(err.response?.data?.error || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (track) => {
    try {
      await axios.post('/api/save', { track });
    } catch (err) {
      console.error('Failed to save track:', err);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🎵 Fun Song Recommender</h1>
        <nav className="nav">
          <button
            className={`nav-btn ${screen === 'search' ? 'active' : ''}`}
            onClick={() => setScreen('search')}
          >
            Search
          </button>
          <button
            className={`nav-btn ${screen === 'playlist' ? 'active' : ''}`}
            onClick={() => setScreen('playlist')}
          >
            My Playlist
          </button>
        </nav>
      </header>

      <main className="main">
        {screen === 'search' && (
          <>
            <SearchBar onSearch={handleSearch} loading={loading} />
            {error && <div className="error">{error}</div>}
            {seedTrack && (
              <div className="seed-info">
                <p>Seed track: <strong>{seedTrack.name}</strong> by {seedTrack.artist}</p>
              </div>
            )}
          </>
        )}

        {screen === 'cards' && recommendations.length > 0 && (
          <CardDeck
            cards={recommendations}
            onSave={handleSave}
            onBack={() => setScreen('search')}
          />
        )}

        {screen === 'playlist' && <SavedPlaylist />}
      </main>
    </div>
  );
}
