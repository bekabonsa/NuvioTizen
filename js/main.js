var CINEMETA_BASE = 'https://v3-cinemeta.strem.io';
var OPENSUBTITLES_BASE = 'https://opensubtitles-v3.strem.io';
var DEFAULT_ADDON_URLS = [CINEMETA_BASE, OPENSUBTITLES_BASE];
var NUVIO_API_BASE = 'https://nuvio.tv';
var SUPABASE_URL = 'https://dpyhjjcoabcglfmgecug.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRweWhqamNvYWJjZ2xmbWdlY3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3ODYyNDcsImV4cCI6MjA4NjM2MjI0N30.U-3QSNDdpsnvRk_7ZL419AFTOtggHJJcmkodxeXjbkg';
var TV_LOGIN_REDIRECT_BASE_URL = 'https://nuvioapp.space/tv-login';
var STORAGE_AUTH = 'nuvio.accessToken';
var STORAGE_REFRESH = 'nuvio.refreshToken';
var STORAGE_USER = 'nuvio.user';
var STORAGE_CONTINUE = 'nuviotizen.continueWatching';
var STORAGE_LIBRARY = 'nuviotizen.library';
function buildDescendingYearList(startYear, endYear) {
    var years = [];
    var year;

    for (year = startYear; year >= endYear; year -= 1) {
        years.push(String(year));
    }

    return years;
}

