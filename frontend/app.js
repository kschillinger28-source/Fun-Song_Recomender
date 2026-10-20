'use strict';

// Must match --swipe-ms in style.css so the card finishes sliding before the next one appears.
const SWIPE_ANIMATION_MS = 300;
const SEARCH_DEBOUNCE_MS = 500;  // wait for a pause in typing before searching
const MIN_SEARCH_LENGTH = 2;
const MAX_RESULTS = 8;
const DECK_SIZE = 5;
const RECENT_LIMIT = 20;         // how many recommended songs to remember this session
const ITUNES_SEARCH_URL = 'https://itunes.apple.com/search';

// Material Design icon paths (24x24 viewBox), drawn as inline SVG.
const ICON_PATHS = {
  note: 'M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z',
  search: 'M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  play: 'M8 5v14l11-7z',
  pause: 'M6 19h4V5H6v14zm8-14v14h4V5h-4z',
  x: 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  heart: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  back: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
  forward: 'M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z',
  check: 'M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  chevron: 'M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
};

// ---------------------------------------------------------------------------
// DOM references: look every element up once, then reuse the variables.
// ---------------------------------------------------------------------------
const views = {
  search: document.getElementById('view-search'),
  seed: document.getElementById('view-seed'),
  cards: document.getElementById('view-cards'),
  done: document.getElementById('view-done'),
  playlist: document.getElementById('view-playlist'),
};

const el = {
  brand: document.getElementById('brand'),
  navSearch: document.getElementById('nav-search'),
  navPlaylist: document.getElementById('nav-playlist'),
  badge: document.getElementById('playlist-badge'),
  stepper: document.getElementById('stepper'),
  steps: Array.from(document.querySelectorAll('.step')),
  searchForm: document.getElementById('search-form'),
  searchInput: document.getElementById('search-input'),
  searchError: document.getElementById('search-error'),
  searchStatus: document.getElementById('search-status'),
  searchResults: document.getElementById('search-results'),
  seedArea: document.getElementById('seed-area'),
  seedStatus: document.getElementById('seed-status'),
  btnSeedBack: document.getElementById('btn-seed-back'),
  btnFind: document.getElementById('btn-find'),
  findLabel: document.getElementById('find-label'),
  seedTitle: document.getElementById('seed-title'),
  progressTrack: document.getElementById('progress-track'),
  progressFill: document.getElementById('progress-fill'),
  progressLabel: document.getElementById('progress-label'),
  cardArea: document.getElementById('card-area'),
  btnPass: document.getElementById('btn-pass'),
  btnSave: document.getElementById('btn-save'),
  toast: document.getElementById('toast'),
  doneCount: document.getElementById('done-count'),
  btnAgain: document.getElementById('btn-again'),
  btnViewPlaylist: document.getElementById('btn-view-playlist'),
  btnClear: document.getElementById('btn-clear'),
  btnEmptySearch: document.getElementById('btn-empty-search'),
  playlistSummary: document.getElementById('playlist-summary'),
  playlistEmpty: document.getElementById('playlist-empty'),
  playlistList: document.getElementById('playlist-list'),
};

const player = document.getElementById('player');
player.loop = true;    // a 30-second preview repeats while you read
player.volume = 0.7;

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const state = {
  seed: null,          // the song the user picked from the search results
  results: [],         // songs currently listed under the search box
  deck: [],            // the five recommended songs
  index: 0,            // which card is on screen
  isAnimating: false,  // true while a card is sliding off (blocks double swipes)
  saved: [],           // songs the user has saved
  recent: new Set(),   // songs already recommended this session (so repeats feel fresh)
  musicOn: true,       // false once the user pauses the music themselves
  searchToken: 0,      // lets us ignore search results that arrive late
};

