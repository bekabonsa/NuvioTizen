var API_BASE = 'https://api.strem.io';
var CINEMETA_BASE = 'https://v3-cinemeta.strem.io';
var STORAGE_AUTH = 'stremio.authKey';
var STORAGE_USER = 'stremio.user';
var STORAGE_CONTINUE = 'stremio.continueWatching';
var FALLBACK_MOVIE_GENRES = ['Top', 'Action', 'Comedy', 'Drama', 'Sci-Fi', 'Thriller', 'Animation', 'Documentary'];
var FALLBACK_SERIES_GENRES = ['Top', 'Drama', 'Comedy', 'Crime', 'Sci-Fi', 'Animation', 'Thriller', 'Documentary'];
var NAV_VIEWS = ['search', 'home', 'series', 'movies', 'login'];
var VIEW_META = {
    home: {
        eyebrow: 'Discover',
        title: 'Home',
        subtitle: 'Featured picks, continue watching, and curated rows shaped for TV browsing.'
    },
    movies: {
        eyebrow: 'Catalog',
        title: 'Films',
        subtitle: 'Browse cinematic rows, change genres, and drill into sources without leaving the TV flow.'
    },
    series: {
        eyebrow: 'Catalog',
        title: 'Series',
        subtitle: 'Browse shows, then move into seasons, episodes, and installed addon sources.'
    },
    search: {
        eyebrow: 'Discover',
        title: 'Search',
        subtitle: 'Search live Cinemeta catalogs for films and series.'
    },
    addons: {
        eyebrow: 'Details',
        title: 'Details',
        subtitle: 'Selection summary, seasons, episodes, and the sources available from your installed addons.'
    },
    player: {
        eyebrow: 'Playback',
        title: 'Player',
        subtitle: 'Native playback with TV overlay controls and direct addon stream support.'
    },
    login: {
        eyebrow: 'Account',
        title: 'My Stremio',
        subtitle: 'Connect your account, restore your session, and use your installed addons.'
    }
};

var state = {
    authKey: null,
    user: null,
    addons: [],
    continueWatching: [],
    movies: [],
    series: [],
    movieGenres: FALLBACK_MOVIE_GENRES.slice(),
    seriesGenres: FALLBACK_SERIES_GENRES.slice(),
    selectedMovieGenre: 'Top',
    selectedSeriesGenre: 'Top',
    movieBrowseItems: [],
    seriesBrowseItems: [],
    movieSkip: 0,
    seriesSkip: 0,
    searchQuery: '',
    searchScope: 'all',
    searchMovies: [],
    searchSeries: [],
    selectedItem: null,
    selectedType: null,
    allSeriesVideos: [],
    availableSeasons: [],
    selectedSeason: null,
    selectedEpisodes: [],
    selectedVideo: null,
    streams: [],
    currentStream: null,
    audioTracks: [],
    subtitleTracks: [],
    externalSubtitleTracks: [],
    externalSubtitleCues: [],
    activeAudioTrack: null,
    activeSubtitleTrack: 'subtitle-off',
    currentTimeMs: 0,
    durationMs: 0,
    playbackTicker: null,
    playerChromeTimer: null,
    playerMode: 'html5',
    playerFullscreen: false,
    currentView: 'home',
    viewHistory: [],
    focusRegion: 'nav',
    navIndex: 1,
    mainRow: 0,
    mainCol: 0,
    featuredKey: null,
    featuredTimer: null,
    featuredItem: null,
    featuredKind: null,
    autoplayPending: false
};

function byId(id) {
    return document.getElementById(id);
}

function queryAll(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
}

function updateConnectionStatus(text, ok, isError) {
    var el = byId('connectionStatus');
    el.textContent = text;
    el.className = 'status-pill';
    if (ok) {
        el.classList.add('is-ok');
    }
    if (isError) {
        el.classList.add('is-error');
    }
}

function updateSessionStatus(text, ok, isError) {
    var el = byId('sessionStatus');
    el.textContent = text;
    el.className = 'status-pill';
    if (ok) {
        el.classList.add('is-ok');
    }
    if (isError) {
        el.classList.add('is-error');
    }
}

function setLoginMessage(text, tone) {
    var el = byId('loginMessage');
    el.textContent = text;
    el.className = 'helper';
    if (tone === 'error') {
        el.classList.add('is-error');
    } else if (tone === 'success') {
        el.classList.add('is-success');
    }
}

function setAddonsMessage(text, tone) {
    var el = byId('addonsMessage');
    el.textContent = text;
    el.className = 'helper';
    if (tone === 'error') {
        el.classList.add('is-error');
    } else if (tone === 'success') {
        el.classList.add('is-success');
    }
}

function setSearchMessage(text, tone) {
    var el = byId('searchMessage');
    el.textContent = text;
    el.className = 'helper';
    if (tone === 'error') {
        el.classList.add('is-error');
    } else if (tone === 'success') {
        el.classList.add('is-success');
    }
}

function setPlayerStatus(text) {
    byId('playerStatus').textContent = text;
}

function uniqueList(items) {
    var seen = {};
    var output = [];

    items.forEach(function(item) {
        if (!item || seen[item]) {
            return;
        }
        seen[item] = true;
        output.push(item);
    });

    return output;
}

function updateUserPanel() {
    var email = state.user && state.user.email ? state.user.email : 'Guest';
    var authKey = state.authKey ? state.authKey : 'Not set';

    byId('sideUserLabel').textContent = email;
    byId('topAccountLabel').textContent = email;
    byId('accountEmail').textContent = email;
    byId('authKeyLabel').textContent = authKey;
    byId('accountNote').textContent = state.authKey
        ? 'This Stremio session is stored locally on the TV shell.'
        : 'Sign in to keep your Stremio session active inside this TV shell.';
}

function cloneContinueItem(item) {
    if (!item) {
        return null;
    }

    return {
        id: item.id,
        name: item.name,
        poster: item.poster,
        background: item.background || item.poster,
        description: item.description,
        releaseInfo: item.releaseInfo,
        year: item.year,
        imdbRating: item.imdbRating
    };
}

function saveContinueWatching() {
    localStorage.setItem(STORAGE_CONTINUE, JSON.stringify(state.continueWatching.slice(0, 12)));
}

function restoreContinueWatching() {
    var payload = safeJsonParse(localStorage.getItem(STORAGE_CONTINUE));

    if (!Array.isArray(payload)) {
        state.continueWatching = [];
        return;
    }

    state.continueWatching = payload.filter(function(entry) {
        return entry && entry.item && entry.kind && entry.item.id;
    }).slice(0, 12);
}

function trackContinueWatching(item, kind, video) {
    var snapshot;
    var key;

    if (!item || !kind) {
        return;
    }

    snapshot = {
        kind: kind,
        item: cloneContinueItem(item),
        video: video ? {
            id: video.id,
            title: video.title || video.name || '',
            season: getVideoSeason(video),
            episode: getVideoEpisode(video)
        } : null
    };
    key = snapshot.kind + ':' + snapshot.item.id + ':' + (snapshot.video && snapshot.video.id ? snapshot.video.id : '');

    state.continueWatching = [snapshot].concat(state.continueWatching.filter(function(entry) {
        var entryKey = entry.kind + ':' + entry.item.id + ':' + (entry.video && entry.video.id ? entry.video.id : '');
        return entryKey !== key;
    })).slice(0, 12);

    saveContinueWatching();
}

function resetTrackState() {
    state.audioTracks = [];
    state.subtitleTracks = [];
    state.externalSubtitleTracks = [];
    state.externalSubtitleCues = [];
    state.activeAudioTrack = null;
    state.activeSubtitleTrack = 'subtitle-off';
    updateSubtitleOverlay(0);
}

function safeJsonParse(value) {
    if (!value) {
        return null;
    }
    if (typeof value === 'object') {
        return value;
    }

    try {
        return JSON.parse(value);
    } catch (error) {
        return null;
    }
}

function normalizeTrackLabel(type, info, index) {
    var language = '';
    var codec = '';
    var label = '';

    if (info) {
        language = info.language || info.lang || info.track_lang || info.subtitle_lang || '';
        codec = info.codec_fourcc || info.codec || '';
        label = info.label || info.track_name || info.name || '';
    }

    if (label) {
        return label;
    }
    if (language && codec) {
        return String(language).toUpperCase() + ' • ' + codec;
    }
    if (language) {
        return String(language).toUpperCase();
    }
    if (codec) {
        return codec;
    }

    return (type === 'audio' ? 'Audio ' : 'Subtitle ') + (index + 1);
}

function isExternalSubtitleTrackId(trackId) {
    return typeof trackId === 'string' && trackId.indexOf('subtitle-ext-') === 0;
}

function mergeHeaderMap(target, source) {
    if (!source || typeof source !== 'object') {
        return target;
    }

    Object.keys(source).forEach(function(key) {
        if (source[key] === null || typeof source[key] === 'undefined') {
            return;
        }
        target[key] = String(source[key]);
    });

    return target;
}

function resolveUrl(baseUrl, value) {
    var anchor;

    if (!value) {
        return '';
    }

    if (/^(https?:|file:|data:|blob:)/i.test(value)) {
        return value;
    }

    anchor = document.createElement('a');
    anchor.href = baseUrl || window.location.href;
    anchor.pathname = value.charAt(0) === '/'
        ? value
        : anchor.pathname.replace(/[^/]*$/, '') + value;

    return anchor.href;
}

function getSubtitleRequestHeaders(streamEntry, subtitleTrack) {
    var headers = {};
    var stream = streamEntry && streamEntry.raw ? streamEntry.raw : null;
    var behaviorHints = stream && stream.behaviorHints ? stream.behaviorHints : null;
    var proxyHeaders = behaviorHints && behaviorHints.proxyHeaders ? behaviorHints.proxyHeaders : null;

    if (proxyHeaders && proxyHeaders.request) {
        mergeHeaderMap(headers, proxyHeaders.request);
    }

    if (stream && stream.proxyHeaders && stream.proxyHeaders.request) {
        mergeHeaderMap(headers, stream.proxyHeaders.request);
    }

    if (subtitleTrack && subtitleTrack.headers) {
        mergeHeaderMap(headers, subtitleTrack.headers);
    }

    if (subtitleTrack && subtitleTrack.requestHeaders) {
        mergeHeaderMap(headers, subtitleTrack.requestHeaders);
    }

    return headers;
}

function requestText(url, headers) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        if (typeof xhr.overrideMimeType === 'function') {
            xhr.overrideMimeType('text/plain; charset=utf-8');
        }
        Object.keys(headers || {}).forEach(function(key) {
            xhr.setRequestHeader(key, headers[key]);
        });
        xhr.onreadystatechange = function() {
            if (xhr.readyState !== 4) {
                return;
            }
            if ((xhr.status >= 200 && xhr.status < 300) || (xhr.status === 0 && xhr.responseText)) {
                resolve(xhr.responseText);
                return;
            }
            reject(new Error('Subtitle request failed with status ' + xhr.status));
        };
        xhr.onerror = function() {
            reject(new Error('Subtitle request failed'));
        };
        xhr.send();
    });
}

function stripSubtitleMarkup(text) {
    return String(text || '')
        .replace(/\\N/g, '\n')
        .replace(/\\n/g, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\{\\[^}]+\}/g, '')
        .replace(/\{[^}]+\}/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();
}

function parseSubtitleTimestamp(value) {
    var token = String(value || '')
        .replace(/^\uFEFF/, '')
        .trim()
        .match(/[0-9]+(?::[0-9]+){0,2}[,.][0-9]+|[0-9]+(?::[0-9]+){1,2}/);
    var parts = (token ? token[0] : '0').replace(',', '.').split(':').map(function(part) {
        return part.trim();
    });
    var hours = 0;
    var minutes = 0;
    var seconds = 0;

    if (parts.length === 3) {
        hours = parseFloat(parts[0]) || 0;
        minutes = parseFloat(parts[1]) || 0;
        seconds = parseFloat(parts[2]) || 0;
    } else if (parts.length === 2) {
        minutes = parseFloat(parts[0]) || 0;
        seconds = parseFloat(parts[1]) || 0;
    } else {
        seconds = parseFloat(parts[0]) || 0;
    }

    return Math.round((((hours * 60) + minutes) * 60 + seconds) * 1000);
}

function parseAssDialogueLine(line) {
    var body = String(line || '').replace(/^Dialogue:\s*/i, '');
    var fields = [];
    var commaIndex;
    var text;

    while (fields.length < 9) {
        commaIndex = body.indexOf(',');
        if (commaIndex === -1) {
            return null;
        }
        fields.push(body.slice(0, commaIndex));
        body = body.slice(commaIndex + 1);
    }

    text = stripSubtitleMarkup(body);
    if (!text) {
        return null;
    }

    return {
        start: parseSubtitleTimestamp(fields[1]),
        end: parseSubtitleTimestamp(fields[2]),
        text: text
    };
}

