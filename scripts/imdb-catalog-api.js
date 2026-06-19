#!/usr/bin/env node

const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const readline = require('readline');
const zlib = require('zlib');

const port = Number(process.env.PORT || 8791);
const host = process.env.HOST || '0.0.0.0';
const dataDir = process.env.IMDB_DATA_DIR || path.join(__dirname, '..', '.cache', 'imdb');
const cacheVersion = 4;
const minVotes = Number(process.env.IMDB_MIN_VOTES || 10000);
const weightedVoteAnchor = Number(process.env.IMDB_WEIGHTED_VOTE_ANCHOR || 25000);
const weightedMeanRating = Number(process.env.IMDB_WEIGHTED_MEAN_RATING || 6.8);
const imdbApiBaseUrl = (process.env.IMDB_API_BASE_URL || 'https://api.imdbapi.dev').replace(/\/+$/, '');
const imdbApiExcludedCountryCodes = parseCsvSet(process.env.IMDB_API_EXCLUDED_COUNTRY_CODES || 'IN');
const imdbApiBatchConcurrency = Math.max(1, Number(process.env.IMDB_API_BATCH_CONCURRENCY || 1) || 1);
const enrichArtwork = process.env.IMDB_ENRICH_ARTWORK === '1';
const maxResults = Number(process.env.IMDB_MAX_RESULTS || 50);
const basicsUrl = process.env.IMDB_BASICS_URL || 'https://datasets.imdbws.com/title.basics.tsv.gz';
const ratingsUrl = process.env.IMDB_RATINGS_URL || 'https://datasets.imdbws.com/title.ratings.tsv.gz';
const cinemetaBaseUrl = (process.env.CINEMETA_META_BASE_URL || 'https://v3-cinemeta.strem.io').replace(/\/+$/, '');
const indexPath = path.join(dataDir, 'catalog-index.json');
const artworkPath = path.join(dataDir, 'catalog-artwork.json');
const imdbApiTitleCachePath = path.join(dataDir, 'imdbapi-title-cache.json');
const basicsPath = path.join(dataDir, 'title.basics.tsv.gz');
const ratingsPath = path.join(dataDir, 'title.ratings.tsv.gz');

let catalogIndexPromise = null;
let artworkCachePromise = null;
let imdbApiTitleCachePromise = null;

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function ensureDataDir() {
  fs.mkdirSync(dataDir, { recursive: true });
}

function downloadFile(url, targetPath) {
  return new Promise((resolve, reject) => {
    const target = fs.createWriteStream(targetPath);

    function request(nextUrl) {
      const client = nextUrl.startsWith('http://') ? http : https;

      client.get(nextUrl, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          request(new URL(response.headers.location, nextUrl).toString());
          return;
        }
        if (response.statusCode !== 200) {
          reject(new Error(`Download failed for ${nextUrl}: HTTP ${response.statusCode}`));
          return;
        }

        response.pipe(target);
      }).on('error', reject);
    }

    target.on('finish', () => target.close(resolve));
    target.on('error', reject);
    request(url);
  });
}

async function ensureFile(url, targetPath) {
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 0) {
    return;
  }

  console.log(`Downloading ${url}`);
  await downloadFile(url, targetPath);
}

function parseTsvLine(line) {
  return line.split('\t').map((value) => value === '\\N' ? '' : value);
}

function parseCsvSet(value) {
  const set = new Set();

  String(value || '').split(',').forEach((item) => {
    const normalized = String(item || '').trim().toLowerCase();

    if (normalized) {
      set.add(normalized);
    }
  });

  return set;
}

function getSetKey(set) {
  return Array.from(set || []).sort().join(',');
}

function normalizeGenre(value) {
  return String(value || '').trim();
}

function normalizeType(type) {
  return type === 'series' ? 'series' : 'movie';
}

function titleTypeMatches(type, titleType) {
  return type === 'series'
    ? titleType === 'tvSeries' || titleType === 'tvMiniSeries'
    : titleType === 'movie';
}

function getDefaultPosterUrl(entry) {
  return `https://images.metahub.space/poster/small/${entry.id}/img`;
}

function getDefaultBackgroundUrl(entry) {
  return `https://images.metahub.space/background/medium/${entry.id}/img`;
}

function getDefaultLogoUrl(entry) {
  return `https://images.metahub.space/logo/medium/${entry.id}/img`;
}

