# NuvioTizen

`NuvioTizen` is a Samsung Tizen TV web app prototype for a Nuvio-branded streaming shell. It is a single-page TV interface built with plain HTML, CSS, and JavaScript and packaged as a Tizen widget (`.wgt`).

The app includes:

- Nuvio account login with direct credentials and QR-based TV pairing
- Home spotlight rotation and browse rails
- Movie and series catalog browsing
- Search with an on-screen keyboard
- Detail, season, episode, and source selection flows
- Playback controls with audio and subtitle switching
- Tizen packaging through `config.xml`

## Project Layout

- [`index.html`](index.html): app shell and all view markup
- [`css/style.css`](css/style.css): TV layout, navigation, player, login, and spotlight styling
- [`js/config-state.js`](js/config-state.js): constants, shared state, caches, and typedefs
- [`js/platform-dom.js`](js/platform-dom.js): DOM helpers, request scheduling, storage normalization, and small shared utilities
- [`js/player.js`](js/player.js): playback metrics, tracks, subtitles, AVPlay/HTML5 player control, and player chrome
- [`js/navigation-focus.js`](js/navigation-focus.js): views, TV focus registry, remote navigation, home spotlight, and browse return state
- [`js/catalogs-addons.js`](js/catalogs-addons.js): addon/catalog option modeling, catalog URL building, browse paging, request helpers, and prefetch
- [`js/auth-sync.js`](js/auth-sync.js): Nuvio/Supabase auth, QR login, synced watch/library data, addon loading, and browse rendering glue
- [`js/detail-streams.js`](js/detail-streams.js): detail pages, seasons/episodes, streams, stream loading, and selection flow
- [`js/search-rendering.js`](js/search-rendering.js): search keyboard/results and shared card/rail rendering
- [`js/main.js`](js/main.js): app bootstrap, bindings, and TV key input handling
- [`config.xml`](config.xml): Tizen widget manifest and privileges
- [`images/`](images): logos and app icons
- [`NuvioTizen.wgt`](NuvioTizen.wgt): packaged widget artifact when built

## Requirements

- Samsung Tizen Studio installed
- A valid Samsung certificate profile for packaging
- Network access from the TV or emulator

This repo does not use a Node build system. The runtime app is plain static web assets, and packaging is handled by Tizen Studio.

## Build

Syntax check:

```sh
for f in js/*.js; do node --check "$f"; done
```

Pure logic tests:

```sh
node tests/pure.test.js
```

Optional local browser smoke test:

```sh
node tests/browser-smoke.js
```

Build the web app:

```sh
"/Users/user/tizen-studio/tools/ide/bin/tizen" build-web -- "$(pwd)"
```

Package the widget:

replace cert in the following command with your certificate

```sh
"/Users/user/tizen-studio/tools/ide/bin/tizen" package -t wgt -s cert -- ./.buildResult
```

Copy the packaged widget to the repo root:

```sh
cp ./.buildResult/*.wgt ./
```

## Runtime Notes

- The app is configured as a Tizen TV widget in [`config.xml`](config.xml).
- Main remote-navigation behavior is implemented in [`js/navigation-focus.js`](js/navigation-focus.js) and wired in [`js/main.js`](js/main.js).
- Spotlight, browse rails, login, and player UI are styled in [`css/style.css`](css/style.css).
- The app currently uses Supabase and Nuvio endpoints configured in [`js/config-state.js`](js/config-state.js).

## Current Output

The packaged build artifact is expected at:

- [`NuvioTizen.wgt`](NuvioTizen.wgt)