function parseSubtitleFile(text) {
    var normalized = String(text || '').replace(/^\uFEFF/, '').replace(/\r/g, '').trim();
    var blocks;
    var dialogueCues;

    if (!normalized) {
        return [];
    }

    normalized = normalized.replace(/^WEBVTT[^\n]*\n+/i, '');
    dialogueCues = normalized.split('\n').map(parseAssDialogueLine).filter(function(cue) {
        return cue && cue.end > cue.start;
    });

    if (dialogueCues.length) {
        return dialogueCues;
    }

    blocks = normalized.split(/\n{2,}/);

    return blocks.map(function(block) {
        var lines = block.split('\n').filter(Boolean);
        var timingLine;
        var textLines;
        var match;

        if (!lines.length) {
            return null;
        }

        if (/^(NOTE|STYLE|REGION)\b/i.test(lines[0].trim())) {
            return null;
        }

        if (/^\d+$/.test(lines[0].trim())) {
            lines.shift();
        }

        if (lines[0] && lines[0].indexOf('-->') === -1 && lines[1] && lines[1].indexOf('-->') !== -1) {
            lines.shift();
        }

        timingLine = lines.shift() || '';
        if (!timingLine || timingLine.indexOf('-->') === -1) {
            return null;
        }

        match = timingLine.match(/^\s*([0-9:\.,]+)\s*-->\s*([0-9:\.,]+)/);
        if (!match) {
            return null;
        }

        textLines = lines.map(stripSubtitleMarkup).filter(Boolean);
        if (!textLines.length) {
            return null;
        }

        return {
            start: parseSubtitleTimestamp(match[1]),
            end: parseSubtitleTimestamp(match[2]),
            text: textLines.join('\n')
        };
    }).filter(function(cue) {
        return cue && cue.end > cue.start;
    }).sort(function(left, right) {
        return left.start - right.start;
    });
}

function updateSubtitleOverlay(currentTimeMs) {
    var overlay = byId('playerSubtitleOverlay');
    var textNode;
    var cue = null;

    if (isExternalSubtitleTrackId(state.activeSubtitleTrack) && state.externalSubtitleCues.length) {
        state.externalSubtitleCues.some(function(entry) {
            if (currentTimeMs >= entry.start && currentTimeMs <= entry.end) {
                cue = entry;
                return true;
            }
            return false;
        });
    }

    if (!cue || !cue.text) {
        overlay.innerHTML = '';
        overlay.classList.add('is-hidden');
        return;
    }

    overlay.innerHTML = '';
    textNode = document.createElement('span');
    textNode.textContent = cue.text;
    overlay.appendChild(textNode);
    overlay.classList.remove('is-hidden');
}

function getExternalSubtitleTracks(stream) {
    var subtitles = stream && stream.raw && Array.isArray(stream.raw.subtitles) ? stream.raw.subtitles : [];
    var baseUrl = stream && stream.addonBaseUrl ? stream.addonBaseUrl : '';

    return subtitles.map(function(track, index) {
        var url = track.url || track.src || track.file;
        var language = track.lang || track.language || '';
        var label = track.label || track.name || track.lang || '';
        if (!url) {
            return null;
        }
        return {
            id: 'subtitle-ext-' + index,
            index: index,
            kind: 'external',
            url: resolveUrl(baseUrl, url),
            headers: getSubtitleRequestHeaders(stream, track),
            label: normalizeTrackLabel('subtitle', {
                language: language,
                label: label
            }, index)
        };
    }).filter(Boolean);
}

function syncExternalSubtitleTracks() {
    state.externalSubtitleTracks = getExternalSubtitleTracks(state.currentStream);

    if (isExternalSubtitleTrackId(state.activeSubtitleTrack)) {
        var stillExists = state.externalSubtitleTracks.some(function(track) {
            return track.id === state.activeSubtitleTrack;
        });
        if (!stillExists) {
            state.activeSubtitleTrack = 'subtitle-off';
            state.externalSubtitleCues = [];
        }
    }
}

function getAllSubtitleTracks() {
    return state.subtitleTracks.concat(state.externalSubtitleTracks);
}

function getPreferredSubtitleTracks() {
    if (state.externalSubtitleTracks.length) {
        return state.externalSubtitleTracks.slice();
    }
    return state.subtitleTracks.slice();
}

function applyPreferredSubtitleSelection() {
    var preferredTracks = getPreferredSubtitleTracks();

    if (!preferredTracks.length) {
        return;
    }

    if (preferredTracks.some(function(track) {
        return track.id === state.activeSubtitleTrack;
    })) {
        return;
    }

    selectSubtitleTrack(preferredTracks[0].id);
}

function cycleAudioTrack() {
    var nextIndex;

    if (!state.audioTracks.length) {
        setPlayerStatus('No alternate audio tracks');
        return;
    }

    nextIndex = state.audioTracks.findIndex(function(track) {
        return track.id === state.activeAudioTrack;
    });
    nextIndex = (nextIndex + 1 + state.audioTracks.length) % state.audioTracks.length;
    selectAudioTrack(state.audioTracks[nextIndex].id);
}

function cycleSubtitleTrack() {
    var tracks = [{ id: 'subtitle-off', label: 'Off' }].concat(getPreferredSubtitleTracks());
    var nextIndex = tracks.findIndex(function(track) {
        return track.id === state.activeSubtitleTrack;
    });

    nextIndex = (nextIndex + 1 + tracks.length) % tracks.length;
    selectSubtitleTrack(tracks[nextIndex].id);
}

function setPlayerToggleUi(isPlaying) {
    var button = byId('playerToggleButton');
    byId('playerToggleGlyph').textContent = isPlaying ? '❚❚' : '▶';
    button.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
    button.setAttribute('title', isPlaying ? 'Pause' : 'Play');
    button.setAttribute('data-state', isPlaying ? 'pause' : 'play');
}

function setPlayerFullscreenUi() {
    var button = byId('playerFullscreenButton');
    byId('playerFullscreenGlyph').textContent = state.playerFullscreen ? '❐' : '⛶';
    button.setAttribute('aria-label', state.playerFullscreen ? 'Windowed' : 'Fullscreen');
    button.setAttribute('title', state.playerFullscreen ? 'Windowed' : 'Fullscreen');
}

function updateTrackBadges() {
    byId('playerAudioBadge').textContent = state.audioTracks.length ? String(state.audioTracks.length) : '1';
    byId('playerSubtitleBadge').textContent = getPreferredSubtitleTracks().length ? String(getPreferredSubtitleTracks().length) : 'Off';
}

