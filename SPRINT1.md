# Sprint 1 Report: Fun Song Recommender

## Project Recap

Fun Song Recommender is for an individual music fan who wants to discover new songs based on a track they already love. They search for a seed song and pick the right match from a list, get a deck of five Tinder-style recommendation cards (title, artist, year, genre, a "why it matches" summary, and a short background blurb) while a preview of each song plays, and press **Pass** or **Save** on each card. Saved songs are collected in a personal playlist.

The Sprint 1 prototype is entirely client-side (vanilla HTML/CSS/JS in [`frontend/`](frontend/)), with no backend, database, or login. It does make one kind of external call from the browser: the free, key-less iTunes Search API, used to list matching songs and to load album art and 30-second audio previews. This needs an internet connection. The recommendations are **not** AI-generated yet: `recommender.js` scores songs from a hand-built catalog (`catalog.js`) and stands in for the LLM call planned for a later sprint.

## Workflow Demo Guide

Open `frontend/index.html` in Chrome, Firefox, or Edge (internet connection required). No build step or server is needed.

1. Click **Search** with the box empty. An error message appears and the search bar is outlined in red (boundary validation).
2. Start typing a song name, for example `Mr. Brightside`. After a short pause, a list of matching songs appears (with loading placeholders while it searches), each with album art, artist, year, and genre.
3. Click the song you meant. The step indicator moves to **Confirm**. A details card shows the album art, title, artist, album, year, genre, and length, and its 30-second preview starts playing. Use the play/pause button on the artwork to pause or resume. Use **Back to results** to choose a different match.
4. Click **Find similar songs**. The deck of five cards appears, and each card's preview plays while you read it. Under **Why it matches** each card lists what it has in common with your song (for example `rock`, `guitar`, `similar era`).
5. Click **Save** (or press **→**). The card slides right, a message confirms the save, the **My Playlist** badge count increases, and the progress bar fills.
6. Click **Pass** (or press **←**). The card slides left and the next card's music starts. If you paused the music, it stays paused on later cards until you press play.
7. Try clicking quickly. The buttons are disabled during the slide animation, so a card can't be swiped twice.
8. After the fifth card, the "You've seen all five picks" screen shows how many songs you saved, and the music stops.
9. Click **View my playlist**. Use **✕** on a row to remove a song, or **Clear all** to empty the list. **Clear all** is disabled when the playlist is empty, and an empty-state message with a **Find songs** button appears.
10. Search the same song again and click **Find similar songs**. You get a different set of picks, because the app remembers what it already recommended this session.
11. Search a song from a different genre (for example a hip-hop or country song). The picks change to match.
12. Save a song that is already in your playlist. A message says it is already there, and it is not added twice.

## How the Recommendations Are Chosen

`recommender.js` builds a profile of the song you picked and scores every song in the 88-song catalog (`catalog.js`) against it. Each catalog song has genre families (rock, indie, pop, hip-hop, R&B, electronic, country, folk, metal, latin), style tags (guitar, synth, dance, acoustic, ...), a release year, and an energy level from 1 to 5.

- **Seed profile:** the genre and year come from iTunes. If the artist is also in the catalog, that artist's style tags and energy are used too.
- **Score:** a shared genre family counts the most (+5, plus +2 for a second shared family), then shared style tags (+1.5 each), then closeness in release year (up to +5, fading to 0 after 18 years), then similar energy (up to +2).
- **Variety:** a random nudge of up to 3.5 points is added so songs with similar scores trade places, and songs already recommended in the current session lose 5 points so repeat searches rotate through different songs.
- **Rules:** never the same artist as the seed, never the same song title, and at most one song per artist.

Test results (run with a script against 11 different seeds): 41 different songs were recommended across the 11 seeds, any two seeds shared on average 0.27 of their 5 songs, 99.2% of recommendations shared a genre family with the seed, and searching the same song 30 times surfaced between 9 and 17 different songs. Limitation: a seed in a genre the catalog doesn't cover (classical, jazz, and so on) gets a broad mix based only on release year.

