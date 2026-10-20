'use strict';

// Decorative background: slowly drifting rows of album covers behind the page.
// The tiles appear right away as colored "record" placeholders, then fill in with
// real album art from iTunes. If iTunes can't be reached, the placeholders stay.
// (Uses jsonp, safeUrl and ITUNES_SEARCH_URL from app.js.)

const WALL_ROWS = 7;
const WALL_TILES_PER_ROW = 10;
const WALL_SEARCH_TERMS = [
  'greatest hits', 'classic rock', 'pop hits', 'hip hop classics', 'indie rock',
  'soul classics', 'country hits', 'dance hits', 'alternative', 'r&b hits',
];
const WALL_CACHE_KEY = 'albumWallCovers';

function shuffle(list) {
  const items = [...list];
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function makeTile(hue) {
  const tile = document.createElement('div');
  tile.className = 'tile';
  tile.style.setProperty('--h', hue);
  return tile;
}

// Build the rows. Each row holds its tiles twice in a row, so the slow scroll
// animation can loop without a visible jump. Returns [first copy, second copy] pairs.
function buildWall(wall) {
  const container = document.createElement('div');
  container.className = 'wall-rows';
  const slots = [];

  for (let r = 0; r < WALL_ROWS; r++) {
    const row = document.createElement('div');
    row.className = r % 2 === 0 ? 'wall-row' : 'wall-row reverse';
    row.style.setProperty('--dur', `${80 + (r % 3) * 25}s`); // each row drifts at its own speed

    const firstCopies = [];
    const secondCopies = [];
    for (let t = 0; t < WALL_TILES_PER_ROW; t++) {
      const hue = (r * 37 + t * 53) % 360;
      firstCopies.push(makeTile(hue));
      secondCopies.push(makeTile(hue));
    }
    row.append(...firstCopies, ...secondCopies);
    container.append(row);
    firstCopies.forEach((tile, t) => slots.push([tile, secondCopies[t]]));
  }

  wall.append(container);
  return slots;
}

async function loadCovers() {
  try {
    const cached = JSON.parse(sessionStorage.getItem(WALL_CACHE_KEY) || 'null');
    if (Array.isArray(cached) && cached.length) return cached;
  } catch (error) {
    // storage unavailable: just fetch
  }

  const terms = shuffle(WALL_SEARCH_TERMS).slice(0, 2); // two requests keeps us far below iTunes' limit
  const responses = await Promise.all(terms.map((term) =>
    jsonp(`${ITUNES_SEARCH_URL}?term=${encodeURIComponent(term)}&media=music&entity=album&limit=40`)
      .catch(() => ({ results: [] }))
  ));

  const urls = responses
    .flatMap((response) => response.results || [])
    .map((album) => safeUrl((album.artworkUrl100 || '').replace('100x100', '200x200')))
    .filter(Boolean);
  const covers = shuffle([...new Set(urls)]);

  try {
    if (covers.length) sessionStorage.setItem(WALL_CACHE_KEY, JSON.stringify(covers));
  } catch (error) {
    // storage unavailable: not a problem
  }
  return covers;
}

function fillWall(slots, covers) {
  slots.forEach((pair, i) => {
    const url = covers[i % covers.length];
    pair.forEach((tile) => {
      const image = new Image();
      image.alt = '';
      image.onload = () => image.classList.add('loaded'); // fade in once downloaded
      image.src = url;
      tile.append(image);
    });
  });
}

async function initAlbumWall() {
  const wall = document.getElementById('album-wall');
  if (!wall) return;

  const slots = buildWall(wall);
  const covers = await loadCovers();
  if (covers.length) fillWall(slots, covers);
}

initAlbumWall();