function formatPlaybackTime(ms) {
    var totalSeconds = Math.max(0, Math.floor((ms || 0) / 1000));
    var hours = Math.floor(totalSeconds / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;
    var pad2 = function(value) {
        return value < 10 ? '0' + String(value) : String(value);
    };

    if (hours > 0) {
        return [
            String(hours),
            pad2(minutes),
            pad2(seconds)
        ].join(':');
    }

    return [
        pad2(minutes),
        pad2(seconds)
    ].join(':');
}

function updateProgressUi() {
    var percent = 0;
    if (state.durationMs > 0) {
        percent = Math.max(0, Math.min(100, (state.currentTimeMs / state.durationMs) * 100));
    }

    byId('playerCurrentTime').textContent = formatPlaybackTime(state.currentTimeMs);
    byId('playerDuration').textContent = formatPlaybackTime(state.durationMs);
    byId('playerProgressFill').style.width = String(percent) + '%';
    byId('playerProgressCaption').textContent = state.durationMs > 0
        ? Math.round(percent) + '% watched'
        : 'Waiting for stream timing...';
}

function setPlaybackMetrics(currentMs, durationMs) {
    state.currentTimeMs = Math.max(0, currentMs || 0);
    state.durationMs = Math.max(0, durationMs || 0);
    updateProgressUi();
    updateSubtitleOverlay(state.currentTimeMs);
}

function resetPlaybackMetrics() {
    state.currentTimeMs = 0;
    state.durationMs = 0;
    updateProgressUi();
}

function readHtml5Metrics() {
    var video = byId('videoPlayer');
    var current = isFinite(video.currentTime) ? video.currentTime * 1000 : 0;
    var duration = isFinite(video.duration) ? video.duration * 1000 : 0;
    setPlaybackMetrics(current, duration);
}

function readAvplayMetrics() {
    var current = 0;
    var duration = state.durationMs || 0;

    if (!hasAvplay()) {
        return;
    }

    try {
        current = webapis.avplay.getCurrentTime() || 0;
    } catch (error1) {
        current = state.currentTimeMs || 0;
    }

    try {
        duration = webapis.avplay.getDuration() || duration;
    } catch (error2) {
        duration = duration || 0;
    }

    setPlaybackMetrics(current, duration);
}

function stopPlaybackTicker() {
    if (state.playbackTicker) {
        clearInterval(state.playbackTicker);
        state.playbackTicker = null;
    }
}

function showPlayerChrome(persist) {
    var body = document.body;

    body.classList.add('is-player-chrome-visible');
    if (state.playerChromeTimer) {
        clearTimeout(state.playerChromeTimer);
        state.playerChromeTimer = null;
    }

    if (persist || !state.playerFullscreen) {
        return;
    }

    state.playerChromeTimer = setTimeout(function() {
        document.body.classList.remove('is-player-chrome-visible');
        state.playerChromeTimer = null;
    }, 2800);
}

function startPlaybackTicker() {
    stopPlaybackTicker();
    state.playbackTicker = setInterval(function() {
        if (state.playerMode === 'avplay') {
            readAvplayMetrics();
        } else {
            readHtml5Metrics();
        }
    }, 500);
}

function seekCurrentPlayback(deltaMs) {
    var video = byId('videoPlayer');
    var current = state.currentTimeMs || 0;
    var duration = state.durationMs || 0;
    var target = current + deltaMs;

    showPlayerChrome(false);

    if (duration > 0) {
        target = Math.min(duration, target);
    }
    target = Math.max(0, target);

    if (state.playerMode === 'avplay' && hasAvplay()) {
        try {
            if (duration > 1000) {
                target = Math.min(duration - 1000, Math.max(1000, target));
            }
            webapis.avplay.seekTo(target, function() {
                setPlaybackMetrics(target, duration);
                setPlayerStatus((deltaMs < 0 ? 'Rewound to ' : 'Skipped to ') + formatPlaybackTime(target));
            }, function() {
                setPlayerStatus('Seek failed');
            });
            return;
        } catch (error) {
            setPlayerStatus('Seek failed');
            return;
        }
    }

    try {
        video.currentTime = target / 1000;
        readHtml5Metrics();
        setPlayerStatus((deltaMs < 0 ? 'Rewound to ' : 'Skipped to ') + formatPlaybackTime(target));
    } catch (error2) {
        setPlayerStatus('Seek failed');
    }
}

function hasAvplay() {
    return typeof webapis !== 'undefined' && webapis && webapis.avplay;
}

function stopHtml5Playback() {
    var video = byId('videoPlayer');
    try {
        video.pause();
        video.removeAttribute('src');
        video.load();
    } catch (error) {
        // no-op
    }
}

function stopAvplayPlayback() {
    if (!hasAvplay()) {
        return;
    }
    try {
        webapis.avplay.stop();
    } catch (error1) {
        // no-op
    }
    try {
        webapis.avplay.close();
    } catch (error2) {
        // no-op
    }
}

function syncAvplayRect() {
    var surface = byId('avplaySurface');
    var shell = byId('contentShell');
    var shellRect;
    var rect;
    var left;
    var top;
    var width;
    var height;
    var targetAspect = 16 / 9;
    var rectAspect;

    if (state.playerMode !== 'avplay' || !hasAvplay()) {
        return;
    }

    rect = surface.getBoundingClientRect();
    shellRect = shell ? shell.getBoundingClientRect() : { left: 0, top: 0 };
    left = state.playerFullscreen ? rect.left : (rect.left - shellRect.left);
    top = state.playerFullscreen ? rect.top : (rect.top - shellRect.top);
    width = rect.width;
    height = rect.height;

    if (!state.playerFullscreen && rect.width > 0 && rect.height > 0) {
        rectAspect = rect.width / rect.height;
        if (rectAspect > targetAspect) {
            width = rect.height * targetAspect;
            left += (rect.width - width) / 2;
        } else {
            height = rect.width / targetAspect;
            top += (rect.height - height) / 2;
        }
    }

    try {
        try {
            webapis.avplay.setDisplayMethod(state.playerFullscreen
                ? 'PLAYER_DISPLAY_MODE_FULL_SCREEN'
                : 'PLAYER_DISPLAY_MODE_LETTER_BOX');
        } catch (displayError) {
            // no-op
        }
        webapis.avplay.setDisplayRect(
            Math.max(0, Math.round(left)),
            Math.max(0, Math.round(top)),
            Math.max(1, Math.round(width)),
            Math.max(1, Math.round(height))
        );
    } catch (error) {
        setPlayerStatus('AVPlay rect failed');
    }
}

function clearPlaybackSurface() {
    byId('avplaySurface').classList.remove('is-active');
    byId('videoPlayer').classList.remove('is-hidden');
    stopPlaybackTicker();
    stopAvplayPlayback();
    stopHtml5Playback();
    state.playerMode = 'html5';
    resetTrackState();
    resetPlaybackMetrics();
    setPlayerToggleUi(false);
    renderTrackSelectors();
}

function stopCurrentPlayback() {
    clearPlaybackSurface();
    setPlayerStatus('Stopped');
}

function renderTrackChips(containerId, tracks, activeId, onSelect) {
    var container = byId(containerId);
    container.innerHTML = '';

    tracks.forEach(function(track) {
        var button = document.createElement('button');
        button.className = 'track-chip';
        button.type = 'button';
        button.setAttribute('tabindex', '-1');
        if (track.id === activeId) {
            button.classList.add('is-selected');
        }
        button.textContent = track.label;
        button.addEventListener('click', function() {
            onSelect(track.id);
        });
        container.appendChild(button);
    });
}

function renderTrackSelectors() {
    var hasPlayableSelection = !!(state.currentStream && state.currentStream.playable);
    var audioTracks = state.audioTracks.slice();
    var preferredSubtitleTracks = getPreferredSubtitleTracks();
    var subtitleTracks = hasPlayableSelection
        ? [{
            id: 'subtitle-off',
            label: 'Off'
        }].concat(preferredSubtitleTracks)
        : [];

    byId('audioTrackCount').textContent = audioTracks.length
        ? String(audioTracks.length) + ' option' + (audioTracks.length === 1 ? '' : 's')
        : 'Default only';
    byId('subtitleTrackCount').textContent = preferredSubtitleTracks.length
        ? String(preferredSubtitleTracks.length) + ' option' + (preferredSubtitleTracks.length === 1 ? '' : 's')
        : 'Off';

    renderTrackChips('audioTrackList', audioTracks, state.activeAudioTrack, selectAudioTrack);
    renderTrackChips('subtitleTrackList', subtitleTracks, state.activeSubtitleTrack, selectSubtitleTrack);
    updateTrackBadges();
}

function refreshHtml5Tracks() {
    var video = byId('videoPlayer');
    var nextAudio = [];
    var nextSubs = [];
    var audioTracks = video.audioTracks;
    var textTracks = video.textTracks;
    var index;

    if (audioTracks && typeof audioTracks.length === 'number') {
        for (index = 0; index < audioTracks.length; index += 1) {
            nextAudio.push({
                id: 'audio-' + index,
                index: index,
                label: normalizeTrackLabel('audio', {
                    language: audioTracks[index].language,
                    label: audioTracks[index].label
                }, index)
            });
            if (audioTracks[index].enabled) {
                state.activeAudioTrack = 'audio-' + index;
            }
        }
    }

    if (textTracks && typeof textTracks.length === 'number') {
        for (index = 0; index < textTracks.length; index += 1) {
            var textTrackLanguage = textTracks[index].language || '';
            var textTrackLabel = textTracks[index].label || '';
            nextSubs.push({
                id: 'subtitle-' + index,
                index: index,
                language: textTrackLanguage,
                label: normalizeTrackLabel('subtitle', {
                    language: textTrackLanguage,
                    label: textTrackLabel
                }, index)
            });
            if (textTracks[index].mode && textTracks[index].mode !== 'disabled') {
                state.activeSubtitleTrack = 'subtitle-' + index;
            }
        }
    }

    if (!nextAudio.length) {
        state.activeAudioTrack = null;
    } else if (!state.activeAudioTrack) {
        state.activeAudioTrack = nextAudio[0].id;
    }

    if (!nextSubs.length) {
        if (!isExternalSubtitleTrackId(state.activeSubtitleTrack)) {
            state.activeSubtitleTrack = 'subtitle-off';
        }
    }

    state.audioTracks = nextAudio;
    state.subtitleTracks = nextSubs;
    renderTrackSelectors();
}

function refreshAvplayTracks() {
    var totalTrackInfo;
    var nextAudio = [];
    var nextSubs = [];

    if (!hasAvplay()) {
        return;
    }

    try {
        totalTrackInfo = webapis.avplay.getTotalTrackInfo() || [];
    } catch (error) {
        return;
    }

    totalTrackInfo.forEach(function(trackInfo, index) {
        var info = safeJsonParse(trackInfo.extra_info) || {};
        var trackId;

        if (trackInfo.type === 'AUDIO') {
            trackId = 'audio-' + trackInfo.index;
            nextAudio.push({
                id: trackId,
                index: trackInfo.index,
                label: normalizeTrackLabel('audio', info, index)
            });
            return;
        }

        if (trackInfo.type === 'TEXT' || trackInfo.type === 'SUBTITLE') {
            trackId = 'subtitle-' + trackInfo.index;
            nextSubs.push({
                id: trackId,
                index: trackInfo.index,
                language: info.language || info.lang || info.track_lang || info.subtitle_lang || '',
                label: normalizeTrackLabel('subtitle', info, index)
            });
        }
    });

    state.audioTracks = nextAudio;
    state.subtitleTracks = nextSubs;

    if (!state.activeAudioTrack && nextAudio.length) {
        state.activeAudioTrack = nextAudio[0].id;
    }
    if (!nextSubs.length) {
        if (!isExternalSubtitleTrackId(state.activeSubtitleTrack)) {
            state.activeSubtitleTrack = 'subtitle-off';
        }
    } else if (state.activeSubtitleTrack !== 'subtitle-off' && !isExternalSubtitleTrackId(state.activeSubtitleTrack)) {
        var stillExists = nextSubs.some(function(track) {
            return track.id === state.activeSubtitleTrack;
        });
        if (!stillExists) {
            state.activeSubtitleTrack = 'subtitle-off';
        }
    }

    renderTrackSelectors();
}

function refreshPlaybackTracks() {
    if (!state.currentStream || !state.currentStream.playable) {
        resetTrackState();
        renderTrackSelectors();
        return;
    }

    if (state.playerMode === 'avplay') {
        refreshAvplayTracks();
        applyPreferredSubtitleSelection();
        return;
    }

    refreshHtml5Tracks();
    applyPreferredSubtitleSelection();
}

function scheduleTrackRefresh() {
    [120, 450, 1200].forEach(function(delay) {
        setTimeout(refreshPlaybackTracks, delay);
    });
}

function selectAudioTrack(trackId) {
    var video = byId('videoPlayer');
    var audioTracks = video.audioTracks;
    var selectedTrack = state.audioTracks.filter(function(track) {
        return track.id === trackId;
    })[0];
    var index;

    if (!selectedTrack) {
        return;
    }

    showPlayerChrome(false);

    if (state.playerMode === 'avplay' && hasAvplay()) {
        try {
            webapis.avplay.setSelectTrack('AUDIO', selectedTrack.index);
            state.activeAudioTrack = trackId;
            renderTrackSelectors();
            setPlayerStatus('Audio: ' + selectedTrack.label);
        } catch (error) {
            setPlayerStatus('Audio switch failed');
        }
        return;
    }

    if (audioTracks && typeof audioTracks.length === 'number') {
        for (index = 0; index < audioTracks.length; index += 1) {
            audioTracks[index].enabled = index === selectedTrack.index;
        }
    }

    state.activeAudioTrack = trackId;
    renderTrackSelectors();
    setPlayerStatus('Audio: ' + selectedTrack.label);
}

function selectSubtitleTrack(trackId) {
    var video = byId('videoPlayer');
    var textTracks = video.textTracks;
    var selectedTrack = getPreferredSubtitleTracks().filter(function(track) {
        return track.id === trackId;
    })[0];
    var index;

    showPlayerChrome(state.playerFullscreen && state.mainRow > 0);

    if (selectedTrack && selectedTrack.kind === 'external') {
        if (state.playerMode === 'avplay' && hasAvplay()) {
            try {
                webapis.avplay.setSilentSubtitle(true);
            } catch (silentError) {
                // no-op
            }
        }

        requestText(selectedTrack.url, selectedTrack.headers).then(function(text) {
            state.externalSubtitleCues = parseSubtitleFile(text);
            state.activeSubtitleTrack = trackId;
            updateSubtitleOverlay(state.currentTimeMs);
            renderTrackSelectors();
            if (!state.externalSubtitleCues.length) {
                setPlayerStatus('Subtitle file loaded but no cues were found');
                return;
            }
            setPlayerStatus('Subtitles: ' + selectedTrack.label + ' (' + state.externalSubtitleCues.length + ' cues)');
        }).catch(function() {
            state.externalSubtitleCues = [];
            state.activeSubtitleTrack = 'subtitle-off';
            updateSubtitleOverlay(0);
            renderTrackSelectors();
            setPlayerStatus('Subtitle load failed');
        });
        return;
    }

    if (state.playerMode === 'avplay' && hasAvplay()) {
        try {
            if (trackId === 'subtitle-off') {
                webapis.avplay.setSilentSubtitle(true);
                state.externalSubtitleCues = [];
                state.activeSubtitleTrack = 'subtitle-off';
                updateSubtitleOverlay(0);
                renderTrackSelectors();
                setPlayerStatus('Subtitles off');
                return;
            }

            webapis.avplay.setSilentSubtitle(false);
            try {
                webapis.avplay.setSelectTrack('TEXT', selectedTrack.index);
            } catch (textError) {
                webapis.avplay.setSelectTrack('SUBTITLE', selectedTrack.index);
            }
            state.externalSubtitleCues = [];
            state.activeSubtitleTrack = trackId;
            updateSubtitleOverlay(0);
            renderTrackSelectors();
            setPlayerStatus('Subtitles: ' + selectedTrack.label);
        } catch (error) {
            setPlayerStatus('Subtitle switch failed');
        }
        return;
    }

    if (textTracks && typeof textTracks.length === 'number') {
        for (index = 0; index < textTracks.length; index += 1) {
            textTracks[index].mode = 'disabled';
        }

        if (selectedTrack) {
            textTracks[selectedTrack.index].mode = 'showing';
        }
    }

    state.externalSubtitleCues = [];
    state.activeSubtitleTrack = trackId;
    updateSubtitleOverlay(0);
    renderTrackSelectors();
    setPlayerStatus(trackId === 'subtitle-off' ? 'Subtitles off' : 'Subtitles: ' + selectedTrack.label);
}

function isPlaybackPlaying() {
    var video = byId('videoPlayer');

    if (!state.currentStream || !state.currentStream.playable) {
        return false;
    }

    if (state.playerMode === 'avplay' && hasAvplay()) {
        return byId('playerToggleButton').getAttribute('data-state') === 'pause';
    }

    return !video.paused && !video.ended;
}

function pauseCurrentPlayback(silent) {
    var video = byId('videoPlayer');

    if (!state.currentStream || !state.currentStream.playable) {
        return;
    }

    if (state.playerMode === 'avplay' && hasAvplay()) {
        try {
            webapis.avplay.pause();
            setPlayerToggleUi(false);
            if (!silent) {
                setPlayerStatus('Paused (AVPlay)');
            }
        } catch (error) {
            if (!silent) {
                setPlayerStatus('Pause failed');
            }
        }
        return;
    }

    if (!video.paused) {
        video.pause();
    }
    setPlayerToggleUi(false);
    if (!silent) {
        setPlayerStatus('Paused');
    }
}

function resumeCurrentPlayback(silent) {
    var video = byId('videoPlayer');
    var playPromise;

    if (!state.currentStream || !state.currentStream.playable) {
        return;
    }

    if (state.playerMode === 'avplay' && hasAvplay()) {
        try {
            webapis.avplay.play();
            setPlayerToggleUi(true);
            if (!silent) {
                setPlayerStatus('Playing (AVPlay)');
            }
        } catch (error) {
            if (!silent) {
                setPlayerStatus('Resume failed');
            }
        }
        return;
    }

    if (!video.paused) {
        return;
    }

    playPromise = video.play();
    if (playPromise && typeof playPromise.then === 'function') {
        playPromise.then(function() {
            setPlayerToggleUi(true);
            if (!silent) {
                setPlayerStatus('Playing (HTML5)');
            }
        }).catch(function() {
            if (!silent) {
                setPlayerStatus('Resume failed');
            }
        });
        return;
    }

    setPlayerToggleUi(true);
    if (!silent) {
        setPlayerStatus('Playing (HTML5)');
    }
}

function setPlayerFullscreen(enabled) {
    var body = document.body;
    var nextFullscreen = !!enabled;
    var wasPlaying = isPlaybackPlaying();

    if (state.playerFullscreen === nextFullscreen) {
        return;
    }

    state.playerFullscreen = nextFullscreen;
    body.classList.toggle('is-player-fullscreen', state.playerFullscreen);
    setPlayerFullscreenUi();
    if (state.playerFullscreen) {
        state.focusRegion = 'main';
        state.mainRow = 0;
        state.mainCol = 0;
        showPlayerChrome(false);
        setTimeout(focusCurrent, 0);
    } else {
        body.classList.add('is-player-chrome-visible');
        pauseCurrentPlayback(false);
    }
    setTimeout(function() {
        syncAvplayRect();
        if (nextFullscreen && wasPlaying) {
            resumeCurrentPlayback(true);
        }
    }, 60);
}

function updatePageHeader() {
    var meta = VIEW_META[state.currentView];
    document.body.setAttribute('data-current-view', state.currentView);
    byId('pageEyebrow').textContent = meta.eyebrow;
    byId('pageTitle').textContent = meta.title;
    byId('pageSubtitle').textContent = meta.subtitle;
}

function updateNavState() {
    var activeView = state.currentView;

    if (NAV_VIEWS.indexOf(activeView) === -1) {
        if (state.currentView === 'addons' || state.currentView === 'player') {
            activeView = state.selectedType === 'series' ? 'series' : 'movies';
        } else {
            activeView = 'home';
        }
    }

    queryAll('.nav-item').forEach(function(item) {
        item.classList.toggle('is-active', item.getAttribute('data-view') === activeView);
    });
}

function updateViewState() {
    queryAll('[data-view-panel]').forEach(function(panel) {
        panel.classList.toggle('is-active', panel.getAttribute('data-view-panel') === state.currentView);
    });
    updateRowEmphasis();
}

function chunkItems(items, size) {
    var rows = [];
    var index;

    for (index = 0; index < items.length; index += size) {
        rows.push(items.slice(index, index + size));
    }

    return rows;
}

function getMainRowContainers() {
    if (state.currentView === 'home') {
        return [
            byId('homeHeroRow'),
            byId('homeContinueSection'),
            byId('homeMoviesSection'),
            byId('homeSeriesSection')
        ].filter(function(el) {
            return el && el.style.display !== 'none';
        });
    }

    if (state.currentView === 'movies') {
        var movieContainers = [byId('movieGenreSection')];
        queryAll('#movieGrid .card-row').forEach(function(row) {
            movieContainers.push(row);
        });
        movieContainers.push(byId('movieLoadSection'));
        return movieContainers.filter(Boolean);
    }

    if (state.currentView === 'series') {
        var seriesContainers = [byId('seriesGenreSection')];
        queryAll('#seriesGrid .card-row').forEach(function(row) {
            seriesContainers.push(row);
        });
        seriesContainers.push(byId('seriesLoadSection'));
        return seriesContainers.filter(Boolean);
    }

    if (state.currentView === 'search') {
        var searchContainers = [
            byId('searchFormSection'),
            byId('searchFormSection'),
            byId('searchFormSection')
        ];

        queryAll('#searchMovieGrid .card-row').forEach(function(row) {
            searchContainers.push(row);
        });
        queryAll('#searchSeriesGrid .card-row').forEach(function(row) {
            searchContainers.push(row);
        });

        return searchContainers.filter(function(el) {
            return el && el.style.display !== 'none';
        });
    }

    if (state.currentView === 'addons') {
        var addonContainers = [byId('detailHeroRow')];
        if (byId('seasonSection') && byId('seasonSection').style.display !== 'none') {
            addonContainers.push(byId('seasonSection'));
        }
        if (byId('episodeSection') && byId('episodeSection').style.display !== 'none') {
            addonContainers.push(byId('episodeSection'));
        }
        queryAll('#streamList .stream-card').forEach(function() {
            addonContainers.push(byId('streamSection'));
        });
        return addonContainers.filter(Boolean);
    }

    if (state.currentView === 'player') {
        var playerContainers = [];
        var stage = queryAll('.player-layout > section')[0];
        var side = queryAll('.player-layout > section')[1];
        var rows = getMainRows();

        rows.forEach(function(_, index) {
            if (state.playerFullscreen) {
                playerContainers.push(stage);
                return;
            }
            playerContainers.push(index <= 1 ? stage : side);
        });

        return playerContainers.filter(Boolean);
    }

    return [byId('loginForm'), byId('loginForm'), byId('loginForm')].filter(Boolean);
}

function getMainRows() {
    if (state.currentView === 'home') {
        var homeRows = [];
        var actions = queryAll('#homeActions .action-button');
        var continueCards = queryAll('#continueRail .card');
        var movieCards = queryAll('#homeMovieRail .card');
        var seriesCards = queryAll('#homeSeriesRail .card');

        if (actions.length) {
            homeRows.push(actions);
        }
        if (continueCards.length) {
            homeRows.push(continueCards);
        }
        if (movieCards.length) {
            homeRows.push(movieCards);
        }
        if (seriesCards.length) {
            homeRows.push(seriesCards);
        }
        return homeRows;
    }

    if (state.currentView === 'movies') {
        var movieRows = [];
        var movieGenres = queryAll('#movieGenreRow .genre-chip');
        var movieCardRows = queryAll('#movieGrid .card-row');

        if (movieGenres.length) {
            movieRows.push(movieGenres);
        }
        movieCardRows.forEach(function(row) {
            var cards = queryAll('#' + row.id + ' .card');
            if (cards.length) {
                movieRows.push(cards);
            }
        });
        if (!movieCardRows.length) {
            var movieCards = queryAll('#movieGrid .card');
            if (movieCards.length) {
                movieRows.push(movieCards);
            }
        }
        movieRows.push([byId('movieLoadMoreButton')]);
        return movieRows;
    }

    if (state.currentView === 'series') {
        var seriesRows = [];
        var seriesGenres = queryAll('#seriesGenreRow .genre-chip');
        var seriesCardRows = queryAll('#seriesGrid .card-row');

        if (seriesGenres.length) {
            seriesRows.push(seriesGenres);
        }
        seriesCardRows.forEach(function(row) {
            var cards = queryAll('#' + row.id + ' .card');
            if (cards.length) {
                seriesRows.push(cards);
            }
        });
        if (!seriesCardRows.length) {
            var seriesCards = queryAll('#seriesGrid .card');
            if (seriesCards.length) {
                seriesRows.push(seriesCards);
            }
        }
        seriesRows.push([byId('seriesLoadMoreButton')]);
        return seriesRows;
    }

    if (state.currentView === 'search') {
        var searchRows = [];
        var searchScopeButtons = queryAll('#searchScopeGroup .search-scope');
        var searchActionButtons = queryAll('.search-actions .action-button');
        var searchMovieRows = state.searchScope === 'series' ? [] : queryAll('#searchMovieGrid .card-row');
        var searchSeriesRows = state.searchScope === 'movies' ? [] : queryAll('#searchSeriesGrid .card-row');

        searchRows.push([byId('searchInput')]);
        if (searchScopeButtons.length) {
            searchRows.push(searchScopeButtons);
        }
        if (searchActionButtons.length) {
            searchRows.push(searchActionButtons);
        }
        searchMovieRows.forEach(function(row) {
            var cards = queryAll('#' + row.id + ' .card');
            if (cards.length) {
                searchRows.push(cards);
            }
        });
        searchSeriesRows.forEach(function(row) {
            var cards = queryAll('#' + row.id + ' .card');
            if (cards.length) {
                searchRows.push(cards);
            }
        });
        if (!searchMovieRows.length && state.searchScope !== 'series') {
            var searchMovieCards = queryAll('#searchMovieGrid .card');
            if (searchMovieCards.length) {
                searchRows = searchRows.concat(chunkItems(searchMovieCards, 4));
            }
        }
        if (!searchSeriesRows.length && state.searchScope !== 'movies') {
            var searchSeriesCards = queryAll('#searchSeriesGrid .card');
            if (searchSeriesCards.length) {
                searchRows = searchRows.concat(chunkItems(searchSeriesCards, 4));
            }
        }
        return searchRows;
    }

    if (state.currentView === 'addons') {
        var addonRows = [];
        var detailActions = queryAll('#detailActions .action-button');
        var seasons = queryAll('#seasonRail .season-chip');
        var episodes = queryAll('#episodeRail .episode-chip');
        var streams = queryAll('#streamList .stream-card');

        if (detailActions.length) {
            addonRows.push(detailActions);
        }
        if (seasons.length) {
            addonRows.push(seasons);
        }
        if (episodes.length) {
            addonRows.push(episodes);
        }

        streams.forEach(function(streamButton) {
            addonRows.push([streamButton]);
        });

        return addonRows;
    }

    if (state.currentView === 'player') {
        var playerRows = [];
        var progressButton = byId('playerProgressButton');
        var playerActions = queryAll('#playerActions .action-button');
        var audioButtons = queryAll('#audioTrackList .track-chip');
        var subtitleButtons = queryAll('#subtitleTrackList .track-chip');

        if (state.playerFullscreen) {
            if (document.body.classList.contains('is-player-chrome-visible') && playerActions.length) {
                return [[byId('videoFrameFocus')], [progressButton], playerActions];
            }
            return [[byId('videoFrameFocus')]];
        }

        if (progressButton) {
            playerRows.push([progressButton]);
        }
        if (playerActions.length) {
            playerRows.push(playerActions);
        }
        if (audioButtons.length) {
            playerRows.push(audioButtons);
        }
        if (subtitleButtons.length) {
            playerRows.push(subtitleButtons);
        }

        return playerRows.length ? playerRows : [[byId('videoFrameFocus')]];
    }

    return [
        [byId('emailInput')],
        [byId('passwordInput')],
        [byId('loginButton'), byId('logoutButton')]
    ];
}

function clampMainFocus(rows) {
    if (!rows.length) {
        state.mainRow = 0;
        state.mainCol = 0;
        return;
    }

    if (state.mainRow < 0) {
        state.mainRow = 0;
    }
    if (state.mainRow >= rows.length) {
        state.mainRow = rows.length - 1;
    }
    if (state.mainCol < 0) {
        state.mainCol = 0;
    }
    if (state.mainCol >= rows[state.mainRow].length) {
        state.mainCol = rows[state.mainRow].length - 1;
    }
}

function scrollElementIntoView(el) {
    var parent = el ? el.parentNode : null;

    if (parent && parent.classList && (
        parent.classList.contains('rail') ||
        parent.classList.contains('nav-list') ||
        parent.classList.contains('season-rail') ||
        parent.classList.contains('episode-rail') ||
        parent.classList.contains('genre-chip-row') ||
        parent.id === 'playerActions' ||
        parent.id === 'searchScopeGroup'
    )) {
        var left = el.offsetLeft - 18;
        var right = el.offsetLeft + el.offsetWidth + 18;
        if (left < parent.scrollLeft) {
            parent.scrollLeft = left;
        } else if (right > parent.scrollLeft + parent.clientWidth) {
            parent.scrollLeft = right - parent.clientWidth;
        }
    }

    if (el && typeof el.scrollIntoView === 'function' && (!parent || !parent.classList || (
        !parent.classList.contains('rail') &&
        !parent.classList.contains('season-rail') &&
        !parent.classList.contains('episode-rail') &&
        !parent.classList.contains('genre-chip-row') &&
        parent.id !== 'playerActions' &&
        parent.id !== 'searchScopeGroup'
    ))) {
        el.scrollIntoView({
            block: 'nearest',
            inline: 'nearest'
        });
    }
}

function scrollActiveViewToTop() {
    var activeView = queryAll('.view.is-active')[0];
    if (activeView) {
        activeView.scrollTop = 0;
    }
}

function scrollRowContainerIntoView(container) {
    var activeView = queryAll('.view.is-active')[0];
    var containerRect;
    var viewRect;
    var topDelta;
    var bottomDelta;
    var margin = 20;

    if (!activeView || !container) {
        return;
    }

    if (state.mainRow === 0) {
        activeView.scrollTop = 0;
        return;
    }

    containerRect = container.getBoundingClientRect();
    viewRect = activeView.getBoundingClientRect();
    topDelta = containerRect.top - (viewRect.top + margin);
    bottomDelta = containerRect.bottom - (viewRect.bottom - margin);

    if (topDelta < 0) {
        activeView.scrollTop += topDelta;
    } else if (bottomDelta > 0) {
        activeView.scrollTop += bottomDelta;
    }
}

function updateRowEmphasis() {
    var rows = getMainRowContainers();
    var uniqueRows = [];

    rows.forEach(function(row) {
        if (row && uniqueRows.indexOf(row) === -1) {
            uniqueRows.push(row);
        }
    });

    uniqueRows.forEach(function(row) {
        row.classList.remove('is-row-current', 'is-row-near', 'is-row-far');
        if (state.focusRegion !== 'main') {
            return;
        }

        var closestDistance = Infinity;
        rows.forEach(function(mapped, index) {
            if (mapped === row) {
                closestDistance = Math.min(closestDistance, Math.abs(index - state.mainRow));
            }
        });

        if (closestDistance === 0) {
            row.classList.add('is-row-current');
        } else if (closestDistance === 1) {
            row.classList.add('is-row-near');
        } else {
            row.classList.add('is-row-far');
        }
    });
}

function focusCurrent() {
    if (state.focusRegion === 'nav') {
        var navItems = queryAll('.nav-item');
        if (!navItems.length) {
            return;
        }

        if (state.navIndex < 0) {
            state.navIndex = 0;
        }
        if (state.navIndex >= navItems.length) {
            state.navIndex = navItems.length - 1;
        }

        scrollActiveViewToTop();
        navItems[state.navIndex].focus();
        updateRowEmphasis();
        return;
    }

    var rows = getMainRows();
    clampMainFocus(rows);

    if (!rows.length || !rows[state.mainRow] || !rows[state.mainRow][state.mainCol]) {
        state.focusRegion = 'nav';
        focusCurrent();
        return;
    }

    var rowContainers = getMainRowContainers();
    if (rowContainers[state.mainRow]) {
        scrollRowContainerIntoView(rowContainers[state.mainRow]);
    }

    rows[state.mainRow][state.mainCol].focus();
    scrollElementIntoView(rows[state.mainRow][state.mainCol]);
    updateRowEmphasis();
    if (state.currentView === 'player' && state.playerFullscreen) {
        showPlayerChrome(state.mainRow > 0);
    }
}

function setView(viewName, options) {
    var navIndex = NAV_VIEWS.indexOf(viewName);
    var previousView = state.currentView;
    var shouldTrackHistory = !options || options.pushHistory !== false;

    if (previousView === 'player' && viewName !== 'player') {
        setPlayerFullscreen(false);
        stopCurrentPlayback();
    }

    if (previousView !== viewName && shouldTrackHistory) {
        state.viewHistory.push(previousView);
        if (state.viewHistory.length > 24) {
            state.viewHistory.shift();
        }
    }

    state.currentView = viewName;
    if (navIndex !== -1) {
        state.navIndex = navIndex;
    }

    if (!options || options.resetMain !== false) {
        state.mainRow = 0;
        state.mainCol = 0;
    }

    if (options && options.focusRegion) {
        state.focusRegion = options.focusRegion;
    }

    updateNavState();
    updateViewState();
    updatePageHeader();

    if (viewName === 'player') {
        setTimeout(syncAvplayRect, 50);
    }
}

function goBackOnce() {
    var previousView;

    if (state.playerFullscreen) {
        setPlayerFullscreen(false);
        return;
    }

    if (state.currentView !== 'home') {
        previousView = state.viewHistory.length ? state.viewHistory.pop() : 'home';
        setView(previousView || 'home', {
            focusRegion: 'main',
            resetMain: true,
            pushHistory: false
        });
        setTimeout(focusCurrent, 0);
        return;
    }

    if (state.focusRegion === 'main') {
        state.focusRegion = 'nav';
        focusCurrent();
    }
}

function formatMetaLine(item, kind) {
    return [
        kind,
        item.releaseInfo || item.year || '',
        item.imdbRating ? 'IMDb ' + item.imdbRating : ''
    ].filter(Boolean).join(' • ');
}

function getVideoSeason(video) {
    var season = video && (video.season || video.seasonNumber);
    if (typeof season === 'number' && !isNaN(season)) {
        return season;
    }
    if (typeof season === 'string' && season) {
        season = parseInt(season, 10);
        if (!isNaN(season)) {
            return season;
        }
    }
    return 1;
}

function getVideoEpisode(video) {
    var episode = video && (video.episode || video.number);
    if (typeof episode === 'number' && !isNaN(episode)) {
        return episode;
    }
    if (typeof episode === 'string' && episode) {
        episode = parseInt(episode, 10);
        if (!isNaN(episode)) {
            return episode;
        }
    }
    return 0;
}

function formatSeasonLabel(season) {
    return 'Season ' + season;
}

function updateSelectedEpisodesForSeason() {
    if (state.selectedType !== 'series') {
        state.selectedEpisodes = [];
        return;
    }

    state.selectedEpisodes = state.allSeriesVideos.filter(function(video) {
        return getVideoSeason(video) === state.selectedSeason;
    }).sort(function(left, right) {
        return getVideoEpisode(left) - getVideoEpisode(right);
    });

    if (!state.selectedEpisodes.length) {
        state.selectedVideo = null;
        return;
    }

    if (!state.selectedVideo || getVideoSeason(state.selectedVideo) !== state.selectedSeason) {
        state.selectedVideo = state.selectedEpisodes[0];
        return;
    }

    if (!state.selectedEpisodes.some(function(video) {
        return video.id === state.selectedVideo.id;
    })) {
        state.selectedVideo = state.selectedEpisodes[0];
    }
}

function updateFeatured(item, kind) {
    var nextKey;
    var normalizedKind;
    var posterUrl;
    if (!item) {
        return;
    }

    nextKey = kind + ':' + (item.id || item.name || '');
    if (state.featuredKey === nextKey) {
        return;
    }
    state.featuredKey = nextKey;
    normalizedKind = kind && kind.toLowerCase().indexOf('series') !== -1 ? 'series' : 'movie';
    state.featuredItem = item;
    state.featuredKind = normalizedKind;

    var poster = byId('featuredPoster');
    var label = poster.querySelector('.featured-poster-label');
    posterUrl = item.background || item.poster || '';

    byId('featuredTag').textContent = kind;
    byId('featuredTitle').textContent = item.name || 'Untitled';
    byId('featuredMeta').textContent = formatMetaLine(item, kind);
    byId('featuredDescription').textContent =
        item.description ||
        item.releaseInfo ||
        'Live Cinemeta metadata is connected. This item is being used as the featured spotlight.';

    if (posterUrl) {
        poster.style.backgroundImage =
            'linear-gradient(180deg, rgba(8, 11, 18, 0.08), rgba(8, 11, 18, 0.6)), url("' + posterUrl + '")';
        label.textContent = kind;
    } else {
        poster.style.backgroundImage =
            'linear-gradient(180deg, rgba(8, 11, 18, 0.08), rgba(8, 11, 18, 0.6)), #101623';
        label.textContent = 'No artwork';
    }
}

function scheduleFeaturedUpdate(item, kind) {
    if (state.currentView !== 'home') {
        return;
    }
    if (state.featuredTimer) {
        clearTimeout(state.featuredTimer);
    }
    state.featuredTimer = setTimeout(function() {
        updateFeatured(item, kind);
    }, 70);
}

function normalizeCatalogPayload(payload) {
    if (!payload || !Array.isArray(payload.metas)) {
        return [];
    }
    return payload.metas.slice(0, 12);
}

function normalizeCatalogPayloadWithLimit(payload, limit) {
    if (!payload || !Array.isArray(payload.metas)) {
        return [];
    }
    return payload.metas.slice(0, typeof limit === 'number' ? limit : 12);
}

function requestJson(url, method, body) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open(method || 'GET', url, true);
        xhr.setRequestHeader('Accept', 'application/json');
        if (body) {
            xhr.setRequestHeader('Content-Type', 'application/json');
        }
        xhr.onreadystatechange = function() {
            if (xhr.readyState !== 4) {
                return;
            }
            if (xhr.status < 200 || xhr.status >= 300) {
                reject(new Error('HTTP ' + xhr.status));
                return;
            }
            try {
                var payload = JSON.parse(xhr.responseText);
                if (payload && payload.error) {
                    reject(new Error(payload.error.message || 'API error'));
                    return;
                }
                if (payload && typeof payload.result !== 'undefined') {
                    resolve(payload.result);
                    return;
                }
                resolve(payload);
            } catch (error) {
                reject(new Error('Invalid JSON response'));
            }
        };
        xhr.onerror = function() {
            reject(new Error('Network request failed'));
        };
        xhr.send(body ? JSON.stringify(body) : null);
    });
}

