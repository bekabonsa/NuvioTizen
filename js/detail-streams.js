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
        requests.push(scheduleRequest('subtitle', function() {
            return requestJson(requestUrl, 'GET');
        }).then(function(payload) {
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

    return scheduleRequest('stream', function() {
        return requestJson(baseUrl + '/stream/' + encodeURIComponent(type) + '/' + encodeURIComponent(videoId) + '.json', 'GET');
    })
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
    var index = state.mainRow - getEpisodeBrowserStartRow();
    var seasonExists = !!state.availableSeasons[index];

    if (!isEpisodeBrowserNavigationActive() || index < 0 || index >= state.selectedEpisodes.length) {
        return -1;
    }

    return state.mainCol === (seasonExists ? 1 : 0) ? index : -1;
}

function getFocusedSeasonIndex() {
    var index = state.mainRow - getEpisodeBrowserStartRow();

    if (!isEpisodeBrowserNavigationActive() || index < 0 || index >= state.availableSeasons.length) {
        return -1;
    }

    return state.mainCol === 0 ? index : -1;
}

function focusEpisodeBrowserEpisode(index) {
    var episodes = state.selectedEpisodes;
    var seasons = state.availableSeasons;
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
    var seasons = state.availableSeasons;
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
    markFocusRegistryDirty();
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
    var fragment = document.createDocumentFragment();

    rail.innerHTML = '';

    if (!state.selectedEpisodes.length) {
        section.style.display = 'none';
        markFocusRegistryDirty();
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
        fragment.appendChild(button);
    });
    rail.appendChild(fragment);
    markFocusRegistryDirty();
}

function renderSeasonRail() {
    var rail = byId('seasonRail');
    var section = byId('seasonSection');
    var fragment = document.createDocumentFragment();

    rail.innerHTML = '';

    if (state.selectedType !== 'series' || !state.availableSeasons.length) {
        section.style.display = 'none';
        markFocusRegistryDirty();
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
        fragment.appendChild(button);
    });
    rail.appendChild(fragment);
    markFocusRegistryDirty();
}

function renderStreamList() {
    var list = byId('streamList');
    var fragment = document.createDocumentFragment();

    byId('streamCount').textContent = String(state.streams.length);
    list.innerHTML = '';

    if (!state.streams.length) {
        applyDetailMode();
        markFocusRegistryDirty();
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
        fragment.appendChild(button);
    });

    list.appendChild(fragment);
    applyDetailMode();
    markFocusRegistryDirty();
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
    markFocusRegistryDirty();
}

function getSelectedKindLabel() {
    return state.selectedType === 'series' ? 'Series' : 'Movie';
}

function getSelectedBrowseKey() {
    return state.selectedType === 'series' ? 'series' : 'movies';
}

function getSelectedVideoSummary() {
    if (state.selectedType === 'series') {
        return state.selectedVideo
            ? (formatSeasonLabel(getVideoSeason(state.selectedVideo)) + ' • Episode ' + (getVideoEpisode(state.selectedVideo) || '?'))
            : 'Choose an episode';
    }

    return 'Movie';
}

function getSelectedItemMetaLine() {
    var item = state.selectedItem;
    var fallback = formatMetaLine(item, getSelectedKindLabel());

    return formatHomeActiveMetaLine(item, state.selectedType, getSelectedBrowseKey()) || fallback;
}