## Where the Required DOM Updates Happen (`frontend/app.js`)

| Update type | Examples |
| --- | --- |
| Content | Progress label ("Card 2 of 5"), playlist badge and summary counts, search status text, toast messages, play/pause icon |
| Style / geometry | Progress bar `width`, card slide-off classes, step indicator states, red outline on an invalid search bar, badge "bump", animated bars while music plays |
| Attribute / state | `data-index` on the deck, `aria-valuenow` on the progress bar, `aria-current` on the current step, `disabled` on Pass/Save, Find similar and Clear all, `hidden` on views, `src` on the audio player |
| Structural / lifecycle | Search-result rows, loading placeholders, cards, and playlist rows are created and swapped with `replaceChildren` |

Boundary checks: empty search is rejected, searches wait for a pause in typing and ignore out-of-date responses, swiping is blocked mid-animation and after the last card, duplicate saves are rejected, and Clear all is disabled on an empty playlist.

## AI Usage Log & Reflection

> **Edit this section so it's in your own words before submitting.** The facts below come from the actual session. The items in [brackets] are things only you can fill in.

I used Claude Code to help me plan and build this project. First I pasted my pitch and asked it to review it; it pointed out two inconsistencies that I fixed in my pitch: "left swipes go to skipped history" contradicted my two-table database, and "it plays the song" contradicted my no-streaming rule (the app only plays 30-second previews). My professor's feedback to start with Pass/Save buttons instead of drag-and-flick physics shaped the interface, and Claude added arrow-key support and a fix so audio from one card doesn't carry over to the next. Before I pasted the Sprint 1 requirements, Claude and I had already built a React + Express + Gemini version of the app, which turned out to be out of scope for this sprint, so I asked for a separate vanilla HTML/CSS/JS prototype in `frontend/`. When I tested the first version, I saw that it never showed the song I searched for and had no music, so I asked Claude to add a list of matching songs, a details view for the chosen song, and audio that plays while reading each card. Claude checked the iTunes Search API before using it and found that it doesn't allow normal `fetch` calls from a web page (no CORS headers), so the code loads results with JSONP instead, and that it has no "similar songs" feature. My first recommendation logic just took the first five songs from a short list for the seed's genre, so every rock song got the same five picks; I noticed this and asked Claude to check the algorithm. Claude replaced it with a scoring system over a larger hand-built catalog, wrote a script to test it across different seeds and repeated searches, and tuned the weights after the first test run showed that repeat searches barely changed and that the repeat-avoidance rule pulled in songs from the wrong genre. I also asked for a more professional look, and Claude replaced the emoji with icons, added the step indicator, loading placeholders, and the blurred album-art cards. Along the way the AI got several things wrong that I had to catch by testing: it first assumed Spotify's recommendation endpoint and preview clips would work (they have been retired or are missing for new apps), it guessed outdated Gemini model names that the API rejected, and some of its own test scripts had bugs that made working features look broken, which it found by checking the test itself. [Add your own: what you tested in the browser, any bug you found in the Sprint 1 code, and how you fixed it.] [Add your own: one or two things you can now explain about the code, such as why the `submit` handler calls `event.preventDefault()`, why the search waits half a second after you stop typing, how the single click listener on each list handles every button inside it (event delegation), or how `recommend()` turns a song into a score.]

## Files

- `frontend/index.html`: page structure
- `frontend/style.css`: layout (Flexbox and Grid), theme, card, results and progress styling, responsive rules
- `frontend/app.js`: state, iTunes lookups, music playback, event listeners, and all DOM updates
- `frontend/catalog.js`: the hand-built 88-song catalog (stand-in for the AI)
- `frontend/recommender.js`: the scoring logic that picks the five songs
- `frontend/background.js`: the decorative background of drifting album covers (real album art from iTunes, with record-style placeholder tiles while it loads or if you're offline)