function fetchCatalogManifest() {
    return requestJson(CINEMETA_BASE + '/manifest.json', 'GET').then(function(manifest) {
        var movieCatalog;
        var seriesCatalog;
        var movieGenres;
        var seriesGenres;

        if (!manifest || !manifest.catalogs) {
            return;
        }

        movieCatalog = manifest.catalogs.filter(function(catalog) {
            return catalog.type === 'movie' && catalog.id === 'top';
        })[0];
        seriesCatalog = manifest.catalogs.filter(function(catalog) {
            return catalog.type === 'series' && catalog.id === 'top';
        })[0];

        movieGenres = ['Top'].concat(movieCatalog && movieCatalog.genres ? movieCatalog.genres.slice(0, 12) : FALLBACK_MOVIE_GENRES.slice(1));
        seriesGenres = ['Top'].concat(seriesCatalog && seriesCatalog.genres ? seriesCatalog.genres.slice(0, 12) : FALLBACK_SERIES_GENRES.slice(1));

        state.movieGenres = uniqueList(movieGenres);
        state.seriesGenres = uniqueList(seriesGenres);
        renderBrowseGenreRows();
    }).catch(function() {
        state.movieGenres = FALLBACK_MOVIE_GENRES.slice();
        state.seriesGenres = FALLBACK_SERIES_GENRES.slice();
        renderBrowseGenreRows();
    });
}