function getWeightedRatingScore(rating, votes) {
  const voteCount = Number(votes || 0);
  const averageRating = Number(rating || 0);
  const anchor = weightedVoteAnchor > 0 ? weightedVoteAnchor : 1;

  return (voteCount / (voteCount + anchor)) * averageRating
    + (anchor / (voteCount + anchor)) * weightedMeanRating;
}

function getImdbApiImageUrl(image) {
  return image && image.url ? image.url : '';
}

function getImdbApiBackgroundUrl(title) {
  return getImdbApiImageUrl(title && title.primaryImage);
}

function getImdbApiRuntimeMinutes(title) {
  return title && title.runtimeSeconds ? Math.round(Number(title.runtimeSeconds) / 60) : null;
}

function getImdbApiRating(title) {
  return title && title.rating && typeof title.rating.aggregateRating === 'number'
    ? Number(title.rating.aggregateRating.toFixed(1))
    : null;
}

function getImdbApiVoteCount(title) {
  return title && title.rating && typeof title.rating.voteCount === 'number'
    ? title.rating.voteCount
    : null;
}

function titleHasExcludedCountry(title) {
  return Array.isArray(title && title.originCountries) && title.originCountries.some((country) => {
    return imdbApiExcludedCountryCodes.has(String(country && country.code || '').trim().toLowerCase());
  });
}

function getImdbApiGenres(title, fallbackEntry) {
  if (Array.isArray(title && title.genres) && title.genres.length) {
    return title.genres.map(normalizeGenre).filter(Boolean);
  }

  return Array.isArray(fallbackEntry && fallbackEntry.genres) ? fallbackEntry.genres : [];
}

function toMeta(entry, artwork) {
  const art = artwork || {};

  return {
    id: entry.id,
    imdb_id: entry.id,
    type: entry.type,
    name: entry.name,
    poster: art.poster || getDefaultPosterUrl(entry),
    background: art.background || getDefaultBackgroundUrl(entry),
    logo: art.logo || getDefaultLogoUrl(entry),
    description: art.description || '',
    releaseInfo: entry.releaseInfo,
    year: entry.year,
    imdbRating: entry.imdbRating,
    imdbVotes: entry.votes,
    imdbScore: entry.imdbScore,
    runtime: entry.runtime,
    genres: entry.genres,
    genre: entry.genres
  };
}

function imdbApiTitleToMeta(title, fallbackEntry) {
  const entry = fallbackEntry || {};
  const rating = getImdbApiRating(title);
  const votes = getImdbApiVoteCount(title);
  const poster = getImdbApiImageUrl(title && title.primaryImage);
  const background = getImdbApiBackgroundUrl(title);
  const year = title && title.startYear ? String(title.startYear) : entry.year;
  const genres = getImdbApiGenres(title, entry);

  return {
    id: title && title.id || entry.id,
    imdb_id: title && title.id || entry.id,
    type: entry.type,
    name: title && title.primaryTitle || entry.name,
    poster: poster || getDefaultPosterUrl(entry),
    background: background || poster || getDefaultBackgroundUrl(entry),
    logo: entry.logo || getDefaultLogoUrl(entry),
    description: title && title.plot || '',
    releaseInfo: year,
    year: year,
    imdbRating: rating || entry.imdbRating,
    imdbVotes: votes || entry.votes,
    imdbScore: entry.imdbScore,
    runtime: getImdbApiRuntimeMinutes(title) || entry.runtime,
    genres: genres,
    genre: genres
  };
}

function readJsonFile(filePath, fallback) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (error) {
    console.warn(`Ignoring invalid cache ${filePath}: ${error.message}`);
  }

  return fallback;
}

function writeJsonFile(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requestJsonUrl(url, redirectCount = 0, attempt = 0) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('http://') ? http : https;
    const req = client.get(url, (response) => {
      let body = '';

      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location && redirectCount < 5) {
        response.resume();
        requestJsonUrl(new URL(response.headers.location, url).toString(), redirectCount + 1).then(resolve, reject);
        return;
      }

      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          if (response.statusCode === 429 && attempt < 3) {
            delay(750 * (attempt + 1)).then(() => {
              requestJsonUrl(url, redirectCount, attempt + 1).then(resolve, reject);
            });
            return;
          }

          const error = new Error(`HTTP ${response.statusCode}`);
          error.status = response.statusCode;
          error.body = body;
          reject(error);
          return;
        }

        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (error) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.setTimeout(10000, () => {
      req.destroy(new Error('Request timed out'));
    });
    req.on('error', reject);
  });
}

