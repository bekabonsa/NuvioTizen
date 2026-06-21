var PROGRESS_SAVE_INTERVAL_MS = 10000;
var PROGRESS_SAVE_POSITION_DELTA_MS = 5000;
var PROGRESS_SAVE_MIN_POSITION_MS = 5000;

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

function formatDiagnosticDetails(details) {
    var parts = [];
    var keys;

    if (!details) {
        return '';
    }

    if (typeof details === 'string') {
        return details;
    }

    if (details.name) {
        parts.push('name=' + details.name);
    }
    if (details.message) {
        parts.push('message=' + details.message);
    }
    if (details.code || details.code === 0) {
        parts.push('code=' + details.code);
    }
    if (details.errorType) {
        parts.push('type=' + details.errorType);
    }

    if (parts.length) {
        return parts.join(', ');
    }

    keys = Object.keys(details);
    if (keys.length) {
        try {
            return JSON.stringify(details);
        } catch (error) {
            return String(details);
        }
    }

    return String(details);
}

function getDiagnosticTimestamp() {
    return new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function renderPlaybackDiagnostics() {
    var count = byId('playerDiagnosticsCount');
    var list = byId('playerDiagnosticsList');
    var diagnostics = state.playbackDiagnostics || [];
    var fragment = document.createDocumentFragment();

    count.textContent = String(diagnostics.length) + ' event' + (diagnostics.length === 1 ? '' : 's');
    list.innerHTML = '';

    if (!diagnostics.length) {
        var empty = document.createElement('p');
        empty.className = 'player-diagnostics-empty';
        empty.textContent = 'No playback diagnostics yet.';
        list.appendChild(empty);
        return;
    }

    diagnostics.forEach(function(entry) {
        var item = document.createElement('p');
        var time = document.createElement('span');
        item.className = 'player-diagnostic-entry is-' + entry.level;
        time.className = 'player-diagnostic-time';
        time.textContent = '[' + entry.time + '] ';
        item.appendChild(time);
        item.appendChild(document.createTextNode(entry.message + (entry.details ? ' - ' + entry.details : '')));
        fragment.appendChild(item);
    });

    list.appendChild(fragment);
    list.scrollTop = list.scrollHeight;
}

function clearPlayerDiagnostics() {
    state.playbackDiagnostics = [];
    state.playbackDiagnosticKeys = {};
    state.audioTrackFailures = {};
    renderPlaybackDiagnostics();
}

function appendPlayerDiagnostic(level, message, details) {
    state.playbackDiagnostics = state.playbackDiagnostics || [];
    state.playbackDiagnostics.push({
        level: level || 'info',
        time: getDiagnosticTimestamp(),
        message: message,
        details: formatDiagnosticDetails(details)
    });

    if (state.playbackDiagnostics.length > 50) {
        state.playbackDiagnostics = state.playbackDiagnostics.slice(state.playbackDiagnostics.length - 50);
    }

    renderPlaybackDiagnostics();

    if (level === 'error') {
        setPlayerStatus(message);
    }
}

function appendPlayerDiagnosticOnce(key, level, message, details) {
    state.playbackDiagnosticKeys = state.playbackDiagnosticKeys || {};
    if (state.playbackDiagnosticKeys[key]) {
        return;
    }
    state.playbackDiagnosticKeys[key] = true;
    appendPlayerDiagnostic(level, message, details);
}

function getUrlFilename(value) {
    var filename = String(value || '').split('#')[0].split('?')[0].split('/').pop();

    try {
        return decodeURIComponent(filename);
    } catch (error) {
        return filename;
    }
}

function detectDtsAudioDetailsFromText(value) {
    var text = String(value || '').replace(/\+/g, ' ');
    var hasDts = /(^|[^a-z0-9])dts([^a-z0-9]|$)/i.test(text)
        || /dts[\s._-]*(?:hd|x|:)/i.test(text);
    var codec = 'DTS';
    var channelMatch;
    var channels = '';

    if (!hasDts) {
        return null;
    }

    if (/dts[\s._-]*:?[\s._-]*x/i.test(text)) {
        codec = 'DTS:X';
    } else if (/dts[\s._-]*hd[\s._-]*(?:ma|master[\s._-]*audio)/i.test(text)) {
        codec = 'DTS-HD MA';
    } else if (/dts[\s._-]*hd/i.test(text)) {
        codec = 'DTS-HD';
    }

    channelMatch = text.match(/(?:^|[^0-9])([257])[\s._-]*[.:][\s._-]*1(?:[^0-9]|$)/);
    if (channelMatch) {
        channels = channelMatch[1] + '.1';
    }

    return {
        codec: codec,
        channels: channels,
        label: codec + (channels ? ' ' + channels : '')
    };
}

function getDtsAudioScore(details) {
    if (!details) {
        return 0;
    }
    if (details.codec === 'DTS:X') {
        return 4;
    }
    if (details.codec === 'DTS-HD MA') {
        return 3;
    }
    if (details.codec === 'DTS-HD') {
        return 2;
    }
    return 1;
}

function chooseBetterDtsAudioDetails(current, candidate) {
    var currentScore = getDtsAudioScore(current);
    var candidateScore = getDtsAudioScore(candidate);

    if (!candidate) {
        return current;
    }
    if (!current) {
        return candidate;
    }
    if (candidateScore > currentScore) {
        return candidate;
    }
    if (candidateScore === currentScore && !current.channels && candidate.channels) {
        return candidate;
    }
    return current;
}

function detectDtsAudioDetails(streamEntry) {
    var stream = streamEntry && streamEntry.raw ? streamEntry.raw : {};
    var values = [];
    var best = null;

    if (streamEntry) {
        values.push(streamEntry.title);
        values.push(streamEntry.description);
    }

    values.push(stream.name);
    values.push(stream.title);
    values.push(stream.description);
    values.push(stream.filename);
    values.push(getUrlFilename(stream.url));

    values.forEach(function(value) {
        best = chooseBetterDtsAudioDetails(best, detectDtsAudioDetailsFromText(value));
    });

    return best;
}

function isDtsAudioText(value) {
    return !!detectDtsAudioDetailsFromText(value);
}

function detectVirtualAudioTracks(streamEntry, realTracks) {
    var details = detectDtsAudioDetails(streamEntry);
    var tracks = realTracks || [];
    var hasRealDtsTrack = tracks.some(function(track) {
        return isDtsAudioText([
            track.label,
            track.name,
            track.codec
        ].join(' '));
    });
    var trackId = 'audio-virtual-dts';

    if (!details || hasRealDtsTrack) {
        return [];
    }

    return [{
        id: trackId,
        index: null,
        kind: 'virtual',
        virtual: true,
        failed: !!(state.audioTrackFailures && state.audioTrackFailures[trackId]),
        label: details.label + ' (detected, not exposed by TV)'
    }];
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

function getSelectableAudioTracks() {
    var tracks = (state.audioTracks || []).slice();

    if (state.currentStream && state.currentStream.playable) {
        tracks = tracks.concat(detectVirtualAudioTracks(state.currentStream, tracks));
    }

    return tracks;
}

function getResolvedAudioTrackId() {
    var video = byId('videoPlayer');
    var audioTracks = video && video.audioTracks;
    var selectableAudioTracks = getSelectableAudioTracks();
    var matchingTrack = selectableAudioTracks.some(function(track) {
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
    var selectableAudioTracks = getSelectableAudioTracks();
    var index = selectableAudioTracks.findIndex(function(track) {
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
    var selectableAudioTracks = getSelectableAudioTracks();
    var currentId;
    var nextIndex;

    if (!selectableAudioTracks.length) {
        setPlayerStatus('No alternate audio tracks');
        return;
    }

    currentId = getResolvedAudioTrackId();
    nextIndex = selectableAudioTracks.findIndex(function(track) {
        return track.id === currentId;
    });
    nextIndex = (nextIndex + 1 + selectableAudioTracks.length) % selectableAudioTracks.length;
    selectAudioTrack(selectableAudioTracks[nextIndex].id);
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

function isTranscodedPlaybackActive() {
    return !!(state.transcodedPlaybackActive && state.transcodedSourceUrl);
}

function resetTranscodedPlaybackState() {
    state.transcodedPlaybackActive = false;
    state.transcodedSourceUrl = '';
    state.transcodedAudioTrack = null;
    state.transcodedOffsetMs = 0;
    state.transcodedDurationMs = 0;
}

function getTimelineCurrentMs(rawCurrentMs) {
    var current = Math.max(0, rawCurrentMs || 0);

    if (!isTranscodedPlaybackActive()) {
        return current;
    }

    return Math.max(0, (state.transcodedOffsetMs || 0) + current);
}

function getTimelineDurationMs(rawDurationMs) {
    var duration = Math.max(0, rawDurationMs || 0);
    var sourceDuration;

    if (!isTranscodedPlaybackActive()) {
        return duration;
    }

    sourceDuration = Math.max(0, state.transcodedDurationMs || 0);
    if (duration > 0) {
        duration = Math.max(sourceDuration, (state.transcodedOffsetMs || 0) + duration);
    }

    return duration || sourceDuration || state.durationMs || 0;
}

function saveCurrentPlaybackProgress(force) {
    var position = Math.max(0, state.currentTimeMs || 0);
    var duration = Math.max(0, state.durationMs || 0);
    var now;

    if (state.suppressProgressSave) {
        return false;
    }

    if (!state.selectedItem || !state.selectedType || !state.currentStream) {
        return false;
    }

    if (!force && position < PROGRESS_SAVE_MIN_POSITION_MS) {
        return false;
    }

    now = Date.now();
    if (!force &&
        now - (state.lastProgressSavedAt || 0) < PROGRESS_SAVE_INTERVAL_MS &&
        Math.abs(position - (state.lastProgressSavedPositionMs || 0)) < PROGRESS_SAVE_POSITION_DELTA_MS) {
        return false;
    }

    state.lastProgressSavedAt = now;
    state.lastProgressSavedPositionMs = position;
    trackContinueWatching(state.selectedItem, state.selectedType, state.selectedVideo);
    renderContinueWatching();
    return duration > 0 || position > 0;
}

function setPlaybackMetrics(currentMs, durationMs) {
    state.currentTimeMs = Math.max(0, currentMs || 0);
    state.durationMs = Math.max(0, durationMs || 0);
    updateProgressUi();
    updateSubtitleOverlay(state.currentTimeMs);
    saveCurrentPlaybackProgress(false);
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
    setPlaybackMetrics(getTimelineCurrentMs(current), getTimelineDurationMs(duration));
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

    setPlaybackMetrics(getTimelineCurrentMs(current), getTimelineDurationMs(duration));
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
    if (typeof markFocusRegistryDirty === 'function') {
        markFocusRegistryDirty();
    }
    if (state.playerChromeTimer) {
        clearTimeout(state.playerChromeTimer);
        state.playerChromeTimer = null;
    }

    if (persist || !state.playerFullscreen) {
        return;
    }

    state.playerChromeTimer = setTimeout(function() {
        document.body.classList.remove('is-player-chrome-visible');
        if (typeof markFocusRegistryDirty === 'function') {
            markFocusRegistryDirty();
        }
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

function applyPendingResumeSeek() {
    var target = Math.max(0, state.pendingResumePositionMs || 0);

    if (!target || !state.currentStream) {
        return false;
    }

    state.pendingResumePositionMs = 0;
    seekPlaybackTo(target, 'Resumed at ');
    return true;
}

function restartTranscodedPlaybackAt(targetMs, statusPrefix) {
    var target = Math.max(0, targetMs || 0);
    var selectedTrack = state.transcodedAudioTrack;
    var sourceUrl = state.transcodedSourceUrl;

    if (!isTranscodedPlaybackActive() || !selectedTrack || !sourceUrl) {
        return false;
    }

    state.transcodedOffsetMs = target;
    state.transcodedDurationMs = Math.max(state.transcodedDurationMs || 0, state.durationMs || 0);
    setPlaybackMetrics(target, getTimelineDurationMs(0));
    setPlayerStatus('Seeking transcoded stream...');
    startTranscodedDtsPlayback(selectedTrack, sourceUrl, target, statusPrefix || 'Skipped to ');
    return true;
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

    if (isTranscodedPlaybackActive() && restartTranscodedPlaybackAt(target, statusPrefix)) {
        saveCurrentPlaybackProgress(true);
        return;
    }

    if (state.playerMode === 'avplay' && hasAvplay()) {
        try {
            if (duration > 1000) {
                target = Math.min(duration - 1000, Math.max(1000, target));
            }
            webapis.avplay.seekTo(target, function() {
                setPlaybackMetrics(target, duration);
                setPlayerStatus((statusPrefix || 'Skipped to ') + formatPlaybackTime(target));
                saveCurrentPlaybackProgress(true);
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
        saveCurrentPlaybackProgress(true);
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
        state.suppressProgressSave = true;
        state.suppressNextHtml5AbortDiagnostic = true;
        video.pause();
        video.removeAttribute('src');
        video.load();
        setTimeout(function() {
            state.suppressProgressSave = false;
        }, 0);
    } catch (error) {
        state.suppressProgressSave = false;
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
    resetTranscodedPlaybackState();
    resetWindowedAvplayFrame();
    resetTrackState();
    resetPlaybackMetrics();
    setPlayerToggleUi(false);
    renderTrackSelectors();
}

function stopCurrentPlayback() {
    saveCurrentPlaybackProgress(true);
    clearPlaybackSurface();
    setPlayerStatus('Stopped');
}

function renderTrackChips(containerId, tracks, activeId, onSelect) {
    var container = byId(containerId);
    var fragment = document.createDocumentFragment();

    container.innerHTML = '';

    tracks.forEach(function(track) {
        var button = document.createElement('button');
        button.className = 'track-chip';
        button.type = 'button';
        button.setAttribute('tabindex', '-1');
        button.setAttribute('data-track-id', track.id);
        if (track.virtual) {
            button.classList.add('is-virtual');
            button.setAttribute('title', track.label);
        }
        if (track.failed || (state.audioTrackFailures && state.audioTrackFailures[track.id])) {
            button.classList.add('is-failed');
        }
        if (track.id === activeId) {
            button.classList.add('is-selected');
        }
        button.textContent = track.label;
        button.addEventListener('click', function() {
            onSelect(track.id);
        });
        fragment.appendChild(button);
    });
    container.appendChild(fragment);
    if (typeof markFocusRegistryDirty === 'function') {
        markFocusRegistryDirty();
    }
}

function renderTrackSelectors() {
    var activeAudioTrack;
    var activeSubtitleTrack;
    var hasPlayableSelection = !!(state.currentStream && state.currentStream.playable);
    var audioTracks = getSelectableAudioTracks();
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
                codec: '',
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
        appendPlayerDiagnosticOnce(
            'html5-no-audio-tracks',
            'warn',
            'HTML5 did not expose audio tracks',
            'The stream may contain unsupported or unreported audio.'
        );
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
        appendPlayerDiagnosticOnce('avplay-track-info-failed', 'error', 'AVPlay track info failed', error);
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
                codec: info.codec_fourcc || info.codec || '',
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

    if (!nextAudio.length) {
        appendPlayerDiagnosticOnce(
            'avplay-no-audio-tracks',
            'warn',
            'AVPlay did not expose audio tracks',
            'The stream may contain unsupported or unreported audio.'
        );
    }

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
    [120, 450, 1200, 2500, 5000, 9000].forEach(function(delay) {
        setTimeout(refreshPlaybackTracks, delay);
    });
}

function markAudioTrackFailure(trackId) {
    state.audioTrackFailures = state.audioTrackFailures || {};
    state.audioTrackFailures[trackId] = true;
    renderTrackSelectors();
}

function getAudioTranscoderBaseUrl() {
    return String(typeof AUDIO_TRANSCODER_BASE_URL === 'undefined' ? '' : AUDIO_TRANSCODER_BASE_URL)
        .replace(/\/+$/, '')
        .trim();
}

function requestDtsTranscodedStreamUrl(streamUrl, selectedTrack, startMs) {
    var baseUrl = getAudioTranscoderBaseUrl();
    var startSeconds = Math.max(0, Math.floor((startMs || 0) / 1000));

    if (!baseUrl) {
        return Promise.reject(new Error('No audio transcoder is configured.'));
    }

    return requestJson(baseUrl + '/transcode', 'POST', {
        url: streamUrl,
        preferredCodec: 'dts',
        avoidCommentary: true,
        outputAudioCodec: 'ac3',
        start: startSeconds,
        sourceLabel: selectedTrack ? selectedTrack.label : ''
    });
}

function startTranscodedDtsPlayback(selectedTrack, streamUrl, startMs, statusPrefix) {
    var startPositionMs = Math.max(0, startMs || 0);

    state.transcodedPlaybackActive = true;
    state.transcodedSourceUrl = streamUrl;
    state.transcodedAudioTrack = selectedTrack;
    state.transcodedOffsetMs = startPositionMs;
    state.transcodedDurationMs = Math.max(state.transcodedDurationMs || 0, state.durationMs || 0);
    setPlaybackMetrics(startPositionMs, getTimelineDurationMs(0));
    appendPlayerDiagnostic(
        'info',
        startPositionMs > 0 ? 'Requesting DTS to AC3 transcode from offset' : 'Requesting DTS to AC3 transcode',
        startPositionMs > 0 ? formatPlaybackTime(startPositionMs) + ' • ' + selectedTrack.label : selectedTrack.label
    );

    requestDtsTranscodedStreamUrl(streamUrl, selectedTrack, startPositionMs).then(function(payload) {
        var transcodedUrl = payload && payload.url ? payload.url : '';
        var audio = payload && payload.audio ? payload.audio : null;

        if (!transcodedUrl) {
            throw new Error('The transcoder did not return a playback URL.');
        }

        state.activeAudioTrack = selectedTrack.id;
        renderTrackSelectors();
        appendPlayerDiagnostic(
            'success',
            'Playing detected DTS track as AC3',
            audio && audio.label ? audio.label : selectedTrack.label
        );
        if (startPositionMs > 0) {
            setPlayerStatus((statusPrefix || 'Skipped to ') + formatPlaybackTime(startPositionMs));
        }
        startAvplayStream(transcodedUrl);
    }).catch(function(error) {
        resetTranscodedPlaybackState();
        markAudioTrackFailure(selectedTrack.id);
        appendPlayerDiagnostic('error', 'DTS to AC3 transcode failed', error);
    });
}

function selectVirtualAudioTrack(selectedTrack) {
    var streamUrl = state.currentStream && state.currentStream.raw && state.currentStream.raw.url;

    if (!streamUrl) {
        markAudioTrackFailure(selectedTrack.id);
        appendPlayerDiagnostic('error', 'DTS attempt failed', 'No stream URL is available.');
        return;
    }

    appendPlayerDiagnostic(
        'warn',
        'Detected DTS track is not exposed by AVPlay',
        selectedTrack.label
    );

    if (getAudioTranscoderBaseUrl()) {
        startTranscodedDtsPlayback(selectedTrack, streamUrl, state.currentTimeMs || 0);
        return;
    }

    appendPlayerDiagnostic(
        'error',
        'DTS track needs transcoding',
        'Set AUDIO_TRANSCODER_BASE_URL to convert the non-commentary DTS track to AC3.'
    );
    markAudioTrackFailure(selectedTrack.id);
}

function selectAudioTrack(trackId) {
    var video = byId('videoPlayer');
    var audioTracks = video.audioTracks;
    var selectedTrack = getSelectableAudioTracks().filter(function(track) {
        return track.id === trackId;
    })[0];
    var index;

    if (!selectedTrack) {
        return;
    }

    showPlayerChrome(false);

    if (selectedTrack.virtual) {
        selectVirtualAudioTrack(selectedTrack);
        return;
    }

    if (state.playerMode === 'avplay' && hasAvplay()) {
        appendPlayerDiagnostic('info', 'Selecting AVPlay audio track', selectedTrack.label);
        try {
            webapis.avplay.setSelectTrack('AUDIO', selectedTrack.index);
            state.activeAudioTrack = trackId;
            renderTrackSelectors();
            setPlayerStatus('Audio: ' + selectedTrack.label);
            appendPlayerDiagnostic('success', 'AVPlay audio track selected', selectedTrack.label);
        } catch (error) {
            markAudioTrackFailure(trackId);
            appendPlayerDiagnostic('error', 'AVPlay audio switch failed', error);
            setPlayerStatus('Audio switch failed');
        }
        return;
    }

    appendPlayerDiagnostic('info', 'Selecting HTML5 audio track', selectedTrack.label);
    if (!audioTracks || typeof audioTracks.length !== 'number' || !audioTracks[selectedTrack.index]) {
        markAudioTrackFailure(trackId);
        appendPlayerDiagnostic('error', 'HTML5 audio switch failed', 'The selected track is not exposed by the video element.');
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
    appendPlayerDiagnostic('success', 'HTML5 audio track selected', selectedTrack.label);
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
    if (typeof markFocusRegistryDirty === 'function') {
        markFocusRegistryDirty();
    }
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