function catalogUrl(type, genre, skip) {
    var extras = [];

    if (genre && genre !== 'Top') {
        extras.push('genre=' + encodeURIComponent(genre));
    }
    if (skip && skip > 0) {
        extras.push('skip=' + skip);
    }

    return CINEMETA_BASE + '/catalog/' + type + '/top' + (extras.length ? '/' + extras.join('&') : '') + '.json';
}

function renderBrowseGenreRows() {
    function renderRow(containerId, genres, active, onSelect) {
        var container = byId(containerId);
        container.innerHTML = '';

        genres.forEach(function(genre) {
            var button = document.createElement('button');
            button.className = 'genre-chip';
            button.type = 'button';
            button.setAttribute('tabindex', '-1');
            if (genre === active) {
                button.classList.add('is-selected');
            }
            button.textContent = genre;
            button.addEventListener('click', function() {
                onSelect(genre);
            });
            container.appendChild(button);
        });
    }

    renderRow('movieGenreRow', state.movieGenres, state.selectedMovieGenre, function(genre) {
        state.selectedMovieGenre = genre;
        state.movieSkip = 0;
        fetchBrowseCatalog('movie', false);
    });

    renderRow('seriesGenreRow', state.seriesGenres, state.selectedSeriesGenre, function(genre) {
        state.selectedSeriesGenre = genre;
        state.seriesSkip = 0;
        fetchBrowseCatalog('series', false);
    });
}

function renderBrowseViews() {
    renderCardRows('movieGrid', state.movieBrowseItems, 'movie', 4);
    renderCardRows('seriesGrid', state.seriesBrowseItems, 'series', 4);

    byId('movieCount').textContent = state.movieBrowseItems.length + ' loaded • ' + state.selectedMovieGenre;
    byId('seriesCount').textContent = state.seriesBrowseItems.length + ' loaded • ' + state.selectedSeriesGenre;
    renderBrowseGenreRows();
}

function fetchBrowseCatalog(type, append) {
    var genre = type === 'movie' ? state.selectedMovieGenre : state.selectedSeriesGenre;
    var skip = type === 'movie' ? state.movieSkip : state.seriesSkip;

    updateConnectionStatus('Loading ' + type + ' browse...', false, false);

    return requestJson(catalogUrl(type, genre, skip), 'GET').then(function(payload) {
        var items = normalizeCatalogPayloadWithLimit(payload, 24);
        if (type === 'movie') {
            state.movieBrowseItems = append ? state.movieBrowseItems.concat(items) : items;
        } else {
            state.seriesBrowseItems = append ? state.seriesBrowseItems.concat(items) : items;
        }
        renderBrowseViews();
        updateConnectionStatus('Cinemeta connected', true, false);
        if ((type === 'movie' && state.currentView === 'movies') || (type === 'series' && state.currentView === 'series')) {
            setTimeout(focusCurrent, 0);
        }
    }).catch(function(error) {
        updateConnectionStatus('Catalog error: ' + error.message, false, true);
    });
}

function fetchCatalogs() {
    updateConnectionStatus('Loading catalogs...', false, false);

    return Promise.all([
        requestJson(CINEMETA_BASE + '/catalog/movie/top.json', 'GET'),
        requestJson(CINEMETA_BASE + '/catalog/series/top.json', 'GET')
    ]).then(function(results) {
        state.movies = normalizeCatalogPayload(results[0]);
        state.series = normalizeCatalogPayload(results[1]);
        renderCatalogViews();
        return Promise.all([
            fetchCatalogManifest(),
            fetchBrowseCatalog('movie', false),
            fetchBrowseCatalog('series', false)
        ]).then(function() {
            updateConnectionStatus('Cinemeta connected', true, false);
            focusCurrent();
        });
    }).catch(function(error) {
        updateConnectionStatus('Catalog error: ' + error.message, false, true);
        setLoginMessage('Catalog fetch failed: ' + error.message, 'error');
    });
}

