var API_BASE = 'https://api.strem.io';
var CINEMETA_BASE = 'https://v3-cinemeta.strem.io';
var STORAGE_AUTH = 'stremio.authKey';
var STORAGE_USER = 'stremio.user';
var NAV_VIEWS = ['home', 'movies', 'series', 'addons', 'player', 'login'];
var VIEW_META = {
    home: {
        eyebrow: 'Discover',
        title: 'Home',
        subtitle: 'Browse live Stremio-backed content in a TV-first shell.'
    },
    movies: {
        eyebrow: 'Catalog',
        title: 'Movies',
        subtitle: 'Pick a movie and move directly into addon streams.'
    },
    series: {
        eyebrow: 'Catalog',
        title: 'Series',
        subtitle: 'Pick a show, then choose an episode before loading streams.'
    },
    addons: {
        eyebrow: 'Sources',
        title: 'Addons',
        subtitle: 'Installed addons and available streams for the selected title.'
    },
    player: {
        eyebrow: 'Playback',
        title: 'Player',
        subtitle: 'A first pass player view for direct stream URLs.'
    },
    login: {
        eyebrow: 'Account',
        title: 'Login',
        subtitle: 'Connect your Stremio account and restore installed addons.'
    }
};

var state = {
    authKey: null,
    user: null,
    addons: [],
    movies: [],
    series: [],
    selectedItem: null,
    selectedType: null,
    selectedEpisodes: [],
    selectedVideo: null,
    streams: [],
    currentStream: null,
    audioTracks: [],
    subtitleTracks: [],
    activeAudioTrack: null,
    activeSubtitleTrack: 'subtitle-off',
    playerMode: 'html5',
    playerFullscreen: false,
    currentView: 'home',
    viewHistory: [],
    focusRegion: 'nav',
    navIndex: 0,
    mainRow: 0,
    mainCol: 0,
    featuredKey: null,
    featuredTimer: null
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

function setPlayerStatus(text) {
    byId('playerStatus').textContent = text;
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

function resetTrackState() {
    state.audioTracks = [];
    state.subtitleTracks = [];
    state.activeAudioTrack = null;
    state.activeSubtitleTrack = 'subtitle-off';
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
    var rect;

    if (state.playerMode !== 'avplay' || !hasAvplay()) {
        return;
    }

    rect = surface.getBoundingClientRect();
    try {
        webapis.avplay.setDisplayRect(
            Math.max(0, Math.round(rect.left)),
            Math.max(0, Math.round(rect.top)),
            Math.max(1, Math.round(rect.width)),
            Math.max(1, Math.round(rect.height))
        );
    } catch (error) {
        setPlayerStatus('AVPlay rect failed');
    }
}

function clearPlaybackSurface() {
    byId('avplaySurface').classList.remove('is-active');
    byId('videoPlayer').classList.remove('is-hidden');
    stopAvplayPlayback();
    stopHtml5Playback();
    state.playerMode = 'html5';
    resetTrackState();
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
    var subtitleTracks = hasPlayableSelection
        ? [{
            id: 'subtitle-off',
            label: 'Off'
        }].concat(state.subtitleTracks)
        : [];

    byId('audioTrackCount').textContent = audioTracks.length
        ? String(audioTracks.length) + ' option' + (audioTracks.length === 1 ? '' : 's')
        : 'Default only';
    byId('subtitleTrackCount').textContent = state.subtitleTracks.length
        ? String(state.subtitleTracks.length) + ' option' + (state.subtitleTracks.length === 1 ? '' : 's')
        : 'Off';

    renderTrackChips('audioTrackList', audioTracks, state.activeAudioTrack, selectAudioTrack);
    renderTrackChips('subtitleTrackList', subtitleTracks, state.activeSubtitleTrack, selectSubtitleTrack);
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
            nextSubs.push({
                id: 'subtitle-' + index,
                index: index,
                label: normalizeTrackLabel('subtitle', {
                    language: textTracks[index].language,
                    label: textTracks[index].label
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
        state.activeSubtitleTrack = 'subtitle-off';
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

        if (trackInfo.type === 'TEXT') {
            trackId = 'subtitle-' + trackInfo.index;
            nextSubs.push({
                id: trackId,
                index: trackInfo.index,
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
        state.activeSubtitleTrack = 'subtitle-off';
    } else if (state.activeSubtitleTrack !== 'subtitle-off') {
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
        return;
    }

    refreshHtml5Tracks();
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
    var selectedTrack = state.subtitleTracks.filter(function(track) {
        return track.id === trackId;
    })[0];
    var index;

    if (state.playerMode === 'avplay' && hasAvplay()) {
        try {
            if (trackId === 'subtitle-off') {
                webapis.avplay.setSilentSubtitle(true);
                state.activeSubtitleTrack = 'subtitle-off';
                renderTrackSelectors();
                setPlayerStatus('Subtitles off');
                return;
            }

            webapis.avplay.setSilentSubtitle(false);
            webapis.avplay.setSelectTrack('TEXT', selectedTrack.index);
            state.activeSubtitleTrack = trackId;
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

    state.activeSubtitleTrack = trackId;
    renderTrackSelectors();
    setPlayerStatus(trackId === 'subtitle-off' ? 'Subtitles off' : 'Subtitles: ' + selectedTrack.label);
}

function setPlayerFullscreen(enabled) {
    var body = document.body;
    state.playerFullscreen = !!enabled;
    body.classList.toggle('is-player-fullscreen', state.playerFullscreen);
    byId('playerFullscreenButton').textContent = state.playerFullscreen ? 'Windowed' : 'Fullscreen';
    if (state.playerFullscreen) {
        state.focusRegion = 'main';
        state.mainRow = 0;
        state.mainCol = 0;
        setTimeout(focusCurrent, 0);
    }
    setTimeout(syncAvplayRect, 60);
}

function updatePageHeader() {
    var meta = VIEW_META[state.currentView];
    byId('pageEyebrow').textContent = meta.eyebrow;
    byId('pageTitle').textContent = meta.title;
    byId('pageSubtitle').textContent = meta.subtitle;
}

function updateNavState() {
    queryAll('.nav-item').forEach(function(item) {
        item.classList.toggle('is-active', item.getAttribute('data-view') === state.currentView);
    });
}

function updateViewState() {
    queryAll('[data-view-panel]').forEach(function(panel) {
        panel.classList.toggle('is-active', panel.getAttribute('data-view-panel') === state.currentView);
    });
}

function chunkItems(items, size) {
    var rows = [];
    var index;

    for (index = 0; index < items.length; index += size) {
        rows.push(items.slice(index, index + size));
    }

    return rows;
}

function getMainRows() {
    if (state.currentView === 'home') {
        var homeRows = [];
        var actions = queryAll('#homeActions .action-button');
        var movieCards = queryAll('#homeMovieRail .card');
        var seriesCards = queryAll('#homeSeriesRail .card');

        if (actions.length) {
            homeRows.push(actions);
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
        return chunkItems(queryAll('#movieGrid .card'), 4);
    }

    if (state.currentView === 'series') {
        return chunkItems(queryAll('#seriesGrid .card'), 4);
    }

    if (state.currentView === 'addons') {
        var addonRows = [];
        var episodes = queryAll('#episodeRail .episode-chip');
        var streams = queryAll('#streamList .stream-card');

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
        var playerActions = queryAll('#playerActions .action-button');
        var audioButtons = queryAll('#audioTrackList .track-chip');
        var subtitleButtons = queryAll('#subtitleTrackList .track-chip');

        if (state.playerFullscreen) {
            return [[byId('videoFrameFocus')]];
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

    if (parent && parent.classList && (parent.classList.contains('rail') || parent.classList.contains('episode-rail'))) {
        var left = el.offsetLeft - 18;
        var right = el.offsetLeft + el.offsetWidth + 18;
        if (left < parent.scrollLeft) {
            parent.scrollLeft = left;
        } else if (right > parent.scrollLeft + parent.clientWidth) {
            parent.scrollLeft = right - parent.clientWidth;
        }
    }

    if (el && typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({
            block: 'nearest',
            inline: 'nearest'
        });
    }
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

        navItems[state.navIndex].focus();
        return;
    }

    var rows = getMainRows();
    clampMainFocus(rows);

    if (!rows.length || !rows[state.mainRow] || !rows[state.mainRow][state.mainCol]) {
        state.focusRegion = 'nav';
        focusCurrent();
        return;
    }

    rows[state.mainRow][state.mainCol].focus();
    scrollElementIntoView(rows[state.mainRow][state.mainCol]);
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

function updateFeatured(item, kind) {
    var nextKey;
    if (!item) {
        return;
    }

    nextKey = kind + ':' + (item.id || item.name || '');
    if (state.featuredKey === nextKey) {
        return;
    }
    state.featuredKey = nextKey;

    var poster = byId('featuredPoster');
    var label = poster.querySelector('.featured-poster-label');
    var posterUrl = item.poster || '';

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

function fetchCatalogs() {
    updateConnectionStatus('Loading catalogs...', false, false);

    return Promise.all([
        requestJson(CINEMETA_BASE + '/catalog/movie/top.json', 'GET'),
        requestJson(CINEMETA_BASE + '/catalog/series/top.json', 'GET')
    ]).then(function(results) {
        state.movies = normalizeCatalogPayload(results[0]);
        state.series = normalizeCatalogPayload(results[1]);
        renderCatalogViews();
        updateConnectionStatus('Cinemeta connected', true, false);
        focusCurrent();
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

function renderAddons() {
    byId('addonCount').textContent = String(state.addons.length);
    byId('streamCount').textContent = String(state.streams.length);

    if (!state.selectedItem) {
        byId('selectedTitle').textContent = 'Nothing selected';
        byId('selectedTypeLabel').textContent = 'Choose a title';
        byId('selectedDescription').textContent = 'Pick a movie or show from the catalog pages to inspect addon streams here.';
        byId('selectedVideoLabel').textContent = 'No episode selected';
    } else {
        byId('selectedTitle').textContent = state.selectedItem.name || 'Untitled';
        byId('selectedTypeLabel').textContent = state.selectedType === 'series' ? 'Series' : 'Movie';
        byId('selectedDescription').textContent =
            state.selectedItem.description ||
            state.selectedItem.releaseInfo ||
            'Installed addons and streams for the current selection appear below.';
        byId('selectedVideoLabel').textContent = state.selectedVideo
            ? (state.selectedVideo.title || state.selectedVideo.name || state.selectedVideo.id)
            : (state.selectedType === 'series' ? 'Choose an episode' : 'Movie stream target');
    }

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
    byId('playerToggleButton').textContent = 'Play';

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
    playPromise = video.play();
    if (playPromise && typeof playPromise.then === 'function') {
        playPromise.then(function() {
            setPlayerStatus('Playing (HTML5)');
            scheduleTrackRefresh();
        }).catch(function(error) {
            setPlayerStatus('Play blocked: ' + error.message);
        });
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
        try {
            webapis.avplay.setDisplayMethod('PLAYER_DISPLAY_MODE_FULL_SCREEN');
        } catch (displayError) {
            // no-op
        }

        webapis.avplay.setListener({
            onbufferingstart: function() {
                setPlayerStatus('Buffering (AVPlay)');
            },
            onbufferingprogress: function() {
                setPlayerStatus('Buffering (AVPlay)');
            },
            onbufferingcomplete: function() {
                setPlayerStatus('Ready (AVPlay)');
                refreshPlaybackTracks();
            },
            onstreamcompleted: function() {
                setPlayerStatus('Finished');
            },
            onerror: function(error) {
                setPlayerStatus('AVPlay error: ' + error);
                startHtml5Stream(url);
            }
        });

        syncAvplayRect();
        setPlayerStatus('Loading (AVPlay)');
        webapis.avplay.prepareAsync(function() {
            syncAvplayRect();
            try {
                webapis.avplay.play();
                setPlayerStatus('Playing (AVPlay)');
                scheduleTrackRefresh();
            } catch (playError) {
                setPlayerStatus('AVPlay play failed');
                startHtml5Stream(url);
            }
        }, function(error) {
            setPlayerStatus('AVPlay prepare failed');
            startHtml5Stream(url);
        });
    } catch (error) {
        setPlayerStatus('AVPlay unavailable, using HTML5');
        startHtml5Stream(url);
    }
}

function toggleCurrentPlayback() {
    var video = byId('videoPlayer');

    if (!state.currentStream || !state.currentStream.playable || !state.currentStream.raw || !state.currentStream.raw.url) {
        setPlayerStatus('No playable stream selected');
        return;
    }

    if (state.playerMode === 'avplay' && hasAvplay()) {
        try {
            if (byId('playerToggleButton').textContent === 'Play') {
                webapis.avplay.play();
                byId('playerToggleButton').textContent = 'Pause';
                setPlayerStatus('Playing (AVPlay)');
            } else {
                webapis.avplay.pause();
                byId('playerToggleButton').textContent = 'Play';
                setPlayerStatus('Paused (AVPlay)');
            }
        } catch (error) {
            setPlayerStatus('AVPlay toggle failed');
        }
        return;
    }

    if (video.paused) {
        video.play().then(function() {
            byId('playerToggleButton').textContent = 'Pause';
            setPlayerStatus('Playing (HTML5)');
        }).catch(function(error) {
            setPlayerStatus('Play blocked: ' + error.message);
        });
    } else {
        video.pause();
        byId('playerToggleButton').textContent = 'Play';
        setPlayerStatus('Paused');
    }
}

function loadCurrentStream() {
    if (!state.currentStream || !state.currentStream.playable || !state.currentStream.raw || !state.currentStream.raw.url) {
        setPlayerStatus(state.currentStream ? state.currentStream.status : 'Idle');
        return;
    }

    resetTrackState();
    renderTrackSelectors();

    if (hasAvplay()) {
        startAvplayStream(state.currentStream.raw.url);
    } else {
        startHtml5Stream(state.currentStream.raw.url);
    }
}

function openStream(streamEntry) {
    state.currentStream = streamEntry;
    renderPlayerState();
    setView('player', {
        focusRegion: 'main',
        resetMain: true
    });

    if (streamEntry.playable && streamEntry.raw && streamEntry.raw.url) {
        loadCurrentStream();
    } else {
        setPlayerStatus(streamEntry.status);
    }
}

function renderCatalogViews() {
    renderCards('homeMovieRail', state.movies.slice(0, 6), 'movie');
    renderCards('homeSeriesRail', state.series.slice(0, 6), 'series');
    renderCards('movieGrid', state.movies, 'movie');
    renderCards('seriesGrid', state.series, 'series');

    byId('homeMovieCount').textContent = state.movies.length + ' loaded';
    byId('homeSeriesCount').textContent = state.series.length + ' loaded';
    byId('movieCount').textContent = state.movies.length + ' loaded';
    byId('seriesCount').textContent = state.series.length + ' loaded';

    if (state.movies.length) {
        updateFeatured(state.movies[0], 'Movie Spotlight');
    } else if (state.series.length) {
        updateFeatured(state.series[0], 'Series Spotlight');
    }
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

function prepareSelection(item, type) {
    state.selectedItem = item;
    state.selectedType = type;
    state.selectedEpisodes = [];
    state.selectedVideo = null;
    state.streams = [];
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
                state.selectedItem = meta || item;
                state.selectedEpisodes = meta && Array.isArray(meta.videos) ? meta.videos.slice(0, 16) : [];
                state.selectedVideo = state.selectedEpisodes.length ? state.selectedEpisodes[0] : null;
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
                resetMain: true
            });
            setTimeout(focusCurrent, 0);
        });
    });
}

function bindHomeActions() {
    byId('homeLoginButton').addEventListener('click', function() {
        setView('login', {
            focusRegion: 'main',
            resetMain: true
        });
        setTimeout(focusCurrent, 0);
    });

    byId('homeMoviesButton').addEventListener('click', function() {
        setView('movies', {
            focusRegion: 'main',
            resetMain: true
        });
        setTimeout(focusCurrent, 0);
    });

    byId('homeSeriesButton').addEventListener('click', function() {
        setView('series', {
            focusRegion: 'main',
            resetMain: true
        });
        setTimeout(focusCurrent, 0);
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

    byId('playerBackButton').addEventListener('click', function() {
        goBackOnce();
    });

    byId('playerToggleButton').addEventListener('click', function() {
        toggleCurrentPlayback();
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
    video.addEventListener('loadeddata', refreshPlaybackTracks);
    video.addEventListener('durationchange', refreshPlaybackTracks);
    video.addEventListener('playing', function() {
        byId('playerToggleButton').textContent = 'Pause';
        setPlayerStatus('Playing');
        refreshPlaybackTracks();
    });
    video.addEventListener('pause', function() {
        byId('playerToggleButton').textContent = 'Play';
        if (video.currentTime > 0) {
            setPlayerStatus('Paused');
        }
    });
    video.addEventListener('waiting', function() {
        setPlayerStatus('Buffering');
    });
    video.addEventListener('error', function() {
        setPlayerStatus('Playback error');
    });

    window.addEventListener('resize', syncAvplayRect);
}

function handleLeft() {
    if (state.focusRegion === 'nav') {
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
    if (state.focusRegion === 'nav') {
        state.focusRegion = 'main';
        state.mainRow = 0;
        state.mainCol = 0;
        focusCurrent();
        return;
    }

    state.mainCol += 1;
    focusCurrent();
}

function handleUp() {
    if (state.focusRegion === 'nav') {
        if (state.navIndex > 0) {
            state.navIndex -= 1;
            setView(NAV_VIEWS[state.navIndex], {
                focusRegion: 'nav',
                resetMain: true
            });
            focusCurrent();
        }
        return;
    }

    if (state.mainRow > 0) {
        state.mainRow -= 1;
        focusCurrent();
    }
}

function handleDown() {
    if (state.focusRegion === 'nav') {
        if (state.navIndex < NAV_VIEWS.length - 1) {
            state.navIndex += 1;
            setView(NAV_VIEWS[state.navIndex], {
                focusRegion: 'nav',
                resetMain: true
            });
            focusCurrent();
        }
        return;
    }

    state.mainRow += 1;
    focusCurrent();
}

function handleEnter() {
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
    bindLogin();
    bindPlayer();

    restoreStoredSession();
    updateUserPanel();
    updateNavState();
    updateViewState();
    updatePageHeader();
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
