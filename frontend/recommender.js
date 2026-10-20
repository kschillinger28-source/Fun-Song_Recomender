'use strict';

// Sprint 1 recommendation engine: content-based matching over CATALOG (catalog.js).
// It builds a profile of the song the user picked, scores every catalog song against
// that profile, and returns the best five. A later sprint swaps this for an LLM call.

// Words in iTunes' genre names -> the families used in the catalog.
const GENRE_TO_FAMILIES = [
  [/hip|rap/, ['hiphop']],
  [/r&b|soul|funk/, ['rnb']],
  [/country/, ['country']],
  [/dance|electro|house|techno|edm|trance/, ['electronic']],
  [/folk|singer|songwriter|acoustic/, ['folk']],
  [/latin|reggaeton|salsa|urbano/, ['latin']],
  [/metal|hard rock|grunge|punk/, ['metal', 'rock']],
  [/alternative|indie/, ['indie', 'rock']],
  [/rock/, ['rock']],
  [/pop/, ['pop']],
];

const FAMILY_LABELS = {
  rock: 'rock', indie: 'indie', pop: 'pop', hiphop: 'hip-hop', rnb: 'R&B',
  electronic: 'electronic', country: 'country', folk: 'folk', metal: 'metal', latin: 'latin',
};

// How much each kind of similarity is worth. The family match matters most.
const SCORE = {
  sharedFamily: 5,   // sharing at least one genre family
  extraFamily: 2,    // bonus for sharing a second family
  sharedTag: 1.5,    // per shared style tag
  eraMax: 5,         // same year; fades to 0 at eraYears apart
  eraYears: 18,
  energyMax: 2,      // same energy level; drops as the levels move apart
  energyPenalty: 0.75,
  jitter: 3.5,       // random nudge among good matches so repeat searches vary
  recentPenalty: 5,  // push down songs we already recommended this session
};
const SAME_ERA_YEARS = 6;
const SIMILAR_ENERGY_GAP = 1;

function plainText(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function catalogKey(song) {
  return `${song.name}|${song.artist}`;
}

function sameArtist(a, b) {
  const first = plainText(a);
  const second = plainText(b);
  return first !== '' && second !== '' && (first.includes(second) || second.includes(first));
}

function familiesForGenre(genre) {
  const text = String(genre || '').toLowerCase();
  const families = new Set();
  GENRE_TO_FAMILIES.forEach(([pattern, list]) => {
    if (pattern.test(text)) list.forEach((family) => families.add(family));
  });
  return families;
}

// What do we know about the seed song? Start with its iTunes genre and year. If the
// artist is also in our catalog, borrow that artist's style tags and energy too.
function buildSeedProfile(seed, catalog) {
  const families = familiesForGenre(seed.genre);
  const tags = new Set();
  const known = catalog.filter((entry) => sameArtist(entry.artist, seed.artist));
  let energyTotal = 0;

  known.forEach((entry) => {
    entry.families.forEach((family) => families.add(family));
    entry.tags.forEach((tag) => tags.add(tag));
    energyTotal += entry.energy;
  });

  return {
    families,
    tags,
    energy: known.length ? energyTotal / known.length : null,
    year: parseInt(seed.year, 10) || null,
  };
}

function scoreEntry(entry, profile, recentKeys, random) {
  const sharedFamilies = entry.families.filter((family) => profile.families.has(family));
  const sharedTags = entry.tags.filter((tag) => profile.tags.has(tag));
  const reasons = [];
  let score = 0;

  if (sharedFamilies.length > 0) {
    score += SCORE.sharedFamily + Math.min(sharedFamilies.length - 1, 1) * SCORE.extraFamily;
  }
  score += sharedTags.length * SCORE.sharedTag;
  sharedFamilies.slice(0, 1).forEach((family) => reasons.push(FAMILY_LABELS[family]));
  sharedTags.slice(0, 2).forEach((tag) => reasons.push(tag));

  if (profile.year) {
    const gap = Math.abs(entry.year - profile.year);
    score += Math.max(0, SCORE.eraMax * (1 - gap / SCORE.eraYears));
    if (gap <= SAME_ERA_YEARS) reasons.push('similar era');
  }

  if (profile.energy !== null) {
    const gap = Math.abs(entry.energy - profile.energy);
    score += Math.max(0, SCORE.energyMax - gap * SCORE.energyPenalty);
    if (gap <= SIMILAR_ENERGY_GAP) reasons.push('similar energy');
  }

  score += random() * SCORE.jitter;
  if (recentKeys.has(catalogKey(entry))) score -= SCORE.recentPenalty;

  return { entry, score, reasons: reasons.slice(0, 4) };
}

// Returns the best `size` songs for the seed, at most one per artist.
function recommend(seed, catalog, { recent = new Set(), size = 5, random = Math.random } = {}) {
  const profile = buildSeedProfile(seed, catalog);
  const seedName = plainText(seed.name);

  const ranked = catalog
    .filter((entry) => !sameArtist(entry.artist, seed.artist) && plainText(entry.name) !== seedName)
    .map((entry) => scoreEntry(entry, profile, recent, random))
    .sort((a, b) => b.score - a.score);

  const picks = [];
  const usedArtists = new Set();
  for (const item of ranked) {
    const artistKey = plainText(item.entry.artist);
    if (usedArtists.has(artistKey)) continue;
    usedArtists.add(artistKey);
    picks.push({ ...item.entry, key: catalogKey(item.entry), reasons: item.reasons });
    if (picks.length === size) break;
  }
  return picks;
}
