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

## Build and Install

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

Set local Tizen CLI variables. Replace the placeholders with values from your own Tizen Studio setup:

```sh
cd /path/to/StremioTest

TIZEN="${TIZEN_STUDIO_HOME:-$HOME/tizen-studio}/tools/ide/bin/tizen"
SDB="${TIZEN_STUDIO_HOME:-$HOME/tizen-studio}/tools/sdb"
TARGET="<target-name-from-sdb-devices>"
PROFILE="<security-profile-name>"
APP_ID="VtffsKLoty.NuvioTizen"
```

Find connected targets and available signing profiles:

```sh
"$SDB" devices
"$TIZEN" security-profiles list
```

Build, package, install, and launch the app:

```sh
"$TIZEN" build-web -- "$(pwd)"
"$TIZEN" package -t wgt -s "$PROFILE" -- ./.buildResult

WGT="$(ls -t .buildResult/*.wgt | head -1)"
"$TIZEN" install -n "$(basename "$WGT")" -t "$TARGET" -- "$(dirname "$WGT")"
"$TIZEN" run -p "$APP_ID" -t "$TARGET"
```

If the target is not listed, reconnect it with the TV IP/port shown by Tizen Studio or Device Manager:

```sh
"$SDB" connect <tv-ip>:26101
```

If installation fails because the device is not permitted for the certificate, run:

```sh
"$TIZEN" install-permit -t "$TARGET"
```

The `run` command must use the full application ID from [`config.xml`](config.xml), not only the package ID.

## DTS Audio Transcode Helper

Samsung TV playback may hide DTS/DTS-HD audio tracks from AVPlay. To play a non-commentary DTS track on those TVs, run the optional helper on a machine that the TV can reach. The helper probes the original stream, chooses a DTS audio stream while avoiding commentary-labeled tracks, copies the video, and transcodes that audio to AC3.

Requirements:

- `ffmpeg` and `ffprobe` available in `PATH`
- The TV can reach the helper machine over the local network

Start the helper:

```sh
node scripts/audio-transcoder.js
```

Point the TV app at the helper by setting [`AUDIO_TRANSCODER_BASE_URL`](js/config-state.js) before packaging:

```js
var AUDIO_TRANSCODER_BASE_URL = 'http://<helper-host-ip>:8787';
```

Then rebuild, install, and launch the app. When a detected DTS/DTS-HD audio chip is selected, the app asks the helper for a stream where that DTS track is converted to AC3 and opens that returned stream in AVPlay.

## Runtime Notes

- The app is configured as a Tizen TV widget in [`config.xml`](config.xml).
- Main remote-navigation behavior is implemented in [`js/navigation-focus.js`](js/navigation-focus.js) and wired in [`js/main.js`](js/main.js).
- Spotlight, browse rails, login, and player UI are styled in [`css/style.css`](css/style.css).
- The app currently uses Supabase and Nuvio endpoints configured in [`js/config-state.js`](js/config-state.js).

## Current Output

The packaged build artifact is expected at:

- [`NuvioTizen.wgt`](NuvioTizen.wgt)
