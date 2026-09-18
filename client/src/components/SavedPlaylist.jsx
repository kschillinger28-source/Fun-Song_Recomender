import { useState, useEffect } from 'react';
import axios from 'axios';

export default function SavedPlaylist() {
  const [playlist, setPlaylist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlaylist();
  }, []);

  const fetchPlaylist = async () => {
    try {
      const response = await axios.get('/api/playlist');
      setPlaylist(response.data);
    } catch (error) {
      console.error('Failed to fetch playlist:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading playlist...</div>;
  if (playlist.length === 0) return <div className="empty">No saved songs yet!</div>;

  return (
    <div className="playlist">
      <h2>Your Saved Songs ({playlist.length})</h2>
      <div className="playlist-grid">
        {playlist.map((track) => (
          <div key={track.id} className="playlist-item">
            <img src={track.image_url} alt={track.track_name} />
            <h3>{track.track_name}</h3>
            <p>{track.artist}</p>
            {track.preview_url && (
              <audio controls>
                <source src={track.preview_url} type="audio/mpeg" />
              </audio>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
