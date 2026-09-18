import { useState } from 'react';

export default function Card({ track }) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="card">
      <div className="card-image">
        <img src={track.image_url} alt={track.name} />
        {track.preview_url && (
          <button
            className={`play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
        )}
      </div>

      {isPlaying && track.preview_url && (
        <audio
          autoPlay
          src={track.preview_url}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      <div className="card-content">
        <h2>{track.name}</h2>
        <p className="artist">{track.artist}</p>
        <p className="year">{new Date(track.release_date).getFullYear()}</p>
        {track.genre && <p className="genre">🏷️ {track.genre}</p>}
        {track.background && <p className="background">{track.background}</p>}
      </div>
    </div>
  );
}
