var CINEMETA_BASE = 'https://v3-cinemeta.strem.io';
var OPENSUBTITLES_BASE = 'https://opensubtitles-v3.strem.io';
var DEFAULT_ADDON_URLS = [CINEMETA_BASE, OPENSUBTITLES_BASE];
var SUPABASE_URL = 'https://dpyhjjcoabcglfmgecug.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRweWhqamNvYWJjZ2xmbWdlY3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3ODYyNDcsImV4cCI6MjA4NjM2MjI0N30.U-3QSNDdpsnvRk_7ZL419AFTOtggHJJcmkodxeXjbkg';
var TV_LOGIN_REDIRECT_BASE_URL = 'https://nuvioapp.space/tv-login';
var STORAGE_AUTH = 'nuvio.accessToken';
var STORAGE_REFRESH = 'nuvio.refreshToken';
var STORAGE_USER = 'nuvio.user';
var STORAGE_CONTINUE = 'nuviowebpc.continueWatching';
var LEGACY_STORAGE_CONTINUE = 'nuviotizen.continueWatching';
var STORAGE_WATCHED = 'nuviowebpc.watchedVideos';
var STORAGE_STREAMING_SERVER = 'nuviowebpc.streamingServerUrl';
var STORAGE_TRANSCODER_QUALITY = 'nuviowebpc.transcoderQuality';
var APP_DEVICE_NAME = 'Nuvio Web PC';
var FALLBACK_MOVIE_GENRES = ['Top', 'Action', 'Comedy', 'Drama', 'Sci-Fi', 'Thriller', 'Animation', 'Documentary'];
var FALLBACK_SERIES_GENRES = ['Top', 'Drama', 'Comedy', 'Crime', 'Sci-Fi', 'Animation', 'Thriller', 'Documentary'];
var NAV_VIEWS = ['search', 'home', 'series', 'movies', 'login'];
var FEATURED_ROTATION_MS = 9000;
var FEATURED_FADE_MS = 180;
var HOME_CATALOG_LIMIT = 120;
var HOME_CATALOG_PAGE_SIZE = 24;
var HOME_RAIL_VISIBLE_DEFAULT = 7;
var HOME_RAIL_HOVER_COOLDOWN_MS = 650;
var HOME_RAIL_AUTO_ROTATE_MS = 6500;
var PLAYER_SCRUB_INITIAL_NUDGE_MS = 5000;
var PLAYER_SCRUB_TICK_MS = 50;
var DEFAULT_STREAMING_SERVER_URL = 'https://local.strem.io:12470';
var NUVIO_STREAMING_SERVER_URL = 'http://127.0.0.1:17870';
var VIEW_META = {
    home: {
        eyebrow: 'Discover',
        title: 'Home',
        subtitle: 'Featured picks, continue watching, and curated rows shaped for desktop browsing.'
    },
    movies: {
        eyebrow: 'Catalog',
        title: 'Films',
        subtitle: 'Browse linked film catalogs and drill into sources without leaving the desktop flow.'
    },
    series: {
        eyebrow: 'Catalog',
        title: 'Series',
        subtitle: 'Browse linked show catalogs, then move into seasons, episodes, and installed addon sources.'
    },
    search: {
        eyebrow: 'Discover',
        title: 'Search',
        subtitle: 'Search linked addon catalogs for films and series.'
    },
    addons: {
        eyebrow: 'Details',
        title: 'Details',
        subtitle: 'Selection summary, seasons, episodes, and the sources available from your installed addons.'
    },
    player: {
        eyebrow: 'Playback',
        title: 'Player',
        subtitle: 'Browser playback with desktop controls and direct addon stream support.'
    },
    login: {
        eyebrow: 'Account',
        title: 'My Nuvio',
        subtitle: 'Connect your Nuvio account, restore your synced session, and use your linked addons.'
    }
};

var state = {
    authKey: null,
    refreshToken: null,
    user: null,
    ownerId: null,
    addons: [],
    continueWatching: [],
    watchedVideos: {},
    movies: [],
    series: [],
    movieGenres: [],
    seriesGenres: [],
    selectedMovieGenre: '',
    selectedSeriesGenre: '',
    movieBrowseItems: [],
    seriesBrowseItems: [],
    movieSkip: 0,
    seriesSkip: 0,
    searchQuery: '',
    searchScope: 'all',
    searchMovies: [],
    searchSeries: [],
    searchResults: [],
    searchSuggestions: [],
    searchDebounceTimer: null,
    searchRequestId: 0,
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
    streamSubtitleTracks: [],
    addonSubtitleTracks: [],
    externalSubtitleTracks: [],
    externalSubtitleCues: [],
    activeAudioTrack: null,
    activeSubtitleTrack: 'subtitle-off',
    subtitleRequestId: 0,
    currentTimeMs: 0,
    durationMs: 0,
    expectedDurationMs: 0,
    transcoderOffsetMs: 0,
    pendingSeekMs: null,
    playbackTicker: null,
    playerChromeTimer: null,
    seekPreviewActive: false,
    seekPreviewTargetMs: 0,
    seekPreviewDirection: 0,
    seekPreviewStartedAt: 0,
    seekPreviewLastTickAt: 0,
    seekPreviewTimer: null,
    progressDragActive: false,
    hlsPlayer: null,
    html5FallbackUrl: '',
    playerMode: 'html5',
    playerFullscreen: false,
    inputMode: 'pointer',
    currentView: 'home',
    viewHistory: [],
    focusRegion: 'nav',
    navIndex: 1,
    mainRow: 0,
    mainCol: 0,
    featuredKey: null,
    featuredIndex: 0,
    featuredRotationItems: [],
    featuredTimer: null,
    featuredItem: null,
    featuredKind: null,
    featuredLabel: '',
    featuredRenderedKey: null,
    featuredTransitionToken: 0,
    featuredTransitionTimer: null,
    homeRailAutoTimer: null,
    homeRailHoverLockUntil: 0,
    homeRailHoverX: null,
    homeRailHoverY: null,
    homeRailPointerActiveUntil: 0,
    autoplayPending: false,
    qrAuthAccessToken: null,
    qrAuthRefreshToken: null,
    qrSessionId: 0,
    qrPollTimer: null,
    qrExpiresTimer: null,
    qrCode: null,
    qrLoginUrl: '',
    qrDeviceNonce: '',
    qrExpiresAt: 0,
    qrStarting: false,
    homeRailIndices: {
        continue: 0,
        movies: 0,
        series: 0
    }
};

function byId(id) {
    return document.getElementById(id);
}

function queryAll(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
}

function setInputMode(mode) {
    state.inputMode = mode === 'keyboard' ? 'keyboard' : 'pointer';
    document.body.setAttribute('data-input-mode', state.inputMode);
}

function isEditableTarget(target) {
    if (!target) {
        return false;
    }

    if (target.isContentEditable) {
        return true;
    }

    return target.tagName === 'INPUT'
        || target.tagName === 'TEXTAREA'
        || target.tagName === 'SELECT';
}

function getInteractiveTabIndex() {
    return '0';
}

function getFullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function requestFullscreenForElement(element) {
    if (!element) {
        return null;
    }
    if (element.requestFullscreen) {
        return element.requestFullscreen();
    }
    if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    }
    return null;
}

function exitBrowserFullscreen() {
    if (document.exitFullscreen) {
        return document.exitFullscreen();
    }
    if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    }
    return null;
}

function clearFeaturedTransitionTimer() {
    if (!state.featuredTransitionTimer) {
        return;
    }
    clearTimeout(state.featuredTransitionTimer);
    state.featuredTransitionTimer = null;
}

function preloadFeaturedArtwork(url) {
    var src = String(url || '').trim();
    if (!src) {
        return Promise.resolve(null);
    }
    return new Promise(function(resolve, reject) {
        var image = new Image();
        var settled = false;

        function finish(error) {
            if (settled) {
                return;
            }
            settled = true;
            image.onload = null;
            image.onerror = null;
            if (error) {
                reject(error);
                return;
            }
            resolve(image);
        }

        function finalize() {
            if (typeof image.decode === 'function') {
                image.decode().then(function() {
                    finish();
                }).catch(function() {
                    finish();
                });
                return;
            }
            finish();
        }

        image.decoding = 'async';
        image.loading = 'eager';
        image.onload = finalize;
        image.onerror = function() {
            finish(new Error('Failed to preload featured artwork.'));
        };
        image.src = src;

        if (image.complete) {
            if (image.naturalWidth > 0 || image.naturalHeight > 0) {
                finalize();
            } else {
                finish(new Error('Failed to preload featured artwork.'));
            }
        }
    });
}

function updateConnectionStatus(text, ok, isError) {
    var el = byId('connectionStatus');
    if (!el) {
        return;
    }
    el.textContent = text;
    el.className = 'visually-hidden';
}

