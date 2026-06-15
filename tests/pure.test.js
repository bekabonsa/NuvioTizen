const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const scriptOrder = [
  'js/config-state.js',
  'js/platform-dom.js',
  'js/player.js',
  'js/navigation-focus.js',
  'js/catalogs-addons.js',
  'js/auth-sync.js',
  'js/detail-streams.js',
  'js/search-rendering.js'
];

const sandbox = {
  console,
  Promise,
  Date,
  Math,
  Array,
  Object,
  String,
  Number,
  Boolean,
  Error,
  parseInt,
  parseFloat,
  isNaN,
  isFinite,
  encodeURIComponent,
  decodeURIComponent,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  window: {
    location: { search: '' }
  },
  document: {
    getElementById() {
      throw new Error('DOM access is not available in pure tests');
    },
    querySelectorAll() {
      return [];
    }
  },
  localStorage: {
    getItem() { return null; },
    setItem() {},
    removeItem() {}
  }
};

vm.createContext(sandbox);
scriptOrder.forEach((relativePath) => {
  const filename = path.join(root, relativePath);
  vm.runInContext(fs.readFileSync(filename, 'utf8'), sandbox, { filename });
});

function testSubtitleParsing() {
  const cues = sandbox.parseSubtitleFile(`WEBVTT

1
00:00:01.000 --> 00:00:03.500
Hello <i>TV</i>

00:00:04,000 --> 00:00:05,250
Second line`);

  assert.strictEqual(cues.length, 2);
  assert.strictEqual(cues[0].start, 1000);
  assert.strictEqual(cues[0].end, 3500);
  assert.strictEqual(cues[0].text, 'Hello TV');
  assert.strictEqual(cues[1].start, 4000);
  assert.strictEqual(cues[1].end, 5250);
  assert.strictEqual(cues[1].text, 'Second line');
}

function testContinueDedupe() {
  const entries = sandbox.dedupeEntries([
    {
      kind: 'movie',
      item: { id: 'tt1', name: 'First' },
      position: 10,
      duration: 100
    },
    {
      kind: 'movie',
      item: { id: 'tt1', name: 'Duplicate' },
      position: 90,
      duration: 100
    },
    {
      kind: 'series',
      item: { id: 'tt2', name: 'Show' },
      video: { id: 'tt2:1:1', season: 1, episode: 1 }
    }
  ], sandbox.normalizeContinueEntry, 10);

  assert.strictEqual(entries.length, 2);
  assert.strictEqual(entries[0].item.name, 'First');
  assert.strictEqual(entries[1].video.season, 1);
}

function testCatalogSelectionAndUrls() {
  const cinemetaAddon = {
    transportUrl: 'https://v3-cinemeta.strem.io/manifest.json'
  };
  const otherAddon = {
    transportUrl: 'https://example.com/addon/manifest.json'
  };
  const preferred = sandbox.selectPreferredCatalogOption([
    { label: 'Other', catalogId: 'popular', supportsSearch: true, addon: otherAddon },
    { label: 'Top', catalogId: 'top', supportsSearch: false, addon: cinemetaAddon }
  ]);

  assert.strictEqual(preferred.catalogId, 'top');

  const url = sandbox.buildCatalogRequestUrl({
    addon: cinemetaAddon,
    type: 'movie',
    catalogId: 'top',
    supportsSkip: true,
    extraArgs: { genre: 'Action' }
  }, 50, { search: 'space' });

  assert.strictEqual(
    url,
    'https://v3-cinemeta.strem.io/catalog/movie/top/genre=Action&search=space&skip=50.json'
  );
}

function testBrowsePaging() {
  const movieTop = {
    addon: { transportUrl: 'https://v3-cinemeta.strem.io/manifest.json' },
    type: 'movie',
    catalogId: 'top',
    supportsSkip: true
  };
  const seriesTop = {
    addon: { transportUrl: 'https://v3-cinemeta.strem.io/manifest.json' },
    type: 'series',
    catalogId: 'top',
    supportsSkip: true
  };

  assert.strictEqual(sandbox.usesLocalBrowsePaging(movieTop, 100), true);
  assert.strictEqual(sandbox.usesLocalBrowsePaging(seriesTop, 0), true);
  assert.strictEqual(sandbox.usesLocalBrowsePaging(seriesTop, 50), false);
  assert.strictEqual(sandbox.getBrowseRequestSkip(seriesTop, 51), 50);
  assert.deepStrictEqual(sandbox.trimToFullBrowseRows([1, 2, 3, 4, 5, 6, 7]), [1, 2, 3, 4, 5]);
}

[
  testSubtitleParsing,
  testContinueDedupe,
  testCatalogSelectionAndUrls,
  testBrowsePaging
].forEach((testFn) => testFn());

console.log('pure tests passed');
