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

function getSelectedYearBrowseKey(type) {
    return type === 'movie' ? state.selectedMovieYear : state.selectedSeriesYear;
}

function setSelectedYearBrowseKey(type, key) {
    if (type === 'movie') {
        state.selectedMovieYear = key || '';
        return;
    }

    state.selectedSeriesYear = key || '';
}

function getSelectedBrowseOption(type) {
    var options = getBrowseOptions(type);
    var key = getSelectedBrowseKey(type);
    var selected = options.filter(function(option) {
        return option.key === key;
    })[0];

    return selected || options[0] || null;
}

function getSelectedYearBrowseOption(type) {
    var options = getBrowseOptions(type);
    var key = getSelectedYearBrowseKey(type);

    if (!key) {
        return null;
    }

    return options.filter(function(option) {
        return option && option.key === key && isYearBrowseOption(option);
    })[0] || null;
}

function getSelectedBrowseLabel(type) {
    var selected = getSelectedBrowseOption(type);
    var year = getSelectedYearBrowseOption(type);

    if (selected && year) {
        return selected.label + ' • ' + year.label;
    }

    return selected ? selected.label : (year ? year.label : 'Unavailable');
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
    var row = getMainRows()[0] || [];
    var nextButton = null;
    var nextCol;

    row.some(function(button) {
        if (button && button.classList && button.classList.contains('is-year-filter') && button.getAttribute('data-year-index') === String(yearIndex)) {
            nextButton = button;
            return true;
        }

        return false;
    });

    if (!nextButton) {
        return false;
    }

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

function getItemGenres(item) {
    var value = item && (item.genres || item.genre);

    if (Array.isArray(value)) {
        return value.map(function(genre) {
            return String(genre || '').toLowerCase();
        }).filter(Boolean);
    }
    if (typeof value === 'string' && value) {
        return value.split(',').map(function(genre) {
            return genre.replace(/^\s+|\s+$/g, '').toLowerCase();
        }).filter(Boolean);
    }

    return [];
}

function itemMatchesGenreLabel(item, genre) {
    var target = String(genre || '').toLowerCase();

    if (!target) {
        return true;
    }

    return getItemGenres(item).some(function(value) {
        return value === target;
    });
}

function getItemImdbRatingNumber(item) {
    var value = item && item.imdbRating;
    var parsed;

    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'string') {
        parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }

    return 0;
}

function sortItemsForBrowseBase(items, baseOption) {
    var output = (items || []).slice();

    if (baseOption && baseOption.catalogId === 'imdbRating') {
        output.sort(function(left, right) {
            return getItemImdbRatingNumber(right) - getItemImdbRatingNumber(left);
        });
        return output;
    }

    return output;
}

function getSelectedYearCombinedOptions(type) {
    var baseOption = getSelectedBrowseOption(type);
    var yearOption = getSelectedYearBrowseOption(type);

    if (!yearOption) {
        return null;
    }

    return {
        baseOption: baseOption,
        yearOption: yearOption
    };
}

function fetchYearCombinedBrowse(type, baseOption, yearOption, currentItems, append) {
    var targetLength = (append ? currentItems.length : 0) + (append ? BROWSE_LOAD_MORE_SIZE : BROWSE_PAGE_SIZE);
    var baseIsGenre = baseOption && baseOption.filterGroup === 'genre';
    var baseRequest = baseIsGenre && baseOption
        ? requestBrowseCatalogPayload(baseOption, 0).catch(function() {
            return { metas: [] };
        })
        : Promise.resolve({ metas: [] });

    return Promise.all([
        requestBrowseCatalogPayload(yearOption, 0),
        baseRequest
    ]).then(function(results) {
        var yearItems = uniqueCatalogItems(results[0] && Array.isArray(results[0].metas) ? results[0].metas : []);
        var baseItems = uniqueCatalogItems(results[1] && Array.isArray(results[1].metas) ? results[1].metas : []);
        var baseIds = {};
        var filtered;
        var combined;
        var nextItems;

        baseItems.forEach(function(item) {
            if (item && item.id) {
                baseIds[item.id] = true;
            }
        });

        filtered = yearItems.filter(function(item) {
            if (!baseIsGenre || !baseOption) {
                return true;
            }

            return itemMatchesGenreLabel(item, baseOption.label) || !!baseIds[item.id];
        });
        filtered = sortItemsForBrowseBase(filtered, baseOption);
        combined = append ? uniqueCatalogItems((currentItems || []).concat(filtered)) : filtered;
        nextItems = trimToFullBrowseRows(combined.slice(0, targetLength));

        return {
            items: nextItems,
            canLoadMore: combined.length > nextItems.length,
            totalAvailable: filtered.length
        };
    });
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
    var yearCombined = getSelectedYearCombinedOptions(type);
    var currentLength = getBrowseItems(type).length;
    var expansionOptions;

    if (!option || !getBrowseCanLoadMore(type) || getBrowseLoadingMore(type)) {
        return;
    }

    if (yearCombined) {
        requestBrowseCatalogPayload(yearCombined.yearOption, 0).catch(function() {});
        if (yearCombined.baseOption && yearCombined.baseOption.filterGroup === 'genre') {
            requestBrowseCatalogPayload(yearCombined.baseOption, 0).catch(function() {});
        }
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
    }, 900);
}

function clearBrowsePrefetchTimers() {
    Object.keys(browsePrefetchTimers).forEach(function(type) {
        clearTimeout(browsePrefetchTimers[type]);
        delete browsePrefetchTimers[type];
    });
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

    browseCatalogPayloadPending[url] = scheduleRequest('catalog', function() {
        return requestJson(url, 'GET');
    }).then(function(payload) {
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
