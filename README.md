# Nuvio Web PC

`Nuvio Web PC` is a browser-first desktop version of the Nuvio streaming shell. It keeps the single-page HTML/CSS/JavaScript app structure from the original TV prototype, but the runtime is now aimed at a normal desktop browser with mouse, keyboard typing, and browser fullscreen support.

## What Changed

- Desktop navigation with mouse, tab focus, and keyboard shortcuts
- Search input for real desktop keyboard typing
- Browser-friendly player behavior with fullscreen support and pointer-driven controls
- Responsive layout adjustments for laptop and desktop screens
- Tizen-only runtime script dependency removed from the page entrypoint

## Project Layout

- [`index.html`](index.html): app shell and all view markup
- [`css/style.css`](css/style.css): layout, navigation, player, login, and browse styling
- [`js/main.js`](js/main.js): state, navigation, auth, catalogs, playback, subtitles, and desktop input handling
- [`images/`](images): logos and app assets
- [`config.xml`](config.xml): leftover Tizen manifest from the original branch history, not required for desktop browser runtime

## Run

This repo has no Node build step. Serve it as static files from any local web server.

Syntax check:

```sh
node --check js/main.js
```

Example local server:

```sh
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Desktop Controls

- Mouse: click navigation, cards, streams, and player controls
- Keyboard: arrow keys still move through the remote-style focus model when needed
- Search: type directly into the search field
- Player: `Space` toggles play/pause, `F` toggles fullscreen, `Esc`/`Backspace` goes back when not typing in a field

## Notes

- Playback uses standard browser video by default on this branch.
- QR sign-in and addon/catalog fetching still use the existing Nuvio and Supabase endpoints configured in [`js/main.js`](js/main.js).