async function getArtworkCache() {
  if (!artworkCachePromise) {
    artworkCachePromise = Promise.resolve(readJsonFile(artworkPath, {}));
  }

  return artworkCachePromise;
}

async function getImdbApiTitleCache() {
  if (!imdbApiTitleCachePromise) {
    imdbApiTitleCachePromise = Promise.resolve(readJsonFile(imdbApiTitleCachePath, {}));
  }

  return imdbApiTitleCachePromise;
}

async function fetchImdbApiTitleBatch(ids) {
  const uniqueIds = Array.from(new Set((ids || []).filter(Boolean))).slice(0, 5);

  if (!uniqueIds.length) {
    return {};
  }

  const url = imdbApiBaseUrl + '/titles:batchGet?' + uniqueIds.map((id) => {
    return 'titleIds=' + encodeURIComponent(id);
  }).join('&');
  const payload = await requestJsonUrl(url);
  const titles = Array.isArray(payload && payload.titles) ? payload.titles : [];
  const byId = {};

  titles.forEach((title) => {
    if (title && title.id) {
      byId[title.id] = title;
    }
  });

  return byId;
}

async function getImdbApiTitles(entries) {
  const cache = await getImdbApiTitleCache();
  const output = {};
  const missing = [];
  const chunks = [];
  let changed = false;

  (entries || []).forEach((entry) => {
    if (!entry || !entry.id) {
      return;
    }
    if (Object.prototype.hasOwnProperty.call(cache, entry.id)) {
      output[entry.id] = cache[entry.id];
      return;
    }
    missing.push(entry.id);
  });

  for (let index = 0; index < missing.length; index += 5) {
    chunks.push(missing.slice(index, index + 5));
  }

  async function worker() {
    while (chunks.length) {
      const chunk = chunks.shift();
      let fetched;

      try {
        fetched = await fetchImdbApiTitleBatch(chunk);
      } catch (error) {
        if (error && error.status === 429) {
          output.__rateLimited = true;
          chunks.length = 0;
          return;
        }
        throw error;
      }

      chunk.forEach((id) => {
        cache[id] = fetched[id] || null;
        output[id] = cache[id];
        changed = true;
      });
    }
  }

  if (chunks.length) {
    await Promise.all(Array.from({ length: Math.min(imdbApiBatchConcurrency, chunks.length) }, worker));
  }

  if (changed) {
    writeJsonFile(imdbApiTitleCachePath, cache);
  }

  return output;
}

async function fetchCinemetaArtwork(type, id) {
  const payload = await requestJsonUrl(`${cinemetaBaseUrl}/meta/${encodeURIComponent(type)}/${encodeURIComponent(id)}.json`);
  const meta = payload && payload.meta ? payload.meta : payload;

  if (!meta || !Object.keys(meta).length) {
    return {
      poster: '',
      background: '',
      logo: '',
      description: '',
      country: ''
    };
  }

  return {
    poster: meta.poster || '',
    background: meta.background || meta.poster || '',
    logo: meta.logo || '',
    description: meta.description || '',
    country: meta.country || ''
  };
}

async function getCachedCinemetaArtwork(type, id) {
  const cache = await getArtworkCache();
  const key = `${type}:${id}`;
  let artwork = cache[key];

  if (artwork) {
    return artwork;
  }

  try {
    artwork = await fetchCinemetaArtwork(type, id);
  } catch (error) {
    artwork = {
      poster: '',
      background: '',
      logo: '',
      description: '',
      country: ''
    };
  }

  artwork.checkedAt = new Date().toISOString();
  cache[key] = artwork;
  writeJsonFile(artworkPath, cache);
  return artwork;
}

async function enrichMetasWithArtwork(type, entries) {
  const metas = new Array(entries.length);
  let cursor = 0;

  async function worker() {
    while (cursor < entries.length) {
      const index = cursor;
      const entry = entries[index];

      cursor += 1;
      metas[index] = toMeta(entry, await getCachedCinemetaArtwork(type, entry.id));
    }
  }

  await Promise.all(Array.from({ length: Math.min(6, entries.length) }, worker));
  return metas;
}

async function readRatings() {
  const ratings = new Map();
  const stream = fs.createReadStream(ratingsPath).pipe(zlib.createGunzip());
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let first = true;

  for await (const line of rl) {
    let parts;
    let rating;
    let votes;

    if (first) {
      first = false;
      continue;
    }
    if (!line) {
      continue;
    }

    parts = parseTsvLine(line);
    rating = Number(parts[1] || 0);
    votes = Number(parts[2] || 0);
    if (!parts[0] || !rating || votes < minVotes) {
      continue;
    }

    ratings.set(parts[0], {
      rating: rating,
      votes: votes
    });
  }

  return ratings;
}

