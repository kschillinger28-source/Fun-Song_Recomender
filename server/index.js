import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db.js';
import { searchSpotifyTrack, getRecommendations } from './spotify.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

await initializeDatabase();

app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query required' });

    const track = await searchSpotifyTrack(query);
    if (!track) return res.status(404).json({ error: 'Track not found' });

    const recommendations = await getRecommendations(track);
    res.json({ seedTrack: track, recommendations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/save', async (req, res) => {
  try {
    const { track } = req.body;
    if (!track) return res.status(400).json({ error: 'Track required' });

    const db = await import('./db.js').then(m => m.getDb());
    db.run(
      'INSERT INTO SavedPlaylist (track_id, track_name, artist, image_url, preview_url, genre, background) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [track.id, track.name, track.artist, track.image_url, track.preview_url, track.genre, track.background],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/playlist', async (req, res) => {
  try {
    const db = await import('./db.js').then(m => m.getDb());
    db.all('SELECT * FROM SavedPlaylist ORDER BY created_at DESC', (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🎵 Server running on http://localhost:${PORT}`);
});
