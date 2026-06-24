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
    var fragment = document.createDocumentFragment();

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
        fragment.appendChild(button);
    });
    container.appendChild(fragment);
    markFocusRegistryDirty();
}

function renderSearchKeyboard() {
    var container = byId('searchKeyboard');
    var fragment = document.createDocumentFragment();

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

        fragment.appendChild(rowEl);
    });
    container.appendChild(fragment);
    markFocusRegistryDirty();
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
        return scheduleRequest('catalog', function() {
            return requestJson(buildCatalogRequestUrl(option, 0, {
                search: query
            }), 'GET');
        }).then(function(payload) {
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
    var imageUrl = options.imageUrl || item.posterPreview || item.poster;
    var fallbackImageUrl = Object.prototype.hasOwnProperty.call(options, 'fallbackImageUrl')
        ? options.fallbackImageUrl
        : (item.posterPreview && imageUrl === item.posterPreview && item.poster && item.poster !== item.posterPreview
            ? item.poster
            : (imageUrl !== item.background ? item.background : ''));

    card.className = 'card';
    if (options.className) {
        card.className += ' ' + options.className;
    }
    card.type = 'button';
    card.setAttribute('tabindex', '-1');
    if (item && item.id) {
        card.setAttribute('data-item-id', String(item.id));
        card.setAttribute('data-item-kind', kind || item.__kind || '');
    }

    poster.className = 'poster';
    function showEmptyPoster() {
        poster.innerHTML = '';
        poster.classList.add('is-empty');
        poster.textContent = 'No poster';
    }

    if (imageUrl) {
        var img = document.createElement('img');
        var triedFallback = false;

        img.decoding = 'async';
        if (options.eagerImage) {
            img.loading = 'eager';
        }
        img.addEventListener('error', function() {
            if (!triedFallback && fallbackImageUrl && fallbackImageUrl !== imageUrl) {
                triedFallback = true;
                img.src = fallbackImageUrl;
                return;
            }

            showEmptyPoster();
        });
        img.src = imageUrl;
        img.alt = item.name || 'Poster';
        poster.appendChild(img);
    } else {
        showEmptyPoster();
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
            if (options.continueEntry && typeof resumeContinueEntry === 'function') {
                resumeContinueEntry(options.continueEntry);
                return;
            }
            prepareSelection(item, kind);
        });
        card.addEventListener('focus', function() {
            if (typeof scheduleDetailTrailerPrefetch === 'function') {
                scheduleDetailTrailerPrefetch(kind || item.__kind, item && item.id);
            }
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
    var fragment = document.createDocumentFragment();

    container.innerHTML = '';
    items.forEach(function(item) {
        fragment.appendChild(createCard(item, item.__kind || kind));
    });
    container.appendChild(fragment);
    markFocusRegistryDirty();
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
    var fragment = document.createDocumentFragment();

    container.innerHTML = '';
    container.classList.add('rail-home-window');
    container.classList.remove('has-home-peek', 'has-home-start-offset', 'is-moving-left', 'is-moving-right');
    state.homeRailMoveDirections[key] = null;

    if (!entries.length) {
        state.homeRailIndices[key] = 0;
        markFocusRegistryDirty();
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
        fragment.appendChild(createCard(previousEntry.item, previousEntry.kind, {
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

        fragment.appendChild(createCard(item, entry.kind, {
            className: isActive ? 'is-home-active' : 'is-home-compact',
            imageUrl: (isActive || useBackgroundForAllCards) ? (item.background || item.poster) : item.poster,
            continueProgress: entry.continueProgress,
            continueEntry: entry.continueEntry,
            metaText: isActive && (key === 'movies' || key === 'series')
                ? formatHomeActiveMetaLine(item, entry.kind, key)
                : entry.metaText,
            eagerImage: isActive,
            hideSynopsis: key === 'continue',
            showSynopsis: key !== 'continue' && isActive
        }));
    });
    container.appendChild(fragment);
    markFocusRegistryDirty();
}

function renderCardRows(containerId, items, kind, rowSize) {
    var options = arguments[4] || {};
    var container = byId(containerId);
    var rows = chunkItems(items, rowSize || 4);
    var fragment = document.createDocumentFragment();

    container.innerHTML = '';
    rows.forEach(function(group, index) {
        var row = document.createElement('div');
        row.className = 'card-row content-row';
        row.id = containerId + 'Row' + index;

        group.forEach(function(item) {
            row.appendChild(createCard(item, item.__kind || kind, options));
        });

        fragment.appendChild(row);
    });
    container.appendChild(fragment);
    markFocusRegistryDirty();
}

function renderContinueWatching() {
    var container = byId('continueRail');
    var count = byId('homeContinueCount');
    var section = byId('homeContinueSection');

    container.innerHTML = '';

    if (!state.continueWatching.length) {
        count.textContent = 'Nothing saved yet';
        section.style.display = 'none';
        markFocusRegistryDirty();
        return;
    }

    section.style.display = 'block';
    count.textContent = state.continueWatching.length + ' saved';
    renderHomeRailWindow('continueRail', buildContinueEntries(), 'continue');

    refreshFeaturedRotation();
}