function applySelectedItemFallbacks(fallbackItem) {
    if (!state.selectedItem || !fallbackItem) {
        return;
    }

    state.selectedItem.id = state.selectedItem.id || fallbackItem.id;
    state.selectedItem.name = state.selectedItem.name || fallbackItem.name;
    state.selectedItem.poster = state.selectedItem.poster || fallbackItem.poster;
    state.selectedItem.background = state.selectedItem.background || fallbackItem.background || fallbackItem.poster;
    state.selectedItem.description = state.selectedItem.description || fallbackItem.description;
    state.selectedItem.releaseInfo = state.selectedItem.releaseInfo || fallbackItem.releaseInfo;
    state.selectedItem.year = state.selectedItem.year || fallbackItem.year;
    state.selectedItem.imdbRating = state.selectedItem.imdbRating || fallbackItem.imdbRating;
    if (!getItemGenreLabel(state.selectedItem) && fallbackItem.genres) {
        state.selectedItem.genres = fallbackItem.genres.slice();
    }
    if (!getItemGenreLabel(state.selectedItem) && fallbackItem.genre) {
        state.selectedItem.genre = fallbackItem.genre;
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
        byId('selectedTypeLabel').textContent = getSelectedKindLabel();
        byId('selectedDescription').textContent =
            state.selectedItem.description ||
            state.selectedItem.releaseInfo ||
            'Installed addons and streams for the current selection appear below.';
        byId('selectedVideoLabel').textContent = getSelectedItemMetaLine();
        selectedTypeSummary.textContent = getSelectedVideoSummary();
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
    markFocusRegistryDirty();
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
            state.suppressNextHtml5AbortDiagnostic = false;
            setPlayerStatus('Playing (HTML5)');
            setPlayerToggleUi(true);
            readHtml5Metrics();
            startPlaybackTicker();
            scheduleTrackRefresh();
        }).catch(function(error) {
            if (state.suppressNextHtml5AbortDiagnostic && error && error.name === 'AbortError') {
                state.suppressNextHtml5AbortDiagnostic = false;
                return;
            }
            state.suppressNextHtml5AbortDiagnostic = false;
            setPlayerStatus('Play blocked: ' + error.message);
            setPlayerToggleUi(false);
            appendPlayerDiagnostic('error', 'HTML5 play failed', error);
        });
    } else {
        setPlayerToggleUi(true);
    }
}

function startAvplayStream(url) {
    var video = byId('videoPlayer');
    var surface = byId('avplaySurface');

    if (!hasAvplay()) {
        appendPlayerDiagnostic('warn', 'AVPlay is unavailable, using HTML5', getUrlFilename(url) || url);
        startHtml5Stream(url);
        return;
    }

    stopHtml5Playback();
    stopAvplayPlayback();
    surface.classList.add('is-active');
    video.classList.add('is-hidden');
    state.playerMode = 'avplay';

    try {
        appendPlayerDiagnostic('info', 'Opening stream with AVPlay', getUrlFilename(url) || url);
        webapis.avplay.open(url);
        appendPlayerDiagnostic('success', 'AVPlay open accepted', getUrlFilename(url) || url);
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
                appendPlayerDiagnostic('error', 'AVPlay runtime error', error);
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
                appendPlayerDiagnostic('success', 'AVPlay playback started', getUrlFilename(url) || url);
                readAvplayMetrics();
                startPlaybackTicker();
                scheduleTrackRefresh();
            } catch (playError) {
                setPlayerToggleUi(false);
                setPlayerStatus('AVPlay play failed');
                appendPlayerDiagnostic('error', 'AVPlay play failed', playError);
                startHtml5Stream(url);
            }
        }, function(error) {
            setPlayerToggleUi(false);
            setPlayerStatus('AVPlay prepare failed');
            appendPlayerDiagnostic('error', 'AVPlay prepare failed', error);
            startHtml5Stream(url);
        });
    } catch (error) {
        setPlayerToggleUi(false);
        setPlayerStatus('AVPlay unavailable, using HTML5');
        appendPlayerDiagnostic('error', 'AVPlay open failed', error);
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
    clearPlayerDiagnostics();
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

        return scheduleRequest('meta', function() {
            return requestJson(
                baseUrl + '/meta/' + encodeURIComponent(type) + '/' + encodeURIComponent(id) + '.json',
                'GET'
            );
        }).then(function(payload) {
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
                applySelectedItemFallbacks(item);
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
    fetchMetaFromAddons('movie', item.id)
        .then(function(payload) {
            var meta = payload && payload.meta ? payload.meta : payload;

            state.selectedItem = meta || item;
            applySelectedItemFallbacks(item);
            state.selectedVideo = {
                id: state.selectedItem.id || item.id,
                title: state.selectedItem.name || item.name
            };
            renderAddons();
            loadStreamsForSelection();
        }).catch(function(error) {
            renderAddons();
            setAddonsMessage('Movie metadata failed: ' + error.message, 'error');
            loadStreamsForSelection();
        });
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
