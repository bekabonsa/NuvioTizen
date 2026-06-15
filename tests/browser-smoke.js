const assert = require('assert');
const fs = require('fs');
const http = require('http');
const path = require('path');

let chromium;
try {
  ({ chromium } = require('playwright'));
} catch (error) {
  console.log('browser smoke skipped: Playwright is not installed');
  process.exit(0);
}

const root = path.resolve(__dirname, '..');

function contentType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

function startServer() {
  const server = http.createServer((req, res) => {
    const requestPath = decodeURIComponent((req.url || '/').split('?')[0]);

    if (requestPath.indexOf('$WEBAPIS/') !== -1) {
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
      res.end('window.webapis = window.webapis || {};');
      return;
    }

    const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, '');
    const filePath = path.join(root, safePath === '/' ? 'index.html' : safePath);

    if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType(filePath) });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function metas(type) {
  return Array.from({ length: 10 }, (_, index) => ({
    id: `${type}-smoke-${index + 1}`,
    name: `${type === 'movie' ? 'Movie' : 'Series'} Smoke ${index + 1}`,
    poster: '',
    background: '',
    description: 'Smoke test item',
    releaseInfo: '2026',
    imdbRating: '7.1'
  }));
}

async function routeAddonMocks(page) {
  await page.route('https://v3-cinemeta.strem.io/manifest.json', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      id: 'org.cinemeta',
      name: 'Cinemeta',
      types: ['movie', 'series'],
      resources: [
        { name: 'catalog', types: ['movie', 'series'] },
        { name: 'meta', types: ['movie', 'series'] },
        { name: 'stream', types: ['movie', 'series'] }
      ],
      catalogs: [
        { type: 'movie', id: 'top', name: 'Top', extra: [{ name: 'genre', options: ['Action'] }, { name: 'search' }, { name: 'skip' }] },
        { type: 'series', id: 'top', name: 'Top', extra: [{ name: 'genre', options: ['Drama'] }, { name: 'search' }, { name: 'skip' }] }
      ]
    })
  }));

  await page.route('https://opensubtitles-v3.strem.io/manifest.json', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      id: 'org.opensubtitles.v3',
      name: 'OpenSubtitles',
      types: ['movie', 'series'],
      resources: [{ name: 'subtitles', types: ['movie', 'series'] }],
      catalogs: []
    })
  }));

  await page.route(/https:\/\/v3-cinemeta\.strem\.io\/catalog\/movie\/.+/, (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ metas: metas('movie') })
  }));

  await page.route(/https:\/\/v3-cinemeta\.strem\.io\/catalog\/series\/.+/, (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ metas: metas('series') })
  }));

  await page.route(/https:\/\/v3-cinemeta\.strem\.io\/meta\/movie\/.+/, (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ meta: metas('movie')[0] })
  }));

  await page.route(/https:\/\/v3-cinemeta\.strem\.io\/stream\/movie\/.+/, (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      streams: [{
        name: 'Smoke stream',
        title: 'Smoke stream',
        description: 'Playable smoke stream',
        url: 'http://127.0.0.1/smoke-video.mp4'
      }]
    })
  }));

  await page.route(/https:\/\/opensubtitles-v3\.strem\.io\/subtitles\/.+/, (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ subtitles: [] })
  }));
}

async function main() {
  const server = await startServer();
  const port = server.address().port;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  try {
    await routeAddonMocks(page);
    await page.goto(`http://127.0.0.1:${port}/index.html`);
    await page.waitForSelector('#homeMovieRail .card', { timeout: 10000 });

    await page.keyboard.press('ArrowRight');
    assert.strictEqual(await page.locator('.nav-item.is-active').textContent(), 'Library');
    await page.keyboard.press('ArrowLeft');
    assert.strictEqual(await page.locator('.nav-item.is-active').textContent(), 'Home');

    await page.locator('#homeMovieRail .card:not(.is-home-peek)').first().click();
    await page.waitForFunction(() => document.body.getAttribute('data-current-view') === 'addons');
    await page.waitForSelector('#streamList .stream-card', { timeout: 10000 });
    assert.ok((await page.locator('#selectedTitle').textContent()).indexOf('Movie Smoke') !== -1);

    await page.locator('#streamList .stream-card').first().click();
    await page.waitForFunction(() => document.body.getAttribute('data-current-view') === 'player');
    assert.ok((await page.locator('#playerTitle').textContent()).length > 0);

    await page.locator('[data-view="search"]').click();
    await page.waitForFunction(() => document.body.getAttribute('data-current-view') === 'search');
    await page.waitForSelector('#searchKeyboard .search-key');

    console.log('browser smoke passed');
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