function storeSession(authKey, user) {
    state.authKey = authKey || null;
    state.user = user || null;

    if (state.authKey) {
        localStorage.setItem(STORAGE_AUTH, state.authKey);
    } else {
        localStorage.removeItem(STORAGE_AUTH);
    }

    if (state.user) {
        localStorage.setItem(STORAGE_USER, JSON.stringify(state.user));
    } else {
        localStorage.removeItem(STORAGE_USER);
    }

    updateUserPanel();
}

function restoreStoredSession() {
    var authKey = localStorage.getItem(STORAGE_AUTH);
    var user = null;

    try {
        user = JSON.parse(localStorage.getItem(STORAGE_USER) || 'null');
    } catch (error) {
        user = null;
    }

    if (authKey) {
        state.authKey = authKey;
        state.user = user;
        updateSessionStatus('Stored session found', true, false);
    } else {
        updateSessionStatus('Signed out', false, false);
    }
}

function verifyStoredSession() {
    if (!state.authKey) {
        return Promise.resolve();
    }

    return requestJson(API_BASE + '/api/getUser', 'POST', {
        authKey: state.authKey
    }).then(function(payload) {
        state.user = payload && payload.user ? payload.user : payload;
        localStorage.setItem(STORAGE_USER, JSON.stringify(state.user));
        updateUserPanel();
        updateSessionStatus('Signed in', true, false);
        setLoginMessage('Restored existing Stremio session.', 'success');
    }).catch(function() {
        storeSession(null, null);
        updateSessionStatus('Stored session expired', false, true);
        setLoginMessage('Stored session was invalid. Sign in again.', 'error');
    });
}

function login(email, password) {
    setLoginMessage('Signing in...', null);

    return requestJson(API_BASE + '/api/login', 'POST', {
        email: email,
        password: password
    }).then(function(payload) {
        if (!payload || !payload.authKey) {
            throw new Error('No auth key returned');
        }

        storeSession(payload.authKey, payload.user || null);
        updateSessionStatus('Signed in', true, false);
        setLoginMessage('Signed in successfully.', 'success');

        return fetchInstalledAddons().then(function() {
            setView('home', {
                focusRegion: 'main',
                resetMain: true
            });
        });
    });
}

function logout() {
    storeSession(null, null);
    state.addons = [];
    state.streams = [];
    state.currentStream = null;
    renderAddons();
    renderPlayerState();
    updateSessionStatus('Signed out', false, false);
    setLoginMessage('Signed out locally.', null);
    setAddonsMessage('Sign in and choose a title to load addon streams.', null);
}

function fetchInstalledAddons() {
    if (!state.authKey) {
        state.addons = [];
        renderAddons();
        return Promise.resolve();
    }

    return requestJson(API_BASE + '/api/addonCollectionGet', 'POST', {
        authKey: state.authKey,
        update: true
    }).then(function(payload) {
        state.addons = payload && Array.isArray(payload.addons) ? payload.addons : [];
        renderAddons();
        return state.addons;
    }).catch(function(error) {
        state.addons = [];
        renderAddons();
        setAddonsMessage('Could not load installed addons: ' + error.message, 'error');
    });
}

function getStreamCapableAddons(type, id) {
    return state.addons.filter(function(addon) {
        var resources = addon && addon.manifest && addon.manifest.resources;
        if (!resources || !resources.length) {
            return false;
        }

        return resources.some(function(resource) {
            var resourceName = typeof resource === 'string' ? resource : resource.name;
            var resourceTypes = typeof resource === 'string' ? null : resource.types;
            var idPrefixes = typeof resource === 'string' ? null : resource.idPrefixes;

            if (resourceName !== 'stream') {
                return false;
            }
            if (resourceTypes && resourceTypes.length && resourceTypes.indexOf(type) === -1) {
                return false;
            }
            if (idPrefixes && idPrefixes.length && id) {
                return idPrefixes.some(function(prefix) {
                    return id.indexOf(prefix) === 0;
                });
            }

            return true;
        });
    });
}

function addonBaseUrl(transportUrl) {
    if (!transportUrl || transportUrl.indexOf('http') !== 0) {
        return null;
    }
    if (transportUrl.indexOf('/manifest.json') !== -1) {
        return transportUrl.split('/manifest.json')[0];
    }
    return null;
}

function fetchStreamsFromAddon(addon, type, videoId) {
    var baseUrl = addonBaseUrl(addon.transportUrl);
    var addonName = addon.manifest && addon.manifest.name ? addon.manifest.name : 'Addon';

    if (!baseUrl) {
        return Promise.resolve([{
            addonName: addonName,
            playable: false,
            status: 'Unsupported transport',
            title: 'Addon transport is not web-loadable',
            description: addon.transportUrl || '',
            raw: null
        }]);
    }

    return requestJson(baseUrl + '/stream/' + encodeURIComponent(type) + '/' + encodeURIComponent(videoId) + '.json', 'GET')
        .then(function(payload) {
            var streams = payload && Array.isArray(payload.streams) ? payload.streams : [];

            if (!streams.length) {
                return [{
                    addonName: addonName,
                    playable: false,
                    status: 'No streams',
                    title: 'No streams returned',
                    description: 'This addon did not return any playable entries for the selection.',
                    raw: null
                }];
            }

            return streams.map(function(stream) {
                var title = stream.name || stream.title || stream.description || 'Unnamed stream';
                var description = stream.description || stream.title || '';
                var playable = !!stream.url;
                var status = playable ? 'Playable' : 'Needs proxy';

                if (stream.behaviorHints && stream.behaviorHints.notWebReady) {
                    playable = false;
                    status = 'Not web ready';
                }

                return {
                    addonName: addonName,
                    addonBaseUrl: baseUrl,
                    playable: playable,
                    status: status,
                    title: title,
                    description: description,
                    raw: stream
                };
            });
        }).catch(function(error) {
            return [{
                addonName: addonName,
                playable: false,
                status: 'Error',
                title: 'Addon request failed',
                description: error.message,
                raw: null
            }];
        });
}

function renderEpisodeRail() {
    var rail = byId('episodeRail');
    var section = byId('episodeSection');

    rail.innerHTML = '';

    if (!state.selectedEpisodes.length) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';

    state.selectedEpisodes.forEach(function(video) {
        var button = document.createElement('button');
        var label = video.title || ('Episode ' + (video.episode || '?'));
        button.className = 'episode-chip';
        button.type = 'button';
        button.setAttribute('tabindex', '-1');
        if (state.selectedVideo && state.selectedVideo.id === video.id) {
            button.classList.add('is-selected');
        }
        button.textContent = label;
        button.addEventListener('click', function() {
            state.selectedVideo = video;
            renderEpisodeRail();
            loadStreamsForSelection();
        });
        rail.appendChild(button);
    });
}

function renderSeasonRail() {
    var rail = byId('seasonRail');
    var section = byId('seasonSection');

    rail.innerHTML = '';

    if (state.selectedType !== 'series' || state.availableSeasons.length < 2) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';

    state.availableSeasons.forEach(function(season) {
        var button = document.createElement('button');
        button.className = 'season-chip';
        button.type = 'button';
        button.setAttribute('tabindex', '-1');
        if (state.selectedSeason === season) {
            button.classList.add('is-selected');
        }
        button.textContent = formatSeasonLabel(season);
        button.addEventListener('click', function() {
            if (state.selectedSeason === season) {
                return;
            }
            state.selectedSeason = season;
            updateSelectedEpisodesForSeason();
            renderAddons();
            if (!state.selectedVideo) {
                setAddonsMessage('No episodes were returned for this season.', 'error');
                return;
            }
            loadStreamsForSelection();
        });
        rail.appendChild(button);
    });
}

function renderAddons() {
    var detailArtwork = byId('detailArtwork');
    var selectedTypeSummary = byId('selectedTypeSummary');
    var detailPlayButton = byId('detailPlayButton');
    var detailEpisodesButton = byId('detailEpisodesButton');

    byId('addonCount').textContent = String(state.addons.length);
    byId('streamCount').textContent = String(state.streams.length);

    if (!state.selectedItem) {
        byId('selectedTitle').textContent = 'Nothing selected';
        byId('selectedTypeLabel').textContent = 'Choose a title';
        byId('selectedDescription').textContent = 'Pick a movie or show from the catalog pages to inspect addon streams here.';
        byId('selectedVideoLabel').textContent = 'No episode selected';
        selectedTypeSummary.textContent = 'Choose a title';
        detailPlayButton.textContent = 'Play';
        detailEpisodesButton.textContent = 'Episodes';
        detailArtwork.style.backgroundImage = 'linear-gradient(180deg, rgba(9, 11, 17, 0.18), rgba(9, 11, 17, 0.42)), #0b0d14';
    } else {
        byId('selectedTitle').textContent = state.selectedItem.name || 'Untitled';
        byId('selectedTypeLabel').textContent = state.selectedType === 'series' ? 'Series' : 'Movie';
        byId('selectedDescription').textContent =
            state.selectedItem.description ||
            state.selectedItem.releaseInfo ||
            'Installed addons and streams for the current selection appear below.';
        byId('selectedVideoLabel').textContent = state.selectedVideo
            ? (state.selectedType === 'series'
                ? (formatSeasonLabel(getVideoSeason(state.selectedVideo)) + ' • Episode ' + (getVideoEpisode(state.selectedVideo) || '?'))
                : (state.selectedVideo.title || state.selectedVideo.name || state.selectedVideo.id))
            : (state.selectedType === 'series' ? 'Choose an episode' : 'Movie stream target');
        selectedTypeSummary.textContent = state.selectedType === 'series'
            ? (state.selectedItem.releaseInfo || 'Series')
            : (state.selectedItem.releaseInfo || 'Movie');
        detailPlayButton.textContent = state.selectedType === 'series' ? 'Play Episode' : 'Play Movie';
        detailEpisodesButton.textContent = state.selectedType === 'series' ? 'More Episodes' : 'Movie Details';
        detailArtwork.style.backgroundImage = state.selectedItem.background || state.selectedItem.poster
            ? 'linear-gradient(180deg, rgba(9, 11, 17, 0.18), rgba(9, 11, 17, 0.42)), url("' + (state.selectedItem.background || state.selectedItem.poster) + '")'
            : 'linear-gradient(180deg, rgba(9, 11, 17, 0.18), rgba(9, 11, 17, 0.42)), #0b0d14';
    }

    renderSeasonRail();
    renderEpisodeRail();

    var list = byId('streamList');
    list.innerHTML = '';

    if (!state.streams.length) {
        return;
    }

    state.streams.forEach(function(streamEntry) {
        var button = document.createElement('button');
        var main = document.createElement('div');
        var body = document.createElement('div');
        var badge = document.createElement('div');
        var title = document.createElement('div');
        var addon = document.createElement('div');
        var note = document.createElement('div');

        button.className = 'stream-card';
        button.type = 'button';
        button.setAttribute('tabindex', '-1');
        button.addEventListener('click', function() {
            openStream(streamEntry);
        });

        main.className = 'stream-card-main';
        body.className = 'stream-card-body';
        badge.className = 'stream-badge';
        title.className = 'stream-card-title';
        addon.className = 'stream-card-addon';
        note.className = 'stream-card-note';

        title.textContent = streamEntry.title;
        addon.textContent = streamEntry.addonName;
        note.textContent = streamEntry.description || 'No extra stream description.';
        badge.textContent = streamEntry.status;

        if (!streamEntry.playable) {
            badge.classList.add('is-error');
        }

        body.appendChild(title);
        body.appendChild(addon);
        body.appendChild(note);
        main.appendChild(body);
        main.appendChild(badge);
        button.appendChild(main);
        list.appendChild(button);
    });
}

function renderPlayerState() {
    var video = byId('videoPlayer');
    var empty = byId('videoEmpty');
    var stream = state.currentStream;
    setPlayerToggleUi(false);

    if (!stream) {
        byId('playerTitle').textContent = 'No stream selected';
        byId('playerAddon').textContent = '-';
        byId('playerSource').textContent = '-';
        setPlayerStatus('Idle');
        empty.classList.remove('is-hidden');
        empty.textContent = 'Pick an addon stream to open the player.';
        byId('playerDescription').textContent =
            'This player page is for direct stream URLs. Some addon entries may still require a proxy or native playback layer.';
        clearPlaybackSurface();
        renderTrackSelectors();
        return;
    }

    byId('playerTitle').textContent = stream.title;
    byId('playerAddon').textContent = stream.addonName;
    byId('playerSource').textContent = stream.raw && stream.raw.url ? stream.raw.url : stream.status;
    byId('playerDescription').textContent =
        stream.description || 'This stream came from the selected addon source.';
    syncExternalSubtitleTracks();

    if (!stream.playable || !stream.raw || !stream.raw.url) {
        empty.classList.remove('is-hidden');
        empty.textContent = 'This stream is not directly playable in the web shell. It likely needs a proxy or native playback pipeline.';
        clearPlaybackSurface();
        setPlayerStatus(stream.status);
        renderTrackSelectors();
        return;
    }

    empty.classList.add('is-hidden');
    video.classList.remove('is-hidden');
    renderTrackSelectors();
}