async function buildIndex() {
  const ratings = await readRatings();
  const index = {
    cacheVersion: cacheVersion,
    generatedAt: new Date().toISOString(),
    minVotes: minVotes,
    weightedVoteAnchor: weightedVoteAnchor,
    weightedMeanRating: weightedMeanRating,
    imdbApiBaseUrl: imdbApiBaseUrl,
    imdbApiExcludedCountryCodes: getSetKey(imdbApiExcludedCountryCodes),
    movie: [],
    series: []
  };
  const stream = fs.createReadStream(basicsPath).pipe(zlib.createGunzip());
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let first = true;

  for await (const line of rl) {
    let parts;
    let rating;
    let titleType;
    let type;
    let genres;
    let year;
    let runtime;

    if (first) {
      first = false;
      continue;
    }
    if (!line) {
      continue;
    }

    parts = parseTsvLine(line);
    rating = ratings.get(parts[0]);
    titleType = parts[1];
    if (!rating || parts[4] === '1') {
      continue;
    }

    if (titleTypeMatches('movie', titleType)) {
      type = 'movie';
    } else if (titleTypeMatches('series', titleType)) {
      type = 'series';
    } else {
      continue;
    }

    genres = (parts[8] || '').split(',').map(normalizeGenre).filter(Boolean);
    year = parts[5] || '';
    runtime = Number(parts[7] || 0) || null;
    index[type].push({
      id: parts[0],
      type: type,
      name: parts[2] || parts[3] || parts[0],
      year: year,
      releaseInfo: type === 'series' && parts[6] ? `${year}-${parts[6]}` : year,
      runtime: runtime,
      genres: genres,
      imdbRating: Number(rating.rating.toFixed(1)),
      imdbScore: Number(getWeightedRatingScore(rating.rating, rating.votes).toFixed(4)),
      votes: rating.votes
    });
  }

  ['movie', 'series'].forEach((type) => {
    index[type].sort((left, right) => {
      if (right.imdbScore !== left.imdbScore) return right.imdbScore - left.imdbScore;
      if (right.imdbRating !== left.imdbRating) return right.imdbRating - left.imdbRating;
      if (right.votes !== left.votes) return right.votes - left.votes;
      return String(left.name).localeCompare(String(right.name));
    });
  });

  fs.writeFileSync(indexPath, JSON.stringify(index));
  return index;
}

async function getCatalogIndex() {
  if (!catalogIndexPromise) {
    catalogIndexPromise = (async () => {
      let cachedIndex;

      ensureDataDir();
      if (fs.existsSync(indexPath)) {
        cachedIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
        if (
          cachedIndex.cacheVersion === cacheVersion
          && cachedIndex.minVotes === minVotes
          && cachedIndex.weightedVoteAnchor === weightedVoteAnchor
          && cachedIndex.weightedMeanRating === weightedMeanRating
          && cachedIndex.imdbApiBaseUrl === imdbApiBaseUrl
          && cachedIndex.imdbApiExcludedCountryCodes === getSetKey(imdbApiExcludedCountryCodes)
        ) {
          return cachedIndex;
        }

        console.log('IMDb cache settings changed, rebuilding catalog index');
      }

      await ensureFile(basicsUrl, basicsPath);
      await ensureFile(ratingsUrl, ratingsPath);
      return buildIndex();
    })();
  }

  return catalogIndexPromise;
}

function itemMatchesGenre(item, genre) {
  const target = String(genre || '').toLowerCase();

  if (!target) {
    return true;
  }

  return (item.genres || []).some((value) => {
    const normalized = String(value || '').toLowerCase();
    return normalized === target || normalized.split(/\s*(?:&|\/|\+|\band\b)\s*/).indexOf(target) !== -1;
  });
}

function itemMatchesYear(item, year) {
  return !year || String(item.year || '') === String(year);
}

function itemMatchesRating(item, rating) {
  const min = Number(rating || 0);

  if (!min) {
    return true;
  }

  return item.imdbRating >= min && item.imdbRating < min + 1;
}

