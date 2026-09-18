# 🎵 Fun Song Recommender

An interactive, Tinder-style song recommendation app that helps music fans discover new tracks based on songs they already love.

## Features

- **Seed Song Search**: Enter any song you love
- **AI-Powered Recommendations**: Get 5 personalized song recommendations using Claude AI
- **Swipe Interface**: Intuitive Tinder-style cards to accept/reject recommendations
- **Audio Previews**: Listen to 30-second previews of each recommended song
- **Saved Playlist**: Build your own playlist by swiping right
- **Local Database**: All your saved songs are stored locally

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: SQLite
- **Music Data**: Spotify API
- **Recommendations**: Claude AI API
- **Audio**: Spotify preview URLs

## Setup

### Prerequisites

- Node.js 16+
- Spotify Developer Account (for API credentials)
- Anthropic API Key (for Claude AI)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/fun-song-recommender.git
cd fun-song-recommender
```

2. Install dependencies:
```bash
npm install
cd client && npm install && cd ..
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Add your credentials to `.env`:
```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
ANTHROPIC_API_KEY=your_anthropic_api_key
PORT=5000
```

### Getting API Keys

**Spotify:**
1. Go to https://developer.spotify.com/dashboard
2. Create an app and get your Client ID and Secret
3. Add the credentials to `.env`

**Anthropic:**
1. Go to https://console.anthropic.com/
2. Create an API key
3. Add it to `.env`

### Running the App

```bash
npm run dev
```

This starts both the backend (port 5000) and frontend (port 3000).

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Usage

1. **Search**: Enter a song you love in the search bar
2. **Swipe**: Review the 5 recommended songs
   - **Swipe Right** or click "Save" to add to your playlist
   - **Swipe Left** or click "Skip" to pass
3. **Preview**: Click the play button to listen to a 30-second preview
4. **Playlist**: View all your saved songs in the "My Playlist" section

## Project Structure

```
fun-song-recommender/
├── server/
│   ├── index.js          # Express server
│   ├── db.js             # SQLite database setup
│   ├── spotify.js        # Spotify API integration
│   └── claude.js         # Claude AI integration
├── client/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── App.jsx       # Main app
│   │   ├── App.css       # Styles
│   │   └── main.jsx      # Entry point
│   ├── vite.config.js    # Vite config
│   └── package.json
├── .env.example          # Example environment variables
└── package.json          # Root dependencies
```

## How It Works

1. **User searches** for a song
2. **Spotify API** finds the exact track and retrieves metadata
3. **Claude AI** analyzes the seed song and generates 5 recommendations
4. **Frontend** displays recommendations as swipeable cards
5. **User swipes** right (save) or left (skip)
6. **SQLite** stores saved songs in the local database
7. **Playlist view** shows all saved tracks with playback controls

## Database Schema

### SeedSearches
- `id`: Primary key
- `query`: Search query
- `created_at`: Timestamp

### SavedPlaylist
- `id`: Primary key
- `track_id`: Spotify track ID
- `track_name`: Song title
- `artist`: Artist name
- `image_url`: Album artwork URL
- `preview_url`: Spotify preview URL
- `genre`: Music genre
- `background`: AI-generated background info
- `created_at`: Timestamp

## API Endpoints

### POST /api/search
Search for a seed song and get recommendations
```json
{
  "query": "Blinding Lights"
}
```

### POST /api/save
Save a song to the playlist
```json
{
  "track": { /* track object */ }
}
```

### GET /api/playlist
Get all saved songs

## Future Enhancements

- Export playlist to Spotify
- Multiple users with profiles
- Share playlists with friends
- Advanced filtering by genre/year
- Recommendation history
- Collaborative playlists

## License

MIT