const STEP_ORDER = ['search', 'seed', 'cards'];
const searchCache = new Map(); // iTunes limits how many requests we can make, so remember answers
let searchTimer = null;
let toastTimer = null;
let jsonpCounter = 0;

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
function createElement(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function iconSvg(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${ICON_PATHS[name]}"/></svg>`;
}

function createIcon(name, className) {
  const node = createElement('span', className ? `icon ${className}` : 'icon');
  node.innerHTML = iconSvg(name);
  return node;
}

// Fill every <span data-icon="..."> written in index.html.
function hydrateIcons() {
  document.querySelectorAll('[data-icon]').forEach((node) => {
    node.innerHTML = iconSvg(node.dataset.icon);
  });
}

function songKey(song) {
  return `${song.name}|${song.artist}`;
}

// Only let https URLs into CSS, so a bad value can never break out of url("...").
function safeUrl(url) {
  return /^https:\/\/[^\s"'()]+$/.test(url || '') ? url : '';
}

function formatDuration(milliseconds) {
  if (!milliseconds) return '';
  const totalSeconds = Math.round(milliseconds / 1000);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// iTunes Search API. It does not allow normal fetch() calls from a web page
// (no CORS headers), so we use JSONP: add a <script> tag whose response calls
// one of our functions with the data.
// ---------------------------------------------------------------------------
function jsonp(url) {
  return new Promise((resolve, reject) => {
    const callbackName = `itunesCallback${jsonpCounter++}`;
    const script = document.createElement('script');

    const cleanup = () => {
      clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    };
    const timeout = setTimeout(() => { cleanup(); reject(new Error('timeout')); }, 8000);

    window[callbackName] = (data) => { cleanup(); resolve(data); };
    script.onerror = () => { cleanup(); reject(new Error('network')); };
    script.src = `${url}&callback=${callbackName}`;
    document.head.append(script);
  });
}

function normalizeTrack(raw) {
  const art = raw.artworkUrl100 || '';
  return {
    id: String(raw.trackId),
    name: raw.trackName,
    artist: raw.artistName,
    album: raw.collectionName || '',
    year: raw.releaseDate ? raw.releaseDate.slice(0, 4) : '',
    genre: raw.primaryGenreName || '',
    duration: formatDuration(raw.trackTimeMillis),
    previewUrl: raw.previewUrl || '',
    artwork: art.replace('100x100', '600x600'), // big version for cards
    thumb: art,                                 // small version for lists
    blurb: '',
    reasons: [],
  };
}

async function searchItunes(term, limit) {
  const cacheKey = `${limit}|${term.toLowerCase()}`;
  if (searchCache.has(cacheKey)) return searchCache.get(cacheKey);

  const url = `${ITUNES_SEARCH_URL}?term=${encodeURIComponent(term)}&media=music&entity=song&limit=${limit}`;
  const data = await jsonp(url);
  const tracks = data.results
    .filter((raw) => raw.trackName && raw.artistName)
    .map(normalizeTrack);

  searchCache.set(cacheKey, tracks);
  return tracks;
}

// ---------------------------------------------------------------------------
// Navigation: show exactly one view at a time (toggle the `hidden` attribute).
// ---------------------------------------------------------------------------
function showView(name) {
  Object.entries(views).forEach(([viewName, section]) => {
    section.hidden = viewName !== name;
  });
  el.navSearch.classList.toggle('is-active', name !== 'playlist');
  el.navPlaylist.classList.toggle('is-active', name === 'playlist');
  updateStepper(name);

  // Music only plays while a song's details are on screen.
  if (name !== 'seed' && name !== 'cards') stopPreview();
}

// Highlight the current step, and tick off the steps before it.
function updateStepper(viewName) {
  el.stepper.hidden = viewName === 'playlist';
  const current = viewName === 'done' ? STEP_ORDER.length : STEP_ORDER.indexOf(viewName);

  el.steps.forEach((step, i) => {
    const isComplete = i < current;
    const isActive = i === current;
    step.classList.toggle('is-complete', isComplete);
    step.classList.toggle('is-active', isActive);
    if (isActive) step.setAttribute('aria-current', 'step');
    else step.removeAttribute('aria-current');
    step.querySelector('.step-dot').innerHTML = isComplete ? iconSvg('check') : String(i + 1);
  });
}

function openPlaylist() {
  renderPlaylist();
  showView('playlist');
}

function openSearch() {
  showView('search');
  el.searchInput.focus();
}

// ---------------------------------------------------------------------------
// Music
// ---------------------------------------------------------------------------
function playPreview(url) {
  stopPreview();
  if (!url) return;

  player.src = url;
  if (!state.musicOn) {
    syncPlayButtons(); // the user paused earlier; leave it paused but ready
    return;
  }
  // play() returns a promise that fails if the browser blocks autoplay.
  player.play().then(syncPlayButtons).catch(syncPlayButtons);
}

function stopPreview() {
  player.pause();
  player.removeAttribute('src');
  player.load(); // stop downloading the old clip
  syncPlayButtons();
}

function toggleMusic() {
  if (!player.hasAttribute('src')) return;
  if (player.paused) {
    state.musicOn = true;
    player.play().catch(syncPlayButtons);
  } else {
    state.musicOn = false;
    player.pause();
  }
}

// Make every play/pause button (and the animated bars) match what the player is doing.
function syncPlayButtons() {
  const playing = !player.paused;
  document.querySelectorAll('.play-btn').forEach((button) => {
    button.innerHTML = iconSvg(playing ? 'pause' : 'play');
    button.setAttribute('aria-label', playing ? 'Pause music' : 'Play music');
  });
  document.querySelectorAll('.card').forEach((card) => card.classList.toggle('is-playing', playing));
}

// ---------------------------------------------------------------------------
// Search: type, see matching songs, pick one.
// ---------------------------------------------------------------------------
function setSearchStatus(message) {
  el.searchStatus.textContent = message;
}

function hideSearchError() {
  el.searchError.hidden = true;
  el.searchForm.classList.remove('invalid');
}

async function runSearch(term) {
  const token = ++state.searchToken;
  setSearchStatus('Searching…');
  renderSkeleton();

  try {
    const tracks = await searchItunes(term, MAX_RESULTS);
    if (token !== state.searchToken) return; // a newer search replaced this one
    state.results = tracks;
    renderResults();
    setSearchStatus(tracks.length ? 'Pick the song you meant:' : `No songs found for "${term}".`);
  } catch (error) {
    if (token !== state.searchToken) return;
    state.results = [];
    renderResults();
    setSearchStatus('Could not reach iTunes. Check your internet connection and try again.');
  }
}

function clearResults() {
  state.searchToken += 1; // cancels any search still in flight
  state.results = [];
  renderResults();
  setSearchStatus('');
}

function createThumb(song, className) {
  if (!song.thumb) {
    const fallback = createElement('div', `${className} thumb-fallback`);
    fallback.append(createIcon('note'));
    return fallback;
  }
  const image = createElement('img', className);
  image.src = song.thumb;
  image.alt = ''; // decorative: the song name is shown right next to it
  return image;
}

// Grey placeholder rows shown while a search is loading.
function renderSkeleton() {
  const rows = Array.from({ length: 4 }, () => {
    const lines = createElement('span', 'skeleton-lines');
    lines.append(createElement('span', 'skeleton skeleton-line'), createElement('span', 'skeleton skeleton-line short'));
    const row = createElement('li', 'skeleton-row');
    row.append(createElement('span', 'skeleton skeleton-thumb'), lines);
    return row;
  });
  el.searchResults.replaceChildren(...rows);
}

function renderResults() {
  const rows = state.results.map((song) => {
    const info = createElement('span', 'result-info');
    info.append(
      createElement('strong', '', song.name),
      createElement('span', '', [song.artist, song.year, song.genre].filter(Boolean).join(' · '))
    );

    const button = createElement('button', 'result');
    button.type = 'button';
    button.dataset.id = song.id;
    button.append(createThumb(song, 'result-thumb'), info, createIcon('chevron', 'chevron'));

    const item = createElement('li');
    item.append(button);
    return item;
  });

  el.searchResults.replaceChildren(...rows); // structural update
}

function handleSearchSubmit(event) {
  event.preventDefault(); // stop the form from reloading the page
  const term = el.searchInput.value.trim();

  // Boundary validation: an empty search is not allowed.
  if (term === '') {
    el.searchError.hidden = false;
    el.searchForm.classList.add('invalid');
    el.searchInput.focus();
    return;
  }

  hideSearchError();
  clearTimeout(searchTimer);
  runSearch(term);
}

function handleSearchInput() {
  hideSearchError();
  clearTimeout(searchTimer);

  const term = el.searchInput.value.trim();
  if (term.length < MIN_SEARCH_LENGTH) {
    clearResults();
    return;
  }
  searchTimer = setTimeout(() => runSearch(term), SEARCH_DEBOUNCE_MS);
}

// ---------------------------------------------------------------------------
// Song cards (used for both the seed song and the recommendations)
// ---------------------------------------------------------------------------
function createArt(song) {
  const art = createElement('div', 'card-art');
  const artUrl = safeUrl(song.artwork);
  if (artUrl) art.style.setProperty('--art', `url("${artUrl}")`);

  const cover = createElement('div', 'cover');
  if (artUrl) {
    const image = createElement('img');
    image.src = artUrl;
    image.alt = `Album art for ${song.album || song.name}`;
    image.draggable = false;
    cover.append(image);
  } else {
    cover.append(createIcon('note', 'cover-fallback'));
  }
  art.append(cover);

  const bars = createElement('span', 'eq');
  bars.setAttribute('aria-hidden', 'true');
  bars.append(createElement('i'), createElement('i'), createElement('i'));
  art.append(bars);

  if (song.previewUrl) {
    const button = createElement('button', 'play-btn');
    button.type = 'button';
    button.innerHTML = iconSvg('play');
    button.setAttribute('aria-label', 'Play music');
    art.append(button);
  } else {
    art.append(createElement('span', 'no-preview', 'No preview available'));
  }
  return art;
}

function buildCard(song) {
  const body = createElement('div', 'card-body');
  body.append(
    createElement('h2', '', song.name),
    createElement('p', 'card-artist', song.artist)
  );
  if (song.album) body.append(createElement('p', 'card-album', `Album · ${song.album}`));

  const tags = createElement('div', 'tags');
  [song.year, song.genre, song.duration]
    .filter(Boolean)
    .forEach((text) => tags.append(createElement('span', 'tag', text)));
  body.append(tags);

  if (song.reasons && song.reasons.length) {
    const chips = createElement('div', 'chips');
    song.reasons.forEach((reason) => chips.append(createElement('span', 'chip', reason)));
    const why = createElement('div', 'why');
    why.append(createElement('span', 'why-label', 'Why it matches'), chips);
    body.append(why);
  }

  if (song.blurb) body.append(createElement('p', 'card-blurb', song.blurb));

  const card = createElement('article', 'card');
  card.append(createArt(song), body);
  return card;
}

// ---------------------------------------------------------------------------
// Seed song: show the details of the song the user picked.
// ---------------------------------------------------------------------------
function selectSeed(song) {
  state.seed = song;
  el.seedArea.replaceChildren(buildCard(song));
  el.seedStatus.textContent = '';
  showView('seed');
  playPreview(song.previewUrl);
}

// ---------------------------------------------------------------------------
// Recommendations: recommender.js picks songs from the catalog, then we look up
// album art and an audio preview for each one on iTunes.
// ---------------------------------------------------------------------------
function rememberRecommendations(picks) {
  picks.forEach((pick) => state.recent.add(pick.key));
  while (state.recent.size > RECENT_LIMIT) {
    state.recent.delete(state.recent.values().next().value); // forget the oldest
  }
}

function plain(text) {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Never fails: a song that can't be found on iTunes just shows without art or audio.
async function lookupPick(pick) {
  const song = {
    id: pick.key,
    name: pick.name,
    artist: pick.artist,
    album: '',
    year: String(pick.year),
    genre: pick.genre,
    duration: '',
    previewUrl: '',
    artwork: '',
    thumb: '',
    blurb: pick.blurb,
    reasons: pick.reasons,
  };

  try {
    const tracks = await searchItunes(`${pick.name} ${pick.artist}`, 5);
    const sameArtist = (track) => plain(track.artist).includes(plain(pick.artist));
    const match = tracks.find((track) => sameArtist(track) && plain(track.name).includes(plain(pick.name)))
      || tracks.find(sameArtist);

    if (match) {
      Object.assign(song, {
        album: match.album,
        duration: match.duration,
        previewUrl: match.previewUrl,
        artwork: match.artwork,
        thumb: match.thumb,
      });
    }
  } catch (error) {
    // leave the song without art or audio
  }
  return song;
}

function setFindLoading(isLoading) {
  el.btnFind.disabled = isLoading;
  el.btnSeedBack.disabled = isLoading;
  el.btnFind.classList.toggle('is-loading', isLoading);
  el.findLabel.textContent = isLoading ? 'Finding songs…' : 'Find similar songs';
}

async function findSimilar() {
  if (!state.seed) return;
  setFindLoading(true);

  const picks = recommend(state.seed, CATALOG, { recent: state.recent, size: DECK_SIZE });
  rememberRecommendations(picks);
  state.deck = await Promise.all(picks.map(lookupPick));

  setFindLoading(false);
  startDeck();
  if (state.deck.every((song) => !song.previewUrl)) {
    showToast('Could not load audio previews right now.');
  }
}

function startDeck() {
  state.index = 0;
  state.isAnimating = false;
  views.cards.dataset.total = state.deck.length;
  el.progressTrack.setAttribute('aria-valuemax', state.deck.length);
  el.seedTitle.textContent = `${state.seed.name} by ${state.seed.artist}`;
  el.toast.textContent = '';

  renderCard();
  updateProgress();
  showView('cards');
}

// ---------------------------------------------------------------------------
// Card + progress rendering
// ---------------------------------------------------------------------------
function renderCard() {
  const song = state.deck[state.index];

  el.cardArea.replaceChildren(buildCard(song)); // structural update
  views.cards.dataset.index = state.index;
  setSwipeButtonsDisabled(false);
  playPreview(song.previewUrl); // the music for this card starts here
}

function updateProgress() {
  const total = state.deck.length;
  const done = state.index; // cards already swiped
  el.progressFill.style.width = `${(done / total) * 100}%`; // style update
  el.progressTrack.setAttribute('aria-valuenow', done);
  el.progressLabel.textContent = `Card ${Math.min(done + 1, total)} of ${total}`; // content update
}

function setSwipeButtonsDisabled(disabled) {
  el.btnPass.disabled = disabled;
  el.btnSave.disabled = disabled;
}

// ---------------------------------------------------------------------------
// Swiping: Pass or Save the current card.
// ---------------------------------------------------------------------------
function swipe(direction) {
  // Boundary checks: ignore clicks mid-animation or after the last card.
  if (state.isAnimating || state.index >= state.deck.length) return;

  state.isAnimating = true;
  setSwipeButtonsDisabled(true);

  if (direction === 'save') {
    saveSong(state.deck[state.index]);
  }

  const card = el.cardArea.querySelector('.card');
  card.classList.add(direction === 'save' ? 'swipe-right' : 'swipe-left');

  setTimeout(advance, SWIPE_ANIMATION_MS);
}

function advance() {
  state.index += 1;
  state.isAnimating = false;
  updateProgress();

  if (state.index >= state.deck.length) {
    el.doneCount.textContent = state.saved.length;
    showView('done');
  } else {
    renderCard();
  }
}

// ---------------------------------------------------------------------------
// Playlist state
// ---------------------------------------------------------------------------
function saveSong(song) {
  // Boundary: the same song can only be in the playlist once.
  if (state.saved.some((saved) => songKey(saved) === songKey(song))) {
    showToast(`"${song.name}" is already in your playlist.`);
    return;
  }
  state.saved.push(song);
  updateBadge();
  showToast(`Saved "${song.name}"`);
}

function removeSong(key) {
  state.saved = state.saved.filter((song) => songKey(song) !== key);
  updateBadge();
  renderPlaylist();
}

function clearPlaylist() {
  state.saved = [];
  updateBadge();
  renderPlaylist();
}

function updateBadge() {
  el.badge.textContent = state.saved.length;
  el.badge.classList.add('bump');
  setTimeout(() => el.badge.classList.remove('bump'), 200);
}

function renderPlaylist() {
  const count = state.saved.length;
  const isEmpty = count === 0;
  el.playlistEmpty.hidden = !isEmpty;
  el.btnClear.disabled = isEmpty; // attribute update: nothing to clear when empty
  el.playlistSummary.textContent = `${count} ${count === 1 ? 'song' : 'songs'} saved`;

  const items = state.saved.map((song) => {
    const info = createElement('div', 'playlist-info');
    info.append(
      createElement('strong', '', song.name),
      createElement('span', '', [song.artist, song.year].filter(Boolean).join(' · '))
    );

    const remove = createElement('button', 'remove-btn');
    remove.type = 'button';
    remove.title = `Remove ${song.name}`;
    remove.setAttribute('aria-label', `Remove ${song.name}`);
    remove.append(createIcon('x'));

    const item = createElement('li', 'playlist-item');
    item.dataset.key = songKey(song);
    item.append(createThumb(song, 'playlist-thumb'), info, remove);
    return item;
  });

  el.playlistList.replaceChildren(...items); // structural update
}

function showToast(message, target = el.toast) {
  target.textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { target.textContent = ''; }, 2200);
}

// ---------------------------------------------------------------------------
// Event listeners
// ---------------------------------------------------------------------------
el.searchForm.addEventListener('submit', handleSearchSubmit);
el.searchInput.addEventListener('input', handleSearchInput);

// Event delegation: one listener on each list handles every button inside it,
// including buttons that are created later when the list is re-rendered.
el.searchResults.addEventListener('click', (event) => {
  const button = event.target.closest('.result');
  if (!button) return;
  const song = state.results.find((result) => result.id === button.dataset.id);
  if (song) selectSeed(song);
});

el.playlistList.addEventListener('click', (event) => {
  const removeButton = event.target.closest('.remove-btn');
  if (!removeButton) return;
  removeSong(removeButton.closest('.playlist-item').dataset.key);
});

// The play/pause button is created fresh for every card, so listen on the document.
document.addEventListener('click', (event) => {
  if (event.target.closest('.play-btn')) toggleMusic();
});

el.btnFind.addEventListener('click', findSimilar);
el.btnSeedBack.addEventListener('click', openSearch);

el.btnPass.addEventListener('click', () => swipe('pass'));
el.btnSave.addEventListener('click', () => swipe('save'));

el.brand.addEventListener('click', openSearch);
el.navSearch.addEventListener('click', openSearch);
el.navPlaylist.addEventListener('click', openPlaylist);
el.btnViewPlaylist.addEventListener('click', openPlaylist);
el.btnEmptySearch.addEventListener('click', openSearch);

el.btnAgain.addEventListener('click', () => {
  el.searchInput.value = '';
  clearResults();
  openSearch();
});

el.btnClear.addEventListener('click', clearPlaylist);

// Keyboard shortcuts only apply while the card deck is on screen.
document.addEventListener('keydown', (event) => {
  if (views.cards.hidden) return;
  if (event.key === 'ArrowRight') swipe('save');
  if (event.key === 'ArrowLeft') swipe('pass');
});

// Keep the buttons in sync when the player starts or stops, and don't keep
// playing music in a background tab.
player.addEventListener('play', syncPlayButtons);
player.addEventListener('pause', syncPlayButtons);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) player.pause();
});

hydrateIcons();
updateStepper('search');
renderPlaylist();
el.searchInput.focus();
