import axios from 'axios';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

let accessToken = null;
let tokenExpiry = 0;

async function getSpotifyToken() {
  if (accessToken && Date.now() < tokenExpiry) return accessToken;

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
        }
      }
    );

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + response.data.expires_in * 1000;
    return accessToken;
  } catch (error) {
    throw new Error(`Failed to get Spotify token: ${error.message}`);
  }
}

export async function searchSpotifyTrack(query) {
  try {
    const token = await getSpotifyToken();
    const response = await axios.get('https://api.spotify.com/v1/search', {
      params: { q: query, type: 'track', limit: 1 },
      headers: { Authorization: `Bearer ${token}` }
    });

    const track = response.data.tracks.items[0];
    if (!track) return null;

    return {
      id: track.id,
      name: track.name,
      artist: track.artists[0].name,
      image_url: track.album.images[0]?.url,
      preview_url: track.preview_url,
      release_date: track.album.release_date,
      genres: track.artists[0].genres || []
    };
  } catch (error) {
    throw new Error(`Spotify search failed: ${error.message}`);
  }
}

export async function getTrackDetails(trackId) {
  try {
    const token = await getSpotifyToken();
    const response = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const track = response.data;
    return {
      id: track.id,
      name: track.name,
      artist: track.artists[0].name,
      image_url: track.album.images[0]?.url,
      preview_url: track.preview_url,
      release_date: track.album.release_date,
      genre: track.artists[0].genres?.[0] || 'Unknown'
    };
  } catch (error) {
    throw new Error(`Failed to get track details: ${error.message}`);
  }
}

export async function getRecommendations(seedTrack) {
  try {
    const token = await getSpotifyToken();
    const response = await axios.get('https://api.spotify.com/v1/recommendations', {
      params: {
        seed_tracks: seedTrack.id,
        limit: 5,
        market: 'US'
      },
      headers: { Authorization: `Bearer ${token}` }
    });

    const tracks = response.data.tracks.map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artists[0].name,
      image_url: track.album.images[0]?.url,
      preview_url: track.preview_url,
      release_date: track.album.release_date,
      genre: track.artists[0].genres?.[0] || 'Unknown'
    }));

    return tracks;
  } catch (error) {
    throw new Error(`Failed to get recommendations: ${error.message}`);
  }
}