async function getPagedCatalogEntries(type, filtered, skip, limit, filters) {
  const items = [];
  let cursor = skip;
  let scanned = 0;
  let rateLimited = false;

  while (cursor < filtered.length && items.length < limit) {
    const batchSize = Math.max(5, Math.min(15, limit - items.length + 5));
    const candidates = filtered.slice(cursor, cursor + batchSize);
    const apiTitles = await getImdbApiTitles(candidates);
    let consumed = 0;

    candidates.some((entry) => {
      if (!Object.prototype.hasOwnProperty.call(apiTitles, entry.id)) {
        return true;
      }

      const apiTitle = apiTitles[entry.id];
      const meta = apiTitle ? imdbApiTitleToMeta(apiTitle, entry) : null;

      consumed += 1;
      if (
        !apiTitle
        || titleHasExcludedCountry(apiTitle)
        || !itemMatchesRating(meta, filters && filters.rating)
        || !itemMatchesGenre(meta, filters && filters.genre)
        || !itemMatchesYear(meta, filters && filters.year)
      ) {
        return false;
      }

      items.push({
        entry: entry,
        apiTitle: apiTitle,
        meta: meta
      });
      return items.length >= limit;
    });

    cursor += consumed;
    scanned += consumed;

    if (apiTitles.__rateLimited) {
      rateLimited = true;
      break;
    }
  }

  return {
    items: items,
    scanned: scanned,
    nextSkip: skip + scanned,
    hasMore: cursor < filtered.length,
    rateLimited: rateLimited
  };
}

async function handleCatalog(req, res, parsedUrl) {
  const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
  const type = normalizeType(pathParts[1]);
  const rating = parsedUrl.searchParams.get('rating') || '';
  const genre = parsedUrl.searchParams.get('genre') || '';
  const year = parsedUrl.searchParams.get('year') || '';
  const skip = Math.max(0, Number(parsedUrl.searchParams.get('skip') || 0) || 0);
  const limit = Math.max(1, Math.min(maxResults, Number(parsedUrl.searchParams.get('limit') || 50) || 50));
  const index = await getCatalogIndex();
  const filtered = (index[type] || []).filter((item) => {
    return itemMatchesRating(item, rating) && itemMatchesGenre(item, genre) && itemMatchesYear(item, year);
  });
  const page = await getPagedCatalogEntries(type, filtered, skip, limit, {
    rating: rating,
    genre: genre,
    year: year
  });
  const metas = page.items.map((item) => item.meta || imdbApiTitleToMeta(item.apiTitle, item.entry));

  if (enrichArtwork) {
    const fallbackEntries = page.items.filter((item) => {
      return !getImdbApiImageUrl(item.apiTitle && item.apiTitle.primaryImage);
    }).map((item) => item.entry);
    const fallbackById = {};

    if (fallbackEntries.length) {
      (await enrichMetasWithArtwork(type, fallbackEntries)).forEach((meta) => {
        fallbackById[meta.id] = meta;
      });
      metas.forEach((meta) => {
        const fallback = fallbackById[meta.id];

        if (fallback) {
          meta.poster = fallback.poster || meta.poster;
          meta.background = fallback.background || meta.background;
          meta.logo = fallback.logo || meta.logo;
          meta.description = meta.description || fallback.description;
        }
      });
    }
  }

  sendJson(res, 200, {
    metas: metas,
    hasMore: page.hasMore,
    skip: skip,
    limit: page.scanned,
    requestedLimit: limit,
    nextSkip: page.nextSkip,
    rateLimited: page.rateLimited,
    total: filtered.length,
    source: 'imdbapi-dev+imdb-datasets',
    generatedAt: index.generatedAt,
    minVotes: index.minVotes,
    weightedVoteAnchor: index.weightedVoteAnchor,
    imdbApiExcludedCountryCodes: index.imdbApiExcludedCountryCodes
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,OPTIONS'
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && parsedUrl.pathname === '/health') {
    getCatalogIndex().then((index) => {
      sendJson(res, 200, {
        ok: true,
        generatedAt: index.generatedAt,
        movieCount: index.movie.length,
        seriesCount: index.series.length
      });
    }).catch((error) => {
      sendJson(res, 500, { ok: false, error: { message: error.message } });
    });
    return;
  }

  if (req.method === 'GET' && /^\/catalog\/(movie|series)$/.test(parsedUrl.pathname)) {
    handleCatalog(req, res, parsedUrl).catch((error) => {
      sendJson(res, 500, { error: { message: error.message } });
    });
    return;
  }

  sendJson(res, 404, { error: { message: 'Not found' } });
});

server.listen(port, host, () => {
  console.log(`IMDb catalog API listening on http://${host}:${port}`);
  console.log(`Using data directory ${dataDir}`);
});
