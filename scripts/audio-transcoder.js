#!/usr/bin/env node

const http = require('http');
const { spawn } = require('child_process');

const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || '0.0.0.0';
const ffmpegBin = process.env.FFMPEG_PATH || 'ffmpeg';
const ffprobeBin = process.env.FFPROBE_PATH || 'ffprobe';

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8');
      if (!text) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(text));
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function runJson(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    const stdout = [];
    const stderr = [];

    child.stdout.on('data', (chunk) => stdout.push(chunk));
    child.stderr.on('data', (chunk) => stderr.push(chunk));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(Buffer.concat(stderr).toString('utf8') || `${command} exited with code ${code}`));
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(stdout).toString('utf8')));
      } catch (error) {
        reject(new Error(`${command} returned invalid JSON`));
      }
    });
  });
}

function audioLabel(stream) {
  const tags = stream.tags || {};
  const parts = [];

  if (tags.language) parts.push(String(tags.language).toUpperCase());
  if (stream.profile) parts.push(stream.profile);
  if (stream.codec_name) parts.push(stream.codec_name);
  if (stream.channels) parts.push(`${stream.channels}ch`);
  if (tags.title) parts.push(tags.title);

  return parts.join(' - ') || `audio stream ${stream.index}`;
}

function isDtsStream(stream) {
  const tags = stream.tags || {};
  return [
    stream.codec_name,
    stream.codec_long_name,
    stream.profile,
    tags.title
  ].join(' ').toLowerCase().indexOf('dts') !== -1;
}

function isCommentaryStream(stream) {
  const tags = stream.tags || {};
  return /commentary|comment|director|writer|producer/i.test(String(tags.title || ''));
}

function scoreAudioStream(stream, avoidCommentary) {
  const text = [
    stream.codec_name,
    stream.codec_long_name,
    stream.profile,
    stream.tags && stream.tags.title
  ].join(' ').toLowerCase();
  let score = 0;

  if (isDtsStream(stream)) score += 1000;
  if (text.indexOf('hd ma') !== -1 || text.indexOf('master audio') !== -1) score += 120;
  if (text.indexOf('hd') !== -1) score += 50;
  if (stream.channels) score += Math.min(Number(stream.channels) || 0, 8) * 5;
  if (stream.disposition && stream.disposition.default) score += 10;
  if (avoidCommentary && isCommentaryStream(stream)) score -= 800;

  return score;
}

async function probeSource(sourceUrl) {
  const payload = await runJson(ffprobeBin, [
    '-v', 'quiet',
    '-analyzeduration', '100M',
    '-probesize', '100M',
    '-print_format', 'json',
    '-select_streams', 'a',
    '-show_streams',
    sourceUrl
  ]);

  return (payload.streams || []).filter((stream) => stream.codec_type === 'audio');
}

function chooseAudioStream(streams, avoidCommentary) {
  const dtsStreams = streams.filter(isDtsStream);
  const candidates = dtsStreams.length ? dtsStreams : streams;

  if (!candidates.length) {
    return null;
  }

  return candidates.slice().sort((left, right) => {
    return scoreAudioStream(right, avoidCommentary) - scoreAudioStream(left, avoidCommentary);
  })[0];
}

function publicBaseUrl(req) {
  const hostHeader = req.headers.host || `127.0.0.1:${port}`;
  return `http://${hostHeader}`;
}

async function handleTranscode(req, res) {
  const body = await readBody(req);
  const sourceUrl = String(body.url || '').trim();
  const avoidCommentary = body.avoidCommentary !== false;
  const audioStreams = sourceUrl ? await probeSource(sourceUrl) : [];
  const audio = chooseAudioStream(audioStreams, avoidCommentary);
  let streamUrl;

  if (!sourceUrl) {
    sendJson(res, 400, { error: { message: 'Missing source url' } });
    return;
  }

  if (!audio || !isDtsStream(audio)) {
    sendJson(res, 422, { error: { message: 'No DTS audio stream was found' } });
    return;
  }

  streamUrl = `${publicBaseUrl(req)}/stream.ts?url=${encodeURIComponent(sourceUrl)}&audio=${encodeURIComponent(audio.index)}`;
  sendJson(res, 200, {
    url: streamUrl,
    audio: {
      index: audio.index,
      codec: audio.codec_name || '',
      profile: audio.profile || '',
      channels: audio.channels || null,
      commentary: isCommentaryStream(audio),
      label: audioLabel(audio)
    }
  });
}

function handleStream(req, res, parsedUrl) {
  const sourceUrl = String(parsedUrl.searchParams.get('url') || '').trim();
  const audioIndex = String(parsedUrl.searchParams.get('audio') || '').trim();
  const child = sourceUrl && audioIndex ? spawn(ffmpegBin, [
    '-hide_banner',
    '-loglevel', 'error',
    '-fflags', '+genpts',
    '-i', sourceUrl,
    '-map', '0:v:0',
    '-map', `0:${audioIndex}`,
    '-sn',
    '-dn',
    '-map_metadata', '-1',
    '-c:v', 'copy',
    '-c:a', 'ac3',
    '-b:a', '640k',
    '-ac', '6',
    '-avoid_negative_ts', 'make_zero',
    '-muxdelay', '0',
    '-muxpreload', '0',
    '-mpegts_flags', '+resend_headers',
    '-f', 'mpegts',
    'pipe:1'
  ], {
    stdio: ['ignore', 'pipe', 'pipe']
  }) : null;

  if (!child) {
    sendJson(res, 400, { error: { message: 'Missing source url or audio stream index' } });
    return;
  }

  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'video/mp2t',
    'Cache-Control': 'no-store'
  });

  child.stdout.pipe(res);
  child.stderr.on('data', (chunk) => {
    process.stderr.write(chunk);
  });
  child.on('error', (error) => {
    if (!res.headersSent) {
      sendJson(res, 500, { error: { message: error.message } });
    } else {
      res.destroy(error);
    }
  });
  child.on('close', () => {
    res.end();
  });
  req.on('close', () => {
    child.kill('SIGTERM');
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && parsedUrl.pathname === '/health') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === 'POST' && parsedUrl.pathname === '/transcode') {
    handleTranscode(req, res).catch((error) => {
      sendJson(res, 500, { error: { message: error.message } });
    });
    return;
  }

  if (req.method === 'GET' && (parsedUrl.pathname === '/stream' || parsedUrl.pathname === '/stream.ts')) {
    handleStream(req, res, parsedUrl);
    return;
  }

  sendJson(res, 404, { error: { message: 'Not found' } });
});

server.listen(port, host, () => {
  console.log(`Audio transcoder listening on http://${host}:${port}`);
});