var CINEMETA_MOVIE_GENRES = ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Horror', 'Sci-Fi', 'Thriller'];
var CINEMETA_MOVIE_EXPANSION_GENRES = ['Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime', 'Documentary', 'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Sport', 'Thriller', 'War', 'Western'];
var CINEMETA_SERIES_GENRES = ['Action', 'Adventure', 'Animation', 'Comedy', 'Drama', 'Fantasy', 'Sci-Fi'];
var CINEMETA_SERIES_EXPANSION_GENRES = ['Action', 'Adventure', 'Animation', 'Comedy', 'Drama', 'Fantasy', 'Sci-Fi'];
var CINEMETA_YEAR_FILTERS = buildDescendingYearList(2026, 1960);
var CINEMETA_EXPANSION_YEAR_FILTERS = buildDescendingYearList(2026, 1960);
var YEAR_FILTER_WINDOW_SIZE = 3;
var CINEMETA_MOVIE_SEARCH_SEEDS = ['the', 'love', 'life', 'night', 'day', 'man', 'girl', 'dark', 'city', 'family', 'last', 'first', 'new', 'old', 'house', 'king', 'school', 'space', 'star', 'time', 'game', 'home'];
var CINEMETA_SERIES_SEARCH_SEEDS = ['the', 'love', 'life', 'night', 'day', 'war', 'dark', 'city', 'family', 'first', 'new', 'old', 'house', 'queen', 'school', 'doctor', 'space', 'star', 'time', 'secret', 'story', 'game', 'home'];
var NAV_VIEWS = ['search', 'home', 'library', 'series', 'movies', 'login'];
var FEATURED_ROTATION_MS = 9000;
var FEATURED_FADE_MS = 180;
var HOME_CATALOG_LIMIT = 60;
var CONTINUE_WATCHING_LIMIT = 20;
var WATCH_PROGRESS_PULL_LIMIT = 50;
var NUVIO_PROFILE_ID = 1;
var LIBRARY_LIMIT = 120;
var LIBRARY_PULL_LIMIT = 500;
var LIBRARY_ROW_SIZE = 6;
var HOME_ARTWORK_PRELOAD_COUNT = 8;
var ARTWORK_PRELOAD_LIMIT = 48;
var BROWSE_ROW_SIZE = 5;
var BROWSE_PAGE_SIZE = 25;
var BROWSE_LOAD_MORE_SIZE = BROWSE_PAGE_SIZE * 5;
var CINEMETA_CATALOG_PAGE_SIZE = 50;
var BROWSE_EXPANSION_BATCH_SIZE = 8;
var FORCE_AVPLAY_DEBUG = false;
var PLAYER_SCRUB_INITIAL_NUDGE_MS = 5000;
var PLAYER_SCRUB_TICK_MS = 50;
var artworkPreloadCache = {};
var artworkPreloadOrder = [];
var browseCatalogPayloadCache = {};
var browseCatalogPayloadPending = {};
var browsePrefetchTimers = {};
var homeActiveMetaCache = {};
var homeActiveMetaPending = {};
var SEARCH_KEYBOARD_ROWS = [
    ['a', 'b', 'c', 'd', 'e', 'f'],
    ['g', 'h', 'i', 'j', 'k', 'l'],
    ['m', 'n', 'o', 'p', 'q', 'r'],
    ['s', 't', 'u', 'v', 'w', 'x'],
    ['y', 'z', '1', '2', '3', '4'],
    ['5', '6', '7', '8', '9', '0'],
    ['space', 'backspace', 'clear']
];
var VIEW_META = {
    home: {
        eyebrow: 'Discover',
        title: 'Home',
        subtitle: 'Featured picks, continue watching, and curated rows shaped for TV browsing.'
    },
    movies: {
        eyebrow: 'Catalog',
        title: 'Films',
        subtitle: 'Browse linked film catalogs and drill into sources without leaving the TV flow.'
    },
    library: {
        eyebrow: 'Saved',
        title: 'Library',
        subtitle: 'Your saved films and series from this TV and synced Nuvio account.'
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
        subtitle: 'Native playback with TV overlay controls and direct addon stream support.'
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
    libraryItems: [],
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
    movieBrowseCanLoadMore: true,
    seriesBrowseCanLoadMore: true,
    movieBrowseLoadingMore: false,
    seriesBrowseLoadingMore: false,
    movieBrowseExpansionIndex: Math.floor(Math.random() * 1000),
    seriesBrowseExpansionIndex: Math.floor(Math.random() * 1000),
    movieYearWindowStart: 0,
    seriesYearWindowStart: 0,
    movieYearFilterOpen: false,
    seriesYearFilterOpen: false,
    movieYearFocusIndex: 0,
    seriesYearFocusIndex: 0,
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
    detailMode: 'details',
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
    playbackTicker: null,
    playerChromeTimer: null,
    seekPreviewActive: false,
    seekPreviewTargetMs: 0,
    seekPreviewDirection: 0,
    seekPreviewStartedAt: 0,
    seekPreviewLastTickAt: 0,
    seekPreviewTimer: null,
    playerMode: 'html5',
    playerFullscreen: false,
    currentView: 'home',
    viewHistory: [],
    browseReturnState: {
        movies: null,
        series: null
    },
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
    debugAvplay: false,
    debugAvplayOverlay: null,
    lastAvplayDebugMetrics: null,
    homeRailIndices: {
        continue: 0,
        movies: 0,
        series: 0
    },
    homeRailMoveDirections: {
        continue: null,
        movies: null,
        series: null
    }
};

function byId(id) {
    return document.getElementById(id);
}

function queryAll(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
}

function isAvplayDebugEnabled() {
    return FORCE_AVPLAY_DEBUG || (window.location && window.location.search && window.location.search.indexOf('debugAvplay=1') !== -1);
}

function roundMetric(value) {
    if (typeof value !== 'number' || !isFinite(value)) {
        return value;
    }
    return Math.round(value * 100) / 100;
}

function getDebugRect(rect) {
    if (!rect) {
        return null;
    }
    return {
        left: roundMetric(rect.left),
        top: roundMetric(rect.top),
        width: roundMetric(rect.width),
        height: roundMetric(rect.height),
        right: roundMetric(rect.right),
        bottom: roundMetric(rect.bottom)
    };
}

function createAvplayDebugOverlay() {
    var overlay;

    if (!state.debugAvplay || state.debugAvplayOverlay) {
        return;
    }

    overlay = document.createElement('pre');
    overlay.id = 'avplayDebugOverlay';
    overlay.style.position = 'fixed';
    overlay.style.left = '18px';
    overlay.style.right = 'auto';
    overlay.style.top = '18px';
    overlay.style.bottom = 'auto';
    overlay.style.zIndex = '99999';
    overlay.style.maxWidth = '560px';
    overlay.style.maxHeight = '440px';
    overlay.style.margin = '0';
    overlay.style.padding = '18px';
    overlay.style.overflow = 'hidden';
    overlay.style.whiteSpace = 'pre-wrap';
    overlay.style.pointerEvents = 'none';
    overlay.style.background = 'rgba(0, 0, 0, 0.82)';
    overlay.style.color = '#fff';
    overlay.style.border = '2px solid rgba(255, 255, 255, 0.55)';
    overlay.style.font = '18px/1.22 monospace';
    document.body.appendChild(overlay);
    state.debugAvplayOverlay = overlay;
}

function renderAvplayDebugOverlay(metrics) {
    if (!state.debugAvplay) {
        return;
    }

    createAvplayDebugOverlay();
    state.lastAvplayDebugMetrics = metrics;
    window.__nuvioAvplayDebug = metrics;

    if (state.debugAvplayOverlay) {
        state.debugAvplayOverlay.textContent = JSON.stringify(metrics, null, 2);
    }

    if (window.console && typeof window.console.log === 'function') {
        window.console.log('NUVIO_AVPLAY_DEBUG', JSON.stringify(metrics));
    }
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

function rememberPreloadedArtwork(src, promise) {
    artworkPreloadCache[src] = promise;
    artworkPreloadOrder.push(src);

    while (artworkPreloadOrder.length > ARTWORK_PRELOAD_LIMIT) {
        delete artworkPreloadCache[artworkPreloadOrder.shift()];
    }
}

function warmArtworkUrl(url) {
    var src = String(url || '').trim();

    if (!src || artworkPreloadCache[src]) {
        return;
    }

    rememberPreloadedArtwork(src, preloadFeaturedArtwork(src).catch(function() {
        return null;
    }));
}

function getHomeRailArtworkUrl(entry) {
    if (!entry || !entry.item) {
        return '';
    }
    return entry.item.background || entry.item.poster || '';
}

function warmHomeRailArtwork(entries, startIndex, count) {
    getCircularHomeWindow(entries, startIndex, count).forEach(function(entry) {
        warmArtworkUrl(getHomeRailArtworkUrl(entry));
    });
}

function warmEpisodeArtwork(videos, startIndex, count) {
    var items = videos || [];
    var safeStart = Math.max(startIndex || 0, 0);
    var safeCount = Math.max(count || 0, 0);
    var index;

    for (index = safeStart; index < Math.min(items.length, safeStart + safeCount); index += 1) {
        warmArtworkUrl(getVideoThumbnail(items[index]));
    }
}

function isVisibleControl(element) {
    return !!(
        element
        && !element.disabled
        && element.style.display !== 'none'
        && element.getClientRects
        && element.getClientRects().length
    );
}

function updateConnectionStatus(text, ok, isError) {
    var el = byId('connectionStatus');
    if (!el) {
        return;
    }
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
    if (!el) {
        return;
    }
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

    byId('sideUserLabel').textContent = email;
    byId('topAccountLabel').textContent = email;
    byId('accountEmail').textContent = email;
    byId('authKeyLabel').textContent = authKey;
    byId('accountNote').textContent = state.authKey
        ? 'This Nuvio session is stored locally on the TV shell.'
        : 'Sign in to keep your Nuvio session active inside this TV shell.';
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

function normalizeContinueEntry(entry) {
    var item = entry && entry.item ? cloneContinueItem(entry.item) : null;
    var video = entry && entry.video ? entry.video : null;

    if (!entry || !item || !entry.kind || !item.id) {
        return null;
    }

    return {
        kind: entry.kind,
        item: item,
        video: video ? {
            id: video.id,
            title: video.title || video.name || '',
            season: getVideoSeason(video),
            episode: getVideoEpisode(video)
        } : null,
        progressKey: entry.progressKey || entry.progress_key || null,
        position: typeof entry.position === 'number' ? entry.position : 0,
        duration: typeof entry.duration === 'number' ? entry.duration : 0,
        lastWatched: entry.lastWatched || entry.last_watched || null,
        updatedAt: entry.updatedAt || entry.updated_at || null
    };
}

function normalizeLibraryEntry(entry) {
    var item = entry && entry.item ? cloneContinueItem(entry.item) : null;

    if (!entry || !item || !entry.kind || !item.id) {
        return null;
    }

    return {
        kind: entry.kind,
        item: item,
        addedAt: typeof entry.addedAt !== 'undefined' ? entry.addedAt : entry.created_at || entry.updated_at || null,
        updatedAt: entry.updatedAt || entry.updated_at || null,
        backendId: entry.backendId || entry.id || null,
        userId: entry.userId || entry.user_id || null,
        posterShape: entry.posterShape || entry.poster_shape || 'POSTER',
        genres: Array.isArray(entry.genres) ? entry.genres.slice() : [],
        addonBaseUrl: entry.addonBaseUrl || entry.addon_base_url || null,
        createdAt: entry.createdAt || entry.created_at || null
    };
}

function continueEntryKey(entry) {
    return entry && entry.kind && entry.item && entry.item.id
        ? entry.kind + ':' + entry.item.id
        : '';
}

function dedupeEntries(entries, normalizer, limit) {
    var normalized = [];
    var seen = {};

    (entries || []).forEach(function(entry) {
        var item = normalizer(entry);
        var key;

        if (!item) {
            return;
        }

        key = continueEntryKey(item);
        if (seen[key]) {
            return;
        }

        seen[key] = true;
        normalized.push(item);
    });

    return normalized.slice(0, limit);
}

function saveContinueWatching() {
    localStorage.setItem(STORAGE_CONTINUE, JSON.stringify(state.continueWatching.slice(0, CONTINUE_WATCHING_LIMIT)));
}

function restoreContinueWatching() {
    var payload = safeJsonParse(localStorage.getItem(STORAGE_CONTINUE));
    var normalized;
    var changed = false;

    if (!Array.isArray(payload)) {
        state.continueWatching = [];
        return;
    }

    normalized = dedupeEntries(payload, normalizeContinueEntry, CONTINUE_WATCHING_LIMIT);
    changed = normalized.length !== payload.length;

    state.continueWatching = normalized;
    if (changed) {
        saveContinueWatching();
    }
}

function saveLibraryItems() {
    localStorage.setItem(STORAGE_LIBRARY, JSON.stringify(state.libraryItems.slice(0, LIBRARY_LIMIT)));
}

function restoreLibraryItems() {
    var payload = safeJsonParse(localStorage.getItem(STORAGE_LIBRARY));
    var normalized;

    if (!Array.isArray(payload)) {
        state.libraryItems = [];
        return;
    }

    normalized = dedupeEntries(payload, normalizeLibraryEntry, LIBRARY_LIMIT);
    state.libraryItems = normalized;
    if (normalized.length !== payload.length) {
        saveLibraryItems();
    }
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
        } : null,
        position: Math.max(0, Math.round((state.currentTimeMs || 0) / 1000)),
        duration: Math.max(0, Math.round((state.durationMs || 0) / 1000)),
        lastWatched: Date.now()
    };
    snapshot.progressKey = buildWatchProgressKey(kind, snapshot.item.id, snapshot.video);
    key = continueEntryKey(snapshot);

    state.continueWatching = [snapshot].concat(state.continueWatching.filter(function(entry) {
        return continueEntryKey(entry) !== key;
    })).slice(0, CONTINUE_WATCHING_LIMIT);

    saveContinueWatching();
    pushContinueWatchingToNuvio(snapshot);
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
        language = info.language || info.lang || info.track_lang || info.subtitle_lang || info.languageCode || info.iso639_1 || info.iso639_2 || info.ISO639 || '';
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

function isEnglishSubtitleSource(value) {
    var normalized = String(value || '').toLowerCase();
    var filename = normalized.split('#')[0].split('?')[0].split('/').pop();

    try {
        filename = decodeURIComponent(filename);
    } catch (error) {
        // Keep the raw filename.
    }

    return /(^|[._\-\s])(en|eng|english)([._\-\s]|$)/.test(filename);
}

function isEnglishSubtitleEntry(info) {
    if (!info || typeof info !== 'object') {
        return false;
    }

    return isEnglishSubtitleValue(info.language)
        || isEnglishSubtitleValue(info.lang)
        || isEnglishSubtitleValue(info.track_lang)
        || isEnglishSubtitleValue(info.subtitle_lang)
        || isEnglishSubtitleValue(info.languageCode)
        || isEnglishSubtitleValue(info.iso639_1)
        || isEnglishSubtitleValue(info.iso639_2)
        || isEnglishSubtitleValue(info.ISO639)
        || isEnglishSubtitleValue(info.label)
        || isEnglishSubtitleValue(info.track_name)
        || isEnglishSubtitleValue(info.name)
        || isEnglishSubtitleSource(info.filename)
        || isEnglishSubtitleSource(info.url)
        || isEnglishSubtitleSource(info.src)
        || isEnglishSubtitleSource(info.file);
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
    button.setAttribute('aria-label', nextEpisode ? 'Play next episode' : 'No next episode');
    button.setAttribute('title', nextEpisode ? 'Play next episode' : 'No next episode');
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
    var duration = state.durationMs || 0;
    var target = Math.max(0, targetMs || 0);

    if (duration > 0) {
        target = Math.min(duration, target);
    }

    return target;
}

function updateProgressUi() {
    var displayTime = getDisplayedPlaybackTimeMs();
    var percent = 0;
    if (state.durationMs > 0) {
        percent = Math.max(0, Math.min(100, (displayTime / state.durationMs) * 100));
    }

    byId('playerCurrentTime').textContent = formatPlaybackTime(displayTime);
    byId('playerDuration').textContent = formatPlaybackTime(state.durationMs);
    byId('playerProgressFill').style.width = String(percent) + '%';
    if (state.seekPreviewActive) {
        byId('playerProgressCaption').textContent =
            'Scrub to ' + formatPlaybackTime(displayTime) +
            ' • ' + String(getSeekPreviewSpeedMultiplier(Date.now() - state.seekPreviewStartedAt)) + 'x' +
            ' • release to seek';
        return;
    }

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
    clearSeekPreviewTimer();
    state.seekPreviewActive = false;
    state.seekPreviewTargetMs = 0;
    state.seekPreviewDirection = 0;
    state.seekPreviewStartedAt = 0;
    state.seekPreviewLastTickAt = 0;
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

function seekPlaybackTo(targetMs, statusPrefix) {
    var video = byId('videoPlayer');
    var duration = state.durationMs || 0;
    var target = Math.max(0, targetMs || 0);

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

    try {
        video.currentTime = target / 1000;
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

    if ((state.durationMs || 0) <= 0) {
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

function resetWindowedAvplayFrame() {
    var layout = byId('playerLayout');
    var stage = byId('playerStageCard');
    var frame = byId('videoFrameFocus');

    if (layout) {
        layout.style.removeProperty('padding-top');
    }
    if (stage) {
        stage.style.removeProperty('position');
        stage.style.removeProperty('left');
        stage.style.removeProperty('top');
        stage.style.removeProperty('z-index');
        stage.style.removeProperty('padding');
        stage.style.removeProperty('margin-left');
        stage.style.removeProperty('width');
    }
    if (frame) {
        frame.style.removeProperty('position');
        frame.style.removeProperty('left');
        frame.style.removeProperty('top');
        frame.style.removeProperty('z-index');
        frame.style.removeProperty('width');
        frame.style.removeProperty('height');
        frame.style.removeProperty('min-height');
    }
}

function syncAvplayRect() {
    var surface = byId('avplaySurface');
    var frame = byId('videoFrameFocus');
    var rect;
    var left;
    var top;
    var width;
    var height;
    var displayRect;
    var metrics;

    if (state.playerMode !== 'avplay' || !hasAvplay()) {
        return;
    }

    resetWindowedAvplayFrame();

    rect = (frame || surface).getBoundingClientRect();
    left = rect.left;
    top = rect.top;
    width = rect.width;
    height = rect.height;

    if (width <= 0 || height <= 0) {
        return;
    }

    displayRect = {
        left: Math.max(0, Math.round(left)),
        top: Math.max(0, Math.round(top)),
        width: Math.max(1, Math.round(width)),
        height: Math.max(1, Math.round(height))
    };
    metrics = {
        reason: 'syncAvplayRect',
        playerMode: state.playerMode,
        fullscreen: state.playerFullscreen,
        currentView: state.currentView,
        mainRow: state.mainRow,
        mainCol: state.mainCol,
        window: {
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio || 1,
            scrollX: window.scrollX || 0,
            scrollY: window.scrollY || 0
        },
        screen: {
            width: screen && screen.width,
            height: screen && screen.height
        },
        frameRect: getDebugRect(rect),
        avplayRect: displayRect,
        timestamp: new Date().toISOString()
    };
    renderAvplayDebugOverlay(metrics);

    try {
        try {
            webapis.avplay.setDisplayMethod(state.playerFullscreen
                ? 'PLAYER_DISPLAY_MODE_FULL_SCREEN'
                : 'PLAYER_DISPLAY_MODE_LETTER_BOX');
        } catch (displayError) {
            // no-op
        }
        webapis.avplay.setDisplayRect(
            displayRect.left,
            displayRect.top,
            displayRect.width,
            displayRect.height
        );
    } catch (error) {
        metrics.error = error && error.message ? error.message : String(error);
        renderAvplayDebugOverlay(metrics);
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
    resetWindowedAvplayFrame();
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
        : 'Default only';
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

    if (state.currentView === 'library') {
        var libraryContainers = [];
        queryAll('#libraryGrid .card-row').forEach(function(row) {
            libraryContainers.push(row);
        });
        if (!libraryContainers.length) {
            libraryContainers.push(byId('libraryShelfSection'));
        }
        return libraryContainers.filter(Boolean);
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
        var keyboardRows = queryAll('#searchKeyboard .search-keyboard-row');
        var suggestionButtons = queryAll('#searchSuggestionList .search-suggestion');

        keyboardRows.forEach(function() {
            searchContainers.push(byId('searchShellSection'));
        });

        suggestionButtons.forEach(function() {
            searchContainers.push(byId('searchShellSection'));
        });

        queryAll('#searchResultGrid .card-row').forEach(function(row) {
            searchContainers.push(row);
        });

        return searchContainers.filter(Boolean);
    }

    if (state.currentView === 'addons') {
        var addonContainers = [byId('detailHeroRow')];
        var episodeBrowserRows = getEpisodeBrowserRowCount();
        var episodeRowIndex;

        for (episodeRowIndex = 0; episodeRowIndex < episodeBrowserRows; episodeRowIndex += 1) {
            addonContainers.push(byId('episodeSection'));
        }
        queryAll('#streamList .stream-card').filter(isVisibleControl).forEach(function() {
            addonContainers.push(byId('streamSection'));
        });
        return addonContainers.filter(function(el) {
            return el && el.style.display !== 'none';
        });
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
        var movieCards = queryAll('#homeMovieRail .card').filter(function(card) {
            return !card.classList.contains('is-home-peek');
        });
        var seriesCards = queryAll('#homeSeriesRail .card').filter(function(card) {
            return !card.classList.contains('is-home-peek');
        });

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
        if (!byId('movieLoadMoreButton').disabled) {
            movieRows.push([byId('movieLoadMoreButton')]);
        }
        return movieRows;
    }

    if (state.currentView === 'library') {
        var libraryRows = [];
        var libraryCardRows = queryAll('#libraryGrid .card-row');

        libraryCardRows.forEach(function(row) {
            var cards = queryAll('#' + row.id + ' .card');
            if (cards.length) {
                libraryRows.push(cards);
            }
        });

        return libraryRows;
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
        if (!byId('seriesLoadMoreButton').disabled) {
            seriesRows.push([byId('seriesLoadMoreButton')]);
        }
        return seriesRows;
    }

    if (state.currentView === 'search') {
        var searchRows = [];
        var keyboardRows = queryAll('#searchKeyboard .search-keyboard-row');
        var suggestionButtons = queryAll('#searchSuggestionList .search-suggestion');
        var resultRows = queryAll('#searchResultGrid .card-row');

        keyboardRows.forEach(function(row) {
            var cards = queryAll('#' + row.id + ' .card');
            var keys;
            if (cards.length) {
                return;
            }
            keys = queryAll('#' + row.id + ' .search-key');
            if (keys.length) {
                searchRows.push(keys);
            }
        });

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
        var detailActions = queryAll('#detailActions .action-button').filter(isVisibleControl);
        var seasons = queryAll('#seasonRail .season-chip').filter(isVisibleControl);
        var episodes = queryAll('#episodeRail .episode-card').filter(isVisibleControl);
        var streams = queryAll('#streamList .stream-card').filter(isVisibleControl);
        var browserRowCount = Math.max(seasons.length, episodes.length);
        var browserRowIndex;

        if (detailActions.length) {
            addonRows.push(detailActions);
        }

        for (browserRowIndex = 0; browserRowIndex < browserRowCount; browserRowIndex += 1) {
            var browserRow = [];
            if (seasons[browserRowIndex]) {
                browserRow.push(seasons[browserRowIndex]);
            }
            if (episodes[browserRowIndex]) {
                browserRow.push(episodes[browserRowIndex]);
            }
            if (browserRow.length) {
                addonRows.push(browserRow);
            }
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
        [byId('loginButton'), byId('logoutButton')],
        [byId('qrRefreshButton')]
    ];
}

function buildContinueEntries() {
    return state.continueWatching.map(function(entry) {
        return {
            item: entry.item,
            kind: entry.kind,
            continueProgress: getContinueProgress(entry),
            metaText: entry.kind === 'series' && entry.video
                ? 'Resume • Season ' + entry.video.season + ' • Episode ' + entry.video.episode
                : 'Resume watching'
        };
    });
}

function getContinueProgress(entry) {
    var position = entry && typeof entry.position === 'number' ? Math.max(0, entry.position) : 0;
    var duration = entry && typeof entry.duration === 'number' ? Math.max(0, entry.duration) : 0;
    var remaining;
    var percent;

    if (!duration || !position) {
        return null;
    }

    remaining = Math.max(0, duration - position);
    percent = Math.max(0, Math.min(100, (position / duration) * 100));

    return {
        percent: percent,
        currentLabel: formatPlaybackTime(position * 1000),
        durationLabel: formatPlaybackTime(duration * 1000),
        remainingLabel: remaining > 0 ? formatContinueRemainingTime(remaining) : 'Almost done'
    };
}

function formatContinueRemainingTime(seconds) {
    var totalMinutes = Math.max(1, Math.ceil((seconds || 0) / 60));
    var hours = Math.floor(totalMinutes / 60);
    var minutes = totalMinutes % 60;

    if (hours > 0 && minutes > 0) {
        return hours + 'h ' + minutes + 'm left';
    }
    if (hours > 0) {
        return hours + 'h left';
    }

    return totalMinutes + 'm left';
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
        entries: state.movies.slice(0, HOME_CATALOG_LIMIT).map(function(item) {
            return { item: item, kind: 'movie' };
        })
    });

    descriptors.push({
        key: 'series',
        containerId: 'homeSeriesRail',
        entries: state.series.slice(0, HOME_CATALOG_LIMIT).map(function(item) {
            return { item: item, kind: 'series' };
        })
    });

    return descriptors;
}

function getHomeRailDescriptorForMainRow(rowIndex) {
    if (state.currentView !== 'home' || rowIndex <= 0) {
        return null;
    }

    return getHomeRailDescriptors()[rowIndex - 1] || null;
}

function getHomeRailDescriptorByKey(key) {
    return getHomeRailDescriptors().filter(function(descriptor) {
        return descriptor.key === key;
    })[0] || null;
}

function getHomeActiveMetaCacheKey(kind, item) {
    return kind && item && item.id ? kind + ':' + item.id : '';
}

function mergeHomeActiveMeta(item, kind) {
    var cacheKey = getHomeActiveMetaCacheKey(kind, item);
    var meta = cacheKey ? homeActiveMetaCache[cacheKey] : null;
    var merged = {};
    var prop;

    if (!meta) {
        return item;
    }

    for (prop in item) {
        if (Object.prototype.hasOwnProperty.call(item, prop)) {
            merged[prop] = item[prop];
        }
    }
    for (prop in meta) {
        if (Object.prototype.hasOwnProperty.call(meta, prop)) {
            merged[prop] = meta[prop];
        }
    }

    merged.id = item.id;
    merged.name = meta.name || item.name;
    merged.poster = item.poster || meta.poster;
    merged.background = item.background || meta.background || meta.poster;

    return merged;
}

function hasHomeActiveMetaDetails(item, key) {
    return !!(
        item && (
            item.runtime ||
            item.runtimeMins ||
            item.runtimeMinutes ||
            item.duration ||
            item.length
        )
    ) && !!getItemGenreLabel(item, getHomeGenreFallback(key));
}

function scheduleHomeActiveMetaEnrichment(entry, key) {
    var item = entry && entry.item;
    var kind = entry && entry.kind;
    var cacheKey = getHomeActiveMetaCacheKey(kind, item);

    if ((key !== 'movies' && key !== 'series') || !cacheKey || hasHomeActiveMetaDetails(item, key)) {
        return;
    }
    if (Object.prototype.hasOwnProperty.call(homeActiveMetaCache, cacheKey) || homeActiveMetaPending[cacheKey]) {
        return;
    }

    homeActiveMetaPending[cacheKey] = true;
    fetchMetaFromAddons(kind, item.id).then(function(meta) {
        var descriptor;

        homeActiveMetaCache[cacheKey] = meta || null;
        homeActiveMetaPending[cacheKey] = false;
        if (state.currentView !== 'home') {
            return;
        }

        descriptor = getHomeRailDescriptorByKey(key);
        if (descriptor && state.homeRailIndices[key] >= 0) {
            renderSingleHomeRail(descriptor);
            setTimeout(focusCurrent, 0);
        }
    }).catch(function() {
        homeActiveMetaCache[cacheKey] = null;
        homeActiveMetaPending[cacheKey] = false;
    });
}

function getSearchPaneInfo() {
    var keyboardRows = queryAll('#searchKeyboard .search-keyboard-row').length;
    var suggestionCount = queryAll('#searchSuggestionList .search-suggestion').length;
    var resultRows = queryAll('#searchResultGrid .card-row').length;
    var leftRowCount = keyboardRows + suggestionCount;

    return {
        keyboardRows: keyboardRows,
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
        parent.classList.contains('search-keyboard-row') ||
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

function getViewPanel(viewName) {
    return queryAll('[data-view-panel="' + viewName + '"]')[0] || null;
}

function isBrowseReturnView(viewName) {
    return viewName === 'movies' || viewName === 'series';
}

function captureBrowseReturnState() {
    var view = state.currentView;
    var panel;

    if (!isBrowseReturnView(view)) {
        return;
    }

    panel = getViewPanel(view);
    state.browseReturnState[view] = {
        mainRow: state.mainRow,
        mainCol: state.mainCol,
        scrollTop: panel ? panel.scrollTop : 0
    };
}

function restoreBrowseReturnState(viewName) {
    var saved = state.browseReturnState[viewName];
    var panel;

    if (!saved) {
        return false;
    }

    state.focusRegion = 'main';
    state.mainRow = saved.mainRow || 0;
    state.mainCol = saved.mainCol || 0;
    panel = getViewPanel(viewName);
    if (panel) {
        panel.scrollTop = saved.scrollTop || 0;
    }
    updateRowEmphasis();

    return true;
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

    if (state.currentView === 'home' && state.mainRow > 0) {
        state.mainCol = 0;
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
    if (state.currentView === 'player' && state.playerMode === 'avplay') {
        setTimeout(syncAvplayRect, 0);
        setTimeout(syncAvplayRect, 90);
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
    var shouldRestoreBrowse;

    if (state.playerFullscreen) {
        setPlayerFullscreen(false);
        return;
    }

    if (state.currentView === 'addons' && state.selectedType === 'series' && state.detailMode === 'sources') {
        state.detailMode = 'episodes';
        renderAddons();
        state.focusRegion = 'main';
        state.mainRow = getSelectedEpisodeMainRow();
        state.mainCol = state.availableSeasons.length && state.selectedEpisodes.length ? 1 : 0;
        focusCurrent();
        return;
    }

    if (state.currentView === 'addons' && state.selectedType === 'series' && state.detailMode === 'episodes') {
        state.detailMode = 'details';
        renderAddons();
        state.focusRegion = 'main';
        state.mainRow = 0;
        state.mainCol = 0;
        focusCurrent();
        return;
    }

    if (state.currentView !== 'home') {
        previousView = state.viewHistory.length ? state.viewHistory.pop() : 'home';
        shouldRestoreBrowse = isBrowseReturnView(previousView) && !!state.browseReturnState[previousView];
        setView(previousView || 'home', {
            focusRegion: 'main',
            resetMain: !shouldRestoreBrowse,
            pushHistory: false
        });
        if (shouldRestoreBrowse) {
            restoreBrowseReturnState(previousView);
        }
        setTimeout(function() {
            if (shouldRestoreBrowse) {
                restoreBrowseReturnState(previousView);
            }
            focusCurrent();
        }, 0);
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

function getItemRuntimeValue(item) {
    return item && (
        item.runtime ||
        item.runtimeMins ||
        item.runtimeMinutes ||
        item.duration ||
        item.length
    );
}

function formatItemRuntime(item) {
    var value = getItemRuntimeValue(item);
    var minutes;
    var hours;
    var remainder;

    if (typeof value === 'number' && !isNaN(value)) {
        minutes = value > 1000 ? Math.round(value / 60000) : Math.round(value);
    } else if (typeof value === 'string' && value) {
        if (/^\d+$/.test(value)) {
            minutes = parseInt(value, 10);
        } else {
            return value.replace(/^PT/i, '').replace(/H/i, 'h ').replace(/M/i, 'm').trim();
        }
    }

    if (!minutes) {
        return '';
    }

    hours = Math.floor(minutes / 60);
    remainder = minutes % 60;
    if (hours && remainder) {
        return hours + 'h ' + remainder + 'm';
    }
    if (hours) {
        return hours + 'h';
    }

    return minutes + 'm';
}

function getItemGenreLabel(item, fallbackGenre) {
    var value = item && (item.genres || item.genre);
    var genres;

    if (Array.isArray(value)) {
        genres = value.filter(Boolean);
        if (genres.length) {
            return genres.slice(0, 2).join(' / ');
        }
    }
    if (typeof value === 'string' && value) {
        return value.split(',').map(function(part) {
            return part.trim();
        }).filter(Boolean).slice(0, 2).join(' / ');
    }

    return fallbackGenre || '';
}

function getHomeGenreFallback(key) {
    var option;

    if (key !== 'movies' && key !== 'series') {
        return '';
    }

    option = getSelectedBrowseOption(key === 'movies' ? 'movie' : 'series');
    return option && option.filterGroup === 'genre' ? option.label : '';
}

function formatHomeActiveMetaLine(item, kind, key) {
    return [
        item && item.imdbRating ? 'IMDb ' + item.imdbRating : '',
        formatItemRuntime(item),
        getItemGenreLabel(item, getHomeGenreFallback(key)),
        item && (item.releaseInfo || item.year) || ''
    ].filter(Boolean).join(' • ') || formatMetaLine(item, kind === 'movie' ? 'Movie' : 'Series');
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

function getPlayerContentTitle() {
    var itemTitle = state.selectedItem && state.selectedItem.name ? state.selectedItem.name : '';
    var videoTitle = state.selectedVideo && (state.selectedVideo.title || state.selectedVideo.name) ? (state.selectedVideo.title || state.selectedVideo.name) : '';
    var season;
    var episode;
    var suffix;

    if (!state.selectedItem) {
        return 'No stream selected';
    }

    if (state.selectedType === 'series' && state.selectedVideo) {
        season = getVideoSeason(state.selectedVideo);
        episode = getVideoEpisode(state.selectedVideo);
        suffix = 'S' + String(season || 1) + ' E' + String(episode || '?');
        if (videoTitle && videoTitle !== itemTitle) {
            suffix += ' • ' + videoTitle;
        }
        return itemTitle + ' • ' + suffix;
    }

    return itemTitle || videoTitle || 'Now playing';
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
    return payload.metas.slice(0, typeof limit === 'number' ? limit : 12);
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

function shuffleCatalogItems(items) {
    var output = (items || []).slice();
    var index;
    var swapIndex;
    var item;

    for (index = output.length - 1; index > 0; index -= 1) {
        swapIndex = Math.floor(Math.random() * (index + 1));
        item = output[index];
        output[index] = output[swapIndex];
        output[swapIndex] = item;
    }

    return output;
}

function trimToFullBrowseRows(items) {
    var list = items || [];
    var fullLength = list.length - (list.length % BROWSE_ROW_SIZE);

    return list.slice(0, fullLength);
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
                    extra: [{ name: 'genre', options: CINEMETA_MOVIE_GENRES.slice() }, { name: 'search' }, { name: 'skip' }]
                },
                {
                    type: 'series',
                    id: 'top',
                    name: 'Top',
                    extra: [{ name: 'genre', options: CINEMETA_SERIES_GENRES.slice() }, { name: 'search' }, { name: 'skip' }]
                },
                {
                    type: 'movie',
                    id: 'imdbRating',
                    name: 'Featured',
                    extra: [{ name: 'skip' }]
                },
                {
                    type: 'series',
                    id: 'imdbRating',
                    name: 'Featured',
                    extra: [{ name: 'skip' }]
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

function stableArgsKey(args) {
    var value = args || {};

    return Object.keys(value).sort().map(function(name) {
        return name + '=' + value[name];
    }).join('&');
}

function buildCatalogOptionKey(addon, catalog, extraArgs) {
    return [
        addonBaseUrl(addon.transportUrl) || addon.id || '',
        normalizeAddonType(catalog.type),
        catalog.id || '',
        catalog.name || '',
        stableArgsKey(extraArgs)
    ].join('::');
}

function getCatalogExtraEntry(extra, name) {
    return (extra || []).filter(function(entry) {
        return entry && entry.name === name;
    })[0] || null;
}

function getCinemetaGenreOptions(type, rawOptions) {
    var allowed = type === 'movie' ? CINEMETA_MOVIE_GENRES : CINEMETA_SERIES_GENRES;
    var available = Array.isArray(rawOptions) && rawOptions.length ? rawOptions : allowed;

    return available.filter(function(value) {
        return allowed.indexOf(value) !== -1;
    });
}

function getCinemetaYearOptions(rawOptions) {
    var available = Array.isArray(rawOptions) && rawOptions.length ? rawOptions : CINEMETA_YEAR_FILTERS;

    return available.filter(function(value) {
        return CINEMETA_YEAR_FILTERS.indexOf(value) !== -1;
    });
}

function mergeCatalogArgs(target, source) {
    Object.keys(source || {}).forEach(function(name) {
        target[name] = source[name];
    });
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
            var supportsSearch = extra.some(function(entry) {
                return entry && entry.name === 'search';
            });
            var supportsSkip = extra.some(function(entry) {
                return entry && entry.name === 'skip';
            });
            var genreEntry = getCatalogExtraEntry(extra, 'genre');
            var baseUrl = addonBaseUrl(addon.transportUrl);
            var isCinemeta = baseUrl === CINEMETA_BASE;
            var hasUnsupportedRequiredExtra = extra.some(function(entry) {
                return entry && entry.isRequired && entry.name !== 'genre';
            });

            function pushOption(label, extraArgs, filterGroup, sortRank) {
                labelCounts[label] = (labelCounts[label] || 0) + 1;

                options.push({
                    key: buildCatalogOptionKey(addon, catalog, extraArgs),
                    label: label,
                    addonName: addonName,
                    addon: addon,
                    type: catalogType,
                    catalogId: catalog.id,
                    extraArgs: extraArgs || null,
                    filterGroup: filterGroup || 'catalog',
                    sortRank: typeof sortRank === 'number' ? sortRank : 500,
                    supportsSearch: supportsSearch,
                    supportsSkip: supportsSkip
                });
            }

            if (!catalog || !catalog.id || preferredTypes.indexOf(catalogType) === -1) {
                return;
            }
            if (hasUnsupportedRequiredExtra) {
                return;
            }

            if (isCinemeta && catalog.id === 'top') {
                pushOption('Popular', null, 'catalog', 0);
                getCinemetaGenreOptions(catalogType, genreEntry && genreEntry.options).forEach(function(genre, index) {
                    pushOption(genre, { genre: genre }, 'genre', 20 + index);
                });
                return;
            }

            if (isCinemeta && catalog.id === 'year' && genreEntry && genreEntry.isRequired) {
                getCinemetaYearOptions(genreEntry.options).forEach(function(year, index) {
                    pushOption(year, { genre: year }, 'year', 100 + index);
                });
                return;
            }

            pushOption(catalog.name || catalog.id, null, 'catalog', catalog.id === 'imdbRating' ? 1 : 500);
        });
    });

    options.sort(function(left, right) {
        if (left.sortRank !== right.sortRank) {
            return left.sortRank - right.sortRank;
        }

        return String(left.label || '').localeCompare(String(right.label || ''));
    });

    return options.map(function(option) {
        var nextOption = {
            key: option.key,
            label: option.label,
            addonName: option.addonName,
            addon: option.addon,
            type: option.type,
            catalogId: option.catalogId,
            extraArgs: option.extraArgs,
            filterGroup: option.filterGroup,
            sortRank: option.sortRank,
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

function getBrowseItems(type) {
    return type === 'movie' ? state.movieBrowseItems : state.seriesBrowseItems;
}

function setBrowseItems(type, items) {
    if (type === 'movie') {
        state.movieBrowseItems = items;
        return;
    }

    state.seriesBrowseItems = items;
}

function setBrowseSkip(type, skip) {
    if (type === 'movie') {
        state.movieSkip = skip;
        return;
    }

    state.seriesSkip = skip;
}

function getBrowseCanLoadMore(type) {
    return type === 'movie' ? state.movieBrowseCanLoadMore : state.seriesBrowseCanLoadMore;
}

function setBrowseCanLoadMore(type, canLoadMore) {
    if (type === 'movie') {
        state.movieBrowseCanLoadMore = !!canLoadMore;
        return;
    }

    state.seriesBrowseCanLoadMore = !!canLoadMore;
}

function getBrowseLoadingMore(type) {
    return type === 'movie' ? state.movieBrowseLoadingMore : state.seriesBrowseLoadingMore;
}

function setBrowseLoadingMore(type, loading) {
    if (type === 'movie') {
        state.movieBrowseLoadingMore = !!loading;
        return;
    }

    state.seriesBrowseLoadingMore = !!loading;
}

function getBrowseExpansionIndex(type) {
    return type === 'movie' ? state.movieBrowseExpansionIndex : state.seriesBrowseExpansionIndex;
}

function setBrowseExpansionIndex(type, index) {
    if (type === 'movie') {
        state.movieBrowseExpansionIndex = index;
        return;
    }

    state.seriesBrowseExpansionIndex = index;
}

function getYearWindowStart(type) {
    return type === 'movie' ? state.movieYearWindowStart : state.seriesYearWindowStart;
}

function setYearWindowStart(type, index) {
    if (type === 'movie') {
        state.movieYearWindowStart = index;
        return;
    }

    state.seriesYearWindowStart = index;
}

function isYearFilterOpen(type) {
    return type === 'movie' ? state.movieYearFilterOpen : state.seriesYearFilterOpen;
}

function setYearFilterOpen(type, open) {
    if (type === 'movie') {
        state.movieYearFilterOpen = !!open;
        return;
    }

    state.seriesYearFilterOpen = !!open;
}

function getYearFocusIndex(type) {
    return type === 'movie' ? state.movieYearFocusIndex : state.seriesYearFocusIndex;
}

function setYearFocusIndex(type, index) {
    if (type === 'movie') {
        state.movieYearFocusIndex = index;
        return;
    }

    state.seriesYearFocusIndex = index;
}

function getCurrentBrowseType() {
    if (state.currentView === 'movies') {
        return 'movie';
    }
    if (state.currentView === 'series') {
        return 'series';
    }

    return '';
}

function resetBrowsePaging(type) {
    setBrowseSkip(type, 0);
    setBrowseCanLoadMore(type, true);
    setBrowseLoadingMore(type, false);
    setBrowseExpansionIndex(type, Math.floor(Math.random() * 1000));
}

function isYearBrowseOption(option) {
    return option && option.filterGroup === 'year';
}

function getYearOptionIndex(yearOptions, key) {
    var index = -1;

    (yearOptions || []).some(function(option, optionIndex) {
        if (option && option.key === key) {
            index = optionIndex;
            return true;
        }

        return false;
    });

    return index;
}

function clampYearWindowStart(start, yearCount) {
    var maxStart = Math.max(0, yearCount - YEAR_FILTER_WINDOW_SIZE);

    return Math.max(0, Math.min(start, maxStart));
}

function getYearWindowStartForRender(type, yearOptions, activeKey) {
    var activeIndex = getYearOptionIndex(yearOptions, activeKey);
    var start = clampYearWindowStart(getYearWindowStart(type), yearOptions.length);

    if (activeIndex >= 0 && (activeIndex < start || activeIndex >= start + YEAR_FILTER_WINDOW_SIZE)) {
        start = clampYearWindowStart(activeIndex - Math.floor(YEAR_FILTER_WINDOW_SIZE / 2), yearOptions.length);
        setYearWindowStart(type, start);
    }

    return start;
}

function getOpenYearWindowStartForRender(type, yearOptions) {
    var focusIndex = Math.max(0, Math.min(getYearFocusIndex(type), Math.max(0, yearOptions.length - 1)));
    var start = clampYearWindowStart(getYearWindowStart(type), yearOptions.length);

    setYearFocusIndex(type, focusIndex);
    if (focusIndex < start || focusIndex >= start + YEAR_FILTER_WINDOW_SIZE) {
        start = clampYearWindowStart(focusIndex - Math.floor(YEAR_FILTER_WINDOW_SIZE / 2), yearOptions.length);
        setYearWindowStart(type, start);
    }

    return start;
}

function getCollapsedYearIndex(type, yearOptions, activeKey) {
    var activeIndex = getYearOptionIndex(yearOptions, activeKey);

    if (activeIndex >= 0) {
        return activeIndex;
    }

    return clampYearWindowStart(getYearWindowStart(type), yearOptions.length);
}

function focusYearFilter(type, yearIndex) {
    var rowId = type === 'movie' ? 'movieGenreRow' : 'seriesGenreRow';
    var nextButton = queryAll('#' + rowId + ' .is-year-filter[data-year-index="' + yearIndex + '"]')[0];
    var row;
    var nextCol;

    if (!nextButton) {
        return false;
    }

    row = queryAll('#' + rowId + ' .genre-chip');
    nextCol = row.indexOf(nextButton);
    if (nextCol >= 0) {
        state.mainRow = 0;
        state.mainCol = nextCol;
    }
    setYearFocusIndex(type, yearIndex);
    focusCurrent();
    return true;
}

function isCinemetaTopCatalog(option) {
    var baseUrl = option && option.addon ? addonBaseUrl(option.addon.transportUrl) : '';

    return baseUrl === CINEMETA_BASE && option.catalogId === 'top';
}

function isCinemetaSeriesTopCatalog(option) {
    return isCinemetaTopCatalog(option) && option.type === 'series';
}

function usesLocalBrowsePaging(option, currentLength) {
    if (!isCinemetaTopCatalog(option)) {
        return false;
    }

    return option.type !== 'series' || currentLength < CINEMETA_CATALOG_PAGE_SIZE;
}

function getBrowseRequestSkip(option, currentLength) {
    if (isCinemetaSeriesTopCatalog(option)) {
        return Math.max(
            CINEMETA_CATALOG_PAGE_SIZE,
            Math.floor(currentLength / CINEMETA_CATALOG_PAGE_SIZE) * CINEMETA_CATALOG_PAGE_SIZE
        );
    }

    return currentLength;
}

function supportsRemoteBrowsePaging(option) {
    return option && option.supportsSkip && (!isCinemetaTopCatalog(option) || isCinemetaSeriesTopCatalog(option));
}

function appendCatalogItems(baseItems, additions, limit) {
    return uniqueCatalogItems((baseItems || []).concat(additions || [])).slice(0, limit);
}

function cloneBrowseOptionWithArgs(option, label, extraArgs) {
    return {
        key: option.key + '::expansion::' + stableArgsKey(extraArgs),
        label: label,
        addonName: option.addonName,
        addon: option.addon,
        type: option.type,
        catalogId: option.catalogId,
        extraArgs: extraArgs || null,
        filterGroup: option.filterGroup,
        sortRank: option.sortRank,
        supportsSearch: option.supportsSearch,
        supportsSkip: option.supportsSkip
    };
}

function getCinemetaExpansionGenres(type) {
    return type === 'movie' ? CINEMETA_MOVIE_EXPANSION_GENRES : CINEMETA_SERIES_EXPANSION_GENRES;
}

function isCinemetaBrowseExpansionOption(option) {
    var baseUrl = option && option.addon ? addonBaseUrl(option.addon.transportUrl) : '';

    return baseUrl === CINEMETA_BASE
        && option
        && (option.catalogId === 'top' || option.catalogId === 'imdbRating' || option.catalogId === 'year');
}

function getCinemetaBrowseExpansionOptions(type, selectedOption) {
    var options = getBrowseOptions(type);
    var searchSeeds = type === 'movie' ? CINEMETA_MOVIE_SEARCH_SEEDS : CINEMETA_SERIES_SEARCH_SEEDS;
    var output = options.filter(function(option) {
        return option
            && option.key !== (selectedOption && selectedOption.key)
            && isCinemetaBrowseExpansionOption(option);
    });
    var existingKeys = {};
    var yearTemplate = options.filter(function(option) {
        return option && isCinemetaBrowseExpansionOption(option) && option.catalogId === 'year';
    })[0];
    var genreTemplate = options.filter(function(option) {
        return option
            && isCinemetaBrowseExpansionOption(option)
            && option.catalogId === 'top'
            && !option.extraArgs;
    })[0];
    var searchTemplate = options.filter(function(option) {
        return option
            && isCinemetaBrowseExpansionOption(option)
            && option.catalogId === 'top'
            && !option.extraArgs
            && option.supportsSearch;
    })[0];

    output.forEach(function(option) {
        existingKeys[option.catalogId + '::' + stableArgsKey(option.extraArgs)] = true;
    });
    if (genreTemplate) {
        getCinemetaExpansionGenres(type).forEach(function(genre) {
            var key = 'top::genre=' + genre;

            if (!existingKeys[key]) {
                existingKeys[key] = true;
                output.push(cloneBrowseOptionWithArgs(genreTemplate, genre, { genre: genre }));
            }
        });
    }
    if (yearTemplate) {
        CINEMETA_EXPANSION_YEAR_FILTERS.forEach(function(year) {
            var key = 'year::genre=' + year;

            if (!existingKeys[key]) {
                existingKeys[key] = true;
                output.push(cloneBrowseOptionWithArgs(yearTemplate, year, { genre: year }));
            }
        });
    }
    if (searchTemplate) {
        searchSeeds.forEach(function(seed) {
            var key = 'top::search=' + seed;

            if (!existingKeys[key]) {
                existingKeys[key] = true;
                output.push(cloneBrowseOptionWithArgs(searchTemplate, seed, { search: seed }));
            }
        });
    }

    return output;
}

function getRotatedOptions(options, startIndex) {
    var list = options || [];
    var offset = list.length ? startIndex % list.length : 0;

    return list.slice(offset).concat(list.slice(0, offset));
}

function getNextCinemetaSeriesPageSkips(currentLength) {
    var requestSkip = Math.max(
        CINEMETA_CATALOG_PAGE_SIZE,
        Math.floor(currentLength / CINEMETA_CATALOG_PAGE_SIZE) * CINEMETA_CATALOG_PAGE_SIZE
    );
    var pageSkips = [];
    var pageIndex;

    for (pageIndex = 0; pageIndex < BROWSE_EXPANSION_BATCH_SIZE / 2; pageIndex += 1) {
        pageSkips.push(requestSkip + (pageIndex * CINEMETA_CATALOG_PAGE_SIZE));
    }

    return pageSkips;
}

function prefetchBrowseCatalogs(type) {
    var option = getSelectedBrowseOption(type);
    var currentLength = getBrowseItems(type).length;
    var expansionOptions;

    if (!option || !getBrowseCanLoadMore(type) || getBrowseLoadingMore(type)) {
        return;
    }

    if (isCinemetaBrowseExpansionOption(option)) {
        requestBrowseCatalogPayload(option, 0).catch(function() {});
        if (isCinemetaSeriesTopCatalog(option) && !option.extraArgs) {
            getNextCinemetaSeriesPageSkips(Math.max(currentLength, CINEMETA_CATALOG_PAGE_SIZE)).forEach(function(skip) {
                requestBrowseCatalogPayload(option, skip).catch(function() {});
            });
        }

        expansionOptions = getRotatedOptions(
            getCinemetaBrowseExpansionOptions(type, option),
            getBrowseExpansionIndex(type)
        ).slice(0, BROWSE_EXPANSION_BATCH_SIZE);
        expansionOptions.forEach(function(source) {
            requestBrowseCatalogPayload(source, 0).catch(function() {});
        });
        return;
    }

    if (supportsRemoteBrowsePaging(option)) {
        requestBrowseCatalogPayload(option, getBrowseRequestSkip(option, currentLength)).catch(function() {});
    }
}

function scheduleBrowsePrefetch(type) {
    clearTimeout(browsePrefetchTimers[type]);
    browsePrefetchTimers[type] = setTimeout(function() {
        delete browsePrefetchTimers[type];
        prefetchBrowseCatalogs(type);
    }, 300);
}

function fetchCinemetaBrowseAppend(type, option, currentItems) {
    var targetLength = currentItems.length + BROWSE_LOAD_MORE_SIZE;
    var expansionOptions = getRotatedOptions(
        getCinemetaBrowseExpansionOptions(type, option),
        getBrowseExpansionIndex(type)
    );
    var nextItems = currentItems.slice();
    var expansionIndex = 0;

    function result(canLoadMore) {
        return {
            items: trimToFullBrowseRows(nextItems),
            canLoadMore: canLoadMore,
            consumedSources: expansionIndex
        };
    }

    function appendPageItems(items) {
        var beforeLength = nextItems.length;

        nextItems = appendCatalogItems(nextItems, items, targetLength);
        return nextItems.length > beforeLength;
    }

    function fetchSeriesRemotePages() {
        var requestSkip;
        var pageSkips = [];
        var pageIndex;

        if (nextItems.length >= targetLength) {
            return Promise.resolve(result(true));
        }

        requestSkip = Math.max(
            CINEMETA_CATALOG_PAGE_SIZE,
            Math.floor(nextItems.length / CINEMETA_CATALOG_PAGE_SIZE) * CINEMETA_CATALOG_PAGE_SIZE
        );

        for (pageIndex = 0; pageIndex < BROWSE_EXPANSION_BATCH_SIZE / 2; pageIndex += 1) {
            pageSkips.push(requestSkip + (pageIndex * CINEMETA_CATALOG_PAGE_SIZE));
        }

        return Promise.all(pageSkips.map(function(pageSkip) {
            return requestBrowseCatalogPayload(option, pageSkip).then(function(payload) {
                return payload;
            }).catch(function() {
                return null;
            });
        })).then(function(payloads) {
            payloads.forEach(function(payload) {
                var pageItems;

                if (!payload || nextItems.length >= targetLength) {
                    return;
                }

                pageItems = shuffleCatalogItems(uniqueCatalogItems(normalizeCatalogPayloadWithLimit(payload, CINEMETA_CATALOG_PAGE_SIZE)));
                appendPageItems(pageItems);
            });
            if (nextItems.length >= targetLength) {
                return result(true);
            }
            return fetchExpansionPages();
        });
    }

    function fetchExpansionPages() {
        var batch;

        if (nextItems.length >= targetLength) {
            return Promise.resolve(result(true));
        }
        if (expansionIndex >= expansionOptions.length) {
            return Promise.resolve(result(false));
        }

        batch = expansionOptions.slice(expansionIndex, expansionIndex + BROWSE_EXPANSION_BATCH_SIZE);
        expansionIndex += batch.length;

        return Promise.all(batch.map(function(source) {
            return requestBrowseCatalogPayload(source, 0).then(function(payload) {
                return payload;
            }).catch(function() {
                return null;
            });
        })).then(function(payloads) {
            payloads.forEach(function(payload) {
                var sourceItems;

                if (!payload) {
                    return;
                }

                sourceItems = shuffleCatalogItems(uniqueCatalogItems(payload && Array.isArray(payload.metas) ? payload.metas : []));
                appendPageItems(sourceItems);
            });
            return fetchExpansionPages();
        });
    }

    function fetchLocalPage() {
        return requestBrowseCatalogPayload(option, 0).then(function(payload) {
            var localItems = shuffleCatalogItems(uniqueCatalogItems(payload && Array.isArray(payload.metas) ? payload.metas : []));

            appendPageItems(localItems);
            if (nextItems.length >= targetLength) {
                return result(true);
            }
            if (isCinemetaSeriesTopCatalog(option) && !option.extraArgs && nextItems.length >= CINEMETA_CATALOG_PAGE_SIZE) {
                return fetchSeriesRemotePages();
            }

            return fetchExpansionPages();
        }).catch(function() {
            return fetchExpansionPages();
        });
    }

    if (isCinemetaSeriesTopCatalog(option) && !option.extraArgs && nextItems.length >= CINEMETA_CATALOG_PAGE_SIZE) {
        return fetchSeriesRemotePages();
    }

    return fetchLocalPage();
}

function buildCatalogRequestUrl(option, skip, extraArgs) {
    var baseUrl = option && option.addon ? addonBaseUrl(option.addon.transportUrl) : '';
    var args = {};
    var parts;

    if (!baseUrl || !option) {
        return '';
    }
    mergeCatalogArgs(args, option.extraArgs || {});
    mergeCatalogArgs(args, extraArgs || {});
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

function requestBrowseCatalogPayload(option, skip, extraArgs) {
    var url = buildCatalogRequestUrl(option, skip, extraArgs);

    if (!url) {
        return Promise.reject(new Error('No catalog URL'));
    }
    if (browseCatalogPayloadCache[url]) {
        return Promise.resolve(browseCatalogPayloadCache[url]);
    }
    if (browseCatalogPayloadPending[url]) {
        return browseCatalogPayloadPending[url];
    }

    browseCatalogPayloadPending[url] = requestJson(url, 'GET').then(function(payload) {
        browseCatalogPayloadCache[url] = payload;
        delete browseCatalogPayloadPending[url];
        return payload;
    }).catch(function(error) {
        delete browseCatalogPayloadPending[url];
        throw error;
    });

    return browseCatalogPayloadPending[url];
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

function requestSupabaseWithTokenHeaders(path, method, body, token, extraHeaders) {
    var headers = buildSupabaseHeaders(token);

    mergeHeaderMap(headers, extraHeaders);
    return requestJsonWithHeaders(
        SUPABASE_URL + path,
        method || 'GET',
        body,
        headers
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

function requestSupabaseWithSessionHeaders(path, method, body, extraHeaders) {
    return requestSupabaseWithTokenHeaders(path, method, body, state.authKey, extraHeaders).catch(function(error) {
        if (!state.refreshToken || error.message.indexOf('HTTP 401') !== 0) {
            throw error;
        }

        return refreshSessionIfNeeded().then(function(refreshed) {
            if (!refreshed) {
                throw error;
            }

            return requestSupabaseWithTokenHeaders(path, method, body, state.authKey, extraHeaders);
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

function buildWatchProgressKey(kind, itemId, video) {
    var normalizedKind = normalizeAddonType(kind);
    var season;
    var episode;

    if (normalizedKind !== 'series') {
        return itemId || '';
    }

    season = getVideoSeason(video);
    episode = getVideoEpisode(video);
    return itemId + '_s' + season + 'e' + episode;
}

function buildWatchVideoId(kind, itemId, video) {
    var normalizedKind = normalizeAddonType(kind);

    if (normalizedKind !== 'series') {
        return itemId || '';
    }

    return video && video.id
        ? video.id
        : itemId + ':' + getVideoSeason(video) + ':' + getVideoEpisode(video);
}

function buildNuvioMetadataAddonPayload() {
    return state.addons.map(function(addon, index) {
        var url = addon && addon.transportUrl ? addonBaseUrl(addon.transportUrl) : addon && addon.id || '';

        return {
            id: addon && addon.id ? addon.id : 'addon-' + index,
            url: url,
            name: addon && addon.manifest && addon.manifest.name ? addon.manifest.name : 'Addon',
            enabled: true,
            sort_order: index,
            profile_id: NUVIO_PROFILE_ID
        };
    }).filter(function(addon) {
        return !!addon.url;
    });
}

function resolveWatchProgressMetadata(rows) {
    var items = (rows || []).map(function(row) {
        return {
            progress_key: row.progress_key,
            content_id: row.content_id,
            content_type: row.content_type
        };
    }).filter(function(item) {
        return item.progress_key && item.content_id && item.content_type;
    });

    if (!items.length) {
        return Promise.resolve({});
    }

    return requestJson(NUVIO_API_BASE + '/api/addons/resolve-watch-metadata', 'POST', {
        items: items,
        addons: buildNuvioMetadataAddonPayload()
    }).then(function(payload) {
        return payload && payload.resolved ? payload.resolved : {};
    }).catch(function(error) {
        console.log('Nuvio watch metadata resolve failed', error.message);
        return resolveWatchProgressMetadataFromAddons(items);
    });
}

function resolveWatchProgressMetadataFromAddons(items) {
    var resolved = {};

    return Promise.all((items || []).map(function(item) {
        var type = normalizeAddonType(item.content_type);

        if (!type || !item.content_id || !item.progress_key) {
            return null;
        }

        return fetchMetaFromAddons(type, item.content_id).then(function(meta) {
            if (!meta) {
                return null;
            }

            resolved[item.progress_key] = {
                name: meta.name || item.content_id,
                poster: meta.poster || '',
                background: meta.background || meta.poster || '',
                description: meta.description || '',
                from_addon: ''
            };
            return null;
        }).catch(function() {
            return null;
        });
    })).then(function() {
        return resolved;
    });
}

function rowToContinueEntry(row, metadata) {
    var kind = normalizeAddonType(row && row.content_type);
    var resolved = metadata && row ? metadata[row.progress_key] : null;
    var item;
    var video = null;

    if (!row || !kind || !row.content_id) {
        return null;
    }

    item = {
        id: row.content_id,
        name: resolved && resolved.name ? resolved.name : row.content_id,
        poster: resolved && resolved.poster ? resolved.poster : '',
        background: resolved && resolved.background ? resolved.background : resolved && resolved.poster || '',
        description: resolved && resolved.description ? resolved.description : '',
        releaseInfo: '',
        year: '',
        imdbRating: ''
    };

    if (kind === 'series') {
        video = {
            id: row.video_id || row.content_id + ':' + row.season + ':' + row.episode,
            title: '',
            season: row.season,
            episode: row.episode
        };
    } else {
        video = {
            id: row.video_id || row.content_id,
            title: item.name
        };
    }

    return normalizeContinueEntry({
        kind: kind,
        item: item,
        video: video,
        progressKey: row.progress_key,
        position: typeof row.position === 'number' ? row.position : 0,
        duration: typeof row.duration === 'number' ? row.duration : 0,
        lastWatched: row.last_watched,
        updatedAt: row.last_watched ? new Date(row.last_watched).toISOString() : null
    });
}

function rowToLibraryEntry(row) {
    var kind = normalizeAddonType(row && row.content_type);

    if (!row || !kind || !row.content_id) {
        return null;
    }

    return normalizeLibraryEntry({
        kind: kind,
        item: {
            id: row.content_id,
            name: row.name || row.content_id,
            poster: row.poster || '',
            background: row.background || row.poster || '',
            description: row.description || '',
            releaseInfo: row.release_info || '',
            year: row.release_info || '',
            imdbRating: row.imdb_rating
        },
        addedAt: row && (row.created_at || row.added_at),
        updatedAt: row && row.updated_at,
        backendId: row.id,
        userId: row.user_id,
        posterShape: row.poster_shape,
        genres: row.genres,
        addonBaseUrl: row.addon_base_url,
        createdAt: row.created_at
    });
}

function fetchContinueWatchingFromNuvio() {
    if (!state.authKey) {
        return Promise.resolve(false);
    }

    return requestSupabaseWithSession('/rest/v1/rpc/sync_pull_watch_progress', 'POST', {
        p_profile_id: NUVIO_PROFILE_ID,
        p_limit: WATCH_PROGRESS_PULL_LIMIT
    }).then(function(rows) {
        var progressRows = Array.isArray(rows) ? rows : [];

        if (!progressRows.length) {
            return false;
        }

        return resolveWatchProgressMetadata(progressRows).then(function(metadata) {
            var entries = progressRows.map(function(row) {
                return rowToContinueEntry(row, metadata);
            }).filter(Boolean);

            if (!entries.length) {
                return false;
            }
            state.continueWatching = dedupeEntries(entries, normalizeContinueEntry, CONTINUE_WATCHING_LIMIT);
            saveContinueWatching();
            renderContinueWatching();
            return true;
        });
    }).catch(function(error) {
        if (!isMissingSupabaseResource(error)) {
            console.log('Nuvio watch history sync unavailable', error.message);
        }
        return false;
    });
}

function fetchLibraryFromNuvio() {
    if (!state.authKey) {
        return Promise.resolve(false);
    }

    return requestSupabaseWithSession('/rest/v1/rpc/sync_pull_library', 'POST', {
        p_limit: LIBRARY_PULL_LIMIT,
        p_offset: 0,
        p_profile_id: NUVIO_PROFILE_ID
    }).then(function(rows) {
        var entries = (Array.isArray(rows) ? rows : []).map(rowToLibraryEntry).filter(Boolean);

        if (!entries.length) {
            state.libraryItems = [];
            saveLibraryItems();
            renderLibraryView();
            updateLibraryButtonUi();
            return true;
        }

        state.libraryItems = dedupeEntries(entries, normalizeLibraryEntry, LIBRARY_LIMIT);
        saveLibraryItems();
        renderLibraryView();
        updateLibraryButtonUi();
        return true;
    }).catch(function(error) {
        if (!isMissingSupabaseResource(error)) {
            console.log('Nuvio library sync unavailable', error.message);
        }
        return false;
    });
}

function continueEntryToWatchProgressPayload(entry) {
    var normalized = normalizeContinueEntry(entry);
    var contentId = normalized && normalized.item ? normalized.item.id : '';
    var video = normalized ? normalized.video : null;
    var kind = normalized ? normalizeAddonType(normalized.kind) : '';

    return {
        progress_key: normalized.progressKey || buildWatchProgressKey(kind, contentId, video),
        content_id: contentId,
        content_type: kind,
        video_id: buildWatchVideoId(kind, contentId, video),
        season: kind === 'series' && video ? getVideoSeason(video) : null,
        episode: kind === 'series' && video ? getVideoEpisode(video) : null,
        position: typeof normalized.position === 'number' ? normalized.position : 0,
        duration: typeof normalized.duration === 'number' ? normalized.duration : 0,
        last_watched: normalized.lastWatched || Date.now()
    };
}

function pushContinueWatchingToNuvio(entry) {
    var normalized = normalizeContinueEntry(entry);

    if (!state.authKey || !normalized) {
        return Promise.resolve(false);
    }

    return requestSupabaseWithSession('/rest/v1/rpc/sync_push_watch_progress', 'POST', {
        p_entries: [continueEntryToWatchProgressPayload(normalized)],
        p_profile_id: NUVIO_PROFILE_ID
    }).then(function() {
        return true;
    }).catch(function(error) {
        if (!isMissingSupabaseResource(error)) {
            console.log('Nuvio watch history update failed', error.message);
        }
        return false;
    });
}

function deleteContinueWatchingFromNuvio(entry) {
    var normalized = normalizeContinueEntry(entry);
    var progressKey;

    if (!state.authKey || !normalized) {
        return Promise.resolve(false);
    }

    progressKey = normalized.progressKey || buildWatchProgressKey(normalized.kind, normalized.item.id, normalized.video);
    return requestSupabaseWithSession('/rest/v1/rpc/sync_delete_watch_progress', 'POST', {
        p_keys: [progressKey, normalized.item.id],
        p_profile_id: NUVIO_PROFILE_ID
    }).then(function() {
        return true;
    }).catch(function(error) {
        if (!isMissingSupabaseResource(error)) {
            console.log('Nuvio watch history delete failed', error.message);
        }
        return false;
    });
}

function libraryEntryToNuvioPayload(entry) {
    var normalized = normalizeLibraryEntry(entry);
    var item = normalized && normalized.item ? normalized.item : {};
    var rating = item.imdbRating;
    var payload = {
        content_id: item.id || '',
        content_type: normalizeAddonType(normalized && normalized.kind),
        name: item.name || item.id || '',
        poster: item.poster || '',
        poster_shape: normalized && normalized.posterShape || 'POSTER',
        background: item.background || item.poster || '',
        description: item.description || '',
        release_info: item.releaseInfo || item.year || '',
        imdb_rating: typeof rating === 'number' ? rating : rating ? parseFloat(rating) || null : null,
        genres: normalized && Array.isArray(normalized.genres) ? normalized.genres : [],
        addon_base_url: normalized && normalized.addonBaseUrl || null,
        added_at: normalized && typeof normalized.addedAt === 'number' ? normalized.addedAt : 0
    };

    if (normalized && normalized.backendId) {
        payload.id = normalized.backendId;
    }
    if (normalized && normalized.userId) {
        payload.user_id = normalized.userId;
    }
    if (normalized && normalized.createdAt) {
        payload.created_at = normalized.createdAt;
    }
    if (normalized && normalized.updatedAt) {
        payload.updated_at = normalized.updatedAt;
    }
    payload.profile_id = NUVIO_PROFILE_ID;

    return payload;
}

function syncLibraryToNuvio() {
    if (!state.authKey) {
        return Promise.resolve(false);
    }

    return requestSupabaseWithSession('/rest/v1/rpc/sync_push_library', 'POST', {
        p_items: state.libraryItems.map(libraryEntryToNuvioPayload),
        p_profile_id: NUVIO_PROFILE_ID
    }).then(function() {
        return true;
    }).catch(function(error) {
        if (!isMissingSupabaseResource(error)) {
            console.log('Nuvio library update failed', error.message);
        }
        return false;
    });
}

function syncNuvioUserData() {
    return Promise.all([
        fetchContinueWatchingFromNuvio(),
        fetchLibraryFromNuvio()
    ]).then(function() {
        renderContinueWatching();
        renderLibraryView();
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
    function getBrowseTypeFromContainer(containerId) {
        return containerId === 'movieGenreRow' ? 'movie' : 'series';
    }

    function renderYearFilters(container, type, yearOptions, activeKey, onSelect) {
        var label;
        var stack;
        var start;
        var visibleOptions;
        var open;
        var collapsedIndex;

        if (!yearOptions.length) {
            return;
        }

        open = isYearFilterOpen(type);
        if (open) {
            start = getOpenYearWindowStartForRender(type, yearOptions);
            visibleOptions = yearOptions.slice(start, start + YEAR_FILTER_WINDOW_SIZE);
        } else {
            collapsedIndex = getCollapsedYearIndex(type, yearOptions, activeKey);
            start = collapsedIndex;
            visibleOptions = [yearOptions[collapsedIndex]];
        }

        label = document.createElement('span');
        label.className = 'year-filter-label';
        label.textContent = 'Year';
        container.appendChild(label);

        stack = document.createElement('div');
        stack.className = 'year-filter-stack';
        stack.setAttribute('data-year-filter-type', type);

        visibleOptions.forEach(function(option, index) {
            var button = document.createElement('button');
            var optionIndex = start + index;

            button.className = 'genre-chip is-year-filter';
            button.type = 'button';
            button.setAttribute('tabindex', '-1');
            button.setAttribute('data-year-filter-type', type);
            button.setAttribute('data-year-index', String(optionIndex));
            button.setAttribute('data-year-total', String(yearOptions.length));
            button.setAttribute('aria-expanded', open ? 'true' : 'false');
            button.textContent = option.label;
            button.setAttribute('aria-label', open ? 'Year ' + option.label : 'Choose year. Current ' + option.label);
            if (option.key === activeKey) {
                button.classList.add('is-selected');
            }
            if (!open) {
                button.classList.add('is-year-collapsed');
            }
            if (open && optionIndex === start && start > 0) {
                button.classList.add('is-year-window-edge');
            }
            if (open && optionIndex === start + visibleOptions.length - 1 && optionIndex < yearOptions.length - 1) {
                button.classList.add('is-year-window-edge');
            }
            button.addEventListener('click', function() {
                if (!isYearFilterOpen(type)) {
                    setYearFocusIndex(type, optionIndex);
                    setYearWindowStart(type, clampYearWindowStart(optionIndex - 1, yearOptions.length));
                    setYearFilterOpen(type, true);
                    renderBrowseGenreRows();
                    focusYearFilter(type, optionIndex);
                    return;
                }

                setYearFilterOpen(type, false);
                setYearFocusIndex(type, optionIndex);
                onSelect(option);
                renderBrowseGenreRows();
                focusYearFilter(type, optionIndex);
            });
            stack.appendChild(button);
        });

        container.appendChild(stack);
    }

    function renderRow(containerId, options, activeKey, onSelect) {
        var container = byId(containerId);
        var type = getBrowseTypeFromContainer(containerId);
        var normalOptions = options.filter(function(option) {
            return !isYearBrowseOption(option);
        });
        var yearOptions = options.filter(isYearBrowseOption);
        var previousGroup = '';
        container.innerHTML = '';

        normalOptions.forEach(function(option) {
            var group = option.filterGroup || 'catalog';
            var button = document.createElement('button');
            button.className = 'genre-chip is-' + group + '-filter';
            button.type = 'button';
            button.setAttribute('tabindex', '-1');
            if (option.key === activeKey) {
                button.classList.add('is-selected');
            }
            if (previousGroup && previousGroup !== group) {
                button.classList.add('is-filter-group-start');
            }
            previousGroup = group;
            button.textContent = option.label;
            button.addEventListener('click', function() {
                setYearFilterOpen(type, false);
                onSelect(option);
            });
            container.appendChild(button);
        });

        renderYearFilters(container, type, yearOptions, activeKey, onSelect);
    }

    renderRow('movieGenreRow', state.movieGenres, state.selectedMovieGenre, function(option) {
        setSelectedBrowseKey('movie', option.key);
        resetBrowsePaging('movie');
        fetchBrowseCatalog('movie', false);
    });

    renderRow('seriesGenreRow', state.seriesGenres, state.selectedSeriesGenre, function(option) {
        setSelectedBrowseKey('series', option.key);
        resetBrowsePaging('series');
        fetchBrowseCatalog('series', false);
    });
}

function moveFocusedYearFilter(direction) {
    var active = document.activeElement;
    var type = active && active.getAttribute ? active.getAttribute('data-year-filter-type') : '';
    var currentIndex;
    var nextIndex;
    var yearOptions;
    var start;
    var nextStart;
    var rowId;
    var nextButton;
    var row;
    var nextCol;

    if (!type) {
        type = getCurrentBrowseType();
    }
    if (!type || !isYearFilterOpen(type)) {
        return false;
    }

    currentIndex = active && active.classList && active.classList.contains('is-year-filter')
        ? Number(active.getAttribute('data-year-index'))
        : getYearFocusIndex(type);
    if (currentIndex !== currentIndex) {
        currentIndex = getYearFocusIndex(type);
    }

    yearOptions = getBrowseOptions(type).filter(isYearBrowseOption);
    nextIndex = currentIndex + direction;

    if (!yearOptions.length || currentIndex !== currentIndex) {
        return false;
    }
    if (nextIndex < 0 || nextIndex >= yearOptions.length) {
        return true;
    }
    setYearFocusIndex(type, nextIndex);

    start = clampYearWindowStart(getYearWindowStart(type), yearOptions.length);
    nextStart = start;
    if (nextIndex < start) {
        nextStart = nextIndex;
    } else if (nextIndex >= start + YEAR_FILTER_WINDOW_SIZE) {
        nextStart = nextIndex - YEAR_FILTER_WINDOW_SIZE + 1;
    }
    nextStart = clampYearWindowStart(nextStart, yearOptions.length);

    if (nextStart !== start) {
        setYearWindowStart(type, nextStart);
        renderBrowseGenreRows();
    }

    rowId = type === 'movie' ? 'movieGenreRow' : 'seriesGenreRow';
    nextButton = queryAll('#' + rowId + ' .is-year-filter[data-year-index="' + nextIndex + '"]')[0];
    if (!nextButton) {
        renderBrowseGenreRows();
        focusYearFilter(type, nextIndex);
        return true;
    }

    row = queryAll('#' + rowId + ' .genre-chip');
    nextCol = row.indexOf(nextButton);
    if (nextCol >= 0) {
        state.mainRow = 0;
        state.mainCol = nextCol;
    }
    focusCurrent();
    return true;
}

function exitFocusedYearFilter(direction) {
    var active = document.activeElement;
    var type = active && active.getAttribute ? active.getAttribute('data-year-filter-type') : '';
    var rowId;
    var row;
    var currentCol;
    var nextCol;

    if (!type || !active.classList || !active.classList.contains('is-year-filter')) {
        return false;
    }

    rowId = type === 'movie' ? 'movieGenreRow' : 'seriesGenreRow';
    row = queryAll('#' + rowId + ' .genre-chip');
    currentCol = row.indexOf(active);
    if (currentCol < 0) {
        return false;
    }

    if (direction < 0) {
        setYearFilterOpen(type, false);
        nextCol = currentCol - 1;
        while (nextCol >= 0 && row[nextCol].classList.contains('is-year-filter')) {
            nextCol -= 1;
        }
        if (nextCol >= 0) {
            state.mainRow = 0;
            state.mainCol = nextCol;
            renderBrowseGenreRows();
            focusCurrent();
        } else {
            renderBrowseGenreRows();
            focusYearFilter(type, getCollapsedYearIndex(type, getBrowseOptions(type).filter(isYearBrowseOption), getSelectedBrowseKey(type)));
        }
        return true;
    }

    setYearFilterOpen(type, false);
    nextCol = currentCol + 1;
    while (nextCol < row.length && row[nextCol].classList.contains('is-year-filter')) {
        nextCol += 1;
    }
    if (nextCol < row.length) {
        state.mainRow = 0;
        state.mainCol = nextCol;
        renderBrowseGenreRows();
        focusCurrent();
    } else {
        renderBrowseGenreRows();
        focusYearFilter(type, getCollapsedYearIndex(type, getBrowseOptions(type).filter(isYearBrowseOption), getSelectedBrowseKey(type)));
    }
    return true;
}

function updateBrowseLoadMoreButton(type) {
    var button = byId(type === 'movie' ? 'movieLoadMoreButton' : 'seriesLoadMoreButton');
    var option = getSelectedBrowseOption(type);
    var canLoadMore = !!option && getBrowseCanLoadMore(type);
    var loading = getBrowseLoadingMore(type);
    var label = type === 'movie' ? 'Films' : 'Series';
    var text;

    if (!button) {
        return;
    }

    text = loading ? 'Loading ' + label : (canLoadMore ? 'Load More ' + label : 'No More ' + label);
    button.disabled = !canLoadMore && !loading;
    button.classList.toggle('is-loading', loading);
    button.setAttribute('aria-busy', loading ? 'true' : 'false');
    button.setAttribute('aria-disabled', loading || !canLoadMore ? 'true' : 'false');
    button.textContent = text;
    button.setAttribute('aria-label', text);
}

function renderBrowseViews() {
    renderCardRows('movieGrid', state.movieBrowseItems, 'movie', BROWSE_ROW_SIZE);
    renderCardRows('seriesGrid', state.seriesBrowseItems, 'series', BROWSE_ROW_SIZE);

    byId('movieCount').textContent = state.movieBrowseItems.length + ' loaded • ' + getSelectedBrowseLabel('movie')
        + (getBrowseCanLoadMore('movie') ? '' : ' • end');
    byId('seriesCount').textContent = state.seriesBrowseItems.length + ' loaded • ' + getSelectedBrowseLabel('series')
        + (getBrowseCanLoadMore('series') ? '' : ' • end');
    updateBrowseLoadMoreButton('movie');
    updateBrowseLoadMoreButton('series');
    renderBrowseGenreRows();
}

function getLibraryCardItems() {
    return state.libraryItems.map(function(entry) {
        var item = cloneContinueItem(entry.item);

        item.__kind = entry.kind;
        return item;
    });
}

function renderLibraryView() {
    var items = getLibraryCardItems();
    var empty = byId('libraryEmptyState');

    if (!byId('libraryGrid')) {
        return;
    }

    renderCardRows('libraryGrid', items, null, LIBRARY_ROW_SIZE, {
        hideSynopsis: true
    });
    byId('libraryCount').textContent = items.length
        ? items.length + ' saved'
        : 'Nothing saved yet';
    if (empty) {
        empty.classList.toggle('is-visible', !items.length);
    }
}

function isSelectedInLibrary() {
    var key;

    if (!state.selectedItem || !state.selectedType) {
        return false;
    }

    key = state.selectedType + ':' + state.selectedItem.id;
    return state.libraryItems.some(function(entry) {
        return continueEntryKey(entry) === key;
    });
}

function updateLibraryButtonUi() {
    var button = byId('detailLibraryButton');
    var selected = !!(state.selectedItem && state.selectedType);
    var saved = selected && isSelectedInLibrary();

    if (!button) {
        return;
    }

    button.disabled = !selected;
    button.classList.toggle('is-saved', saved);
    button.setAttribute('aria-label', saved ? 'Remove from library' : 'Add to library');
    button.title = saved ? 'Remove this title from your library' : 'Add this title to your library';
}

function addSelectedToLibrary() {
    var snapshot;
    var key;

    if (!state.selectedItem || !state.selectedType) {
        setAddonsMessage('Choose a title first.', 'error');
        updateLibraryButtonUi();
        return;
    }

    snapshot = {
        kind: state.selectedType,
        item: cloneContinueItem(state.selectedItem),
        addedAt: new Date().toISOString()
    };
    key = continueEntryKey(snapshot);

    if (isSelectedInLibrary()) {
        removeSelectedFromLibrary();
        return;
    }

    state.libraryItems = [snapshot].concat(state.libraryItems.filter(function(entry) {
        return continueEntryKey(entry) !== key;
    })).slice(0, LIBRARY_LIMIT);

    saveLibraryItems();
    renderLibraryView();
    updateLibraryButtonUi();
    setAddonsMessage('Added to your library.', 'success');
    syncLibraryToNuvio();
}

function removeSelectedFromLibrary() {
    var key;

    if (!state.selectedItem || !state.selectedType) {
        setAddonsMessage('Choose a title first.', 'error');
        updateLibraryButtonUi();
        return;
    }

    key = state.selectedType + ':' + state.selectedItem.id;
    state.libraryItems = state.libraryItems.filter(function(entry) {
        return continueEntryKey(entry) !== key;
    });

    saveLibraryItems();
    renderLibraryView();
    updateLibraryButtonUi();
    setAddonsMessage('Removed from your library.', 'success');
    syncLibraryToNuvio();
}

function fetchBrowseCatalog(type, append) {
    var option = getSelectedBrowseOption(type);
    var currentItems = getBrowseItems(type);
    var skip = append ? currentItems.length : 0;
    var useLocalPaging = usesLocalBrowsePaging(option, skip);
    var requestSkip = useLocalPaging ? 0 : getBrowseRequestSkip(option, skip);
    var requestLimit = append && isCinemetaSeriesTopCatalog(option) && !useLocalPaging
        ? CINEMETA_CATALOG_PAGE_SIZE
        : (append ? BROWSE_LOAD_MORE_SIZE : BROWSE_PAGE_SIZE);

    function finishAppendLoading() {
        if (append) {
            setBrowseLoadingMore(type, false);
            updateBrowseLoadMoreButton(type);
        }
    }

    if (append && getBrowseLoadingMore(type)) {
        return Promise.resolve();
    }
    if (append) {
        setBrowseLoadingMore(type, true);
        updateBrowseLoadMoreButton(type);
    }

    if (!option) {
        setBrowseItems(type, []);
        setBrowseCanLoadMore(type, false);
        finishAppendLoading();
        renderBrowseViews();
        updateConnectionStatus('No addon catalogs are available for ' + type + '.', false, true);
        return Promise.resolve();
    }

    if (append && isCinemetaBrowseExpansionOption(option)) {
        updateConnectionStatus('Loading ' + type + ' browse...', false, false);
        return fetchCinemetaBrowseAppend(type, option, currentItems).then(function(result) {
            setBrowseItems(type, result.items);
            setBrowseSkip(type, result.items.length);
            setBrowseCanLoadMore(type, result.canLoadMore);
            setBrowseExpansionIndex(type, getBrowseExpansionIndex(type) + result.consumedSources);
            renderBrowseViews();
            updateConnectionStatus(
                result.items.length === currentItems.length
                    ? 'No more full rows are available in this catalog.'
                    : 'Addon catalogs ready',
                result.items.length !== currentItems.length,
                result.items.length === currentItems.length
            );
            if ((type === 'movie' && state.currentView === 'movies') || (type === 'series' && state.currentView === 'series')) {
                setTimeout(focusCurrent, 0);
            }
            finishAppendLoading();
            scheduleBrowsePrefetch(type);
        }).catch(function(error) {
            finishAppendLoading();
            updateConnectionStatus('Catalog error: ' + error.message, false, true);
        });
    }

    if (append && !useLocalPaging && !supportsRemoteBrowsePaging(option)) {
        setBrowseCanLoadMore(type, false);
        finishAppendLoading();
        renderBrowseViews();
        updateConnectionStatus('This catalog does not support loading more items.', false, true);
        return Promise.resolve();
    }

    updateConnectionStatus('Loading ' + type + ' browse...', false, false);

    return requestBrowseCatalogPayload(option, requestSkip).then(function(payload) {
        var normalized = useLocalPaging
            ? shuffleCatalogItems(uniqueCatalogItems(payload && Array.isArray(payload.metas) ? payload.metas : []))
            : shuffleCatalogItems(uniqueCatalogItems(normalizeCatalogPayloadWithLimit(payload, requestLimit)));
        var items = useLocalPaging ? normalized.slice(skip, skip + requestLimit) : normalized.slice(0, requestLimit);
        var nextItems = trimToFullBrowseRows(append ? uniqueCatalogItems(currentItems.concat(items)) : items);
        var remainingLocalItems = normalized.length - nextItems.length;
        var canLoadMore = useLocalPaging
            ? remainingLocalItems >= BROWSE_ROW_SIZE || isCinemetaSeriesTopCatalog(option)
            : supportsRemoteBrowsePaging(option) && (!append || nextItems.length > currentItems.length);

        setBrowseItems(type, nextItems);
        setBrowseSkip(type, nextItems.length);
        setBrowseCanLoadMore(type, canLoadMore);
        if (append && nextItems.length === currentItems.length) {
            updateConnectionStatus('No more full rows are available in this catalog.', false, true);
        } else {
            updateConnectionStatus('Addon catalogs ready', true, false);
        }
        renderBrowseViews();
        if ((type === 'movie' && state.currentView === 'movies') || (type === 'series' && state.currentView === 'series')) {
            setTimeout(focusCurrent, 0);
        }
        finishAppendLoading();
        scheduleBrowsePrefetch(type);
    }).catch(function(error) {
        finishAppendLoading();
        updateConnectionStatus('Catalog error: ' + error.message, false, true);
    });
}

function fetchCatalogs() {
    updateConnectionStatus('Loading catalogs...', false, false);

    return fetchCatalogManifest().then(function() {
        var movieOption = getSelectedBrowseOption('movie');
        var seriesOption = getSelectedBrowseOption('series');
        var movieRequest = movieOption
            ? requestBrowseCatalogPayload(movieOption, 0).catch(function() {
                return { metas: [] };
            })
            : Promise.resolve({ metas: [] });
        var seriesRequest = seriesOption
            ? requestBrowseCatalogPayload(seriesOption, 0).catch(function() {
                return { metas: [] };
            })
            : Promise.resolve({ metas: [] });

        return Promise.all([movieRequest, seriesRequest]).then(function(results) {
            state.movies = uniqueCatalogItems(normalizeCatalogPayload(results[0]), HOME_CATALOG_LIMIT);
            state.series = uniqueCatalogItems(normalizeCatalogPayload(results[1]), HOME_CATALOG_LIMIT);
            state.movieBrowseItems = trimToFullBrowseRows(shuffleCatalogItems(uniqueCatalogItems(normalizeCatalogPayloadWithLimit(results[0], CINEMETA_CATALOG_PAGE_SIZE))).slice(0, BROWSE_PAGE_SIZE));
            state.seriesBrowseItems = trimToFullBrowseRows(shuffleCatalogItems(uniqueCatalogItems(normalizeCatalogPayloadWithLimit(results[1], CINEMETA_CATALOG_PAGE_SIZE))).slice(0, BROWSE_PAGE_SIZE));
            renderCatalogViews();
            renderBrowseViews();
            scheduleBrowsePrefetch('movie');
            scheduleBrowsePrefetch('series');

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
        code.textContent = 'TV already connected';
    }
    setQrExpiryMessage('Use Refresh QR to connect a different account from your phone.');
    setQrLoginMessage('QR login is available, but this TV already has a Nuvio session.', 'success');
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
            tv_client: 'nuvio-tv-shell'
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
        body.p_device_name = 'Nuvio TV Shell';
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
                return syncNuvioUserData();
            }).then(function() {
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
            setQrExpiryMessage('Phone approved. Finishing TV sign-in…');
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

        setQrLoginMessage('Waiting for phone approval…', null);
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
        'Creating a fresh TV login session.',
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
                return syncNuvioUserData();
            }).then(function() {
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

function normalizeAddonSubtitleTracks(addonName, baseUrl, subtitles, idPrefix) {
    var safeAddonName = addonName.replace(/[^a-z0-9]+/ig, '-').toLowerCase();
    var safePrefix = String(idPrefix || 'result').replace(/[^a-z0-9]+/ig, '-').toLowerCase();

    return (subtitles || []).map(function(track, index) {
        var url = track && (track.url || track.src || track.file);

        if (!url) {
            return null;
        }
        if (!isEnglishSubtitleEntry(track)) {
            return null;
        }

        return {
            id: 'subtitle-ext-addon-' + safeAddonName + '-' + safePrefix + '-' + index,
            index: index,
            kind: 'external',
            url: resolveUrl(baseUrl, url),
            headers: getSubtitleRequestHeaders(null, track),
            language: track.lang || track.language || track.languageCode || track.iso639_1 || track.iso639_2 || track.ISO639 || '',
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
    var requests = [];

    if (!baseUrl) {
        return Promise.resolve([]);
    }

    function buildSubtitleRequestUrl(id, args) {
        return baseUrl
            + '/subtitles/'
            + encodeURIComponent(type)
            + '/'
            + encodeURIComponent(id)
            + (args ? '/' + args : '')
            + '.json';
    }

    function queueRequest(id, args, key) {
        var requestUrl;

        if (!id) {
            return;
        }

        requestUrl = buildSubtitleRequestUrl(id, args);
        requests.push(requestJson(requestUrl, 'GET').then(function(payload) {
            var subtitles = payload && Array.isArray(payload.subtitles)
                ? payload.subtitles
                : (payload && Array.isArray(payload.subtitle) ? payload.subtitle : []);

            return normalizeAddonSubtitleTracks(addonName, baseUrl, subtitles, key);
        }).catch(function() {
            return [];
        }));
    }

    idCandidates.forEach(function(id, index) {
        if (extraArgs) {
            queueRequest(id, extraArgs, 'stream-' + index);
        }
        queueRequest(id, '', 'id-' + index);
    });

    return Promise.all(requests).then(function(groups) {
        var tracks = [];

        groups.forEach(function(group) {
            tracks = tracks.concat(group);
        });

        return dedupeSubtitleTracks(tracks);
    });
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

function getSeasonEpisodeCount(season) {
    return state.allSeriesVideos.filter(function(video) {
        return getVideoSeason(video) === season;
    }).length;
}

function getEpisodeBrowserRowCount() {
    if (state.selectedType !== 'series' || state.detailMode !== 'episodes') {
        return 0;
    }

    return Math.max(state.availableSeasons.length, state.selectedEpisodes.length);
}

function getVisibleDetailActionRowCount() {
    return queryAll('#detailActions .action-button').some(function(button) {
        return isVisibleControl(button);
    }) ? 1 : 0;
}

function getFirstStreamMainRow() {
    return getVisibleDetailActionRowCount() + getEpisodeBrowserRowCount();
}

function getSelectedEpisodeMainRow() {
    var episodeIndex = 0;

    if (state.selectedVideo && state.selectedVideo.id) {
        state.selectedEpisodes.some(function(video, index) {
            if (video && video.id === state.selectedVideo.id) {
                episodeIndex = index;
                return true;
            }
            return false;
        });
    }

    return getVisibleDetailActionRowCount() + episodeIndex;
}

function isEpisodeBrowserNavigationActive() {
    return state.currentView === 'addons'
        && state.detailMode === 'episodes'
        && state.focusRegion === 'main';
}

function getEpisodeBrowserStartRow() {
    return getVisibleDetailActionRowCount();
}

function getFocusedEpisodeIndex() {
    return queryAll('#episodeRail .episode-card').filter(isVisibleControl).indexOf(document.activeElement);
}

function getFocusedSeasonIndex() {
    return queryAll('#seasonRail .season-chip').filter(isVisibleControl).indexOf(document.activeElement);
}

function focusEpisodeBrowserEpisode(index) {
    var episodes = queryAll('#episodeRail .episode-card').filter(isVisibleControl);
    var seasons = queryAll('#seasonRail .season-chip').filter(isVisibleControl);
    var safeIndex;

    if (!episodes.length) {
        return false;
    }

    safeIndex = Math.max(0, Math.min(index, episodes.length - 1));
    state.mainRow = getEpisodeBrowserStartRow() + safeIndex;
    state.mainCol = seasons[safeIndex] ? 1 : 0;
    focusCurrent();
    return true;
}

function focusEpisodeBrowserSeason(index) {
    var seasons = queryAll('#seasonRail .season-chip').filter(isVisibleControl);
    var safeIndex;

    if (!seasons.length) {
        return false;
    }

    safeIndex = Math.max(0, Math.min(index, seasons.length - 1));
    state.mainRow = getEpisodeBrowserStartRow() + safeIndex;
    state.mainCol = 0;
    focusCurrent();
    return true;
}

function moveEpisodeBrowserVertical(direction) {
    var episodeIndex;
    var seasonIndex;
    var targetIndex;

    if (!isEpisodeBrowserNavigationActive()) {
        return false;
    }

    episodeIndex = getFocusedEpisodeIndex();
    if (episodeIndex !== -1) {
        targetIndex = episodeIndex + direction;
        if (targetIndex >= 0 && targetIndex < state.selectedEpisodes.length) {
            return focusEpisodeBrowserEpisode(targetIndex);
        }
        return false;
    }

    seasonIndex = getFocusedSeasonIndex();
    if (seasonIndex !== -1) {
        targetIndex = seasonIndex + direction;
        if (targetIndex >= 0 && targetIndex < state.availableSeasons.length) {
            return focusEpisodeBrowserSeason(targetIndex);
        }
        return false;
    }

    return false;
}

function moveEpisodeBrowserHorizontal(direction) {
    var episodeIndex;
    var seasonIndex;

    if (!isEpisodeBrowserNavigationActive()) {
        return false;
    }

    episodeIndex = getFocusedEpisodeIndex();
    if (direction < 0 && episodeIndex !== -1) {
        return focusEpisodeBrowserSeason(episodeIndex);
    }

    seasonIndex = getFocusedSeasonIndex();
    if (direction > 0 && seasonIndex !== -1) {
        return focusEpisodeBrowserEpisode(seasonIndex);
    }

    return false;
}

function applyDetailMode() {
    var hasSelection = !!state.selectedItem;
    var isSeries = state.selectedType === 'series';
    var showDetails = !hasSelection || !isSeries || state.detailMode === 'details';
    var showEpisodes = hasSelection && isSeries && state.detailMode === 'episodes';
    var showStreams = hasSelection && (!isSeries || state.detailMode === 'sources');
    var detailHero = byId('detailHeroRow');
    var episodeSection = byId('episodeSection');
    var streamSection = byId('streamSection');

    if (detailHero) {
        detailHero.style.display = showDetails ? '' : 'none';
    }
    if (episodeSection) {
        episodeSection.style.display = showEpisodes && state.selectedEpisodes.length ? '' : 'none';
    }
    if (streamSection) {
        streamSection.style.display = showStreams ? '' : 'none';
    }
}

function getVideoTitle(video) {
    return video && (video.title || video.name) || 'Episode';
}

function getVideoDescription(video) {
    return video && (
        video.overview ||
        video.description ||
        video.summary ||
        video.plot ||
        video.synopsis
    ) || state.selectedItem && state.selectedItem.description || 'No episode description was returned for this title.';
}

function getVideoThumbnail(video) {
    return video && (
        video.thumbnail ||
        video.thumbnailUrl ||
        video.poster ||
        video.background ||
        video.image
    ) || state.selectedItem && (state.selectedItem.background || state.selectedItem.poster) || '';
}

function formatVideoRuntime(video) {
    var value = video && (video.runtime || video.duration || video.length);
    var minutes;

    if (typeof value === 'number' && !isNaN(value)) {
        minutes = value > 1000 ? Math.round(value / 60000) : Math.round(value);
        return minutes ? '(' + minutes + 'm)' : '';
    }

    if (typeof value === 'string' && value) {
        if (/^\d+$/.test(value)) {
            minutes = parseInt(value, 10);
            return minutes ? '(' + minutes + 'm)' : '';
        }
        return value.charAt(0) === '(' ? value : '(' + value + ')';
    }

    return '';
}

function formatEpisodeCode(video) {
    return 'S' + getVideoSeason(video) + ':E' + (getVideoEpisode(video) || '?');
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
    byId('episodeBrowserTitle').textContent = formatSeasonLabel(state.selectedSeason);
    byId('episodeBrowserCount').textContent = state.selectedEpisodes.length + ' episode' + (state.selectedEpisodes.length === 1 ? '' : 's');
    warmEpisodeArtwork(state.selectedEpisodes, 0, 8);

    state.selectedEpisodes.forEach(function(video, index) {
        var button = document.createElement('button');
        var thumb = document.createElement('div');
        var thumbImg = document.createElement('img');
        var thumbLabel = document.createElement('span');
        var copy = document.createElement('div');
        var title = document.createElement('div');
        var description = document.createElement('p');
        var runtime = document.createElement('div');
        var imageUrl = getVideoThumbnail(video);

        button.className = 'episode-card';
        button.type = 'button';
        button.setAttribute('tabindex', '-1');

        thumb.className = 'episode-thumb';
        if (imageUrl) {
            thumb.classList.add('is-loading');
            thumbImg.decoding = 'async';
            thumbImg.loading = index < 5 ? 'eager' : 'lazy';
            thumbImg.onload = function() {
                thumb.classList.remove('is-loading');
                thumb.classList.add('is-loaded');
            };
            thumbImg.onerror = function() {
                thumb.classList.remove('is-loading');
                thumb.classList.add('is-empty');
            };
            thumbImg.src = imageUrl;
            thumbImg.alt = getVideoTitle(video);
            if (thumbImg.complete && (thumbImg.naturalWidth || thumbImg.naturalHeight)) {
                thumb.classList.remove('is-loading');
                thumb.classList.add('is-loaded');
            }
            thumb.appendChild(thumbImg);
        } else {
            thumb.classList.add('is-empty');
            thumb.textContent = formatEpisodeCode(video);
        }
        thumbLabel.className = 'episode-thumb-label';
        thumbLabel.textContent = formatEpisodeCode(video);
        thumb.appendChild(thumbLabel);

        copy.className = 'episode-copy';
        title.className = 'episode-title';
        title.textContent = getVideoTitle(video);
        description.className = 'episode-description';
        description.textContent = getVideoDescription(video);
        runtime.className = 'episode-runtime';
        runtime.textContent = formatVideoRuntime(video);

        copy.appendChild(title);
        copy.appendChild(description);
        if (runtime.textContent) {
            copy.appendChild(runtime);
        }

        button.appendChild(thumb);
        button.appendChild(copy);
        button.addEventListener('click', function() {
            state.selectedVideo = video;
            state.selectedSeason = getVideoSeason(video);
            state.detailMode = 'sources';
            state.streams = [];
            renderEpisodeBrowserForMode();
            renderStreamList();
            applyDetailMode();
            loadStreamsForSelection({
                focusStreams: true
            });
        });
        rail.appendChild(button);
    });
}

function renderSeasonRail() {
    var rail = byId('seasonRail');
    var section = byId('seasonSection');

    rail.innerHTML = '';

    if (state.selectedType !== 'series' || !state.availableSeasons.length) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    byId('episodeShowTitle').textContent = state.selectedItem && state.selectedItem.name || 'Series';
    byId('episodeShowMeta').textContent = [
        state.selectedItem && (state.selectedItem.year || state.selectedItem.releaseInfo),
        state.availableSeasons.length + ' season' + (state.availableSeasons.length === 1 ? '' : 's')
    ].filter(Boolean).join(' • ');

    state.availableSeasons.forEach(function(season) {
        var button = document.createElement('button');
        var label = document.createElement('span');
        var count = document.createElement('span');
        var episodeCount = getSeasonEpisodeCount(season);

        button.className = 'season-chip';
        button.type = 'button';
        button.setAttribute('tabindex', '-1');
        if (state.selectedSeason === season) {
            button.classList.add('is-selected');
        }
        label.textContent = formatSeasonLabel(season);
        count.textContent = episodeCount + ' episode' + (episodeCount === 1 ? '' : 's');
        button.appendChild(label);
        button.appendChild(count);
        button.addEventListener('click', function() {
            if (state.selectedSeason === season) {
                return;
            }
            state.selectedSeason = season;
            updateSelectedEpisodesForSeason();
            state.streams = [];
            state.detailMode = 'episodes';
            renderAddons();
            if (!state.selectedVideo) {
                setAddonsMessage('No episodes were returned for this season.', 'error');
                return;
            }
        });
        rail.appendChild(button);
    });
}

function renderStreamList() {
    var list = byId('streamList');

    byId('streamCount').textContent = String(state.streams.length);
    list.innerHTML = '';

    if (!state.streams.length) {
        applyDetailMode();
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

    applyDetailMode();
}

function renderEpisodeBrowserForMode() {
    if (state.selectedType === 'series' && state.detailMode === 'episodes') {
        renderSeasonRail();
        renderEpisodeRail();
        return;
    }

    if (byId('seasonRail')) {
        byId('seasonRail').innerHTML = '';
    }
    if (byId('episodeRail')) {
        byId('episodeRail').innerHTML = '';
    }
    if (byId('episodeSection')) {
        byId('episodeSection').style.display = 'none';
    }
}

function renderAddons() {
    var detailArtwork = byId('detailArtwork');
    var selectedTypeSummary = byId('selectedTypeSummary');
    var detailPlayButton = byId('detailPlayButton');
    var detailEpisodesButton = byId('detailEpisodesButton');

    //byId('addonCount').textContent = String(state.addons.length);

    if (!state.selectedItem) {
        byId('selectedTitle').textContent = 'Nothing selected';
        byId('selectedTypeLabel').textContent = 'Choose a title';
        byId('selectedDescription').textContent = 'Pick a movie or show from the catalog pages to inspect addon streams here.';
        byId('selectedVideoLabel').textContent = 'No episode selected';
        selectedTypeSummary.textContent = 'Choose a title';
        detailPlayButton.textContent = 'Play';
        detailEpisodesButton.textContent = 'Episodes';
        detailEpisodesButton.style.display = 'none';
        detailEpisodesButton.disabled = true;
        detailEpisodesButton.setAttribute('aria-hidden', 'true');
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
        detailEpisodesButton.textContent = 'More Episodes';
        detailEpisodesButton.style.display = state.selectedType === 'series' ? '' : 'none';
        detailEpisodesButton.disabled = state.selectedType !== 'series';
        detailEpisodesButton.setAttribute('aria-hidden', state.selectedType === 'series' ? 'false' : 'true');
        detailArtwork.style.backgroundImage = state.selectedItem.background || state.selectedItem.poster
            ? 'linear-gradient(180deg, rgba(9, 11, 17, 0.18), rgba(9, 11, 17, 0.42)), url("' + (state.selectedItem.background || state.selectedItem.poster) + '")'
            : 'linear-gradient(180deg, rgba(9, 11, 17, 0.18), rgba(9, 11, 17, 0.42)), #0b0d14';
    }

    updateLibraryButtonUi();
    renderEpisodeBrowserForMode();
    renderStreamList();
    applyDetailMode();
}

function renderPlayerState() {
    var video = byId('videoPlayer');
    var empty = byId('videoEmpty');
    var stream = state.currentStream;
    setPlayerToggleUi(false);
    setPlayerNextEpisodeUi();

    if (!stream) {
        resetTrackState();
        byId('playerTitle').textContent = 'No stream selected';
        byId('playerControlTitle').textContent = 'No stream selected';
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
    byId('playerControlTitle').textContent = getPlayerContentTitle();
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
        setPlayerNextEpisodeUi();
        return;
    }

    empty.classList.add('is-hidden');
    video.classList.remove('is-hidden');
    renderTrackSelectors();
    setPlayerNextEpisodeUi();
}

function startHtml5Stream(url) {
    var video = byId('videoPlayer');
    var playPromise;

    stopAvplayPlayback();
    byId('avplaySurface').classList.remove('is-active');
    video.classList.remove('is-hidden');
    state.playerMode = 'html5';
    resetWindowedAvplayFrame();

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
    renderHomeRailWindow('homeMovieRail', state.movies.slice(0, HOME_CATALOG_LIMIT).map(function(item) {
        return { item: item, kind: 'movie' };
    }), 'movies');
    renderHomeRailWindow('homeSeriesRail', state.series.slice(0, HOME_CATALOG_LIMIT).map(function(item) {
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
    var normalized = Math.max(0, Math.min(startIndex || 0, Math.max(total - 1, 0)));
    var index = 0;

    if (!total) {
        return windowItems;
    }

    for (index = normalized; index < Math.min(total, normalized + visibleCount); index += 1) {
        windowItems.push(entries[index]);
    }

    return windowItems;
}

function renderSingleHomeRail(descriptor) {
    if (!descriptor) {
        return;
    }

    renderHomeRailWindow(descriptor.containerId, descriptor.entries, descriptor.key);
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
    byId('searchDisplayValue').textContent = state.searchQuery || 'Search titles';
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
        button.setAttribute('tabindex', '-1');
        button.textContent = item.name || 'Untitled';
        button.addEventListener('click', function() {
            state.searchQuery = item.name || '';
            syncSearchDisplay();
            scheduleSearchCatalogs();
        });
        container.appendChild(button);
    });
}

function renderSearchKeyboard() {
    var container = byId('searchKeyboard');

    container.innerHTML = '';

    SEARCH_KEYBOARD_ROWS.forEach(function(row, rowIndex) {
        var rowEl = document.createElement('div');
        rowEl.className = 'search-keyboard-row';
        rowEl.id = 'searchKeyboardRow' + rowIndex;

        row.forEach(function(key) {
            var button = document.createElement('button');
            button.className = 'search-key';
            button.type = 'button';
            button.setAttribute('tabindex', '-1');
            button.setAttribute('data-key', key);

            if (key === 'space') {
                button.classList.add('is-wide');
                button.textContent = 'Space';
            } else if (key === 'backspace') {
                button.classList.add('is-wide');
                button.textContent = 'Delete';
            } else if (key === 'clear') {
                button.classList.add('is-wide');
                button.textContent = 'Clear';
            } else {
                button.textContent = key;
            }

            button.addEventListener('click', function() {
                applySearchKey(key);
            });
            rowEl.appendChild(button);
        });

        container.appendChild(rowEl);
    });
}

function renderSearchResults() {
    var total = state.searchResults.length;
    var empty = byId('searchEmptyState');

    renderCardRows('searchResultGrid', state.searchResults, null, 4);

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

function applySearchKey(key) {
    if (key === 'backspace') {
        state.searchQuery = state.searchQuery.slice(0, -1);
    } else if (key === 'clear') {
        state.searchQuery = '';
        state.searchMovies = [];
        state.searchSeries = [];
        state.searchResults = [];
    } else if (key === 'space') {
        if (state.searchQuery && state.searchQuery.slice(-1) !== ' ') {
            state.searchQuery += ' ';
        }
    } else {
        state.searchQuery += key;
    }

    syncSearchDisplay();
    renderSearchResults();
    scheduleSearchCatalogs();
}

function getSearchCatalogOptions(type) {
    return getBrowseOptions(type).filter(function(option) {
        return option.supportsSearch && !option.extraArgs;
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
        setSearchMessage('Use the TV keyboard to search linked addon catalogs.', null);
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
    var poster = document.createElement('div');
    var title = document.createElement('div');
    var meta = document.createElement('div');
    var synopsis = document.createElement('div');
    var progress;
    var mediaStack;
    var progressRail;
    var imageUrl = options.imageUrl || item.poster;

    card.className = 'card';
    if (options.className) {
        card.className += ' ' + options.className;
    }
    card.type = 'button';
    card.setAttribute('tabindex', '-1');

    poster.className = 'poster';
    if (imageUrl) {
        var img = document.createElement('img');
        img.decoding = 'async';
        if (options.eagerImage) {
            img.loading = 'eager';
        }
        img.src = imageUrl;
        img.alt = item.name || 'Poster';
        poster.appendChild(img);
    } else {
        poster.classList.add('is-empty');
        poster.textContent = 'No poster';
    }

    title.className = 'card-title';
    title.textContent = item.name || 'Untitled';

    meta.className = 'card-meta';
    meta.textContent = Object.prototype.hasOwnProperty.call(options, 'metaText')
        ? (options.metaText || '')
        : formatMetaLine(item, kind === 'movie' ? 'Movie' : 'Series');

    if (options.continueProgress) {
        card.classList.add('card-has-progress');
        progress = createContinueProgress(options.continueProgress);
    }

    if (!options.hideSynopsis) {
        synopsis.className = 'card-synopsis';
        synopsis.textContent = item.description || item.releaseInfo || 'Open details, streams, and playback options.';
        if (options.showSynopsis) {
            card.classList.add('card-has-static-synopsis');
        }
    }

    if (progress) {
        progressRail = progress.querySelector('.continue-progress-rail');
        mediaStack = document.createElement('div');
        mediaStack.className = 'card-media-stack';
        mediaStack.appendChild(poster);
        if (progressRail) {
            mediaStack.appendChild(progressRail);
        }
        card.appendChild(mediaStack);
        card.appendChild(progress);
    } else {
        card.appendChild(poster);
    }
    card.appendChild(title);
    card.appendChild(meta);

    if (!options.hideSynopsis) {
        card.appendChild(synopsis);
    }

    if (options.inert) {
        card.setAttribute('aria-hidden', 'true');
    } else {
        card.addEventListener('click', function() {
            prepareSelection(item, kind);
        });
    }

    return card;
}

function createContinueProgress(progress) {
    var wrap = document.createElement('div');
    var meta = document.createElement('div');
    var current = document.createElement('span');
    var remaining = document.createElement('span');
    var rail = document.createElement('div');
    var fill = document.createElement('div');

    wrap.className = 'continue-progress';
    wrap.setAttribute('aria-label', 'Resume progress: ' + progress.currentLabel + ' of ' + progress.durationLabel + ', ' + progress.remainingLabel);

    meta.className = 'continue-progress-meta';
    current.className = 'continue-progress-time';
    current.textContent = progress.currentLabel;
    remaining.className = 'continue-progress-remaining';
    remaining.textContent = progress.remainingLabel;

    rail.className = 'continue-progress-rail';
    rail.setAttribute('aria-hidden', 'true');
    fill.className = 'continue-progress-fill';
    fill.style.width = progress.percent.toFixed(1) + '%';

    meta.appendChild(current);
    meta.appendChild(remaining);
    rail.appendChild(fill);
    wrap.appendChild(rail);
    wrap.appendChild(meta);

    return wrap;
}

function renderCards(containerId, items, kind) {
    var container = byId(containerId);
    container.innerHTML = '';
    items.forEach(function(item) {
        container.appendChild(createCard(item, item.__kind || kind));
    });
}

function renderHomeRailWindow(containerId, entries, key) {
    var container = byId(containerId);
    var index;
    var moveDirection = state.homeRailMoveDirections[key];
    var previousEntry;
    var shouldShowPeek;
    var shouldOffsetFirstItem;
    var visible;
    var useBackgroundForAllCards = key === 'continue';

    container.innerHTML = '';
    container.classList.add('rail-home-window');
    container.classList.remove('has-home-peek', 'has-home-start-offset', 'is-moving-left', 'is-moving-right');
    state.homeRailMoveDirections[key] = null;

    if (!entries.length) {
        state.homeRailIndices[key] = 0;
        return;
    }

    index = state.homeRailIndices[key] || 0;
    if (index < 0) {
        index = 0;
    }
    if (index >= entries.length) {
        index = entries.length - 1;
    }
    state.homeRailIndices[key] = index;

    shouldShowPeek = (key === 'movies' || key === 'series') && index > 0 && entries.length > 1;
    shouldOffsetFirstItem = (key === 'movies' || key === 'series') && index === 0 && entries.length > 1;
    if (shouldShowPeek) {
        container.classList.add('has-home-peek');
    }
    if (shouldOffsetFirstItem) {
        container.classList.add('has-home-start-offset');
    }
    if (moveDirection === 'left' || moveDirection === 'right') {
        container.classList.add('is-moving-' + moveDirection);
    }

    if (shouldShowPeek) {
        previousEntry = entries[index - 1];
        container.appendChild(createCard(previousEntry.item, previousEntry.kind, {
            className: 'is-home-peek',
            imageUrl: previousEntry.item.poster,
            inert: true
        }));
    }

    visible = getCircularHomeWindow(entries, index, 4);
    warmHomeRailArtwork(entries, index, HOME_ARTWORK_PRELOAD_COUNT);

    visible.forEach(function(entry, visibleIndex) {
        var isActive = visibleIndex === 0;
        var item = isActive && (key === 'movies' || key === 'series')
            ? mergeHomeActiveMeta(entry.item, entry.kind)
            : entry.item;

        if (isActive) {
            scheduleHomeActiveMetaEnrichment(entry, key);
        }

        container.appendChild(createCard(item, entry.kind, {
            className: isActive ? 'is-home-active' : 'is-home-compact',
            imageUrl: (isActive || useBackgroundForAllCards) ? (item.background || item.poster) : item.poster,
            continueProgress: entry.continueProgress,
            metaText: isActive && (key === 'movies' || key === 'series')
                ? formatHomeActiveMetaLine(item, entry.kind, key)
                : entry.metaText,
            eagerImage: isActive,
            hideSynopsis: key === 'continue',
            showSynopsis: key !== 'continue' && isActive
        }));
    });
}

function renderCardRows(containerId, items, kind, rowSize) {
    var options = arguments[4] || {};
    var container = byId(containerId);
    var rows = chunkItems(items, rowSize || 4);

    container.innerHTML = '';
    rows.forEach(function(group, index) {
        var row = document.createElement('div');
        row.className = 'card-row content-row';
        row.id = containerId + 'Row' + index;

        group.forEach(function(item) {
            row.appendChild(createCard(item, item.__kind || kind, options));
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
    renderHomeRailWindow('continueRail', buildContinueEntries(), 'continue');

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
    captureBrowseReturnState();
    state.selectedItem = item;
    state.selectedType = type;
    state.detailMode = 'details';
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
                if (state.autoplayPending) {
                    loadStreamsForSelection();
                    return;
                }
                setAddonsMessage('Choose More Episodes to pick an episode, or Play to start the first episode.', null);
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
    state.detailMode = 'details';
    renderAddons();
    loadStreamsForSelection();
}

function loadStreamsForSelection(options) {
    var type = state.selectedType;
    var videoId = state.selectedVideo && state.selectedVideo.id;
    var eligibleAddons;
    var shouldFocusStreams = !!(options && options.focusStreams);

    if (!state.selectedItem || !type || !videoId) {
        setAddonsMessage('Choose a title first.', 'error');
        return Promise.resolve();
    }

    eligibleAddons = getStreamCapableAddons(type, videoId);
    if (!eligibleAddons.length) {
        state.streams = [];
        renderStreamList();
        setAddonsMessage(
            state.authKey
                ? 'No linked addons expose stream resources for this selection.'
                : 'No stream addons are available yet. Sign in with Nuvio to sync your addon collection.',
            'error'
        );
        if (shouldFocusStreams && state.selectedType === 'series') {
            state.detailMode = 'episodes';
            renderAddons();
            state.focusRegion = 'main';
            state.mainRow = getSelectedEpisodeMainRow();
            state.mainCol = state.availableSeasons.length && state.selectedEpisodes.length ? 1 : 0;
            setTimeout(focusCurrent, 0);
        }
        return Promise.resolve();
    }

    state.streams = [];
    renderStreamList();
    setAddonsMessage('Loading streams from ' + eligibleAddons.length + ' addon(s)...', null);

    return Promise.all(eligibleAddons.map(function(addon) {
        return fetchStreamsFromAddon(addon, type, videoId);
    })).then(function(streamGroups) {
        state.streams = [];
        streamGroups.forEach(function(group) {
            state.streams = state.streams.concat(group);
        });

        renderStreamList();

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
            if (shouldFocusStreams) {
                state.focusRegion = 'main';
                state.mainRow = getFirstStreamMainRow();
                state.mainCol = 0;
            }
            setTimeout(focusCurrent, 0);
        } else {
            setAddonsMessage('No stream entries were returned.', 'error');
            if (shouldFocusStreams) {
                if (state.selectedType === 'series') {
                    state.detailMode = 'episodes';
                    renderAddons();
                }
                state.focusRegion = 'main';
                state.mainRow = getSelectedEpisodeMainRow();
                state.mainCol = state.availableSeasons.length && state.selectedEpisodes.length ? 1 : 0;
                setTimeout(focusCurrent, 0);
            }
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
        if (state.selectedType !== 'series') {
            return;
        }

        state.detailMode = 'episodes';
        renderAddons();
        state.focusRegion = 'main';
        state.mainRow = getSelectedEpisodeMainRow();
        state.mainCol = state.availableSeasons.length && state.selectedEpisodes.length ? 1 : 0;
        focusCurrent();
    });

    byId('detailSourcesButton').addEventListener('click', function() {
        if (!state.selectedItem || !state.selectedType || !state.selectedVideo) {
            setAddonsMessage('Choose a title first.', 'error');
            return;
        }

        state.detailMode = 'sources';
        renderAddons();
        loadStreamsForSelection({
            focusStreams: true
        });
    });

    byId('detailLibraryButton').addEventListener('click', function() {
        addSelectedToLibrary();
    });
}

function bindSearch() {
    renderSearchKeyboard();
    renderSearchSuggestions();
    syncSearchDisplay();
}

function bindBrowse() {
    byId('movieLoadMoreButton').addEventListener('click', function() {
        if (getBrowseLoadingMore('movie') || !getBrowseCanLoadMore('movie')) {
            return;
        }
        fetchBrowseCatalog('movie', true);
    });

    byId('seriesLoadMoreButton').addEventListener('click', function() {
        if (getBrowseLoadingMore('series') || !getBrowseCanLoadMore('series')) {
            return;
        }
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

    controller.addEventListener('click', function(event) {
        event.stopPropagation();
    });

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
        setPlayerStatus('Hold left or right to scrub, release to seek');
    });

    byId('playerAudioButton').addEventListener('click', function() {
        cycleAudioTrack();
    });

    byId('playerSubtitleButton').addEventListener('click', function() {
        cycleSubtitleTrack();
    });

    byId('playerNextEpisodeButton').addEventListener('click', function() {
        playNextEpisode();
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
    if (state.currentView === 'player' && !state.playerFullscreen) {
        if (state.mainRow === 0) {
            beginOrUpdateSeekPreview(-1);
            return;
        }
        if (state.mainCol > 0) {
            state.mainCol -= 1;
            focusCurrent();
        }
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
            if (state.homeRailIndices[homeRailLeft.key] > 0) {
                state.homeRailIndices[homeRailLeft.key] -= 1;
            } else {
                state.homeRailIndices[homeRailLeft.key] = Math.max(homeRailLeft.entries.length - 1, 0);
            }
            state.homeRailMoveDirections[homeRailLeft.key] = 'right';
            state.mainCol = 0;
            renderSingleHomeRail(homeRailLeft);
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

    if (moveEpisodeBrowserHorizontal(-1)) {
        return;
    }

    if (exitFocusedYearFilter(-1)) {
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
    if (state.currentView === 'player' && !state.playerFullscreen) {
        if (state.mainRow === 0) {
            beginOrUpdateSeekPreview(1);
            return;
        }
        state.mainCol += 1;
        focusCurrent();
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
            state.homeRailIndices[homeRailRight.key] = (state.homeRailIndices[homeRailRight.key] + 1) % homeRailRight.entries.length;
            state.homeRailMoveDirections[homeRailRight.key] = 'left';
            state.mainCol = 0;
            renderSingleHomeRail(homeRailRight);
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

    if (moveEpisodeBrowserHorizontal(1)) {
        return;
    }

    if (exitFocusedYearFilter(1)) {
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

    if (moveEpisodeBrowserVertical(-1)) {
        return;
    }

    if (moveFocusedYearFilter(-1)) {
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

    if (moveEpisodeBrowserVertical(1)) {
        return;
    }

    if (moveFocusedYearFilter(1)) {
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
    state.debugAvplay = isAvplayDebugEnabled();
    if (state.debugAvplay) {
        renderAvplayDebugOverlay({
            reason: 'init',
            playerMode: state.playerMode,
            fullscreen: state.playerFullscreen,
            currentView: state.currentView,
            window: {
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                devicePixelRatio: window.devicePixelRatio || 1
            },
            screen: {
                width: screen && screen.width,
                height: screen && screen.height
            },
            timestamp: new Date().toISOString()
        });
    }

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

    document.addEventListener('keyup', function(event) {
        if ((event.keyCode === 37 || event.keyCode === 39) && state.seekPreviewActive) {
            event.preventDefault();
            stopSeekPreview(true);
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
    restoreLibraryItems();
    updateUserPanel();
    updateNavState();
    updateViewState();
    updatePageHeader();
    renderSearchResults();
    renderContinueWatching();
    renderLibraryView();
    renderAddons();
    renderPlayerState();
    startFeaturedRotation();

    verifyStoredSession().catch(function() {
        return null;
    }).then(function() {
        return fetchInstalledAddons();
    }).then(function() {
        return syncNuvioUserData();
    }).then(function() {
        return fetchCatalogs();
    }).catch(function(error) {
        updateConnectionStatus('Startup error: ' + error.message, false, true);
    });

    setTimeout(function() {
        focusCurrent();
    }, 60);
}

window.onload = init;