function startHtml5Stream(url) {
    var video = byId('videoPlayer');
    var playPromise;

    stopAvplayPlayback();
    byId('avplaySurface').classList.remove('is-active');
    video.classList.remove('is-hidden');
    state.playerMode = 'html5';

    if (video.getAttribute('src') !== url) {
        video.src = url;
        video.load();
    }

    setPlayerStatus('Loading (HTML5)');
    resetPlaybackMetrics();
    playPromise = video.play();
    if (playPromise && typeof playPromise.then === 'function') {
        playPromise.then(function() {
            setPlayerStatus('Playing (HTML5)');
            setPlayerToggleUi(true);
            readHtml5Metrics();
            startPlaybackTicker();
            scheduleTrackRefresh();
        }).catch(function(error) {
            setPlayerStatus('Play blocked: ' + error.message);
            setPlayerToggleUi(false);
        });
    } else {
        setPlayerToggleUi(true);
    }
}

function startAvplayStream(url) {
    var video = byId('videoPlayer');
    var surface = byId('avplaySurface');

    if (!hasAvplay()) {
        startHtml5Stream(url);
        return;
    }

    stopHtml5Playback();
    stopAvplayPlayback();
    surface.classList.add('is-active');
    video.classList.add('is-hidden');
    state.playerMode = 'avplay';

    try {
        webapis.avplay.open(url);
        webapis.avplay.setListener({
            onbufferingstart: function() {
                setPlayerStatus('Buffering (AVPlay)');
            },
            onbufferingprogress: function() {
                setPlayerStatus('Buffering (AVPlay)');
            },
            onbufferingcomplete: function() {
                setPlayerStatus('Ready (AVPlay)');
                readAvplayMetrics();
                refreshPlaybackTracks();
            },
            oncurrentplaytime: function(currentTime) {
                setPlaybackMetrics(currentTime, state.durationMs);
            },
            onstreamcompleted: function() {
                readAvplayMetrics();
                setPlayerToggleUi(false);
                setPlayerStatus('Finished');
            },
            onerror: function(error) {
                setPlayerToggleUi(false);
                setPlayerStatus('AVPlay error: ' + error);
                startHtml5Stream(url);
            }
        });

        syncAvplayRect();
        setPlayerStatus('Loading (AVPlay)');
        resetPlaybackMetrics();
        webapis.avplay.prepareAsync(function() {
            syncAvplayRect();
            try {
                webapis.avplay.play();
                setPlayerStatus('Playing (AVPlay)');
                setPlayerToggleUi(true);
                readAvplayMetrics();
                startPlaybackTicker();
                scheduleTrackRefresh();
            } catch (playError) {
                setPlayerToggleUi(false);
                setPlayerStatus('AVPlay play failed');
                startHtml5Stream(url);
            }
        }, function(error) {
            setPlayerToggleUi(false);
            setPlayerStatus('AVPlay prepare failed');
            startHtml5Stream(url);
        });
    } catch (error) {
        setPlayerToggleUi(false);
        setPlayerStatus('AVPlay unavailable, using HTML5');
        startHtml5Stream(url);
    }
}

function toggleCurrentPlayback() {
    var video = byId('videoPlayer');

    showPlayerChrome(false);

    if (!state.currentStream || !state.currentStream.playable || !state.currentStream.raw || !state.currentStream.raw.url) {
        setPlayerStatus('No playable stream selected');
        return;
    }

    if (state.playerMode === 'avplay' && hasAvplay()) {
        try {
            if (byId('playerToggleButton').getAttribute('data-state') !== 'pause') {
                webapis.avplay.play();
                setPlayerToggleUi(true);
                setPlayerStatus('Playing (AVPlay)');
            } else {
                webapis.avplay.pause();
                setPlayerToggleUi(false);
                setPlayerStatus('Paused (AVPlay)');
            }
        } catch (error) {
            setPlayerStatus('AVPlay toggle failed');
        }
        return;
    }

    if (video.paused) {
        video.play().then(function() {
            setPlayerToggleUi(true);
            setPlayerStatus('Playing (HTML5)');
        }).catch(function(error) {
            setPlayerStatus('Play blocked: ' + error.message);
        });
    } else {
        video.pause();
        setPlayerToggleUi(false);
        setPlayerStatus('Paused');
    }
}

function loadCurrentStream() {
    if (!state.currentStream || !state.currentStream.playable || !state.currentStream.raw || !state.currentStream.raw.url) {
        setPlayerStatus(state.currentStream ? state.currentStream.status : 'Idle');
        return;
    }

    resetTrackState();
    syncExternalSubtitleTracks();
    renderTrackSelectors();

    if (hasAvplay()) {
        startAvplayStream(state.currentStream.raw.url);
    } else {
        startHtml5Stream(state.currentStream.raw.url);
    }
}

function openStream(streamEntry) {
    state.currentStream = streamEntry;
    trackContinueWatching(state.selectedItem, state.selectedType, state.selectedVideo);
    renderContinueWatching();
    renderPlayerState();
    setView('player', {
        focusRegion: 'main',
        resetMain: true
    });
    showPlayerChrome(true);

    if (streamEntry.playable && streamEntry.raw && streamEntry.raw.url) {
        loadCurrentStream();
    } else {
        setPlayerStatus(streamEntry.status);
    }
}

function renderCatalogViews() {
    renderContinueWatching();
    renderCards('homeMovieRail', state.movies.slice(0, 8), 'movie');
    renderCards('homeSeriesRail', state.series.slice(0, 8), 'series');

    byId('homeMovieCount').textContent = state.movies.length + ' ready';
    byId('homeSeriesCount').textContent = state.series.length + ' ready';

    if (state.continueWatching.length) {
        updateFeatured(state.continueWatching[0].item, state.continueWatching[0].kind === 'series' ? 'Series Spotlight' : 'Movie Spotlight');
    } else if (state.movies.length) {
        updateFeatured(state.movies[0], 'Movie Spotlight');
    } else if (state.series.length) {
        updateFeatured(state.series[0], 'Series Spotlight');
    }
}

function updateSearchScopeUi() {
    byId('searchScopeAll').classList.toggle('is-selected', state.searchScope === 'all');
    byId('searchScopeMovies').classList.toggle('is-selected', state.searchScope === 'movies');
    byId('searchScopeSeries').classList.toggle('is-selected', state.searchScope === 'series');
}

function renderSearchResults() {
    var movieSection = byId('searchMovieSection');
    var seriesSection = byId('searchSeriesSection');
    var total = state.searchMovies.length + state.searchSeries.length;

    renderCardRows('searchMovieGrid', state.searchMovies, 'movie', 4);
    renderCardRows('searchSeriesGrid', state.searchSeries, 'series', 4);

    byId('searchMovieCount').textContent = state.searchMovies.length + ' result' + (state.searchMovies.length === 1 ? '' : 's');
    byId('searchSeriesCount').textContent = state.searchSeries.length + ' result' + (state.searchSeries.length === 1 ? '' : 's');
    byId('searchResultCount').textContent = total ? total + ' result' + (total === 1 ? '' : 's') : 'No results yet';

    movieSection.style.display = state.searchScope === 'series' ? 'none' : 'block';
    seriesSection.style.display = state.searchScope === 'movies' ? 'none' : 'block';
}

function searchCatalogs() {
    var query = byId('searchInput').value.replace(/^\s+|\s+$/g, '');
    var requests = [];

    state.searchQuery = query;

    if (query.length < 2) {
        state.searchMovies = [];
        state.searchSeries = [];
        renderSearchResults();
        setSearchMessage('Enter at least 2 characters to search live catalogs.', 'error');
        return Promise.resolve();
    }

    setSearchMessage('Searching for "' + query + '"...', null);

    if (state.searchScope === 'all' || state.searchScope === 'movies') {
        requests.push(
            requestJson(CINEMETA_BASE + '/catalog/movie/top/search=' + encodeURIComponent(query) + '.json', 'GET')
                .then(function(payload) {
                    state.searchMovies = normalizeCatalogPayloadWithLimit(payload, 20);
                }).catch(function() {
                    state.searchMovies = [];
                })
        );
    } else {
        state.searchMovies = [];
    }

    if (state.searchScope === 'all' || state.searchScope === 'series') {
        requests.push(
            requestJson(CINEMETA_BASE + '/catalog/series/top/search=' + encodeURIComponent(query) + '.json', 'GET')
                .then(function(payload) {
                    state.searchSeries = normalizeCatalogPayloadWithLimit(payload, 20);
                }).catch(function() {
                    state.searchSeries = [];
                })
        );
    } else {
        state.searchSeries = [];
    }

    return Promise.all(requests).then(function() {
        var total = state.searchMovies.length + state.searchSeries.length;
        renderSearchResults();
        if (total) {
            setSearchMessage('Loaded ' + total + ' matching title' + (total === 1 ? '' : 's') + '.', 'success');
            if (state.currentView === 'search') {
                setTimeout(focusCurrent, 0);
            }
        } else {
            setSearchMessage('No matching titles were found.', 'error');
        }
    });
}

function createCard(item, kind) {
    var card = document.createElement('button');
    var poster = document.createElement('div');
    var title = document.createElement('div');
    var meta = document.createElement('div');

    card.className = 'card';
    card.type = 'button';
    card.setAttribute('tabindex', '-1');

    poster.className = 'poster';
    if (item.poster) {
        var img = document.createElement('img');
        img.src = item.poster;
        img.alt = item.name || 'Poster';
        poster.appendChild(img);
    } else {
        poster.classList.add('is-empty');
        poster.textContent = 'No poster';
    }

    title.className = 'card-title';
    title.textContent = item.name || 'Untitled';

    meta.className = 'card-meta';
    meta.textContent = formatMetaLine(item, kind === 'movie' ? 'Movie' : 'Series');

    card.appendChild(poster);
    card.appendChild(title);
    card.appendChild(meta);

    card.addEventListener('focus', function() {
        scheduleFeaturedUpdate(item, kind === 'movie' ? 'Movie Spotlight' : 'Series Spotlight');
    });

    card.addEventListener('click', function() {
        prepareSelection(item, kind);
    });

    return card;
}

function renderCards(containerId, items, kind) {
    var container = byId(containerId);
    container.innerHTML = '';
    items.forEach(function(item) {
        container.appendChild(createCard(item, kind));
    });
}

function renderCardRows(containerId, items, kind, rowSize) {
    var container = byId(containerId);
    var rows = chunkItems(items, rowSize || 4);

    container.innerHTML = '';
    rows.forEach(function(group, index) {
        var row = document.createElement('div');
        row.className = 'card-row content-row';
        row.id = containerId + 'Row' + index;

        group.forEach(function(item) {
            row.appendChild(createCard(item, kind));
        });

        container.appendChild(row);
    });
}