function updateSessionStatus(text, ok, isError) {
    var el = byId('sessionStatus');
    if (!el) {
        return;
    }
    el.textContent = text;
    el.className = 'visually-hidden';
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

function setQrLoginMessage(text, tone) {
    var el = byId('qrLoginMessage');
    if (!el) {
        return;
    }
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

function maskToken(value) {
    var token = String(value || '').trim();

    if (!token) {
        return 'Not set';
    }
    if (token.length <= 20) {
        return token;
    }

    return token.slice(0, 10) + '…' + token.slice(-8);
}

function normalizeAddonType(type) {
    var normalized = String(type || '').toLowerCase();

    if (normalized === 'tv') {
        return 'series';
    }

    return normalized;
}

function getCompatibleTypes(type) {
    var normalized = normalizeAddonType(type);

    if (normalized === 'series') {
        return ['series', 'tv'];
    }

    return normalized ? [normalized] : [];
}

function getResourceName(resource) {
    if (typeof resource === 'string') {
        return resource;
    }

    return resource && resource.name ? resource.name : '';
}

function getResourceTypes(resource) {
    if (typeof resource === 'string') {
        return [];
    }

    return resource && Array.isArray(resource.types)
        ? resource.types.map(function(value) {
            return normalizeAddonType(value);
        }).filter(Boolean)
        : [];
}

function getResourceIdPrefixes(resource) {
    if (typeof resource === 'string') {
        return [];
    }

    return resource && Array.isArray(resource.idPrefixes)
        ? resource.idPrefixes.filter(Boolean)
        : [];
}

function addonSupportsResource(addon, resourceNames, type, id) {
    var resources = addon && addon.manifest && addon.manifest.resources;
    var compatibleTypes = getCompatibleTypes(type);

    if (!resources || !resources.length) {
        return false;
    }

    return resources.some(function(resource) {
        var resourceName = String(getResourceName(resource) || '').toLowerCase();
        var resourceTypes = getResourceTypes(resource);
        var idPrefixes = getResourceIdPrefixes(resource);

        if (resourceNames.indexOf(resourceName) === -1) {
            return false;
        }
        if (compatibleTypes.length && resourceTypes.length) {
            return compatibleTypes.some(function(candidate) {
                return resourceTypes.indexOf(candidate) !== -1;
            });
        }
        if (idPrefixes.length && id) {
            return idPrefixes.some(function(prefix) {
                return String(id).indexOf(prefix) === 0;
            });
        }

        return true;
    });
}

function updateUserPanel() {
    var email = state.user && state.user.email ? state.user.email : 'Guest';
    var authKey = maskToken(state.authKey);

    if (byId('sideUserLabel')) {
        byId('sideUserLabel').textContent = email;
    }
    if (byId('topAccountLabel')) {
        byId('topAccountLabel').textContent = email;
    }
    byId('accountEmail').textContent = email;
    byId('authKeyLabel').textContent = authKey;
    byId('accountNote').textContent = state.authKey
        ? 'This Nuvio session is stored locally in this browser.'
        : 'Sign in to keep your Nuvio session active inside this browser session.';
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
    var normalized = [];
    var seen = {};

    if (!Array.isArray(payload)) {
        payload = safeJsonParse(localStorage.getItem(LEGACY_STORAGE_CONTINUE));
    }

    if (!Array.isArray(payload)) {
        state.continueWatching = [];
        return;
    }

    payload.forEach(function(entry) {
        var key;

        if (!entry || !entry.item || !entry.kind || !entry.item.id) {
            return;
        }

        key = entry.kind + ':' + entry.item.id;
        if (seen[key]) {
            return;
        }

        seen[key] = true;
        normalized.push(entry);
    });

    state.continueWatching = normalized.slice(0, 12);
}

function getWatchedVideoKey(item, video) {
    if (!item || !item.id || !video || !video.id) {
        return '';
    }
    return item.id + ':' + video.id;
}

function saveWatchedVideos() {
    localStorage.setItem(STORAGE_WATCHED, JSON.stringify(state.watchedVideos || {}));
}

function restoreWatchedVideos() {
    var payload = safeJsonParse(localStorage.getItem(STORAGE_WATCHED));
    state.watchedVideos = payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};
}

function markVideoWatched(item, video) {
    var key = getWatchedVideoKey(item, video);

    if (!key) {
        return;
    }

    state.watchedVideos[key] = {
        watchedAt: new Date().toISOString()
    };
    saveWatchedVideos();
}

function isVideoWatched(video) {
    return !!(state.watchedVideos && state.watchedVideos[getWatchedVideoKey(state.selectedItem, video)]);
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
    key = snapshot.kind + ':' + snapshot.item.id;

    state.continueWatching = [snapshot].concat(state.continueWatching.filter(function(entry) {
        var entryKey = entry.kind + ':' + entry.item.id;
        return entryKey !== key;
    })).slice(0, 12);

    saveContinueWatching();
}

function resetTrackState() {
    state.audioTracks = [];
    state.subtitleTracks = [];
    state.streamSubtitleTracks = [];
    state.addonSubtitleTracks = [];
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

function isEnglishSubtitleValue(value) {
    var normalized = String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();

    if (!normalized) {
        return false;
    }

    return normalized === 'en'
        || normalized === 'eng'
        || normalized.indexOf('en-') === 0
        || normalized.indexOf('en_') === 0
        || normalized.indexOf('eng-') === 0
        || normalized.indexOf('eng_') === 0
        || normalized.indexOf('english') !== -1;
}

function isEnglishSubtitleEntry(info) {
    if (!info || typeof info !== 'object') {
        return false;
    }

    return isEnglishSubtitleValue(info.language)
        || isEnglishSubtitleValue(info.lang)
        || isEnglishSubtitleValue(info.track_lang)
        || isEnglishSubtitleValue(info.subtitle_lang)
        || isEnglishSubtitleValue(info.label)
        || isEnglishSubtitleValue(info.track_name)
        || isEnglishSubtitleValue(info.name);
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
        if (!isEnglishSubtitleEntry(track)) {
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

function dedupeSubtitleTracks(tracks) {
    var seen = {};

    return (tracks || []).filter(function(track) {
        var key;

        if (!track || !track.id || !track.url) {
            return false;
        }

        key = [
            track.url,
            track.language || '',
            track.label || ''
        ].join('|');

        if (seen[key]) {
            return false;
        }

        seen[key] = true;
        return true;
    });
}

function updateExternalSubtitleTracks() {
    state.externalSubtitleTracks = dedupeSubtitleTracks(
        state.streamSubtitleTracks.concat(state.addonSubtitleTracks)
    );

    if (isExternalSubtitleTrackId(state.activeSubtitleTrack)) {
        var stillExists = state.externalSubtitleTracks.some(function(track) {
            return track.id === state.activeSubtitleTrack;
        });
        if (!stillExists) {
            state.activeSubtitleTrack = 'subtitle-off';
            state.externalSubtitleCues = [];
            updateSubtitleOverlay(0);
        }
    }
}

function syncExternalSubtitleTracks() {
    state.streamSubtitleTracks = getExternalSubtitleTracks(state.currentStream);
    updateExternalSubtitleTracks();
}

function getAllSubtitleTracks() {
    return state.subtitleTracks.concat(state.externalSubtitleTracks);
}

function getPreferredSubtitleTracks() {
    return state.externalSubtitleTracks.concat(state.subtitleTracks);
}

function getResolvedAudioTrackId() {
    var video = byId('videoPlayer');
    var audioTracks = video && video.audioTracks;
    var matchingTrack = state.audioTracks.some(function(track) {
        return track.id === state.activeAudioTrack;
    });
    var index;

    if (matchingTrack) {
        return state.activeAudioTrack;
    }

    if (audioTracks && typeof audioTracks.length === 'number') {
        for (index = 0; index < audioTracks.length; index += 1) {
            if (audioTracks[index].enabled) {
                return 'audio-' + index;
            }
        }
    }

    return state.audioTracks.length ? state.audioTracks[0].id : null;
}

function getResolvedSubtitleTrackId() {
    var preferredTracks = getPreferredSubtitleTracks();
    var video = byId('videoPlayer');
    var textTracks = video && video.textTracks;
    var matchingTrack = state.activeSubtitleTrack === 'subtitle-off'
        || preferredTracks.some(function(track) {
            return track.id === state.activeSubtitleTrack;
        });
    var index;

    if (matchingTrack) {
        return state.activeSubtitleTrack;
    }

    if (textTracks && typeof textTracks.length === 'number') {
        for (index = 0; index < textTracks.length; index += 1) {
            if (textTracks[index].mode && textTracks[index].mode !== 'disabled') {
                return 'subtitle-' + index;
            }
        }
    }

    return 'subtitle-off';
}

function getAudioBadgeLabel() {
    var currentId = getResolvedAudioTrackId();
    var index = state.audioTracks.findIndex(function(track) {
        return track.id === currentId;
    });

    if (index === -1) {
        return '1';
    }

    return String(index + 1);
}

function getSubtitleBadgeLabel() {
    var preferredTracks = getPreferredSubtitleTracks();
    var currentId = getResolvedSubtitleTrackId();
    var index;

    if (currentId === 'subtitle-off' || !preferredTracks.length) {
        return 'Off';
    }

    index = preferredTracks.findIndex(function(track) {
        return track.id === currentId;
    });

    return index === -1 ? 'Off' : String(index + 1);
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
    var currentId;
    var nextIndex;

    if (!state.audioTracks.length) {
        setPlayerStatus('No alternate audio tracks');
        return;
    }

    currentId = getResolvedAudioTrackId();
    nextIndex = state.audioTracks.findIndex(function(track) {
        return track.id === currentId;
    });
    nextIndex = (nextIndex + 1 + state.audioTracks.length) % state.audioTracks.length;
    selectAudioTrack(state.audioTracks[nextIndex].id);
}

function cycleSubtitleTrack() {
    var currentId;
    var tracks = [{ id: 'subtitle-off', label: 'Off' }].concat(getPreferredSubtitleTracks());
    var nextIndex;

    currentId = getResolvedSubtitleTrackId();
    nextIndex = tracks.findIndex(function(track) {
        return track.id === currentId;
    });
    nextIndex = (nextIndex + 1 + tracks.length) % tracks.length;
    selectSubtitleTrack(tracks[nextIndex].id);
}

function getSortedSeriesVideos() {
    return (state.allSeriesVideos || []).slice().sort(function(left, right) {
        var seasonDelta = getVideoSeason(left) - getVideoSeason(right);

        if (seasonDelta) {
            return seasonDelta;
        }

        return getVideoEpisode(left) - getVideoEpisode(right);
    });
}

function getNextEpisode() {
    var videos = getSortedSeriesVideos();
    var currentId = state.selectedVideo && state.selectedVideo.id;
    var currentIndex;

    if (state.selectedType !== 'series' || !currentId || !videos.length) {
        return null;
    }

    currentIndex = videos.findIndex(function(video) {
        return video.id === currentId;
    });

    if (currentIndex === -1 || currentIndex >= videos.length - 1) {
        return null;
    }

    return videos[currentIndex + 1];
}

function setPlayerNextEpisodeUi() {
    var button = byId('playerNextEpisodeButton');
    var nextEpisode = getNextEpisode();

    if (!button) {
        return;
    }

    button.disabled = !nextEpisode;
    button.classList.toggle('is-disabled', !nextEpisode);
    button.setAttribute('aria-label', nextEpisode ? 'Play next episode' : 'No next episode');
    button.setAttribute('title', nextEpisode ? 'Play next episode' : 'No next episode');
}

function getPreferredPlayableStream() {
    var playable = state.streams.filter(function(entry) {
        return entry.playable && entry.raw && entry.raw.url;
    });
    var browserSafe = playable.filter(function(entry) {
        return !entry.audioWarning;
    })[0];

    return browserSafe || playable[0] || null;
}

function playNextEpisode() {
    var nextEpisode = getNextEpisode();

    if (!nextEpisode || !state.selectedItem) {
        setPlayerStatus('No next episode');
        setPlayerNextEpisodeUi();
        return;
    }

    stopCurrentPlayback();
    state.selectedSeason = getVideoSeason(nextEpisode);
    state.selectedVideo = nextEpisode;
    updateSelectedEpisodesForSeason();
    state.streams = [];
    state.currentStream = null;
    state.autoplayPending = true;
    renderAddons();
    renderPlayerState();
    setPlayerStatus('Loading next episode');
    loadStreamsForSelection();
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
    byId('playerFullscreenGlyph').textContent = '\u26F6';
    button.setAttribute('aria-label', state.playerFullscreen ? 'Exit fullscreen' : 'Fullscreen');
    button.setAttribute('title', state.playerFullscreen ? 'Exit fullscreen' : 'Fullscreen');
}

function updateTrackBadges() {
    byId('playerAudioBadge').textContent = getAudioBadgeLabel();
    byId('playerSubtitleBadge').textContent = getSubtitleBadgeLabel();
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

function parseDurationMs(value) {
    var text;
    var parts;
    var number;

    if (typeof value === 'number' && isFinite(value)) {
        return value > 1000 ? value : value * 60000;
    }

    text = String(value || '').trim();
    if (!text) {
        return 0;
    }

    parts = text.split(':').map(function(part) {
        return parseInt(part, 10);
    });
    if (parts.length === 3 && parts.every(function(part) { return !isNaN(part); })) {
        return ((parts[0] * 3600) + (parts[1] * 60) + parts[2]) * 1000;
    }
    if (parts.length === 2 && parts.every(function(part) { return !isNaN(part); })) {
        return ((parts[0] * 60) + parts[1]) * 1000;
    }

    number = parseInt(text, 10);
    if (isNaN(number)) {
        return 0;
    }

    return number * 60000;
}

function getSelectedRuntimeMs() {
    var video = state.selectedVideo || {};
    var item = state.selectedItem || {};

    return parseDurationMs(video.runtime || video.duration || item.runtime || item.duration);
}

function getDisplayedPlaybackTimeMs() {
    return state.seekPreviewActive ? state.seekPreviewTargetMs : state.currentTimeMs;
}

function getSeekPreviewSpeedMultiplier(heldMs) {
    if (heldMs >= 5000) {
        return 128;
    }
    if (heldMs >= 3000) {
        return 64;
    }
    if (heldMs >= 1500) {
        return 32;
    }
    if (heldMs >= 500) {
        return 16;
    }
    return 8;
}

function clearSeekPreviewTimer() {
    if (!state.seekPreviewTimer) {
        return;
    }
    clearInterval(state.seekPreviewTimer);
    state.seekPreviewTimer = null;
}

function clampSeekPreviewTarget(targetMs) {
    var duration = state.durationMs || state.expectedDurationMs || 0;
    var target = Math.max(0, targetMs || 0);

    if (duration > 0) {
        target = Math.min(duration, target);
    }

    return target;
}

function updateProgressUi() {
    var displayTime = getDisplayedPlaybackTimeMs();
    var duration = state.durationMs || state.expectedDurationMs || 0;
    var percent = 0;
    if (duration > 0) {
        percent = Math.max(0, Math.min(100, (displayTime / duration) * 100));
    }

    byId('playerCurrentTime').textContent = formatPlaybackTime(displayTime);
    byId('playerDuration').textContent = formatPlaybackTime(duration);
    byId('playerProgressFill').style.width = String(percent) + '%';
    if (state.seekPreviewActive) {
        if (!state.seekPreviewDirection) {
            byId('playerProgressCaption').textContent =
                'Seek to ' + formatPlaybackTime(displayTime) + ' • release to jump';
            return;
        }
        byId('playerProgressCaption').textContent =
            'Scrub to ' + formatPlaybackTime(displayTime) +
            ' • ' + String(getSeekPreviewSpeedMultiplier(Date.now() - state.seekPreviewStartedAt)) + 'x' +
            ' • release to seek';
        return;
    }

    byId('playerProgressCaption').textContent = duration > 0
        ? Math.round(percent) + '% watched'
        : 'Waiting for stream timing...';
}

function setPlaybackMetrics(currentMs, durationMs) {
    state.currentTimeMs = Math.max(0, (currentMs || 0) + (state.transcoderOffsetMs || 0));
    state.durationMs = Math.max(0, durationMs || 0);
    if (state.expectedDurationMs && state.durationMs && state.durationMs < state.expectedDurationMs * 0.7) {
        state.durationMs = state.expectedDurationMs;
    }
    updateProgressUi();
    updateSubtitleOverlay(state.currentTimeMs);
}

function resetPlaybackMetrics() {
    clearSeekPreviewTimer();
    state.seekPreviewActive = false;
    state.seekPreviewTargetMs = 0;
    state.seekPreviewDirection = 0;
    state.seekPreviewStartedAt = 0;
    state.seekPreviewLastTickAt = 0;
    state.currentTimeMs = 0;
    state.durationMs = 0;
    state.transcoderOffsetMs = 0;
    state.pendingSeekMs = null;
    state.expectedDurationMs = getSelectedRuntimeMs();
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

function seekPlaybackTo(targetMs, statusPrefix) {
    var video = byId('videoPlayer');
    var duration = state.durationMs || state.expectedDurationMs || 0;
    var target = Math.max(0, targetMs || 0);
    var currentBufferedEndMs = ((state.transcoderOffsetMs || 0) + ((isFinite(video.duration) ? video.duration : 0) * 1000));

    if (state.seekPreviewActive) {
        clearSeekPreviewTimer();
        state.seekPreviewActive = false;
        state.seekPreviewDirection = 0;
        state.seekPreviewStartedAt = 0;
        state.seekPreviewLastTickAt = 0;
    }

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
                setPlayerStatus((statusPrefix || 'Skipped to ') + formatPlaybackTime(target));
            }, function() {
                setPlayerStatus('Seek failed');
            });
            return;
        } catch (error) {
            setPlayerStatus('Seek failed');
            return;
        }
    }

    if (state.html5FallbackUrl && target > currentBufferedEndMs - 4000) {
        state.pendingSeekMs = target;
        state.transcoderOffsetMs = target;
        setPlaybackMetrics(0, state.expectedDurationMs || duration);
        setPlayerStatus('Preparing stream at ' + formatPlaybackTime(target));
        startHtml5Stream(state.currentStream.raw.url);
        return;
    }

    try {
        video.currentTime = Math.max(0, (target - (state.transcoderOffsetMs || 0)) / 1000);
        readHtml5Metrics();
        setPlayerStatus((statusPrefix || 'Skipped to ') + formatPlaybackTime(target));
    } catch (error2) {
        setPlayerStatus('Seek failed');
    }
}

function stopSeekPreview(commit) {
    var target;

    if (!state.seekPreviewActive) {
        return;
    }

    target = clampSeekPreviewTarget(state.seekPreviewTargetMs);
    clearSeekPreviewTimer();
    state.seekPreviewActive = false;
    state.seekPreviewDirection = 0;
    state.seekPreviewStartedAt = 0;
    state.seekPreviewLastTickAt = 0;

    if (!commit) {
        updateProgressUi();
        return;
    }

    state.currentTimeMs = target;
    updateProgressUi();
    seekPlaybackTo(target, 'Skipped to ');
}

function getProgressPointerTargetMs(event) {
    var progressButton = byId('playerProgressButton');
    var duration = state.durationMs || state.expectedDurationMs || 0;
    var rect;
    var ratio;

    if (!progressButton || !duration) {
        return 0;
    }

    rect = progressButton.getBoundingClientRect();
    if (!rect.width) {
        return state.currentTimeMs || 0;
    }

    ratio = (event.clientX - rect.left) / rect.width;
    ratio = Math.max(0, Math.min(1, ratio));
    return ratio * duration;
}

function updateProgressPointerPreview(event) {
    if (!(state.durationMs || state.expectedDurationMs)) {
        setPlayerStatus('Stream timing unavailable');
        return;
    }

    state.seekPreviewActive = true;
    state.seekPreviewTargetMs = clampSeekPreviewTarget(getProgressPointerTargetMs(event));
    state.seekPreviewStartedAt = Date.now();
    state.seekPreviewDirection = 0;
    showPlayerChrome(true);
    updateProgressUi();
}

function beginProgressPointerSeek(event) {
    var progressButton = byId('playerProgressButton');

    if (!(state.durationMs || state.expectedDurationMs)) {
        setPlayerStatus('Stream timing unavailable');
        return;
    }

    state.progressDragActive = true;
    clearSeekPreviewTimer();
    updateProgressPointerPreview(event);
    if (progressButton && progressButton.setPointerCapture && event.pointerId !== undefined) {
        try {
            progressButton.setPointerCapture(event.pointerId);
        } catch (error) {
            // no-op
        }
    }
}

function finishProgressPointerSeek(commit) {
    if (!state.progressDragActive) {
        return;
    }

    state.progressDragActive = false;
    stopSeekPreview(commit);
}

function tickSeekPreview() {
    var now;
    var elapsedMs;
    var deltaMs;
    var multiplier;
    var nextTarget;

    if (!state.seekPreviewActive || !state.seekPreviewDirection) {
        return;
    }

    now = Date.now();
    elapsedMs = Math.max(0, now - state.seekPreviewStartedAt);
    deltaMs = Math.max(0, now - state.seekPreviewLastTickAt);
    multiplier = getSeekPreviewSpeedMultiplier(elapsedMs);
    nextTarget = state.seekPreviewTargetMs + (state.seekPreviewDirection * multiplier * deltaMs);

    state.seekPreviewLastTickAt = now;
    state.seekPreviewTargetMs = clampSeekPreviewTarget(nextTarget);
    updateProgressUi();
}

function beginOrUpdateSeekPreview(direction) {
    var now = Date.now();

    if ((state.durationMs || state.expectedDurationMs || 0) <= 0) {
        seekPlaybackTo((state.currentTimeMs || 0) + (direction * 30000), direction < 0 ? 'Rewound to ' : 'Skipped to ');
        return;
    }

    showPlayerChrome(true);

    if (!state.seekPreviewActive) {
        state.seekPreviewActive = true;
        state.seekPreviewDirection = direction;
        state.seekPreviewStartedAt = now;
        state.seekPreviewLastTickAt = now;
        state.seekPreviewTargetMs = clampSeekPreviewTarget((state.currentTimeMs || 0) + (direction * PLAYER_SCRUB_INITIAL_NUDGE_MS));
        clearSeekPreviewTimer();
        state.seekPreviewTimer = setInterval(tickSeekPreview, PLAYER_SCRUB_TICK_MS);
        updateProgressUi();
        setPlayerStatus('Scrubbing ' + (direction < 0 ? 'backward' : 'forward') + ' • release to seek');
        return;
    }

    if (state.seekPreviewDirection === direction) {
        return;
    }

    state.seekPreviewDirection = direction;
    state.seekPreviewStartedAt = now;
    state.seekPreviewLastTickAt = now;
    state.seekPreviewTargetMs = clampSeekPreviewTarget(state.seekPreviewTargetMs + (direction * PLAYER_SCRUB_INITIAL_NUDGE_MS));
    updateProgressUi();
    setPlayerStatus('Scrubbing ' + (direction < 0 ? 'backward' : 'forward') + ' • release to seek');
}

function seekCurrentPlayback(deltaMs) {
    seekPlaybackTo((state.currentTimeMs || 0) + deltaMs, deltaMs < 0 ? 'Rewound to ' : 'Skipped to ');
}

function hasAvplay() {
    return typeof webapis !== 'undefined' && webapis && webapis.avplay;
}

function destroyHlsPlayer() {
    if (!state.hlsPlayer) {
        return;
    }

    try {
        state.hlsPlayer.destroy();
    } catch (error) {
        // no-op
    }
    state.hlsPlayer = null;
}

function getStreamingServerUrl() {
    var params;
    var fromQuery = '';
    var stored = '';

    try {
        params = new URLSearchParams(window.location.search || '');
        fromQuery = params.get('streamingServer') || '';
    } catch (error1) {
        fromQuery = '';
    }

    if (fromQuery) {
        localStorage.setItem(STORAGE_STREAMING_SERVER, fromQuery);
        return fromQuery.replace(/\/+$/, '');
    }

    try {
        stored = localStorage.getItem(STORAGE_STREAMING_SERVER) || '';
    } catch (error2) {
        stored = '';
    }

    if (/^https?:\/\/(127\.0\.0\.1|localhost):11470/i.test(stored)) {
        stored = '';
        try {
            localStorage.removeItem(STORAGE_STREAMING_SERVER);
        } catch (error3) {
            // no-op
        }
    }

    return (stored || DEFAULT_STREAMING_SERVER_URL).replace(/\/+$/, '');
}

function buildStreamingServerHlsUrl(url, streamEntry, serverUrlOverride, seekMs) {
    var raw = streamEntry && streamEntry.raw ? streamEntry.raw : {};
    var serverUrl = (serverUrlOverride || getStreamingServerUrl()).replace(/\/+$/, '');
    var filename = raw.filename || deriveFilenameFromUrl(url) || 'stream.mkv';
    var requestUrl;

    if (!serverUrl || !url) {
        return url;
    }

    requestUrl = serverUrl
        + '/hlsv2/'
        + encodeURIComponent(filename)
        + '/video0.m3u8?mediaURL='
        + encodeURIComponent(url);

    if (seekMs && seekMs > 0) {
        requestUrl += '&seek=' + encodeURIComponent(String(Math.floor(seekMs / 1000)));
    }
    requestUrl += '&quality=' + encodeURIComponent(localStorage.getItem(STORAGE_TRANSCODER_QUALITY) || 'auto');

    return requestUrl;
}

function getHtml5PlaybackUrl(url) {
    if (!url) {
        return '';
    }

    if (/\.m3u8(?:\?|$)/i.test(url)) {
        return url;
    }

    return buildStreamingServerHlsUrl(url, state.currentStream, '', state.pendingSeekMs || 0);
}

function getCorsSafeStreamingUrl(url) {
    return buildStreamingServerHlsUrl(url, state.currentStream, DEFAULT_STREAMING_SERVER_URL, state.pendingSeekMs || 0);
}

function stopHtml5Playback() {
    var video = byId('videoPlayer');
    try {
        destroyHlsPlayer();
        state.html5FallbackUrl = '';
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
        button.setAttribute('tabindex', getInteractiveTabIndex());
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
    var activeAudioTrack;
    var activeSubtitleTrack;
    var hasPlayableSelection = !!(state.currentStream && state.currentStream.playable);
    var audioTracks = state.audioTracks.slice();
    var preferredSubtitleTracks = getPreferredSubtitleTracks();
    var subtitleTracks = hasPlayableSelection
        ? [{
            id: 'subtitle-off',
            label: 'Off'
        }].concat(preferredSubtitleTracks)
        : [];

    activeAudioTrack = getResolvedAudioTrackId();
    activeSubtitleTrack = getResolvedSubtitleTrackId();
    state.activeAudioTrack = activeAudioTrack;
    state.activeSubtitleTrack = activeSubtitleTrack;

    byId('audioTrackCount').textContent = audioTracks.length
        ? String(audioTracks.length) + ' option' + (audioTracks.length === 1 ? '' : 's')
        : (state.currentStream && state.html5FallbackUrl ? 'Server decode' : 'Default only');
    byId('subtitleTrackCount').textContent = preferredSubtitleTracks.length
        ? String(preferredSubtitleTracks.length) + ' option' + (preferredSubtitleTracks.length === 1 ? '' : 's')
        : 'Off';

    renderTrackChips('audioTrackList', audioTracks, activeAudioTrack, selectAudioTrack);
    renderTrackChips('subtitleTrackList', subtitleTracks, activeSubtitleTrack, selectSubtitleTrack);
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
            if (!isEnglishSubtitleEntry({
                language: textTrackLanguage,
                label: textTrackLabel
            })) {
                continue;
            }
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
            if (!isEnglishSubtitleEntry(info)) {
                return;
            }
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

function applyPlayerFullscreenState(enabled, shouldRestorePlayback) {
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
        if (state.inputMode === 'keyboard') {
            setTimeout(function() {
                focusCurrent(true);
            }, 0);
        }
    } else {
        body.classList.add('is-player-chrome-visible');
    }
    setTimeout(function() {
        syncAvplayRect();
        if (nextFullscreen && shouldRestorePlayback !== false && wasPlaying) {
            resumeCurrentPlayback(true);
        }
    }, 60);
}

function setPlayerFullscreen(enabled) {
    var frame = byId('videoFrameFocus');
    var fullscreenElement = getFullscreenElement();
    var desired = !!enabled;
    var request;

    if (desired && frame && fullscreenElement !== frame) {
        request = requestFullscreenForElement(frame);
        if (request && typeof request.catch === 'function') {
            request.catch(function() {
                return null;
            });
        }
    } else if (!desired && fullscreenElement) {
        request = exitBrowserFullscreen();
        if (request && typeof request.catch === 'function') {
            request.catch(function() {
                return null;
            });
        }
    }

    applyPlayerFullscreenState(desired, true);
}

function syncDocumentFullscreenState() {
    var frame = byId('videoFrameFocus');
    var fullscreenElement = getFullscreenElement();

    if (!frame) {
        return;
    }

    if (!fullscreenElement && state.playerFullscreen) {
        applyPlayerFullscreenState(false, false);
        return;
    }

    if (fullscreenElement === frame && !state.playerFullscreen) {
        applyPlayerFullscreenState(true, false);
    }
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
        var searchContainers = [];
        var searchInput = byId('searchTextInput');
        var suggestionButtons = queryAll('#searchSuggestionList .search-suggestion');

        if (searchInput) {
            searchContainers.push(byId('searchShellSection'));
        }

        suggestionButtons.forEach(function() {
            searchContainers.push(byId('searchShellSection'));
        });

        queryAll('#searchResultGrid .card-row').forEach(function(row) {
            searchContainers.push(row);
        });

        return searchContainers.filter(Boolean);
    }

    if (state.currentView === 'addons') {
        var addonContainers = [];
        var episodeSection = byId('episodeSection');
        var detailHeroRow = byId('detailHeroRow');
        var streamSection = byId('streamSection');
        var episodeVisible = episodeSection && episodeSection.style.display !== 'none';

        if (state.selectedType === 'series' && episodeVisible) {
            addonContainers.push(episodeSection);
            queryAll('#episodeRail .episode-list-button').forEach(function() {
                addonContainers.push(episodeSection);
            });
            queryAll('#streamList .stream-card').forEach(function() {
                addonContainers.push(streamSection);
            });
            return addonContainers.filter(Boolean);
        }

        if (detailHeroRow) {
            addonContainers.push(detailHeroRow);
        }
        queryAll('#streamList .stream-card').forEach(function() {
            addonContainers.push(streamSection);
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

    return [
        byId('loginForm'),
        byId('loginForm'),
        byId('loginForm'),
        byId('qrLoginCard')
    ].filter(Boolean);
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
        var searchInput = byId('searchTextInput');
        var suggestionButtons = queryAll('#searchSuggestionList .search-suggestion');
        var resultRows = queryAll('#searchResultGrid .card-row');

        if (searchInput) {
            searchRows.push([searchInput]);
        }

        suggestionButtons.forEach(function(button) {
            searchRows.push([button]);
        });

        resultRows.forEach(function(row) {
            var cards = queryAll('#' + row.id + ' .card');
            if (cards.length) {
                searchRows.push(cards);
            }
        });
        return searchRows;
    }

    if (state.currentView === 'addons') {
        var addonRows = [];
        var detailActions = queryAll('#detailActions .action-button');
        var seasonSelect = byId('seasonSelect');
        var episodes = queryAll('#episodeRail .episode-list-button');
        var streams = queryAll('#streamList .stream-card');
        var episodeVisible = byId('episodeSection') && byId('episodeSection').style.display !== 'none';

        if (state.selectedType === 'series' && episodeVisible) {
            if (seasonSelect) {
                addonRows.push([seasonSelect]);
            }

            episodes.forEach(function(episodeButton) {
                addonRows.push([episodeButton]);
            });

            streams.forEach(function(streamButton) {
                addonRows.push([streamButton]);
            });

            return addonRows;
        }

        if (detailActions.length) {
            addonRows.push(detailActions);
        }

        streams.forEach(function(streamButton) {
            addonRows.push([streamButton]);
        });

        return addonRows;
    }

    if (state.currentView === 'player') {
        var playerRows = [];
        var progressButton = byId('playerProgressButton');
        var playerActions = queryAll('#playerActions .action-button').filter(function(button) {
            return !button.disabled;
        });
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
        [byId('loginButton'), byId('logoutButton')],
        [byId('qrRefreshButton')]
    ];
}

function buildContinueEntries() {
    return state.continueWatching.map(function(entry) {
        return {
            item: entry.item,
            kind: entry.kind,
            video: entry.video,
            metaText: entry.kind === 'series' && entry.video
                ? 'Resume • Season ' + entry.video.season + ' • Episode ' + entry.video.episode
                : 'Resume watching'
        };
    });
}

function getHomeRailDescriptors() {
    var descriptors = [];

    if (state.continueWatching.length) {
        descriptors.push({
            key: 'continue',
            containerId: 'continueRail',
            entries: buildContinueEntries()
        });
    }

    descriptors.push({
        key: 'movies',
        containerId: 'homeMovieRail',
        entries: state.movies.map(function(item) {
            return { item: item, kind: 'movie' };
        })
    });

    descriptors.push({
        key: 'series',
        containerId: 'homeSeriesRail',
        entries: state.series.map(function(item) {
            return { item: item, kind: 'series' };
        })
    });

    return descriptors;
}

function getHomeRailDescriptorForMainRow(rowIndex) {
    var descriptors;
    var railRowIndex;

    if (state.currentView !== 'home' || rowIndex <= 0) {
        return null;
    }

    descriptors = getHomeRailDescriptors().filter(function(descriptor) {
        return descriptor.key !== 'continue';
    });
    railRowIndex = rowIndex - (state.continueWatching.length ? 2 : 1);

    return descriptors[railRowIndex] || null;
}

function getHomeRailDescriptorByKey(key) {
    return getHomeRailDescriptors().filter(function(descriptor) {
        return descriptor.key === key;
    })[0] || null;
}

function getMainPositionForElement(element) {
    var rows = getMainRows();
    var rowIndex;
    var colIndex;

    for (rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
        colIndex = rows[rowIndex].indexOf(element);
        if (colIndex !== -1) {
            return {
                row: rowIndex,
                col: colIndex
            };
        }
    }

    return null;
}

function activatePointerMainElement(element) {
    var position = getMainPositionForElement(element);

    if (!position) {
        return false;
    }

    state.focusRegion = 'main';
    state.mainRow = position.row;
    state.mainCol = position.col;
    updateRowEmphasis();

    if (state.currentView === 'player' && state.playerFullscreen) {
        showPlayerChrome(position.row > 0);
    }

    return true;
}

function activatePointerNavElement(element) {
    var navItems = queryAll('.nav-item');
    var index = navItems.indexOf(element);

    if (index === -1) {
        return false;
    }

    state.focusRegion = 'nav';
    state.navIndex = index;
    updateRowEmphasis();
    return true;
}

function activateHomeRailHover(card) {
    var event = arguments[1] || {};
    var key = card.getAttribute('data-home-rail-key');
    var entryIndex = parseInt(card.getAttribute('data-home-entry-index'), 10);
    var descriptor;
    var previousIndex;
    var direction;
    var now = Date.now();
    var movedEnough = true;

    if (!key || isNaN(entryIndex)) {
        return false;
    }

    descriptor = getHomeRailDescriptorByKey(key);
    if (!descriptor || !descriptor.entries.length) {
        return false;
    }

    state.homeRailPointerActiveUntil = now + 4200;
    previousIndex = state.homeRailIndices[key] || 0;
    if (previousIndex !== entryIndex) {
        if (typeof event.clientX === 'number' && typeof event.clientY === 'number') {
            movedEnough = state.homeRailHoverX === null
                || Math.abs(event.clientX - state.homeRailHoverX) > 10
                || Math.abs(event.clientY - state.homeRailHoverY) > 10;
            state.homeRailHoverX = event.clientX;
            state.homeRailHoverY = event.clientY;
        }
        if (!movedEnough || now < state.homeRailHoverLockUntil) {
            return true;
        }
        state.homeRailHoverLockUntil = now + HOME_RAIL_HOVER_COOLDOWN_MS;
        direction = entryIndex > previousIndex ? 'right' : 'left';
        state.homeRailIndices[key] = entryIndex;
        renderSingleHomeRail(descriptor, direction);
    }

    activatePointerMainElement((byId(descriptor.containerId) && byId(descriptor.containerId).querySelector('.card.is-home-active')) || card);
    return true;
}

function rotateHomeRail(descriptor) {
    if (!descriptor || !descriptor.entries.length) {
        return;
    }

    state.homeRailIndices[descriptor.key] = ((state.homeRailIndices[descriptor.key] || 0) + 1) % descriptor.entries.length;
    renderSingleHomeRail(descriptor, 'right');
}

function startHomeRailAutoRotation() {
    if (state.homeRailAutoTimer) {
        clearInterval(state.homeRailAutoTimer);
    }

    state.homeRailAutoTimer = setInterval(function() {
        if (state.currentView !== 'home' || Date.now() < state.homeRailPointerActiveUntil) {
            return;
        }

        getHomeRailDescriptors().filter(function(descriptor) {
            return descriptor.key !== 'continue';
        }).forEach(rotateHomeRail);
    }, HOME_RAIL_AUTO_ROTATE_MS);
}

function getSearchPaneInfo() {
    var inputRows = byId('searchTextInput') ? 1 : 0;
    var suggestionCount = queryAll('#searchSuggestionList .search-suggestion').length;
    var resultRows = queryAll('#searchResultGrid .card-row').length;
    var leftRowCount = inputRows + suggestionCount;

    return {
        keyboardRows: 0,
        inputRows: inputRows,
        suggestionCount: suggestionCount,
        resultRows: resultRows,
        leftRowCount: leftRowCount,
        firstResultRow: leftRowCount
    };
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
        parent.classList.contains('card-row') ||
        parent.classList.contains('nav-list') ||
        parent.classList.contains('season-rail') ||
        parent.classList.contains('episode-rail') ||
        parent.classList.contains('genre-chip-row') ||
        parent.classList.contains('search-suggestion-list') ||
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
}

function scrollActiveViewToTop() {
    var activeView = queryAll('.view.is-active')[0];
    window.scrollTo(0, 0);
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

function focusCurrent(force) {
    if (!force && state.inputMode === 'pointer') {
        updateRowEmphasis();
        if (state.currentView === 'player' && state.playerFullscreen) {
            showPlayerChrome(state.mainRow > 0);
        }
        return;
    }

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

    if (state.currentView === 'home' && state.mainRow > 0) {
        if (getHomeRailDescriptorForMainRow(state.mainRow)) {
            state.mainCol = Math.min(getHomeRailCenterOffset(rows[state.mainRow].length), rows[state.mainRow].length - 1);
        }
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

    if (previousView === 'login' && viewName !== 'login') {
        stopQrLoginSession(true);
    }

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
    window.scrollTo(0, 0);

    if (viewName === 'home' && state.featuredRotationItems[state.featuredIndex]) {
        updateFeatured(
            state.featuredRotationItems[state.featuredIndex].item,
            state.featuredRotationItems[state.featuredIndex].label
        );
    }

    if (viewName === 'login') {
        setTimeout(function() {
            startQrLoginSession(false);
        }, 0);
    }

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

function padEpisodeNumber(value) {
    var number = parseInt(value, 10);

    if (isNaN(number) || number <= 0) {
        return '??';
    }

    return number < 10 ? '0' + String(number) : String(number);
}

function getEpisodeTitle(video) {
    var title = video && (video.title || video.name);
    var episodeNumber = getVideoEpisode(video);

    if (title && String(title).trim()) {
        return title;
    }

    return 'Episode ' + (episodeNumber || '?');
}

function getEpisodeArtwork(video) {
    if (!video) {
        return state.selectedItem && (state.selectedItem.background || state.selectedItem.poster) || '';
    }

    return video.thumbnail
        || video.still
        || video.poster
        || video.background
        || video.image
        || video.snapshot
        || (state.selectedItem && (state.selectedItem.background || state.selectedItem.poster))
        || '';
}

function getEpisodeDescription(video) {
    if (!video) {
        return '';
    }

    return video.description
        || video.overview
        || video.summary
        || video.plot
        || video.synopsis
        || '';
}

function formatEpisodeMeta(video) {
    var parts = [];
    var released = video && (video.released || video.releaseInfo || video.firstAired || video.aired || video.airDate || video.premiered);
    var runtime = video && (video.runtime || video.duration);
    var episodeNumber = getVideoEpisode(video);

    parts.push(formatSeasonLabel(getVideoSeason(video)) + ' • Episode ' + (episodeNumber || '?'));

    if (released) {
        parts.push(String(released));
    }
    if (runtime) {
        parts.push(String(runtime));
    }

    return parts.join(' • ');
}

function buildFeaturedRotationItems() {
    var pool = [];
    var seen = {};

    function pushEntry(item, kind, label) {
        var key;

        if (!item || !item.id) {
            return;
        }

        key = kind + ':' + item.id;
        if (seen[key]) {
            return;
        }

        seen[key] = true;
        pool.push({
            item: item,
            kind: kind,
            label: label
        });
    }

    state.continueWatching.forEach(function(entry) {
        pushEntry(entry.item, entry.kind, entry.kind === 'series' ? 'Series Spotlight' : 'Movie Spotlight');
    });

    state.movies.slice(0, 8).forEach(function(item) {
        pushEntry(item, 'movie', 'Movie Spotlight');
    });

    state.series.slice(0, 8).forEach(function(item) {
        pushEntry(item, 'series', 'Series Spotlight');
    });

    return pool;
}

function refreshFeaturedRotation() {
    var previousKey = state.featuredItem && state.featuredKind
        ? (state.featuredKind + ':' + state.featuredItem.id)
        : '';
    var nextEntry;

    state.featuredRotationItems = buildFeaturedRotationItems();

    if (!state.featuredRotationItems.length) {
        state.featuredIndex = 0;
        return;
    }

    state.featuredIndex = 0;
    state.featuredRotationItems.some(function(entry, index) {
        if ((entry.kind + ':' + entry.item.id) === previousKey) {
            state.featuredIndex = index;
            return true;
        }
        return false;
    });

    nextEntry = state.featuredRotationItems[state.featuredIndex];
    if (state.currentView === 'home' || !state.featuredItem) {
        updateFeatured(nextEntry.item, nextEntry.label);
        return;
    }

    state.featuredItem = nextEntry.item;
    state.featuredKind = nextEntry.kind;
    state.featuredLabel = nextEntry.label;
    state.featuredKey = nextEntry.kind + ':' + nextEntry.item.id;
}

function advanceFeaturedRotation() {
    var nextEntry;

    if (!state.featuredRotationItems.length) {
        refreshFeaturedRotation();
    }

    if (state.featuredRotationItems.length < 2) {
        if (state.featuredRotationItems[0]) {
            updateFeatured(state.featuredRotationItems[0].item, state.featuredRotationItems[0].label);
        }
        return;
    }

    state.featuredIndex = (state.featuredIndex + 1) % state.featuredRotationItems.length;
    nextEntry = state.featuredRotationItems[state.featuredIndex];
    if (state.currentView === 'home') {
        updateFeatured(nextEntry.item, nextEntry.label);
        return;
    }

    state.featuredItem = nextEntry.item;
    state.featuredKind = nextEntry.kind;
    state.featuredLabel = nextEntry.label;
    state.featuredKey = nextEntry.kind + ':' + nextEntry.item.id;
}

function startFeaturedRotation() {
    if (state.featuredTimer) {
        clearInterval(state.featuredTimer);
        state.featuredTimer = null;
    }

    state.featuredTimer = setInterval(function() {
        advanceFeaturedRotation();
    }, FEATURED_ROTATION_MS);
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

function applyFeaturedContent(item, kind, posterUrl) {
    var poster = byId('featuredPoster');
    var label = poster ? poster.querySelector('.featured-poster-label') : null;

    byId('featuredTag').textContent = kind;
    byId('featuredTitle').textContent = item.name || 'Untitled';
    byId('featuredMeta').textContent = formatMetaLine(item, kind);
    byId('featuredDescription').textContent =
        item.description ||
        item.releaseInfo ||
        'Linked addon metadata is connected. This item is being used as the featured spotlight.';

    if (!poster || !label) {
        return;
    }

    poster.style.backgroundImage = '';
    if (posterUrl) {
        poster.style.setProperty('--hero-art', 'url("' + posterUrl + '")');
        label.textContent = kind;
        return;
    }

    poster.style.removeProperty('--hero-art');
    label.textContent = 'No artwork';
}

function updateFeatured(item, kind, options) {
    var nextKey;
    var normalizedKind;
    var posterUrl;
    var poster;
    var token;
    var immediate;

    if (!item) {
        return;
    }

    options = options || {};
    nextKey = kind + ':' + (item.id || item.name || '');
    if (!options.force && state.featuredRenderedKey === nextKey) {
        state.featuredKey = nextKey;
        return;
    }

    normalizedKind = kind && kind.toLowerCase().indexOf('series') !== -1 ? 'series' : 'movie';
    posterUrl = item.background || item.poster || '';
    poster = byId('featuredPoster');

    state.featuredKey = nextKey;
    state.featuredItem = item;
    state.featuredKind = normalizedKind;
    state.featuredLabel = kind;
    state.featuredTransitionToken = Number(state.featuredTransitionToken || 0) + 1;
    token = state.featuredTransitionToken;
    immediate = Boolean(options.immediate || !state.featuredRenderedKey || !poster);

    preloadFeaturedArtwork(posterUrl).catch(function() {
        return null;
    }).then(function() {
        if (token !== state.featuredTransitionToken) {
            return;
        }

        if (!poster) {
            applyFeaturedContent(item, kind, posterUrl);
            state.featuredRenderedKey = nextKey;
            return;
        }

        if (immediate) {
            clearFeaturedTransitionTimer();
            poster.classList.remove('is-transitioning');
            applyFeaturedContent(item, kind, posterUrl);
            state.featuredRenderedKey = nextKey;
            return;
        }

        clearFeaturedTransitionTimer();
        poster.classList.add('is-transitioning');
        state.featuredTransitionTimer = setTimeout(function() {
            if (token !== state.featuredTransitionToken) {
                return;
            }
            applyFeaturedContent(item, kind, posterUrl);
            state.featuredRenderedKey = nextKey;
            requestAnimationFrame(function() {
                if (token !== state.featuredTransitionToken) {
                    return;
                }
                poster.classList.remove('is-transitioning');
            });
            state.featuredTransitionTimer = null;
        }, FEATURED_FADE_MS);
    });
}

function scheduleFeaturedUpdate(item, kind) {
    return {
        item: item,
        kind: kind
    };
}

function normalizeCatalogPayload(payload) {
    if (!payload || !Array.isArray(payload.metas)) {
        return [];
    }
    return payload.metas.slice(0, HOME_CATALOG_LIMIT);
}

function normalizeCatalogPayloadWithLimit(payload, limit) {
    if (!payload || !Array.isArray(payload.metas)) {
        return [];
    }
    return payload.metas.slice(0, typeof limit === 'number' ? limit : HOME_CATALOG_LIMIT);
}

function uniqueCatalogItems(items, limit) {
    var seen = {};
    var output = [];

    (items || []).forEach(function(item) {
        var key;

        if (!item || !item.id) {
            return;
        }

        key = item.id;
        if (seen[key]) {
            return;
        }

        seen[key] = true;
        output.push(item);
    });

    if (typeof limit === 'number') {
        return output.slice(0, limit);
    }

    return output;
}

function canonicalizeAddonUrl(url) {
    var value = String(url || '').trim().replace(/\/+$/, '');

    if (value.slice(-14) === '/manifest.json') {
        return value.slice(0, -14);
    }

    return value;
}

function buildAddonTransportUrl(baseUrl) {
    var cleanBaseUrl = canonicalizeAddonUrl(baseUrl);

    return cleanBaseUrl ? cleanBaseUrl + '/manifest.json' : '';
}

function buildBuiltinAddonManifest(baseUrl) {
    var cleanBaseUrl = canonicalizeAddonUrl(baseUrl);

    if (cleanBaseUrl === CINEMETA_BASE) {
        return {
            id: 'org.cinemeta',
            name: 'Cinemeta',
            version: 'fallback',
            description: 'Fallback Cinemeta manifest',
            resources: [
                { name: 'catalog', types: ['movie', 'series'] },
                { name: 'meta', types: ['movie', 'series'] }
            ],
            types: ['movie', 'series'],
            catalogs: [
                {
                    type: 'movie',
                    id: 'top',
                    name: 'Top',
                    extra: [{ name: 'search' }, { name: 'skip' }]
                },
                {
                    type: 'series',
                    id: 'top',
                    name: 'Top',
                    extra: [{ name: 'search' }, { name: 'skip' }]
                }
            ]
        };
    }

    if (cleanBaseUrl === OPENSUBTITLES_BASE) {
        return {
            id: 'org.opensubtitles.v3',
            name: 'OpenSubtitles v3',
            version: 'fallback',
            description: 'Fallback OpenSubtitles manifest',
            resources: [
                { name: 'subtitles', types: ['movie', 'series'] }
            ],
            types: ['movie', 'series'],
            catalogs: []
        };
    }

    return null;
}

function normalizeAddonManifest(baseUrl, manifest) {
    var rawTypes = Array.isArray(manifest && manifest.types) ? manifest.types : [];
    var cleanBaseUrl = canonicalizeAddonUrl(baseUrl);
    var types = rawTypes.map(function(value) {
        return normalizeAddonType(value);
    }).filter(Boolean);
    var resources = Array.isArray(manifest && manifest.resources) ? manifest.resources : [];
    var catalogs = Array.isArray(manifest && manifest.catalogs) ? manifest.catalogs : [];

    return {
        id: manifest && manifest.id ? manifest.id : cleanBaseUrl,
        transportUrl: buildAddonTransportUrl(cleanBaseUrl),
        manifest: {
            id: manifest && manifest.id ? manifest.id : cleanBaseUrl,
            name: manifest && manifest.name ? manifest.name : cleanBaseUrl,
            version: manifest && manifest.version ? manifest.version : '0.0.0',
            description: manifest && manifest.description ? manifest.description : '',
            logo: manifest && manifest.logo ? manifest.logo : null,
            types: types,
            resources: resources.map(function(resource) {
                if (typeof resource === 'string') {
                    return {
                        name: resource,
                        types: types.slice(),
                        idPrefixes: null
                    };
                }

                return {
                    name: resource && resource.name ? resource.name : '',
                    types: Array.isArray(resource && resource.types)
                        ? resource.types.map(function(value) {
                            return normalizeAddonType(value);
                        }).filter(Boolean)
                        : types.slice(),
                    idPrefixes: Array.isArray(resource && resource.idPrefixes)
                        ? resource.idPrefixes.filter(Boolean)
                        : null
                };
            }),
            catalogs: catalogs.map(function(catalog) {
                return {
                    id: catalog && catalog.id ? catalog.id : '',
                    type: normalizeAddonType(catalog && catalog.type ? catalog.type : ''),
                    name: catalog && catalog.name ? catalog.name : (catalog && catalog.id ? catalog.id : 'Catalog'),
                    extra: Array.isArray(catalog && catalog.extra) ? catalog.extra : []
                };
            })
        }
    };
}

function buildSupabaseHeaders(token) {
    return {
        apikey: SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + (token || SUPABASE_ANON_KEY)
    };
}

function extractAddonUrls(rows) {
    return (rows || []).map(function(row) {
        return row && (row.url || row.base_url) ? row.url || row.base_url : null;
    }).filter(Boolean);
}

function isMissingSupabaseResource(error) {
    var message = String(error && error.message || '');

    return message.indexOf('PGRST205') !== -1
        || message.indexOf('PGRST202') !== -1
        || message.indexOf('Could not find the table') !== -1
        || message.indexOf('Could not find the function') !== -1
        || message.indexOf('HTTP 404') === 0;
}

function buildCatalogOptionKey(addon, catalog) {
    return [
        addonBaseUrl(addon.transportUrl) || addon.id || '',
        normalizeAddonType(catalog.type),
        catalog.id || '',
        catalog.name || ''
    ].join('::');
}

function buildCatalogOptions(type) {
    var options = [];
    var labelCounts = {};
    var preferredTypes = getCompatibleTypes(type);

    state.addons.forEach(function(addon) {
        var catalogs = addon && addon.manifest && Array.isArray(addon.manifest.catalogs)
            ? addon.manifest.catalogs
            : [];
        var addonName = addon && addon.manifest && addon.manifest.name ? addon.manifest.name : 'Addon';

        if (!addonSupportsResource(addon, ['catalog'], type)) {
            return;
        }

        catalogs.forEach(function(catalog) {
            var catalogType = normalizeAddonType(catalog && catalog.type);
            var extra = Array.isArray(catalog && catalog.extra) ? catalog.extra : [];
            var label;

            if (!catalog || !catalog.id || preferredTypes.indexOf(catalogType) === -1) {
                return;
            }

            label = catalog.name || catalog.id;
            labelCounts[label] = (labelCounts[label] || 0) + 1;

            options.push({
                key: buildCatalogOptionKey(addon, catalog),
                label: label,
                addonName: addonName,
                addon: addon,
                type: catalogType,
                catalogId: catalog.id,
                supportsSearch: extra.some(function(entry) {
                    return entry && entry.name === 'search';
                }),
                supportsSkip: extra.some(function(entry) {
                    return entry && entry.name === 'skip';
                })
            });
        });
    });

    return options.map(function(option) {
        var nextOption = {
            key: option.key,
            label: option.label,
            addonName: option.addonName,
            addon: option.addon,
            type: option.type,
            catalogId: option.catalogId,
            supportsSearch: option.supportsSearch,
            supportsSkip: option.supportsSkip
        };

        if (labelCounts[option.label] > 1) {
            nextOption.label = option.label + ' • ' + option.addonName;
        }

        return nextOption;
    });
}

function selectPreferredCatalogOption(options) {
    var ranked = (options || []).slice();

    ranked.sort(function(left, right) {
        function score(option) {
            var baseUrl = option && option.addon ? addonBaseUrl(option.addon.transportUrl) : '';
            var value = 0;

            if (baseUrl === CINEMETA_BASE && option.catalogId === 'top') {
                value += 20;
            }
            if (option.catalogId === 'top') {
                value += 10;
            }
            if (String(option.label || '').toLowerCase().indexOf('top') !== -1) {
                value += 4;
            }
            if (option.supportsSearch) {
                value += 2;
            }

            return value;
        }

        return score(right) - score(left);
    });

    return ranked[0] || null;
}

function getBrowseOptions(type) {
    return type === 'movie' ? state.movieGenres : state.seriesGenres;
}

function getSelectedBrowseKey(type) {
    return type === 'movie' ? state.selectedMovieGenre : state.selectedSeriesGenre;
}

function setSelectedBrowseKey(type, key) {
    if (type === 'movie') {
        state.selectedMovieGenre = key;
        return;
    }

    state.selectedSeriesGenre = key;
}

function getSelectedBrowseOption(type) {
    var options = getBrowseOptions(type);
    var key = getSelectedBrowseKey(type);
    var selected = options.filter(function(option) {
        return option.key === key;
    })[0];

    return selected || options[0] || null;
}

function getSelectedBrowseLabel(type) {
    var selected = getSelectedBrowseOption(type);

    return selected ? selected.label : 'Unavailable';
}

function buildCatalogRequestUrl(option, skip, extraArgs) {
    var baseUrl = option && option.addon ? addonBaseUrl(option.addon.transportUrl) : '';
    var args = extraArgs || {};
    var parts;

    if (!baseUrl || !option) {
        return '';
    }
    if (!args || !Object.keys(args).length) {
        return skip > 0 && option.supportsSkip
            ? baseUrl + '/catalog/' + encodeURIComponent(option.type) + '/' + encodeURIComponent(option.catalogId) + '/skip=' + skip + '.json'
            : baseUrl + '/catalog/' + encodeURIComponent(option.type) + '/' + encodeURIComponent(option.catalogId) + '.json';
    }

    if (skip > 0 && option.supportsSkip && typeof args.skip === 'undefined') {
        args.skip = String(skip);
    }

    parts = Object.keys(args).map(function(name) {
        return encodeURIComponent(name) + '=' + encodeURIComponent(String(args[name]));
    });

    return baseUrl
        + '/catalog/'
        + encodeURIComponent(option.type)
        + '/'
        + encodeURIComponent(option.catalogId)
        + '/'
        + parts.join('&')
        + '.json';
}

function fetchCatalogItems(option, limit) {
    var targetLimit = typeof limit === 'number' ? limit : HOME_CATALOG_LIMIT;
    var pageSize = HOME_CATALOG_PAGE_SIZE;
    var skips = [];
    var skip = 0;

    if (!option) {
        return Promise.resolve([]);
    }

    if (!option.supportsSkip) {
        return requestJson(buildCatalogRequestUrl(option, 0), 'GET').then(function(payload) {
            return uniqueCatalogItems(normalizeCatalogPayloadWithLimit(payload, targetLimit), targetLimit);
        });
    }

    while (skip < targetLimit) {
        skips.push(skip);
        skip += pageSize;
    }

    return Promise.all(skips.map(function(pageSkip) {
        return requestJson(buildCatalogRequestUrl(option, pageSkip), 'GET').catch(function() {
            return { metas: [] };
        });
    })).then(function(payloads) {
        var items = [];

        payloads.forEach(function(payload) {
            items = items.concat(normalizeCatalogPayloadWithLimit(payload, pageSize));
        });

        return uniqueCatalogItems(items, targetLimit);
    });
}

function normalizeHttpError(error) {
    var parsed;
    var candidates;
    var message;

    if (error instanceof Error) {
        return error.message;
    }

    if (!error) {
        return 'Request failed';
    }

    parsed = safeJsonParse(error.text);
    candidates = [
        parsed && parsed.msg,
        parsed && parsed.message,
        parsed && parsed.error_description,
        parsed && parsed.error,
        parsed && parsed.hint
    ];

    message = candidates.filter(function(value) {
        return typeof value === 'string' && value.trim();
    })[0];

    if (!message && error.text) {
        message = String(error.text).replace(/\s+/g, ' ').trim();
    }

    if (!message) {
        return 'HTTP ' + (error.status || 0);
    }

    return (error.status ? 'HTTP ' + error.status + ': ' : '') + message;
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

function requestJsonWithHeaders(url, method, body, headers) {
    return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        var payload = body ? JSON.stringify(body) : null;
        xhr.open(method || 'GET', url, true);
        xhr.setRequestHeader('Accept', 'application/json');
        if (body) {
            xhr.setRequestHeader('Content-Type', 'application/json');
        }
        Object.keys(headers || {}).forEach(function(name) {
            xhr.setRequestHeader(name, headers[name]);
        });
        xhr.onreadystatechange = function() {
            var parsed;
            if (xhr.readyState !== 4) {
                return;
            }
            if (xhr.status < 200 || xhr.status >= 300) {
                reject({
                    status: xhr.status,
                    text: xhr.responseText
                });
                return;
            }
            parsed = safeJsonParse(xhr.responseText);
            if (xhr.responseText && !parsed) {
                reject(new Error('Invalid JSON response'));
                return;
            }
            resolve(parsed);
        };
        xhr.onerror = function() {
            reject(new Error('Network request failed'));
        };
        xhr.send(payload);
    }).catch(function(error) {
        throw new Error(normalizeHttpError(error));
    });
}

function requestSupabaseAuth(path, method, body) {
    return requestJsonWithHeaders(
        SUPABASE_URL + path,
        method || 'GET',
        body,
        {
            apikey: SUPABASE_ANON_KEY
        }
    );
}

function requestSupabaseWithToken(path, method, body, token) {
    return requestJsonWithHeaders(
        SUPABASE_URL + path,
        method || 'GET',
        body,
        buildSupabaseHeaders(token)
    );
}

function requestSupabaseWithSession(path, method, body) {
    return requestSupabaseWithToken(path, method, body, state.authKey).catch(function(error) {
        if (!state.refreshToken || error.message.indexOf('HTTP 401') !== 0) {
            throw error;
        }

        return refreshSessionIfNeeded().then(function(refreshed) {
            if (!refreshed) {
                throw error;
            }

            return requestSupabaseWithToken(path, method, body, state.authKey);
        });
    });
}

function fetchCurrentSupabaseUser() {
    if (!state.authKey) {
        return Promise.resolve(null);
    }

    return requestSupabaseWithSession('/auth/v1/user', 'GET').then(function(payload) {
        return payload && payload.user ? payload.user : payload;
    });
}

function fetchCurrentSupabaseUserForToken(token) {
    if (!token) {
        return Promise.resolve(null);
    }

    return requestSupabaseWithToken('/auth/v1/user', 'GET', null, token).then(function(payload) {
        return payload && payload.user ? payload.user : payload;
    }).catch(function() {
        return null;
    });
}

function fetchEffectiveOwnerId() {
    if (!state.authKey) {
        state.ownerId = null;
        return Promise.resolve(null);
    }
    if (state.ownerId) {
        return Promise.resolve(state.ownerId);
    }

    return requestSupabaseWithSession('/rest/v1/rpc/get_sync_owner', 'POST', {}).then(function(payload) {
        state.ownerId = payload;
        return payload;
    });
}

function fetchAddonUrlsFromNuvio() {
    if (!state.authKey) {
        return Promise.resolve(DEFAULT_ADDON_URLS.slice());
    }

    return fetchEffectiveOwnerId().then(function(ownerId) {
        if (!ownerId) {
            return DEFAULT_ADDON_URLS.slice();
        }

        return requestSupabaseWithSession(
            '/rest/v1/addons?user_id=eq.' + encodeURIComponent(ownerId) + '&profile_id=eq.1&select=url,sort_order&order=sort_order.asc',
            'GET'
        ).then(function(rows) {
            var urls = extractAddonUrls(rows);

            if (urls.length) {
                return urls;
            }

            return DEFAULT_ADDON_URLS.slice();
        }).catch(function(error) {
            if (!isMissingSupabaseResource(error)) {
                throw error;
            }

            return requestSupabaseWithSession(
                '/rest/v1/tv_addons?owner_id=eq.' + encodeURIComponent(ownerId) + '&select=base_url,position&order=position.asc',
                'GET'
            ).then(function(rows) {
                var urls = extractAddonUrls(rows);

                if (urls.length) {
                    return urls;
                }

                return DEFAULT_ADDON_URLS.slice();
            }).catch(function(tvError) {
                if (!isMissingSupabaseResource(tvError)) {
                    throw tvError;
                }

                return requestSupabaseWithSession('/rest/v1/rpc/sync_pull_addons', 'POST', {
                    p_profile_id: 1
                }).then(function(rows) {
                    var urls = extractAddonUrls(rows);

                    if (urls.length) {
                        return urls;
                    }

                    return DEFAULT_ADDON_URLS.slice();
                }).catch(function() {
                    return DEFAULT_ADDON_URLS.slice();
                });
            });
        });
    });
}

function fetchAddonDefinition(baseUrl) {
    var cleanBaseUrl = canonicalizeAddonUrl(baseUrl);

    if (!cleanBaseUrl) {
        return Promise.resolve(null);
    }

    return requestJson(buildAddonTransportUrl(cleanBaseUrl), 'GET').catch(function() {
        var fallback = buildBuiltinAddonManifest(cleanBaseUrl);

        if (!fallback) {
            return null;
        }

        return fallback;
    }).then(function(manifest) {
        if (!manifest) {
            return null;
        }

        return normalizeAddonManifest(cleanBaseUrl, manifest);
    });
}

function refreshSessionIfNeeded() {
    if (!state.authKey && !state.refreshToken) {
        return Promise.resolve(false);
    }

    if (!state.refreshToken) {
        return fetchCurrentSupabaseUserForToken(state.authKey).then(function(user) {
            if (user) {
                state.user = user;
                localStorage.setItem(STORAGE_USER, JSON.stringify(user));
                updateUserPanel();
                return true;
            }

            return false;
        }).catch(function() {
            return false;
        });
    }

    return requestSupabaseAuth('/auth/v1/token?grant_type=refresh_token', 'POST', {
        refresh_token: state.refreshToken
    }).then(function(payload) {
        if (!payload || !payload.access_token) {
            throw new Error('No access token returned');
        }

        state.authKey = payload.access_token;
        state.refreshToken = payload.refresh_token || state.refreshToken;
        localStorage.setItem(STORAGE_AUTH, state.authKey);
        if (state.refreshToken) {
            localStorage.setItem(STORAGE_REFRESH, state.refreshToken);
        }
        state.ownerId = null;

        return fetchCurrentSupabaseUserForToken(state.authKey).then(function(user) {
            if (user) {
                state.user = user;
                localStorage.setItem(STORAGE_USER, JSON.stringify(user));
            }
            updateUserPanel();
            return true;
        });
    }).catch(function() {
        storeSession(null, null, null);
        return false;
    });
}

function fetchCatalogManifest() {
    var movieOptions = buildCatalogOptions('movie');
    var seriesOptions = buildCatalogOptions('series');
    var selectedMovie = getSelectedBrowseOption('movie');
    var selectedSeries = getSelectedBrowseOption('series');
    var preferredMovie = selectedMovie && movieOptions.some(function(option) {
        return option.key === selectedMovie.key;
    }) ? selectedMovie : selectPreferredCatalogOption(movieOptions);
    var preferredSeries = selectedSeries && seriesOptions.some(function(option) {
        return option.key === selectedSeries.key;
    }) ? selectedSeries : selectPreferredCatalogOption(seriesOptions);

    state.movieGenres = movieOptions;
    state.seriesGenres = seriesOptions;
    setSelectedBrowseKey('movie', preferredMovie ? preferredMovie.key : '');
    setSelectedBrowseKey('series', preferredSeries ? preferredSeries.key : '');
    renderBrowseGenreRows();

    return Promise.resolve({
        movies: movieOptions,
        series: seriesOptions
    });
}

function renderBrowseGenreRows() {
    function renderRow(containerId, options, activeKey, onSelect) {
        var container = byId(containerId);
        container.innerHTML = '';

        options.forEach(function(option) {
            var button = document.createElement('button');
            button.className = 'genre-chip';
            button.type = 'button';
            button.setAttribute('tabindex', getInteractiveTabIndex());
            if (option.key === activeKey) {
                button.classList.add('is-selected');
            }
            button.textContent = option.label;
            button.addEventListener('click', function() {
                onSelect(option);
            });
            container.appendChild(button);
        });
    }

    renderRow('movieGenreRow', state.movieGenres, state.selectedMovieGenre, function(option) {
        setSelectedBrowseKey('movie', option.key);
        state.movieSkip = 0;
        fetchBrowseCatalog('movie', false);
    });

    renderRow('seriesGenreRow', state.seriesGenres, state.selectedSeriesGenre, function(option) {
        setSelectedBrowseKey('series', option.key);
        state.seriesSkip = 0;
        fetchBrowseCatalog('series', false);
    });
}

function renderBrowseViews() {
    renderCardRows('movieGrid', state.movieBrowseItems, 'movie', 5);
    renderCardRows('seriesGrid', state.seriesBrowseItems, 'series', 5);

    byId('movieCount').textContent = state.movieBrowseItems.length + ' loaded • ' + getSelectedBrowseLabel('movie');
    byId('seriesCount').textContent = state.seriesBrowseItems.length + ' loaded • ' + getSelectedBrowseLabel('series');
    renderBrowseGenreRows();
}

function fetchBrowseCatalog(type, append) {
    var option = getSelectedBrowseOption(type);
    var skip = type === 'movie' ? state.movieSkip : state.seriesSkip;

    if (!option) {
        if (type === 'movie') {
            state.movieBrowseItems = [];
        } else {
            state.seriesBrowseItems = [];
        }
        renderBrowseViews();
        updateConnectionStatus('No addon catalogs are available for ' + type + '.', false, true);
        return Promise.resolve();
    }
    if (append && skip > 0 && !option.supportsSkip) {
        updateConnectionStatus('This catalog does not support loading more items.', false, true);
        return Promise.resolve();
    }

    updateConnectionStatus('Loading ' + type + ' browse...', false, false);

    return requestJson(buildCatalogRequestUrl(option, skip), 'GET').then(function(payload) {
        var items = uniqueCatalogItems(normalizeCatalogPayloadWithLimit(payload, 24), 24);
        if (type === 'movie') {
            state.movieBrowseItems = append ? state.movieBrowseItems.concat(items) : items;
        } else {
            state.seriesBrowseItems = append ? state.seriesBrowseItems.concat(items) : items;
        }
        renderBrowseViews();
        updateConnectionStatus('Addon catalogs ready', true, false);
        if ((type === 'movie' && state.currentView === 'movies') || (type === 'series' && state.currentView === 'series')) {
            setTimeout(focusCurrent, 0);
        }
    }).catch(function(error) {
        updateConnectionStatus('Catalog error: ' + error.message, false, true);
    });
}

function fetchCatalogs() {
    updateConnectionStatus('Loading catalogs...', false, false);

    return fetchCatalogManifest().then(function() {
        var movieOption = getSelectedBrowseOption('movie');
        var seriesOption = getSelectedBrowseOption('series');
        var movieRequest = movieOption
            ? fetchCatalogItems(movieOption, HOME_CATALOG_LIMIT).catch(function() {
                return [];
            })
            : Promise.resolve([]);
        var seriesRequest = seriesOption
            ? fetchCatalogItems(seriesOption, HOME_CATALOG_LIMIT).catch(function() {
                return [];
            })
            : Promise.resolve([]);

        return Promise.all([movieRequest, seriesRequest]).then(function(results) {
            state.movies = results[0];
            state.series = results[1];
            state.movieBrowseItems = state.movies.slice(0, 24);
            state.seriesBrowseItems = state.series.slice(0, 24);
            renderCatalogViews();
            renderBrowseViews();

            if (!state.movies.length && !state.series.length) {
                updateConnectionStatus('No addon catalogs are available yet.', false, true);
                return;
            }

            updateConnectionStatus('Addon catalogs ready', true, false);
            focusCurrent();
        });
    }).catch(function(error) {
        updateConnectionStatus('Catalog error: ' + error.message, false, true);
        setLoginMessage('Catalog fetch failed: ' + error.message, 'error');
    });
}

function getQrAuthHeaders() {
    return {
        apikey: SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + (state.qrAuthAccessToken || SUPABASE_ANON_KEY)
    };
}

function extractQrSessionTokens(payload) {
    if (!payload || typeof payload !== 'object') {
        return null;
    }

    return {
        accessToken: payload.access_token || payload.accessToken || (payload.session && payload.session.access_token) || null,
        refreshToken: payload.refresh_token || payload.refreshToken || (payload.session && payload.session.refresh_token) || null
    };
}

function generateQrDeviceNonce() {
    var bytes;
    var binary = '';

    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
    }

    bytes = new Uint8Array(24);
    if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
        window.crypto.getRandomValues(bytes);
    } else {
        bytes = Array.prototype.map.call(bytes, function() {
            return Math.floor(Math.random() * 256);
        });
    }

    Array.prototype.forEach.call(bytes, function(value) {
        binary += String.fromCharCode(value);
    });

    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function clearQrLoginTimers() {
    if (state.qrPollTimer) {
        clearInterval(state.qrPollTimer);
        state.qrPollTimer = null;
    }
    if (state.qrExpiresTimer) {
        clearInterval(state.qrExpiresTimer);
        state.qrExpiresTimer = null;
    }
}

function setQrExpiryMessage(text) {
    var el = byId('qrLoginExpiry');
    if (!el) {
        return;
    }
    el.textContent = text;
}

function renderQrLoginSignedIn() {
    var image = byId('qrLoginImage');
    var code = byId('qrLoginCode');

    clearQrLoginTimers();
    state.qrStarting = false;
    state.qrCode = null;
    state.qrLoginUrl = '';
    state.qrDeviceNonce = '';
    state.qrExpiresAt = 0;

    if (image) {
        image.removeAttribute('src');
        image.classList.remove('is-ready');
    }
    if (code) {
        code.textContent = 'Browser already connected';
    }
    setQrExpiryMessage('Use Refresh QR to connect a different account from your phone.');
    setQrLoginMessage('QR login is available, but this browser already has a Nuvio session.', 'success');
}

function renderQrLoginPlaceholder(codeText, expiryText, helperText, tone) {
    var image = byId('qrLoginImage');
    var code = byId('qrLoginCode');

    if (image) {
        image.removeAttribute('src');
        image.classList.remove('is-ready');
    }
    if (code) {
        code.textContent = codeText;
    }
    setQrExpiryMessage(expiryText);
    setQrLoginMessage(helperText, tone);
}

function renderQrLoginSession(session) {
    var image = byId('qrLoginImage');
    var code = byId('qrLoginCode');

    if (image) {
        image.src = session.qrImageUrl;
        image.classList.add('is-ready');
    }
    if (code) {
        code.textContent = 'Code: ' + session.code;
    }
    setQrLoginMessage('Scan the QR code with your phone and approve the Nuvio sign-in.', null);
}

function refreshQrCountdown() {
    var remainingSeconds;

    if (!state.qrExpiresAt) {
        setQrExpiryMessage('Waiting for a fresh QR session.');
        return;
    }

    remainingSeconds = Math.max(0, Math.ceil((state.qrExpiresAt - Date.now()) / 1000));
    if (!remainingSeconds) {
        setQrExpiryMessage('This QR code expired. Refresh it to continue.');
        return;
    }

    setQrExpiryMessage('Expires in ' + remainingSeconds + 's');
}

function startQrCountdown() {
    if (state.qrExpiresTimer) {
        clearInterval(state.qrExpiresTimer);
        state.qrExpiresTimer = null;
    }
    refreshQrCountdown();
    state.qrExpiresTimer = setInterval(refreshQrCountdown, 1000);
}

function ensureQrAnonymousSession() {
    var baseHeaders = {
        apikey: SUPABASE_ANON_KEY,
        Authorization: 'Bearer ' + SUPABASE_ANON_KEY
    };

    if (state.qrAuthAccessToken) {
        return Promise.resolve(state.qrAuthAccessToken);
    }

    return requestJsonWithHeaders(SUPABASE_URL + '/auth/v1/signup', 'POST', {
        data: {
            tv_client: 'nuvio-web-pc'
        }
    }, baseHeaders).catch(function() {
        return requestJsonWithHeaders(SUPABASE_URL + '/auth/v1/token?grant_type=anonymous', 'POST', {}, baseHeaders);
    }).then(function(payload) {
        var tokens = extractQrSessionTokens(payload);

        if (!tokens || !tokens.accessToken) {
            throw new Error('QR auth bootstrap did not return a session token');
        }

        state.qrAuthAccessToken = tokens.accessToken;
        state.qrAuthRefreshToken = tokens.refreshToken || null;
        return tokens.accessToken;
    });
}

function startQrRpc(deviceNonce, includeDeviceName) {
    var body = {
        p_device_nonce: deviceNonce,
        p_redirect_base_url: TV_LOGIN_REDIRECT_BASE_URL
    };

    if (includeDeviceName) {
        body.p_device_name = APP_DEVICE_NAME;
    }

    return requestJsonWithHeaders(
        SUPABASE_URL + '/rest/v1/rpc/start_tv_login_session',
        'POST',
        body,
        getQrAuthHeaders()
    ).then(function(payload) {
        return Array.isArray(payload) ? payload[0] : payload;
    });
}

function extractQrApprovedSession(result) {
    var candidates = [
        result,
        result && result.data,
        result && result.result,
        result && result.session,
        result && result.nuvio,
        result && result.nuvioSession,
        result && result.nuvio_session,
        result && result.credentials
    ];
    var found = null;

    candidates.some(function(candidate) {
        var accessToken;
        var refreshToken;
        var user;

        if (Array.isArray(candidate)) {
            candidate = candidate[0];
        }
        if (!candidate || typeof candidate !== 'object') {
            return false;
        }

        accessToken = candidate.accessToken
            || candidate.access_token
            || candidate.authKey
            || candidate.auth_key
            || (candidate.session && candidate.session.access_token)
            || (candidate.nuvio && candidate.nuvio.accessToken)
            || (candidate.nuvio && candidate.nuvio.access_token)
            || (candidate.credentials && candidate.credentials.accessToken)
            || (candidate.credentials && candidate.credentials.access_token)
            || null;
        refreshToken = candidate.refreshToken
            || candidate.refresh_token
            || (candidate.session && candidate.session.refresh_token)
            || (candidate.nuvio && candidate.nuvio.refreshToken)
            || (candidate.nuvio && candidate.nuvio.refresh_token)
            || (candidate.credentials && candidate.credentials.refreshToken)
            || (candidate.credentials && candidate.credentials.refresh_token)
            || null;
        user = candidate.user
            || candidate.profile
            || candidate.nuvioUser
            || candidate.nuvio_user
            || (candidate.nuvio && candidate.nuvio.user)
            || (candidate.credentials && candidate.credentials.user)
            || null;

        if (!accessToken) {
            return false;
        }

        found = {
            accessToken: accessToken,
            refreshToken: refreshToken,
            user: user || null
        };
        return true;
    });

    return found;
}

function resolveQrApprovedUser(session) {
    if (session.user) {
        return Promise.resolve(session.user);
    }

    return requestSupabaseWithToken('/auth/v1/user', 'GET', null, session.accessToken).then(function(payload) {
        return payload && payload.user ? payload.user : payload;
    }).catch(function() {
        return null;
    });
}

function stopQrLoginSession(resetUi) {
    clearQrLoginTimers();
    state.qrSessionId += 1;
    state.qrStarting = false;
    state.qrCode = null;
    state.qrLoginUrl = '';
    state.qrDeviceNonce = '';
    state.qrExpiresAt = 0;

    if (resetUi && !state.authKey) {
        renderQrLoginPlaceholder(
            'Preparing QR sign-in…',
            'Waiting for a fresh QR session.',
            'Open the QR code on your phone to approve sign-in.',
            null
        );
    }
}

function exchangeQrLoginSession(sessionId) {
    return requestJsonWithHeaders(
        SUPABASE_URL + '/functions/v1/tv-logins-exchange',
        'POST',
        {
            code: state.qrCode,
            device_nonce: state.qrDeviceNonce
        },
        getQrAuthHeaders()
    ).then(function(result) {
        var session = extractQrApprovedSession(result);

        if (sessionId !== state.qrSessionId) {
            return null;
        }

        if (!session || !session.accessToken) {
            throw new Error('QR sign-in completed, but no Nuvio session token was returned');
        }

        return resolveQrApprovedUser(session).then(function(user) {
            storeSession(session.accessToken, session.refreshToken || null, user || session.user || null);
            updateSessionStatus('Signed in', true, false);
            setLoginMessage('Signed in successfully via QR code.', 'success');
            renderQrLoginSignedIn();
            return fetchInstalledAddons().then(function() {
                return fetchCatalogs();
            }).then(function() {
                setView('home', {
                    focusRegion: 'main',
                    resetMain: true
                });
            });
        });
    });
}

function pollQrLoginSession(sessionId) {
    return requestJsonWithHeaders(
        SUPABASE_URL + '/rest/v1/rpc/poll_tv_login_session',
        'POST',
        {
            p_code: state.qrCode,
            p_device_nonce: state.qrDeviceNonce
        },
        getQrAuthHeaders()
    ).then(function(payload) {
        var result = Array.isArray(payload) ? payload[0] : payload;
        var status = result && result.status ? result.status : null;

        if (sessionId !== state.qrSessionId || !status) {
            return;
        }

        if (status === 'approved') {
            clearQrLoginTimers();
            setQrExpiryMessage('Phone approved. Finishing web sign-in...');
            return exchangeQrLoginSession(sessionId).catch(function(error) {
                setQrLoginMessage('QR login failed: ' + error.message, 'error');
                setQrExpiryMessage('Refresh the QR code and try again.');
            });
        }

        if (status === 'expired') {
            clearQrLoginTimers();
            setQrLoginMessage('This QR code expired. Refresh it to continue.', 'error');
            setQrExpiryMessage('Expired');
            return;
        }

        setQrLoginMessage('Waiting for phone approval...', null);
    }).catch(function(error) {
        if (sessionId !== state.qrSessionId) {
            return;
        }
        clearQrLoginTimers();
        setQrLoginMessage('QR login failed: ' + error.message, 'error');
        setQrExpiryMessage('Refresh the QR code and try again.');
    });
}

function startQrLoginSession(forceRefresh) {
    var sessionId;
    var deviceNonce;

    if (state.currentView !== 'login') {
        return Promise.resolve();
    }

    if (state.authKey && !forceRefresh) {
        renderQrLoginSignedIn();
        return Promise.resolve();
    }

    if (state.qrStarting) {
        return Promise.resolve();
    }

    stopQrLoginSession(false);
    state.qrStarting = true;
    sessionId = state.qrSessionId + 1;
    state.qrSessionId = sessionId;
    deviceNonce = generateQrDeviceNonce();
    state.qrDeviceNonce = deviceNonce;

    renderQrLoginPlaceholder(
        'Preparing QR sign-in…',
        'Creating a fresh web login session.',
        'Open the QR code on your phone to approve sign-in.',
        null
    );

    if (byId('qrRefreshButton')) {
        byId('qrRefreshButton').disabled = true;
    }

    return ensureQrAnonymousSession().then(function() {
        return startQrRpc(deviceNonce, true).catch(function(error) {
            if (error.message && error.message.indexOf('p_device_name') !== -1) {
                return startQrRpc(deviceNonce, false);
            }
            throw error;
        });
    }).then(function(session) {
        var qrImageUrl;
        var pollSeconds;

        if (sessionId !== state.qrSessionId || !session) {
            return;
        }

        qrImageUrl = session.qr_image_url
            || 'https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=' + encodeURIComponent(session.qr_content || session.web_url || '');
        pollSeconds = Math.max(2, Number(session.poll_interval_seconds || 3));

        state.qrCode = session.code;
        state.qrLoginUrl = session.qr_content || session.web_url || '';
        state.qrExpiresAt = Date.parse(session.expires_at || '') || (Date.now() + 5 * 60 * 1000);
        state.qrStarting = false;

        renderQrLoginSession({
            code: session.code,
            qrImageUrl: qrImageUrl
        });
        startQrCountdown();
        state.qrPollTimer = setInterval(function() {
            pollQrLoginSession(sessionId);
        }, pollSeconds * 1000);
        pollQrLoginSession(sessionId);
    }).catch(function(error) {
        if (sessionId !== state.qrSessionId) {
            return;
        }
        state.qrStarting = false;
        renderQrLoginPlaceholder(
            'QR sign-in unavailable',
            'Refresh the QR code to try again.',
            'QR login failed: ' + error.message,
            'error'
        );
    }).finally(function() {
        if (byId('qrRefreshButton')) {
            byId('qrRefreshButton').disabled = false;
        }
    });
}

function storeSession(authKey, refreshToken, user) {
    state.authKey = authKey || null;
    state.refreshToken = refreshToken || null;
    state.user = user || null;
    state.ownerId = null;

    if (state.authKey) {
        localStorage.setItem(STORAGE_AUTH, state.authKey);
    } else {
        localStorage.removeItem(STORAGE_AUTH);
    }

    if (state.refreshToken) {
        localStorage.setItem(STORAGE_REFRESH, state.refreshToken);
    } else {
        localStorage.removeItem(STORAGE_REFRESH);
    }

    if (state.user) {
        localStorage.setItem(STORAGE_USER, JSON.stringify(state.user));
    } else {
        localStorage.removeItem(STORAGE_USER);
    }

    updateUserPanel();

    if (state.currentView === 'login') {
        if (state.authKey) {
            renderQrLoginSignedIn();
        } else {
            renderQrLoginPlaceholder(
                'Preparing QR sign-in…',
                'Waiting for a fresh QR session.',
                'Open the QR code on your phone to approve sign-in.',
                null
            );
        }
    }
}

function restoreStoredSession() {
    var authKey = localStorage.getItem(STORAGE_AUTH);
    var refreshToken = localStorage.getItem(STORAGE_REFRESH);
    var user = null;

    try {
        user = JSON.parse(localStorage.getItem(STORAGE_USER) || 'null');
    } catch (error) {
        user = null;
    }

    if (authKey) {
        state.authKey = authKey;
        state.refreshToken = refreshToken || null;
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

    return refreshSessionIfNeeded().then(function(isValid) {
        if (!isValid) {
            throw new Error('Stored session expired');
        }

        return fetchCurrentSupabaseUser();
    }).then(function(payload) {
        state.user = payload || null;
        localStorage.setItem(STORAGE_USER, JSON.stringify(state.user));
        updateUserPanel();
        updateSessionStatus('Signed in', true, false);
        setLoginMessage('Restored existing Nuvio session.', 'success');
    }).catch(function() {
        storeSession(null, null, null);
        updateSessionStatus('Stored session expired', false, true);
        setLoginMessage('Stored session was invalid. Sign in again.', 'error');
    });
}

function login(email, password) {
    setLoginMessage('Signing in...', null);

    return requestSupabaseAuth('/auth/v1/token?grant_type=password', 'POST', {
        email: email,
        password: password
    }).then(function(payload) {
        if (!payload || !payload.access_token) {
            throw new Error('No access token returned');
        }

        return fetchCurrentSupabaseUserForToken(payload.access_token).then(function(user) {
            storeSession(payload.access_token, payload.refresh_token || null, user || payload.user || null);
            updateSessionStatus('Signed in', true, false);
            setLoginMessage('Signed in successfully.', 'success');

            return fetchInstalledAddons().then(function() {
                return fetchCatalogs();
            }).then(function() {
                setView('home', {
                    focusRegion: 'main',
                    resetMain: true
                });
            });
        });
    });
}

function logout() {
    storeSession(null, null, null);
    state.streams = [];
    state.currentStream = null;
    updateSessionStatus('Signed out', false, false);
    setLoginMessage('Signed out locally.', null);
    setAddonsMessage('Sign in with Nuvio to load your synced stream addons.', null);

    return fetchInstalledAddons().then(function() {
        renderAddons();
        renderPlayerState();
        return fetchCatalogs();
    }).then(function() {
        if (state.currentView === 'login') {
            startQrLoginSession(false);
        }
    });
}

function fetchInstalledAddons() {
    return fetchAddonUrlsFromNuvio().then(function(urls) {
        var uniqueUrls = uniqueList((urls || []).map(canonicalizeAddonUrl).filter(Boolean));

        return Promise.all(uniqueUrls.map(function(url) {
            return fetchAddonDefinition(url);
        }));
    }).then(function(addons) {
        state.addons = (addons || []).filter(Boolean);
        renderAddons();
        return state.addons;
    }).catch(function(error) {
        return Promise.all(DEFAULT_ADDON_URLS.map(function(url) {
            return fetchAddonDefinition(url);
        })).then(function(defaultAddons) {
            state.addons = (defaultAddons || []).filter(Boolean);
            renderAddons();
            setAddonsMessage('Could not load synced addons. Showing default catalogs only.', 'error');
            return state.addons;
        });
    });
}

function getStreamCapableAddons(type, id) {
    return state.addons.filter(function(addon) {
        return addonSupportsResource(addon, ['stream'], type, id);
    });
}

function getSubtitleCapableAddons(type, id) {
    return state.addons.filter(function(addon) {
        return addonSupportsResource(addon, ['subtitles', 'subtitle'], type, id);
    });
}

function addonBaseUrl(transportUrl) {
    var cleanTransport = canonicalizeAddonUrl(transportUrl);

    if (!cleanTransport || cleanTransport.indexOf('http') !== 0) {
        return null;
    }

    return cleanTransport;
}

function getStreamBehaviorHints(streamEntry) {
    var raw = streamEntry && streamEntry.raw ? streamEntry.raw : null;
    return raw && raw.behaviorHints ? raw.behaviorHints : {};
}

function deriveFilenameFromUrl(url) {
    var cleanUrl;
    var filename = '';

    if (!url) {
        return '';
    }

    cleanUrl = String(url).split('#')[0].split('?')[0];
    filename = cleanUrl.slice(cleanUrl.lastIndexOf('/') + 1);

    try {
        return decodeURIComponent(filename);
    } catch (error) {
        return filename;
    }
}

function buildSubtitleExtraArgs(streamEntry) {
    var raw = streamEntry && streamEntry.raw ? streamEntry.raw : null;
    var hints = getStreamBehaviorHints(streamEntry);
    var parts = [];
    var videoHash = hints.videoHash || raw && raw.videoHash || '';
    var videoSize = hints.videoSize || raw && raw.videoSize || '';
    var filename = hints.filename || raw && raw.filename || deriveFilenameFromUrl(raw && raw.url);

    if (videoHash) {
        parts.push('videoHash=' + encodeURIComponent(String(videoHash)));
    }
    if (videoSize) {
        parts.push('videoSize=' + encodeURIComponent(String(videoSize)));
    }
    if (filename) {
        parts.push('filename=' + encodeURIComponent(String(filename)));
    }

    return parts.join('&');
}

function buildSubtitleTrackLabel(track, addonName, index) {
    var info = track || {};
    var baseLabel = info.label || info.name || '';
    var language = info.lang || info.language || '';
    var normalized = normalizeTrackLabel('subtitle', {
        language: language,
        label: baseLabel
    }, index);

    if (addonName && normalized.indexOf(addonName) === -1) {
        return normalized + ' • ' + addonName;
    }

    return normalized;
}

function normalizeAddonSubtitleTracks(addonName, baseUrl, subtitles) {
    return (subtitles || []).map(function(track, index) {
        var url = track && (track.url || track.src || track.file);

        if (!url) {
            return null;
        }
        if (!isEnglishSubtitleEntry(track)) {
            return null;
        }

        return {
            id: 'subtitle-ext-addon-' + addonName.replace(/[^a-z0-9]+/ig, '-').toLowerCase() + '-' + index,
            index: index,
            kind: 'external',
            url: resolveUrl(baseUrl, url),
            headers: getSubtitleRequestHeaders(null, track),
            language: track.lang || track.language || '',
            label: buildSubtitleTrackLabel(track, addonName, index)
        };
    }).filter(Boolean);
}

function normalizeSubtitleLookupId(value) {
    var raw = String(value || '').trim();
    var head = raw.split(':')[0];

    return head || raw;
}

function buildSubtitleIdCandidates(type, videoId) {
    var candidates = [];

    function push(value) {
        var normalized = String(value || '').trim();

        if (!normalized || candidates.indexOf(normalized) !== -1) {
            return;
        }

        candidates.push(normalized);
    }

    if (normalizeAddonType(type) === 'series') {
        push(videoId);
    }

    push(state.selectedItem && state.selectedItem.id);
    push(normalizeSubtitleLookupId(state.selectedItem && state.selectedItem.id));
    push(normalizeSubtitleLookupId(videoId));

    return candidates;
}

function fetchSubtitlesFromAddon(addon, type, videoId, streamEntry) {
    var baseUrl = addonBaseUrl(addon.transportUrl);
    var addonName = addon.manifest && addon.manifest.name ? addon.manifest.name : 'Addon';
    var extraArgs = buildSubtitleExtraArgs(streamEntry);
    var idCandidates = buildSubtitleIdCandidates(type, videoId);

    if (!baseUrl) {
        return Promise.resolve([]);
    }

    function requestNext(index) {
        var id = idCandidates[index];
        var requestUrl;

        if (!id) {
            return Promise.resolve([]);
        }

        requestUrl = baseUrl
            + '/subtitles/'
            + encodeURIComponent(type)
            + '/'
            + encodeURIComponent(id)
            + (extraArgs ? '/' + extraArgs : '')
            + '.json';

        return requestJson(requestUrl, 'GET').then(function(payload) {
            var subtitles = payload && Array.isArray(payload.subtitles)
                ? payload.subtitles
                : (payload && Array.isArray(payload.subtitle) ? payload.subtitle : []);

            if (!subtitles.length && index + 1 < idCandidates.length) {
                return requestNext(index + 1);
            }

            return normalizeAddonSubtitleTracks(addonName, baseUrl, subtitles);
        }).catch(function() {
            return requestNext(index + 1);
        });
    }

    return requestNext(0);
}

function refreshSubtitleAddonsForCurrentStream() {
    var streamEntry = state.currentStream;
    var type = state.selectedType;
    var videoId = state.selectedVideo && state.selectedVideo.id;
    var subtitleAddons;
    var requestId;

    if (!streamEntry || !type || !videoId) {
        state.addonSubtitleTracks = [];
        updateExternalSubtitleTracks();
        renderTrackSelectors();
        return Promise.resolve();
    }

    subtitleAddons = getSubtitleCapableAddons(type, videoId);
    requestId = state.subtitleRequestId + 1;
    state.subtitleRequestId = requestId;
    state.addonSubtitleTracks = [];
    updateExternalSubtitleTracks();
    renderTrackSelectors();

    if (!subtitleAddons.length) {
        return Promise.resolve();
    }

    return Promise.all(subtitleAddons.map(function(addon) {
        return fetchSubtitlesFromAddon(addon, type, videoId, streamEntry);
    })).then(function(groups) {
        if (requestId !== state.subtitleRequestId || streamEntry !== state.currentStream) {
            return;
        }

        state.addonSubtitleTracks = [];
        groups.forEach(function(group) {
            state.addonSubtitleTracks = state.addonSubtitleTracks.concat(group);
        });
        updateExternalSubtitleTracks();
        renderTrackSelectors();
        applyPreferredSubtitleSelection();
    });
}

function getDesktopAudioWarning(stream) {
    var text = [
        stream && stream.name,
        stream && stream.title,
        stream && stream.description,
        stream && stream.filename
    ].filter(Boolean).join(' ').toLowerCase();

    if (!text) {
        return '';
    }

    if (/\b(e-?ac-?3|ddp|dd\+|dolby digital plus|ac-?3|dts|dts-hd|truehd|atmos)\b/.test(text)) {
        return 'Audio codec may not work in desktop browsers';
    }

    if (/\b(aac|opus|vorbis|mp3)\b/.test(text)) {
        return '';
    }

    return '';
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
                var status = playable ? '' : 'Needs proxy';
                var audioWarning = getDesktopAudioWarning(stream);

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
                    audioWarning: playable ? audioWarning : '',
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

function renderEpisodePreview() {
    var previewArt = byId('episodePreviewArt');
    var previewEyebrow = byId('episodePreviewEyebrow');
    var previewTitle = byId('episodePreviewTitle');
    var previewMeta = byId('episodePreviewMeta');
    var previewDescription = byId('episodePreviewDescription');
    var video = state.selectedVideo;
    var artwork = getEpisodeArtwork(video);
    var description = getEpisodeDescription(video);

    if (!previewArt || !previewEyebrow || !previewTitle || !previewMeta || !previewDescription) {
        return;
    }

    if (state.selectedType !== 'series' || !video) {
        previewEyebrow.textContent = 'Episode preview';
        previewTitle.textContent = 'Choose an episode';
        previewMeta.textContent = 'No episode selected';
        previewDescription.textContent = 'Select an episode from the list to inspect its artwork, summary, and available streams.';
        previewArt.style.backgroundImage = 'linear-gradient(180deg, rgba(8, 10, 16, 0.08), rgba(8, 10, 16, 0.42)), #0b0d14';
        return;
    }

    previewEyebrow.textContent = 'Selected episode';
    previewTitle.textContent = getEpisodeTitle(video);
    previewMeta.textContent = formatEpisodeMeta(video);
    previewDescription.textContent = description || 'No episode synopsis was returned for this selection. Choose a stream below to start playback.';
    previewArt.style.backgroundImage = artwork
        ? 'linear-gradient(180deg, rgba(8, 10, 16, 0.08), rgba(8, 10, 16, 0.42)), url("' + artwork + '")'
        : 'linear-gradient(180deg, rgba(8, 10, 16, 0.08), rgba(8, 10, 16, 0.42)), #0b0d14';
}

function renderEpisodeRail() {
    var rail = byId('episodeRail');
    var section = byId('episodeSection');
    var count = byId('episodeCountLabel');

    if (!rail || !section || !count) {
        return;
    }

    rail.innerHTML = '';

    if (state.selectedType !== 'series' || !state.selectedEpisodes.length) {
        section.style.display = 'none';
        count.textContent = '0 episodes';
        renderEpisodePreview();
        return;
    }

    section.style.display = 'block';
    count.textContent = state.selectedEpisodes.length + ' episode' + (state.selectedEpisodes.length === 1 ? '' : 's');

    state.selectedEpisodes.forEach(function(video) {
        var button = document.createElement('button');
        var index = document.createElement('div');
        var copy = document.createElement('div');
        var title = document.createElement('div');
        var meta = document.createElement('div');
        var watched = document.createElement('div');

        button.className = 'episode-list-button';
        button.type = 'button';
        button.setAttribute('tabindex', getInteractiveTabIndex());
        if (state.selectedVideo && state.selectedVideo.id === video.id) {
            button.classList.add('is-selected');
        }
        if (isVideoWatched(video)) {
            button.classList.add('is-watched');
        }

        index.className = 'episode-list-index';
        index.textContent = 'E' + padEpisodeNumber(getVideoEpisode(video));

        copy.className = 'episode-list-copy';
        title.className = 'episode-list-title';
        meta.className = 'episode-list-meta';
        watched.className = 'episode-list-watched';

        title.textContent = getEpisodeTitle(video);
        meta.textContent = formatEpisodeMeta(video);
        watched.textContent = 'Watched';

        copy.appendChild(title);
        copy.appendChild(meta);
        copy.appendChild(watched);
        button.appendChild(index);
        button.appendChild(copy);

        button.addEventListener('click', function() {
            state.selectedVideo = video;
            renderEpisodeRail();
            renderEpisodePreview();
            loadStreamsForSelection();
        });

        rail.appendChild(button);
    });

    renderEpisodePreview();
}

function renderSeasonRail() {
    var select = byId('seasonSelect');
    var section = byId('episodeSection');
    var summary = byId('seasonSummary');

    if (!select || !section || !summary) {
        return;
    }

    select.innerHTML = '';

    if (state.selectedType !== 'series' || !state.availableSeasons.length) {
        select.disabled = true;
        summary.textContent = 'Pick a season to browse episodes and streams.';
        return;
    }

    state.availableSeasons.forEach(function(season) {
        var option = document.createElement('option');
        option.value = String(season);
        option.textContent = formatSeasonLabel(season);
        select.appendChild(option);
    });

    select.value = String(state.selectedSeason || state.availableSeasons[0]);
    select.disabled = state.availableSeasons.length < 2;
    select.onchange = function() {
        var season = parseInt(select.value, 10);

        if (isNaN(season) || state.selectedSeason === season) {
            return;
        }

        state.selectedSeason = season;
        updateSelectedEpisodesForSeason();
        state.streams = [];
        renderAddons();
        if (!state.selectedVideo) {
            setAddonsMessage('No episodes were returned for this season.', 'error');
            return;
        }
        loadStreamsForSelection();
    };

    summary.textContent = state.selectedEpisodes.length
        ? (formatSeasonLabel(state.selectedSeason) + ' • ' + state.selectedEpisodes.length + ' episode' + (state.selectedEpisodes.length === 1 ? '' : 's'))
        : (formatSeasonLabel(state.selectedSeason) + ' • No episodes returned');
}

function renderStreams() {
    var list = byId('streamList');
    var empty = byId('streamEmptyState');
    var selectionLabel = byId('streamSelectionLabel');

    if (!list || !empty || !selectionLabel) {
        return;
    }

    list.innerHTML = '';

    if (state.selectedType === 'series' && state.selectedVideo) {
        selectionLabel.textContent = getEpisodeTitle(state.selectedVideo);
    } else if (state.selectedType === 'movie' && state.selectedItem) {
        selectionLabel.textContent = state.selectedItem.name || 'Movie';
    } else {
        selectionLabel.textContent = 'Choose an episode';
    }

    if (!state.streams.length) {
        empty.classList.add('is-visible');
        if (state.selectedType === 'series') {
            empty.textContent = state.selectedVideo
                ? 'No streams loaded for this episode yet. Try another episode or addon.'
                : 'Pick an episode to load streams from your installed addons.';
        } else {
            empty.textContent = 'Choose a playable source to continue.';
        }
        return;
    }

    empty.classList.remove('is-visible');

    state.streams.forEach(function(streamEntry) {
        var button = document.createElement('button');
        var main = document.createElement('div');
        var body = document.createElement('div');
        var title = document.createElement('div');
        var addon = document.createElement('div');
        var note = document.createElement('div');

        button.className = 'stream-card';
        button.type = 'button';
        button.setAttribute('tabindex', getInteractiveTabIndex());
        button.addEventListener('click', function() {
            openStream(streamEntry);
        });

        main.className = 'stream-card-main';
        body.className = 'stream-card-body';
        title.className = 'stream-card-title';
        addon.className = 'stream-card-addon';
        note.className = 'stream-card-note';

        title.textContent = streamEntry.title;
        addon.textContent = streamEntry.addonName;
        note.textContent = streamEntry.description || 'No extra stream description.';

        body.appendChild(title);
        body.appendChild(addon);
        body.appendChild(note);
        main.appendChild(body);
        button.appendChild(main);
        list.appendChild(button);
    });
}

function syncAddonsLayoutOrder() {
    var view = queryAll('[data-view-panel="addons"]')[0];
    var episodeSection = byId('episodeSection');
    var episodeBrowser = episodeSection ? queryAll('#episodeSection .episode-browser')[0] : null;
    var detailHeroRow = byId('detailHeroRow');
    var streamSection = byId('streamSection');

    if (!view || !episodeSection || !detailHeroRow || !streamSection) {
        return;
    }

    if (state.selectedType === 'series') {
        detailHeroRow.style.display = 'none';
        if (view.firstElementChild !== episodeSection) {
            view.insertBefore(episodeSection, detailHeroRow);
        }
        if (episodeBrowser && streamSection.parentNode !== episodeBrowser) {
            episodeBrowser.appendChild(streamSection);
        }
        return;
    }

    detailHeroRow.style.display = '';
    if (streamSection.parentNode !== view) {
        view.insertBefore(streamSection, episodeSection);
    }
    if (view.firstElementChild !== detailHeroRow) {
        view.insertBefore(detailHeroRow, episodeSection);
    }
    if (detailHeroRow.nextElementSibling !== streamSection) {
        view.insertBefore(streamSection, episodeSection);
    }
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
            (state.selectedType === 'series' && state.selectedVideo && getEpisodeDescription(state.selectedVideo)) ||
            state.selectedItem.description ||
            state.selectedItem.releaseInfo ||
            'Installed addons and streams for the current selection appear below.';
        byId('selectedVideoLabel').textContent = state.selectedVideo
            ? (state.selectedType === 'series'
                ? (formatEpisodeMeta(state.selectedVideo) + ' • ' + getEpisodeTitle(state.selectedVideo))
                : (state.selectedVideo.title || state.selectedVideo.name || state.selectedVideo.id))
            : (state.selectedType === 'series' ? 'Choose an episode' : 'Movie stream target');
        selectedTypeSummary.textContent = state.selectedType === 'series'
            ? (state.selectedVideo ? getEpisodeTitle(state.selectedVideo) : (state.selectedItem.releaseInfo || 'Series'))
            : (state.selectedItem.releaseInfo || 'Movie');
        detailPlayButton.textContent = state.selectedType === 'series' ? 'Play Episode' : 'Play Movie';
        detailEpisodesButton.textContent = state.selectedType === 'series' ? 'Episode Browser' : 'Movie Details';
        detailArtwork.style.backgroundImage = state.selectedItem.background || state.selectedItem.poster
            ? 'linear-gradient(180deg, rgba(9, 11, 17, 0.18), rgba(9, 11, 17, 0.42)), url("' + (state.selectedItem.background || state.selectedItem.poster) + '")'
            : 'linear-gradient(180deg, rgba(9, 11, 17, 0.18), rgba(9, 11, 17, 0.42)), #0b0d14';
    }

    syncAddonsLayoutOrder();
    renderSeasonRail();
    renderEpisodeRail();
    renderStreams();
}

function renderPlayerState() {
    var video = byId('videoPlayer');
    var empty = byId('videoEmpty');
    var stream = state.currentStream;
    setPlayerToggleUi(false);

    if (!stream) {
        resetTrackState();
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
        setPlayerNextEpisodeUi();
        return;
    }

    byId('playerTitle').textContent = stream.title;
    byId('playerAddon').textContent = stream.addonName;
    byId('playerSource').textContent = stream.raw && stream.raw.url ? stream.raw.url : stream.status;
    byId('playerDescription').textContent =
        (stream.description || 'This stream came from the selected addon source.') +
        ' Audio is routed through the local streaming server when the source is not browser-native HLS.';
    syncExternalSubtitleTracks();

    if (!stream.playable || !stream.raw || !stream.raw.url) {
        empty.classList.remove('is-hidden');
        empty.textContent = 'This stream is not directly playable in the web shell. It likely needs a proxy or native playback pipeline.';
        clearPlaybackSurface();
        setPlayerStatus(stream.status);
        renderTrackSelectors();
        setPlayerNextEpisodeUi();
        return;
    }

    empty.classList.add('is-hidden');
    video.classList.remove('is-hidden');
    renderTrackSelectors();
    setPlayerNextEpisodeUi();
}

function startHtml5Stream(url) {
    var forceDirect = arguments[1] === true;
    var retryCorsSafe = arguments[2] === true;
    var serverOverride = arguments[3] || '';
    var video = byId('videoPlayer');
    var seekMs = state.pendingSeekMs || 0;
    var playbackUrl = serverOverride
        ? buildStreamingServerHlsUrl(url, state.currentStream, serverOverride, seekMs)
        : (retryCorsSafe ? getCorsSafeStreamingUrl(url) : (forceDirect ? url : getHtml5PlaybackUrl(url)));
    var isHls = /\.m3u8(?:\?|$)/i.test(playbackUrl);
    var usesStreamingServer = playbackUrl !== url;
    var isCorsUnsafeLocal = /^http:\/\/(127\.0\.0\.1|localhost):11470/i.test(playbackUrl);
    var isStremioLocal = /^https:\/\/local\.strem\.io:12470/i.test(playbackUrl);

    function beginHtml5Playback() {
        var playPromise = video.play();

        if (playPromise && typeof playPromise.then === 'function') {
            playPromise.then(function() {
                setPlayerStatus(usesStreamingServer ? 'Playing through streaming server' : 'Playing (HTML5)');
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

    stopAvplayPlayback();
    destroyHlsPlayer();
    byId('avplaySurface').classList.remove('is-active');
    video.classList.remove('is-hidden');
    video.muted = false;
    video.defaultMuted = false;
    video.volume = 1;
    state.playerMode = 'html5';
    state.html5FallbackUrl = playbackUrl !== url ? url : '';
    state.transcoderOffsetMs = usesStreamingServer ? seekMs : 0;
    state.pendingSeekMs = null;

    if (isHls && typeof Hls !== 'undefined' && Hls.isSupported()) {
        state.hlsPlayer = new Hls({
            enableWorker: true,
            lowLatencyMode: false
        });
        state.hlsPlayer.on(Hls.Events.ERROR, function(_, data) {
            if (data && data.fatal) {
                if (isCorsUnsafeLocal && !retryCorsSafe) {
                    setPlayerStatus('Retrying streaming server through local.strem.io');
                    startHtml5Stream(url, false, true);
                    return;
                }
                if (isStremioLocal && serverOverride !== NUVIO_STREAMING_SERVER_URL) {
                    setPlayerStatus('Stremio Service unavailable, trying Nuvio transcoder');
                    startHtml5Stream(url, false, false, NUVIO_STREAMING_SERVER_URL);
                    return;
                }
                setPlayerToggleUi(false);
                setPlayerStatus(usesStreamingServer
                    ? 'Streaming server unavailable. Start Stremio Service or tools/nuvio-transcoder.py.'
                    : 'HLS playback failed');
            }
        });
        state.hlsPlayer.on(Hls.Events.MANIFEST_PARSED, beginHtml5Playback);
        state.hlsPlayer.loadSource(playbackUrl);
        state.hlsPlayer.attachMedia(video);
    } else if (isHls && !video.canPlayType('application/vnd.apple.mpegurl')) {
        setPlayerStatus('HLS playback library unavailable. Check network access to hls.js.');
        setPlayerToggleUi(false);
        resetPlaybackMetrics();
        return;
    } else if (video.getAttribute('src') !== playbackUrl) {
        video.src = playbackUrl;
        video.load();
    }

    setPlayerStatus(usesStreamingServer ? 'Loading through streaming server' : 'Loading (HTML5)');
    resetPlaybackMetrics();
    if (!(isHls && typeof Hls !== 'undefined' && Hls.isSupported())) {
        beginHtml5Playback();
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
    refreshSubtitleAddonsForCurrentStream();

    if (hasAvplay()) {
        startAvplayStream(state.currentStream.raw.url);
    } else {
        startHtml5Stream(state.currentStream.raw.url);
    }
}

function openStream(streamEntry) {
    resetTrackState();
    state.currentStream = streamEntry;
    if (state.selectedType === 'series' && state.selectedVideo) {
        markVideoWatched(state.selectedItem, state.selectedVideo);
        renderEpisodeRail();
    }
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
    renderHomeRailWindow('homeMovieRail', state.movies.map(function(item) {
        return { item: item, kind: 'movie' };
    }), 'movies');
    renderHomeRailWindow('homeSeriesRail', state.series.map(function(item) {
        return { item: item, kind: 'series' };
    }), 'series');

    byId('homeMovieCount').textContent = state.movies.length + ' ready';
    byId('homeSeriesCount').textContent = state.series.length + ' ready';
    refreshFeaturedRotation();
}

function getCircularHomeWindow(entries, startIndex, count) {
    var windowItems = [];
    var total = entries.length;
    var visibleCount = Math.min(count, total);
    var normalized = startIndex;
    var index = 0;

    if (!total) {
        return windowItems;
    }

    normalized = ((normalized % total) + total) % total;

    for (index = 0; index < visibleCount; index += 1) {
        windowItems.push(entries[(normalized + index) % total]);
    }

    return windowItems;
}

function getHomeRailVisibleCount() {
    return Math.min(HOME_RAIL_VISIBLE_DEFAULT, window.innerWidth >= 1560 ? 7 : 5);
}

function getHomeRailCenterOffset(count) {
    return Math.floor((count || getHomeRailVisibleCount()) / 2);
}

function getCenteredHomeWindow(entries, selectedIndex, count) {
    return getCircularHomeWindow(entries, selectedIndex - getHomeRailCenterOffset(count), count);
}

function renderSingleHomeRail(descriptor, direction) {
    if (!descriptor) {
        return;
    }

    renderHomeRailWindow(descriptor.containerId, descriptor.entries, descriptor.key, direction);
}

function getDefaultSearchSuggestions() {
    var suggestions = [];
    var seen = {};

    state.continueWatching.forEach(function(entry) {
        if (entry && entry.item && entry.item.id && !seen[entry.item.id]) {
            entry.item.__kind = entry.kind;
            suggestions.push(entry.item);
            seen[entry.item.id] = true;
        }
    });

    state.movies.slice(0, 3).forEach(function(item) {
        if (item && item.id && !seen[item.id]) {
            item.__kind = 'movie';
            suggestions.push(item);
            seen[item.id] = true;
        }
    });

    state.series.slice(0, 3).forEach(function(item) {
        if (item && item.id && !seen[item.id]) {
            item.__kind = 'series';
            suggestions.push(item);
            seen[item.id] = true;
        }
    });

    return suggestions.slice(0, 4);
}

function syncSearchDisplay() {
    var input = byId('searchTextInput');
    byId('searchDisplayValue').textContent = state.searchQuery || 'Search titles';
    if (input && input.value !== state.searchQuery) {
        input.value = state.searchQuery;
    }
}

function buildMixedSearchResults() {
    var mixed = [];
    var index = 0;
    var maxLength = Math.max(state.searchMovies.length, state.searchSeries.length);

    for (index = 0; index < maxLength; index += 1) {
        if (state.searchMovies[index]) {
            state.searchMovies[index].__kind = 'movie';
            mixed.push(state.searchMovies[index]);
        }
        if (state.searchSeries[index]) {
            state.searchSeries[index].__kind = 'series';
            mixed.push(state.searchSeries[index]);
        }
    }

    return mixed.slice(0, 16);
}

function renderSearchSuggestions() {
    var container = byId('searchSuggestionList');
    var suggestions = state.searchSuggestions.length ? state.searchSuggestions : getDefaultSearchSuggestions();

    container.innerHTML = '';

    suggestions.forEach(function(item) {
        var button = document.createElement('button');
        button.className = 'search-suggestion';
        button.type = 'button';
        button.setAttribute('tabindex', getInteractiveTabIndex());
        button.textContent = item.name || 'Untitled';
        button.addEventListener('click', function() {
            state.searchQuery = item.name || '';
            syncSearchDisplay();
            scheduleSearchCatalogs();
        });
        container.appendChild(button);
    });
}

function renderSearchResults() {
    var total = state.searchResults.length;
    var empty = byId('searchEmptyState');

    renderCardRows('searchResultGrid', state.searchResults, null, 5);

    byId('searchResultCount').textContent = total ? total + ' result' + (total === 1 ? '' : 's') : 'No results yet';
    empty.classList.toggle('is-visible', !total);
    renderSearchSuggestions();
    syncSearchDisplay();
}

function scheduleSearchCatalogs() {
    if (state.searchDebounceTimer) {
        clearTimeout(state.searchDebounceTimer);
        state.searchDebounceTimer = null;
    }

    state.searchDebounceTimer = setTimeout(function() {
        state.searchDebounceTimer = null;
        searchCatalogs();
    }, 180);
}

function getSearchCatalogOptions(type) {
    return getBrowseOptions(type).filter(function(option) {
        return option.supportsSearch;
    });
}

function searchCatalogType(type, query, limit) {
    var options = getSearchCatalogOptions(type);

    if (!options.length) {
        return Promise.resolve([]);
    }

    return Promise.all(options.slice(0, 6).map(function(option) {
        return requestJson(buildCatalogRequestUrl(option, 0, {
            search: query
        }), 'GET').then(function(payload) {
            return normalizeCatalogPayloadWithLimit(payload, limit);
        }).catch(function() {
            return [];
        });
    })).then(function(groups) {
        var items = [];

        groups.forEach(function(group) {
            items = items.concat(group);
        });

        return uniqueCatalogItems(items, limit);
    });
}

function searchCatalogs() {
    var query = state.searchQuery.replace(/^\s+|\s+$/g, '');
    var requestId;

    state.searchQuery = query;
    syncSearchDisplay();
    requestId = state.searchRequestId + 1;
    state.searchRequestId = requestId;

    if (query.length < 2) {
        state.searchMovies = [];
        state.searchSeries = [];
        state.searchResults = [];
        renderSearchResults();
        setSearchMessage('Type in the search box to search linked addon catalogs.', null);
        return Promise.resolve();
    }

    setSearchMessage('Searching for "' + query + '"...', null);

    return Promise.all([
        searchCatalogType('movie', query, 20).then(function(items) {
            state.searchMovies = items;
        }),
        searchCatalogType('series', query, 20).then(function(items) {
            state.searchSeries = items;
        })
    ]).then(function() {
        var total;

        if (requestId !== state.searchRequestId) {
            return;
        }

        state.searchResults = buildMixedSearchResults();
        state.searchSuggestions = state.searchResults.slice(0, 4);
        total = state.searchResults.length;
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
    var options = arguments[2] || {};
    var card = document.createElement('button');
    var ambient;
    var poster = document.createElement('div');
    var title = document.createElement('div');
    var meta = document.createElement('div');
    var synopsis = document.createElement('div');

    card.className = 'card';
    if (options.className) {
        card.className += ' ' + options.className;
    }
    card.type = 'button';
    card.setAttribute('tabindex', getInteractiveTabIndex());

    if (options.homeFeatureLayout && (item.background || item.poster)) {
        ambient = document.createElement('div');
        ambient.className = 'card-ambient-art';
        ambient.style.backgroundImage = 'url("' + (item.background || item.poster) + '")';
        card.appendChild(ambient);
    }

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
    meta.textContent = options.metaText || formatMetaLine(item, kind === 'movie' ? 'Movie' : 'Series');

    synopsis.className = 'card-synopsis';
    synopsis.textContent = item.description || item.releaseInfo || 'Open details, streams, and playback options.';
    if (options.showSynopsis) {
        card.classList.add('card-has-static-synopsis');
    }
    if (options.homeFeatureLayout) {
        card.classList.add('card-home-feature-layout');
    }

    card.appendChild(poster);
    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(synopsis);

    card.addEventListener('click', function() {
        prepareSelection(item, kind, options.video && options.video.id ? {
            resumeVideoId: options.video.id
        } : null);
    });

    return card;
}

function renderCards(containerId, items, kind) {
    var container = byId(containerId);
    container.innerHTML = '';
    items.forEach(function(item) {
        container.appendChild(createCard(item, item.__kind || kind));
    });
}

function renderHomeRailWindow(containerId, entries, key, direction) {
    var container = byId(containerId);
    var index;
    var visible;
    var visibleCount;
    var centerIndex;

    container.innerHTML = '';
    container.classList.add('rail-home-window');
    container.classList.remove('is-sliding-left', 'is-sliding-right');

    if (!entries.length) {
        state.homeRailIndices[key] = 0;
        container.dataset.windowSize = '0';
        return;
    }

    index = state.homeRailIndices[key] || 0;
    if (index < 0) {
        index = 0;
    }
    if (index >= entries.length) {
        index = 0;
    }
    state.homeRailIndices[key] = index;

    visibleCount = Math.min(getHomeRailVisibleCount(), entries.length);
    centerIndex = getHomeRailCenterOffset(visibleCount);
    container.dataset.windowSize = String(visibleCount);
    visible = getCenteredHomeWindow(entries, index, visibleCount);

    visible.forEach(function(entry, visibleIndex) {
        var entryIndex = ((index - centerIndex + visibleIndex) % entries.length + entries.length) % entries.length;
        var card = createCard(entry.item, entry.kind, {
            className: visibleIndex === centerIndex ? 'is-home-active' : 'is-home-compact',
            metaText: entry.metaText,
            showSynopsis: visibleIndex === centerIndex,
            homeFeatureLayout: visibleIndex === centerIndex
        });

        card.setAttribute('data-home-rail-key', key);
        card.setAttribute('data-home-entry-index', String(entryIndex));
        card.style.setProperty('--rail-order', String(visibleIndex));
        card.style.setProperty('--rail-distance', String(Math.abs(visibleIndex - centerIndex)));
        card.style.setProperty('--rail-offset', String(visibleIndex - centerIndex));
        card.style.setProperty('--rail-scale', String(Math.max(0.48, 1 - (Math.abs(visibleIndex - centerIndex) * 0.16))));
        card.style.setProperty('--rail-depth', String((centerIndex - Math.abs(visibleIndex - centerIndex)) * 56));
        card.style.setProperty('--rail-rotate', String((centerIndex - visibleIndex) * 11));
        container.appendChild(card);
    });

    if (direction) {
        requestAnimationFrame(function() {
            container.classList.add(direction === 'left' ? 'is-sliding-left' : 'is-sliding-right');
        });
    }
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
            row.appendChild(createCard(item, item.__kind || kind));
        });

        container.appendChild(row);
    });
}

function renderContinueWatching() {
    var container = byId('continueRail');
    var count = byId('homeContinueCount');
    var section = byId('homeContinueSection');
    var entries = buildContinueEntries();

    container.innerHTML = '';
    container.classList.remove('rail-home-window', 'is-sliding-left', 'is-sliding-right');
    delete container.dataset.windowSize;

    if (!state.continueWatching.length) {
        count.textContent = 'Nothing saved yet';
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    count.textContent = state.continueWatching.length + ' saved';
    entries.slice(0, 8).forEach(function(entry) {
        container.appendChild(createCard(entry.item, entry.kind, {
            className: 'is-continue-card',
            metaText: entry.metaText,
            video: entry.video
        }));
    });

    refreshFeaturedRotation();
}

function fetchMetaFromAddons(type, id) {
    var eligibleAddons = state.addons.filter(function(addon) {
        return addonSupportsResource(addon, ['meta'], type, id);
    });

    function requestNext(index) {
        var addon = eligibleAddons[index];
        var baseUrl;

        if (!addon) {
            return Promise.reject(new Error('No metadata addon returned details for this title.'));
        }

        baseUrl = addonBaseUrl(addon.transportUrl);
        if (!baseUrl) {
            return requestNext(index + 1);
        }

        return requestJson(
            baseUrl + '/meta/' + encodeURIComponent(type) + '/' + encodeURIComponent(id) + '.json',
            'GET'
        ).then(function(payload) {
            var meta = payload && payload.meta ? payload.meta : payload;

            if (!meta) {
                throw new Error('Missing meta');
            }

            return meta;
        }).catch(function() {
            return requestNext(index + 1);
        });
    }

    return requestNext(0);
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

    setView('addons', {
        focusRegion: 'main',
        resetMain: true
    });
    setAddonsMessage('Loading selection details...', null);

    if (type === 'series') {
        fetchMetaFromAddons('series', item.id)
            .then(function(payload) {
                var meta = payload && payload.meta ? payload.meta : payload;
                var seasons;
                var resumeVideo;
                state.selectedItem = meta || item;
                state.allSeriesVideos = meta && Array.isArray(meta.videos) ? meta.videos.slice() : [];
                seasons = uniqueList(state.allSeriesVideos.map(getVideoSeason)).sort(function(left, right) {
                    return left - right;
                });
                state.availableSeasons = seasons;
                resumeVideo = options && options.resumeVideoId
                    ? state.allSeriesVideos.filter(function(video) {
                        return video.id === options.resumeVideoId;
                    })[0]
                    : null;
                state.selectedSeason = resumeVideo ? getVideoSeason(resumeVideo) : (seasons.length ? seasons[0] : null);
                state.selectedVideo = resumeVideo || null;
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

    if (!state.selectedItem || !type || !videoId) {
        setAddonsMessage('Choose a title first.', 'error');
        return;
    }

    eligibleAddons = getStreamCapableAddons(type, videoId);
    if (!eligibleAddons.length) {
        state.streams = [];
        renderAddons();
        setAddonsMessage(
            state.authKey
                ? 'No linked addons expose stream resources for this selection.'
                : 'No stream addons are available yet. Sign in with Nuvio to sync your addon collection.',
            'error'
        );
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
                var playable = getPreferredPlayableStream();
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

function bindPointerHover() {
    var hoverSelector = [
        '.nav-item',
        '.action-button',
        '.genre-chip',
        '.card',
        '.search-suggestion',
        '.stream-card',
        '.episode-list-button',
        '.track-chip',
        '.player-progress-button',
        '.video-frame',
        '#seasonSelect',
        '#searchTextInput'
    ].join(',');

    document.addEventListener('pointerover', function(event) {
        var target;

        if (event.pointerType && event.pointerType !== 'mouse' && event.pointerType !== 'pen') {
            return;
        }

        target = event.target && event.target.closest ? event.target.closest(hoverSelector) : null;
        if (!target) {
            return;
        }

        setInputMode('pointer');

        if (target.classList && target.classList.contains('nav-item')) {
            activatePointerNavElement(target);
            return;
        }

        if (target.classList && target.classList.contains('card') && target.hasAttribute('data-home-rail-key')) {
            activateHomeRailHover(target, event);
            return;
        }

        activatePointerMainElement(target);
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

function focusAddonsRow(selector) {
    var rows = getMainRows();
    var targetIndex = rows.findIndex(function(row) {
        return row && row[0] && row[0].matches && row[0].matches(selector);
    });

    if (targetIndex === -1) {
        return false;
    }

    state.focusRegion = 'main';
    state.mainRow = targetIndex;
    state.mainCol = 0;
    focusCurrent(true);
    return true;
}

function bindDetailActions() {
    byId('detailPlayButton').addEventListener('click', function() {
        var playable = getPreferredPlayableStream();

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
            if (focusAddonsRow('#seasonSelect')) {
                return;
            }
            if (focusAddonsRow('.episode-list-button')) {
                return;
            }
            return;
        }
        state.focusRegion = 'main';
        state.mainRow = 0;
        state.mainCol = 0;
        focusCurrent(true);
    });

    byId('detailSourcesButton').addEventListener('click', function() {
        if (focusAddonsRow('.stream-card')) {
            return;
        }
        state.focusRegion = 'main';
        state.mainRow = 0;
        state.mainCol = 0;
        focusCurrent(true);
    });
}

function bindSearch() {
    var searchInput = byId('searchTextInput');

    renderSearchSuggestions();
    syncSearchDisplay();

    if (!searchInput) {
        return;
    }

    searchInput.addEventListener('input', function() {
        state.searchQuery = searchInput.value;
        syncSearchDisplay();
        scheduleSearchCatalogs();
    });

    searchInput.addEventListener('keydown', function(event) {
        if ((event.key === 'Enter' || event.keyCode === 13) && state.searchQuery.trim()) {
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
        logout().catch(function(error) {
            setLoginMessage('Logout failed: ' + error.message, 'error');
        });
    });

    byId('qrRefreshButton').addEventListener('click', function() {
        startQrLoginSession(true);
    });
}

function bindPlayer() {
    var video = byId('videoPlayer');
    var frame = byId('videoFrameFocus');
    var controller = byId('playerControllerChrome');
    var seekBackGlyph = byId('playerSeekBackButton');
    var seekForwardGlyph = byId('playerSeekForwardButton');
    var nextEpisodeGlyph = byId('playerNextEpisodeButton');
    var audioGlyph = byId('playerAudioButton');

    controller.addEventListener('click', function(event) {
        event.stopPropagation();
    });

    if (seekBackGlyph && seekBackGlyph.firstElementChild) {
        seekBackGlyph.firstElementChild.innerHTML = '&#8630;';
    }
    if (seekForwardGlyph && seekForwardGlyph.firstElementChild) {
        seekForwardGlyph.firstElementChild.innerHTML = '&#8631;';
    }
    if (nextEpisodeGlyph && nextEpisodeGlyph.firstElementChild) {
        nextEpisodeGlyph.firstElementChild.innerHTML = '&#9197;';
    }
    if (audioGlyph && audioGlyph.firstElementChild) {
        audioGlyph.firstElementChild.innerHTML = '&#9835;';
    }

    byId('playerSeekBackButton').addEventListener('click', function() {
        seekCurrentPlayback(-30000);
    });

    byId('playerToggleButton').addEventListener('click', function() {
        toggleCurrentPlayback();
    });

    byId('playerSeekForwardButton').addEventListener('click', function() {
        seekCurrentPlayback(30000);
    });

    byId('playerNextEpisodeButton').addEventListener('click', function() {
        playNextEpisode();
    });

    byId('playerProgressButton').addEventListener('pointerdown', function(event) {
        event.preventDefault();
        event.stopPropagation();
        beginProgressPointerSeek(event);
    });

    byId('playerProgressButton').addEventListener('pointermove', function(event) {
        if (!state.progressDragActive) {
            return;
        }
        event.preventDefault();
        updateProgressPointerPreview(event);
    });

    byId('playerProgressButton').addEventListener('pointerup', function(event) {
        event.preventDefault();
        finishProgressPointerSeek(true);
    });

    byId('playerProgressButton').addEventListener('pointercancel', function() {
        finishProgressPointerSeek(false);
    });

    byId('playerAudioButton').addEventListener('click', function() {
        cycleAudioTrack();
    });

    byId('playerSubtitleButton').addEventListener('click', function() {
        cycleSubtitleTrack();
    });

    byId('playerFullscreenButton').addEventListener('click', function() {
        setPlayerFullscreen(!state.playerFullscreen);
    });

    frame.addEventListener('click', function() {
        toggleCurrentPlayback();
    });

    frame.addEventListener('dblclick', function() {
        setPlayerFullscreen(!state.playerFullscreen);
    });

    frame.addEventListener('mousemove', function() {
        if (state.playerFullscreen) {
            showPlayerChrome(false);
        }
    });

    video.addEventListener('loadedmetadata', refreshPlaybackTracks);
    video.addEventListener('loadedmetadata', readHtml5Metrics);
    video.addEventListener('loadeddata', refreshPlaybackTracks);
    video.addEventListener('timeupdate', readHtml5Metrics);
    video.addEventListener('durationchange', refreshPlaybackTracks);
    video.addEventListener('durationchange', readHtml5Metrics);
    video.addEventListener('playing', function() {
        setPlayerToggleUi(true);
        setPlayerStatus(state.html5FallbackUrl ? 'Playing through streaming server' : 'Playing');
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
        setPlayerStatus(state.html5FallbackUrl
            ? 'Streaming server required for audio. Start Stremio Service.'
            : 'Playback error');
    });

    window.addEventListener('resize', syncAvplayRect);
    document.addEventListener('fullscreenchange', syncDocumentFullscreenState);
    document.addEventListener('webkitfullscreenchange', syncDocumentFullscreenState);
}

function handleLeft() {
    if (state.currentView === 'player' && !state.playerFullscreen && state.mainRow === 0) {
        beginOrUpdateSeekPreview(-1);
        return;
    }

    if (state.currentView === 'player' && state.playerFullscreen) {
        if (state.mainRow === 1) {
            beginOrUpdateSeekPreview(-1);
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

    if (state.currentView === 'home' && state.focusRegion === 'main' && state.mainRow > 0) {
        var homeRailLeft = getHomeRailDescriptorForMainRow(state.mainRow);
        if (homeRailLeft) {
            if (!homeRailLeft.entries.length) {
                return;
            }
            state.homeRailIndices[homeRailLeft.key] = (state.homeRailIndices[homeRailLeft.key] - 1 + homeRailLeft.entries.length) % homeRailLeft.entries.length;
            state.mainCol = getHomeRailCenterOffset();
            renderSingleHomeRail(homeRailLeft, 'left');
            focusCurrent();
            return;
        }
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

    if (state.currentView === 'search') {
        var searchPaneInfo = getSearchPaneInfo();
        if (searchPaneInfo.resultRows && state.mainRow >= searchPaneInfo.firstResultRow && state.mainCol === 0) {
            state.mainRow = Math.min(
                Math.max(searchPaneInfo.leftRowCount - 1, 0),
                state.mainRow - searchPaneInfo.firstResultRow
            );
            state.mainCol = 0;
            focusCurrent();
            return;
        }
    }

    if (state.mainCol > 0) {
        state.mainCol -= 1;
        focusCurrent();
    }
}

function handleRight() {
    if (state.currentView === 'player' && !state.playerFullscreen && state.mainRow === 0) {
        beginOrUpdateSeekPreview(1);
        return;
    }

    if (state.currentView === 'player' && state.playerFullscreen) {
        if (state.mainRow === 1) {
            beginOrUpdateSeekPreview(1);
            return;
        }
        if (state.mainRow === 0) {
            return;
        }
        state.mainCol += 1;
        focusCurrent();
        return;
    }

    if (state.currentView === 'home' && state.focusRegion === 'main' && state.mainRow > 0) {
        var homeRailRight = getHomeRailDescriptorForMainRow(state.mainRow);
        if (homeRailRight) {
            if (!homeRailRight.entries.length) {
                return;
            }
            state.homeRailIndices[homeRailRight.key] = (state.homeRailIndices[homeRailRight.key] + 1) % homeRailRight.entries.length;
            state.mainCol = getHomeRailCenterOffset();
            renderSingleHomeRail(homeRailRight, 'right');
            focusCurrent();
            return;
        }
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

    if (state.currentView === 'search') {
        var searchPaneInfo = getSearchPaneInfo();
        if (searchPaneInfo.resultRows && state.mainRow < searchPaneInfo.firstResultRow) {
            var searchRows = getMainRows();
            var currentSearchRow = searchRows[state.mainRow] || [];
            if (currentSearchRow.length && state.mainCol < currentSearchRow.length - 1) {
                state.mainCol += 1;
                focusCurrent();
                return;
            }
            state.mainRow = searchPaneInfo.firstResultRow;
            state.mainCol = 0;
            focusCurrent();
            return;
        }
    }

    state.mainCol += 1;
    focusCurrent();
}

function handleUp() {
    if (state.currentView === 'search' && state.focusRegion === 'main') {
        var searchPaneInfo = getSearchPaneInfo();
        if (searchPaneInfo.resultRows && state.mainRow === searchPaneInfo.firstResultRow) {
            state.focusRegion = 'nav';
            focusCurrent();
            return;
        }
    }

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
    setInputMode('pointer');

    document.addEventListener('pointerdown', function() {
        setInputMode('pointer');
        if (state.currentView === 'player' && state.playerFullscreen) {
            showPlayerChrome(false);
        }
    });

    document.addEventListener('keydown', function(event) {
        var key = event.key || '';
        var isLeft = key === 'ArrowLeft' || event.keyCode === 37;
        var isUp = key === 'ArrowUp' || event.keyCode === 38;
        var isRight = key === 'ArrowRight' || event.keyCode === 39;
        var isDown = key === 'ArrowDown' || event.keyCode === 40;
        var isEnter = key === 'Enter' || event.keyCode === 13;
        var isEscape = key === 'Escape' || event.keyCode === 27 || event.keyCode === 10009;
        var isBackspace = key === 'Backspace' || event.keyCode === 8;
        var isSpace = key === ' ' || key === 'Spacebar' || event.keyCode === 32;
        var isPlayerShortcut = state.currentView === 'player' && !isEditableTarget(event.target);

        setInputMode('keyboard');

        if (state.currentView === 'player' && state.playerFullscreen) {
            showPlayerChrome(false);
        }

        if (isEditableTarget(event.target)) {
            if (isEscape) {
                event.preventDefault();
                event.target.blur();
            }
            return;
        }

        if (isLeft) {
            event.preventDefault();
            handleLeft();
            return;
        }
        if (isUp) {
            event.preventDefault();
            handleUp();
            return;
        }
        if (isRight) {
            event.preventDefault();
            handleRight();
            return;
        }
        if (isDown) {
            event.preventDefault();
            handleDown();
            return;
        }
        if (isEnter) {
            event.preventDefault();
            handleEnter();
            return;
        }

        if (isEscape || isBackspace) {
            event.preventDefault();
            goBackOnce();
            return;
        }

        if (isPlayerShortcut && (key === 'f' || key === 'F')) {
            event.preventDefault();
            setPlayerFullscreen(!state.playerFullscreen);
            return;
        }

        if (isPlayerShortcut && isSpace) {
            event.preventDefault();
            toggleCurrentPlayback();
        }
    });

    document.addEventListener('keyup', function(event) {
        var key = event.key || '';
        if ((key === 'ArrowLeft' || key === 'ArrowRight' || event.keyCode === 37 || event.keyCode === 39) && state.seekPreviewActive) {
            event.preventDefault();
            stopSeekPreview(true);
        }
    });

    bindNav();
    bindPointerHover();
    bindHomeActions();
    bindDetailActions();
    bindSearch();
    bindBrowse();
    bindLogin();
    bindPlayer();
    startHomeRailAutoRotation();

    restoreStoredSession();
    restoreContinueWatching();
    restoreWatchedVideos();
    updateUserPanel();
    updateNavState();
    updateViewState();
    updatePageHeader();
    renderSearchResults();
    renderContinueWatching();
    renderAddons();
    renderPlayerState();
    startFeaturedRotation();

    verifyStoredSession().catch(function() {
        return null;
    }).then(function() {
        return fetchInstalledAddons();
    }).then(function() {
        return fetchCatalogs();
    }).catch(function(error) {
        updateConnectionStatus('Startup error: ' + error.message, false, true);
    });
}

window.onload = init;