function renderContinueWatching() {
    var container = byId('continueRail');
    var count = byId('homeContinueCount');
    var section = byId('homeContinueSection');

    container.innerHTML = '';

    if (!state.continueWatching.length) {
        count.textContent = 'Nothing saved yet';
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    count.textContent = state.continueWatching.length + ' saved';
    state.continueWatching.forEach(function(entry) {
        var card = createCard(entry.item, entry.kind);
        var meta = card.querySelector('.card-meta');

        if (entry.kind === 'series' && entry.video) {
            meta.textContent = 'Resume • Season ' + entry.video.season + ' • Episode ' + entry.video.episode;
        } else {
            meta.textContent = 'Resume watching';
        }

        container.appendChild(card);
    });
}

function prepareSelection(item, type, options) {
    state.selectedItem = item;
    state.selectedType = type;
    state.allSeriesVideos = [];
    state.availableSeasons = [];
    state.selectedSeason = null;
    state.selectedEpisodes = [];
    state.selectedVideo = null;
    state.streams = [];
    state.autoplayPending = !!(options && options.autoplayFirst);
    renderAddons();

    if (!state.authKey) {
        setView('addons', {
            focusRegion: 'main',
            resetMain: true
        });
        setAddonsMessage('Sign in first to load installed addons and streams.', 'error');
        return;
    }

    setView('addons', {
        focusRegion: 'main',
        resetMain: true
    });
    setAddonsMessage('Loading selection details...', null);

    if (type === 'series') {
        requestJson(CINEMETA_BASE + '/meta/series/' + encodeURIComponent(item.id) + '.json', 'GET')
            .then(function(payload) {
                var meta = payload && payload.meta ? payload.meta : payload;
                var seasons;
                state.selectedItem = meta || item;
                state.allSeriesVideos = meta && Array.isArray(meta.videos) ? meta.videos.slice() : [];
                seasons = uniqueList(state.allSeriesVideos.map(getVideoSeason)).sort(function(left, right) {
                    return left - right;
                });
                state.availableSeasons = seasons;
                state.selectedSeason = seasons.length ? seasons[0] : null;
                updateSelectedEpisodesForSeason();
                renderAddons();
                if (!state.selectedVideo) {
                    setAddonsMessage('No episode metadata was returned for this series.', 'error');
                    return;
                }
                loadStreamsForSelection();
            }).catch(function(error) {
                renderAddons();
                setAddonsMessage('Series metadata failed: ' + error.message, 'error');
            });
        return;
    }

    state.selectedVideo = {
        id: item.id,
        title: item.name
    };
    renderAddons();
    loadStreamsForSelection();
}

function loadStreamsForSelection() {
    var type = state.selectedType;
    var videoId = state.selectedVideo && state.selectedVideo.id;
    var eligibleAddons;

    if (!state.authKey) {
        setAddonsMessage('Sign in first to load installed addons and streams.', 'error');
        return;
    }
    if (!state.selectedItem || !type || !videoId) {
        setAddonsMessage('Choose a title first.', 'error');
        return;
    }

    eligibleAddons = getStreamCapableAddons(type, videoId);
    if (!eligibleAddons.length) {
        state.streams = [];
        renderAddons();
        setAddonsMessage('No installed addons expose stream resources for this selection.', 'error');
        return;
    }

    state.streams = [];
    renderAddons();
    setAddonsMessage('Loading streams from ' + eligibleAddons.length + ' addon(s)...', null);

    Promise.all(eligibleAddons.map(function(addon) {
        return fetchStreamsFromAddon(addon, type, videoId);
    })).then(function(streamGroups) {
        state.streams = [];
        streamGroups.forEach(function(group) {
            state.streams = state.streams.concat(group);
        });

        renderAddons();

        if (state.streams.length) {
            setAddonsMessage('Loaded ' + state.streams.length + ' stream entries.', 'success');
            if (state.autoplayPending) {
                state.autoplayPending = false;
                var playable = state.streams.filter(function(entry) {
                    return entry.playable && entry.raw && entry.raw.url;
                })[0];
                if (playable) {
                    openStream(playable);
                    return;
                }
            }
            setTimeout(focusCurrent, 0);
        } else {
            setAddonsMessage('No stream entries were returned.', 'error');
        }
    });
}

function bindNav() {
    queryAll('.nav-item').forEach(function(item) {
        item.addEventListener('click', function() {
            setView(item.getAttribute('data-view'), {
                focusRegion: 'main',
                resetMain: true,
                pushHistory: false
            });
            setTimeout(focusCurrent, 0);
        });
    });
}

function bindHomeActions() {
    byId('homeLoginButton').addEventListener('click', function() {
        if (!state.featuredItem || !state.featuredKind) {
            return;
        }
        prepareSelection(state.featuredItem, state.featuredKind, {
            autoplayFirst: true
        });
    });

    byId('homeMoviesButton').addEventListener('click', function() {
        if (!state.featuredItem || !state.featuredKind) {
            return;
        }
        prepareSelection(state.featuredItem, state.featuredKind);
    });

    byId('homeSeriesButton').addEventListener('click', function() {
        setView('search', {
            focusRegion: 'main',
            resetMain: true
        });
        setTimeout(focusCurrent, 0);
    });
}

function bindDetailActions() {
    byId('detailPlayButton').addEventListener('click', function() {
        var playable = state.streams.filter(function(entry) {
            return entry.playable && entry.raw && entry.raw.url;
        })[0];

        if (playable) {
            openStream(playable);
            return;
        }

        if (state.selectedItem && state.selectedType && state.selectedVideo) {
            state.autoplayPending = true;
            loadStreamsForSelection();
            return;
        }

        setAddonsMessage('Choose a title first.', 'error');
    });

    byId('detailEpisodesButton').addEventListener('click', function() {
        if (state.selectedType === 'series') {
            state.focusRegion = 'main';
            state.mainRow = state.availableSeasons.length > 1 ? 1 : 2;
            state.mainCol = 0;
            focusCurrent();
            return;
        }
        state.focusRegion = 'main';
        state.mainRow = 0;
        state.mainCol = 0;
        focusCurrent();
    });

    byId('detailSourcesButton').addEventListener('click', function() {
        state.focusRegion = 'main';
        state.mainRow = state.selectedType === 'series'
            ? (state.availableSeasons.length > 1 ? 3 : 2)
            : 1;
        state.mainCol = 0;
        focusCurrent();
    });
}

function bindSearch() {
    function setScope(scope) {
        state.searchScope = scope;
        updateSearchScopeUi();
        renderSearchResults();
    }

    byId('searchScopeAll').addEventListener('click', function() {
        setScope('all');
    });

    byId('searchScopeMovies').addEventListener('click', function() {
        setScope('movies');
    });

    byId('searchScopeSeries').addEventListener('click', function() {
        setScope('series');
    });

    byId('searchSubmitButton').addEventListener('click', function() {
        searchCatalogs();
    });

    byId('searchClearButton').addEventListener('click', function() {
        byId('searchInput').value = '';
        state.searchQuery = '';
        state.searchMovies = [];
        state.searchSeries = [];
        renderSearchResults();
        setSearchMessage('Enter at least 2 characters to search live catalogs.', null);
        setTimeout(focusCurrent, 0);
    });

    byId('searchInput').addEventListener('keydown', function(event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            searchCatalogs();
        }
    });
}

function bindBrowse() {
    byId('movieLoadMoreButton').addEventListener('click', function() {
        state.movieSkip += 24;
        fetchBrowseCatalog('movie', true);
    });

    byId('seriesLoadMoreButton').addEventListener('click', function() {
        state.seriesSkip += 24;
        fetchBrowseCatalog('series', true);
    });
}

function bindLogin() {
    byId('loginForm').addEventListener('submit', function(event) {
        var email = byId('emailInput').value.trim();
        var password = byId('passwordInput').value;

        event.preventDefault();

        if (!email || !password) {
            setLoginMessage('Email and password are required.', 'error');
            return;
        }

        login(email, password).catch(function(error) {
            updateSessionStatus('Sign-in failed', false, true);
            setLoginMessage('Login failed: ' + error.message, 'error');
        });
    });

    byId('logoutButton').addEventListener('click', function() {
        logout();
    });
}

function bindPlayer() {
    var video = byId('videoPlayer');
    var frame = byId('videoFrameFocus');

    byId('playerSeekBackButton').addEventListener('click', function() {
        seekCurrentPlayback(-30000);
    });

    byId('playerToggleButton').addEventListener('click', function() {
        toggleCurrentPlayback();
    });

    byId('playerSeekForwardButton').addEventListener('click', function() {
        seekCurrentPlayback(30000);
    });

    byId('playerProgressButton').addEventListener('click', function() {
        showPlayerChrome(true);
        setPlayerStatus('Use left and right to seek');
    });

    byId('playerAudioButton').addEventListener('click', function() {
        cycleAudioTrack();
    });

    byId('playerSubtitleButton').addEventListener('click', function() {
        cycleSubtitleTrack();
    });

    byId('playerReloadButton').addEventListener('click', function() {
        if (!state.currentStream || !state.currentStream.playable || !state.currentStream.raw || !state.currentStream.raw.url) {
            setPlayerStatus('No playable stream selected');
            return;
        }
        loadCurrentStream();
    });

    byId('playerFullscreenButton').addEventListener('click', function() {
        setPlayerFullscreen(!state.playerFullscreen);
    });

    frame.addEventListener('click', function() {
        toggleCurrentPlayback();
    });

    video.addEventListener('loadedmetadata', refreshPlaybackTracks);
    video.addEventListener('loadedmetadata', readHtml5Metrics);
    video.addEventListener('loadeddata', refreshPlaybackTracks);
    video.addEventListener('timeupdate', readHtml5Metrics);
    video.addEventListener('durationchange', refreshPlaybackTracks);
    video.addEventListener('durationchange', readHtml5Metrics);
    video.addEventListener('playing', function() {
        setPlayerToggleUi(true);
        setPlayerStatus('Playing');
        startPlaybackTicker();
        refreshPlaybackTracks();
    });
    video.addEventListener('pause', function() {
        setPlayerToggleUi(false);
        if (video.currentTime > 0) {
            setPlayerStatus('Paused');
        }
    });
    video.addEventListener('waiting', function() {
        setPlayerStatus('Buffering');
    });
    video.addEventListener('ended', function() {
        stopPlaybackTicker();
        readHtml5Metrics();
        setPlayerToggleUi(false);
        setPlayerStatus('Finished');
    });
    video.addEventListener('error', function() {
        stopPlaybackTicker();
        setPlayerToggleUi(false);
        setPlayerStatus('Playback error');
    });

    window.addEventListener('resize', syncAvplayRect);
}

function handleLeft() {
    if (state.currentView === 'player' && state.playerFullscreen) {
        if (state.mainRow === 1) {
            seekCurrentPlayback(-30000);
            return;
        }
        if (state.mainRow === 0) {
            return;
        }
        if (state.mainCol > 0) {
            state.mainCol -= 1;
            focusCurrent();
        }
        return;
    }

    if (state.focusRegion === 'nav') {
        if (state.navIndex > 0) {
            state.navIndex -= 1;
            setView(NAV_VIEWS[state.navIndex], {
                focusRegion: 'nav',
                resetMain: true,
                pushHistory: false
            });
            focusCurrent();
        }
        return;
    }

    if (state.mainCol > 0) {
        state.mainCol -= 1;
        focusCurrent();
        return;
    }

    state.focusRegion = 'nav';
    focusCurrent();
}

function handleRight() {
    if (state.currentView === 'player' && state.playerFullscreen) {
        if (state.mainRow === 1) {
            seekCurrentPlayback(30000);
            return;
        }
        if (state.mainRow === 0) {
            return;
        }
        state.mainCol += 1;
        focusCurrent();
        return;
    }

    if (state.focusRegion === 'nav') {
        if (state.navIndex < NAV_VIEWS.length - 1) {
            state.navIndex += 1;
            setView(NAV_VIEWS[state.navIndex], {
                focusRegion: 'nav',
                resetMain: true,
                pushHistory: false
            });
            focusCurrent();
            return;
        }
        return;
    }

    state.mainCol += 1;
    focusCurrent();
}

function handleUp() {
    if (state.currentView === 'player' && state.playerFullscreen) {
        if (state.mainRow > 0) {
            state.mainRow -= 1;
            focusCurrent();
        }
        return;
    }

    if (state.focusRegion === 'nav') {
        return;
    }

    if (state.mainRow > 0) {
        state.mainRow -= 1;
        focusCurrent();
        return;
    }

    state.focusRegion = 'nav';
    focusCurrent();
}

function handleDown() {
    if (state.currentView === 'player' && state.playerFullscreen) {
        state.mainRow += 1;
        state.mainCol = 0;
        focusCurrent();
        return;
    }

    if (state.focusRegion === 'nav') {
        state.focusRegion = 'main';
        state.mainRow = 0;
        state.mainCol = 0;
        focusCurrent();
        return;
    }

    state.mainRow += 1;
    focusCurrent();
}

function handleEnter() {
    if (state.currentView === 'player' && state.playerFullscreen) {
        if (state.mainRow === 0) {
            toggleCurrentPlayback();
        } else if (document.activeElement) {
            document.activeElement.click();
        }
        return;
    }

    if (!document.activeElement) {
        return;
    }

    if (document.activeElement.tagName === 'INPUT') {
        document.activeElement.focus();
        document.activeElement.click();
        return;
    }

    document.activeElement.click();
}

function init() {
    document.addEventListener('keydown', function(event) {
        if (state.currentView === 'player' && state.playerFullscreen) {
            showPlayerChrome(false);
        }

        switch (event.keyCode) {
        case 37:
            event.preventDefault();
            handleLeft();
            return;
        case 38:
            event.preventDefault();
            handleUp();
            return;
        case 39:
            event.preventDefault();
            handleRight();
            return;
        case 40:
            event.preventDefault();
            handleDown();
            return;
        case 13:
            event.preventDefault();
            handleEnter();
            return;
        }

        if (event.keyCode === 10009) {
            event.preventDefault();
            goBackOnce();
        }
    });

    bindNav();
    bindHomeActions();
    bindDetailActions();
    bindSearch();
    bindBrowse();
    bindLogin();
    bindPlayer();

    restoreStoredSession();
    restoreContinueWatching();
    updateUserPanel();
    updateNavState();
    updateViewState();
    updatePageHeader();
    updateSearchScopeUi();
    renderSearchResults();
    renderContinueWatching();
    renderAddons();
    renderPlayerState();

    verifyStoredSession().then(function() {
        return Promise.all([
            fetchInstalledAddons(),
            fetchCatalogs()
        ]);
    }, function() {
        return fetchCatalogs();
    });

    setTimeout(function() {
        focusCurrent();
    }, 60);
}

window.onload = init;
