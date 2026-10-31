// Shared plumbing for the SCAS AI launch-film tooling.
// Windows-first: every server is a real process tree, killed with
// `taskkill /T /F`, and its port is re-checked before we call it done.

import { spawn, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

export const IS_WIN = process.platform === 'win32';
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const OUT = path.join(ROOT, 'out');
export const RENDER = path.join(ROOT, 'render');
export const FRAMES_DIR = path.join(RENDER, 'frames');
export const STILLS_DIR = path.join(OUT, 'stills');

export const FPS = 24;
export const DURATION = 116;
export const TOTAL_FRAMES = 2784;
export const VIDEO = path.join(OUT, 'scas-ai-showcase-1080p24.mp4');
export const AUDIO_MASTER = path.join(OUT, 'scas-ai-master.wav');

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// CSS that makes screenshots reproducible: no blink, no transition wobble,
// no caret. GSAP writes inline styles every frame, so it is unaffected.
export const CSS_FREEZE = `
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    caret-color: transparent !important;
  }
  html { scrollbar-width: none !important; }
`;

export function parseArgs(argv = process.argv.slice(2)) {
  const flags = new Set();
  const values = new Map();

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const eq = arg.indexOf('=');
    if (eq === -1) {
      flags.add(arg.slice(2));
    } else {
      values.set(arg.slice(2, eq), arg.slice(eq + 1));
    }
  }

  return {
    flags,
    values,
    has: (name) => flags.has(name) || values.has(name),
    get: (name, fallback) => (values.has(name) ? values.get(name) : fallback),
    num: (name, fallback) => {
      if (!values.has(name)) return fallback;
      const parsed = Number(values.get(name));
      return Number.isFinite(parsed) ? parsed : fallback;
    },
    bool: (name, fallback = false) => {
      if (flags.has(`no-${name}`)) return false;
      if (flags.has(name)) return true;
      return values.has(name) ? values.get(name) !== '0' && values.get(name) !== 'false' : fallback;
    },
  };
}

export function clampInt(value, min, max) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function pad(value, width) {
  return String(value).padStart(width, '0');
}

export function fmtDuration(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h) return `${h}h${pad(m, 2)}m${pad(s, 2)}s`;
  if (m) return `${m}m${pad(s, 2)}s`;
  return `${s}s`;
}

// ── Ports & processes ────────────────────────────────────────────────────────

export function pidsOnPort(port) {
  try {
    if (IS_WIN) {
      const out =
        spawnSync('netstat', ['-ano', '-p', 'TCP'], {
          encoding: 'utf8',
          windowsHide: true,
          maxBuffer: 16 * 1024 * 1024,
        }).stdout || '';
      const pids = new Set();
      for (const line of out.split(/\r?\n/)) {
        if (!/\bLISTENING\b/i.test(line)) continue;
        const cols = line.trim().split(/\s+/);
        const local = cols[1] || '';
        if (!local.endsWith(`:${port}`)) continue;
        const pid = Number(cols[cols.length - 1]);
        if (pid) pids.add(pid);
      }
      return [...pids];
    }

    const out =
      spawnSync('lsof', ['-ti', `tcp:${port}`, '-sTCP:LISTEN'], {
        encoding: 'utf8',
      }).stdout || '';
    return out.split(/\s+/).map(Number).filter(Boolean);
  } catch {
    return [];
  }
}

export function killProcessTree(pid) {
  if (!pid) return;
  try {
    if (IS_WIN) {
      spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      });
    } else {
      try {
        process.kill(-pid, 'SIGKILL');
      } catch {
        process.kill(pid, 'SIGKILL');
      }
    }
  } catch {
    // Already gone.
  }
}

export async function ensurePortFree(port, { timeoutMs = 5000, log = console.log } = {}) {
  const started = Date.now();
  let pids = pidsOnPort(port);

  while (pids.length) {
    for (const pid of pids) {
      log(`[port ${port}] killing stale pid ${pid}`);
      killProcessTree(pid);
    }
    if (Date.now() - started > timeoutMs) return false;
    await sleep(200);
    pids = pidsOnPort(port);
  }
  return true;
}

async function waitForHttp(url, { timeoutMs = 60000, child, label = 'server' } = {}) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (child && child.exitCode !== null) {
      throw new Error(`${label} exited with code ${child.exitCode} before it was ready`);
    }
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // Not listening yet.
    }
    await sleep(200);
  }
  throw new Error(`${label} was not ready at ${url} after ${timeoutMs}ms`);
}

export function runViteBuild({ log = console.log } = {}) {
  const vite = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
  if (!fs.existsSync(vite)) throw new Error('vite is not installed (run npm install)');
  log('building static bundle...');
  const res = spawnSync(process.execPath, [vite, 'build'], {
    cwd: ROOT,
    stdio: 'inherit',
    windowsHide: true,
  });
  if (res.error) throw res.error;
  if (res.status !== 0) throw new Error(`vite build failed (exit ${res.status})`);
}

/**
 * Starts Vite (preview or dev) as a child process and resolves once the URL
 * answers. Always pair with `stopServer` in a finally block.
 */
export async function startServer({
  mode = 'preview',
  port = 4173,
  label = 'vite',
  readyTimeoutMs = 60000,
  log = console.log,
} = {}) {
  if (!(await ensurePortFree(port, { log }))) {
    throw new Error(`port ${port} is still in use after cleanup`);
  }

  const vite = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
  if (!fs.existsSync(vite)) throw new Error('vite is not installed (run npm install)');

  const argv = [
    vite,
    mode === 'preview' ? 'preview' : 'serve',
    '--port',
    String(port),
    '--strictPort',
    '--host',
    '127.0.0.1',
  ];

  const child = spawn(process.execPath, argv, {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  let tail = '';
  const forward = (stream, sink) => {
    stream.setEncoding('utf8');
    stream.on('data', (chunk) => {
      tail = (tail + chunk).slice(-8000);
      for (const line of chunk.split(/\r?\n/)) {
        if (line.trim()) sink(`[${label}] ${line}`);
      }
    });
  };
  forward(child.stdout, log);
  forward(child.stderr, (line) => console.error(line));

  const handle = {
    mode,
    port,
    url: `http://127.0.0.1:${port}/`,
    child,
    stopped: false,
    get stderr() {
      return tail;
    },
  };

  try {
    await waitForHttp(handle.url, { timeoutMs: readyTimeoutMs, child, label });
  } catch (error) {
    await stopServer(handle, { log });
    throw new Error(`${error.message}\n${tail.slice(-1500)}`);
  }

  return handle;
}

export async function stopServer(handle, { log = console.log } = {}) {
  if (!handle) return true;

  if (!handle.stopped) {
    handle.stopped = true;
    killProcessTree(handle.child.pid);
    await new Promise((resolve) => {
      if (handle.child.exitCode !== null) {
        resolve();
        return;
      }
      const timer = setTimeout(resolve, 3000);
      handle.child.once('exit', () => {
        clearTimeout(timer);
        resolve();
      });
    });
  }

  const free = await ensurePortFree(handle.port, { log });
  if (!free) log(`warning: port ${handle.port} is still held after shutdown`);
  return free;
}

// ── Browser ──────────────────────────────────────────────────────────────────

const CHROMIUM_ARGS = [
  '--force-color-profile=srgb',
  '--font-render-hinting=none',
  '--disable-lcd-text',
  '--hide-scrollbars',
  '--disable-dev-shm-usage',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding',
  '--disable-backgrounding-occluded-windows',
];

export async function launchBrowser({ log = console.warn } = {}) {
  for (const channel of ['chrome', 'msedge', undefined]) {
    try {
      return await chromium.launch({
        headless: true,
        args: CHROMIUM_ARGS,
        ...(channel ? { channel } : {}),
      });
    } catch (error) {
      log(`[browser] ${channel || 'bundled chromium'} unavailable: ${String(error.message).split('\n')[0]}`);
    }
  }
  throw new Error('No Chromium browser available (install Chrome/Edge or `npx playwright install chromium`)');
}

export async function openRenderPage(browser, url, { freezeCss = true, fps = FPS } = {}) {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    reducedMotion: 'reduce',
    locale: 'en-US',
    timezoneId: 'Asia/Manila',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(120000);

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const source = msg.location()?.url || '';
    if (/\/favicon\.ico(\?|$)/i.test(source)) return;
    errors.push(msg.text());
    console.error(`[page] ${msg.text()}${source ? ` (${source})` : ''}`);
  });
  page.on('pageerror', (error) => {
    errors.push(error.message);
    console.error(`[pageerror] ${error.message}`);
  });

  await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForFunction(() => window.__READY === true, null, { timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);

  const meta = await page.evaluate(() => ({
    fps: window.__FPS,
    total: window.__TOTAL_FRAMES,
    scenes: window.__SCENES || [],
    viewport: { width: window.innerWidth, height: window.innerHeight },
  }));

  if (meta.fps !== fps || meta.total !== TOTAL_FRAMES) {
    throw new Error(`bad runtime contract: fps=${meta.fps} total=${meta.total} (expected ${fps}/${TOTAL_FRAMES})`);
  }
  if (meta.viewport.width !== 1920 || meta.viewport.height !== 1080) {
    throw new Error(`bad viewport: ${meta.viewport.width}x${meta.viewport.height}`);
  }

  if (freezeCss) await page.addStyleTag({ content: CSS_FREEZE });

  // Let the injected CSS settle before the first seek.
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );

  return { context, page, meta, errors };
}

/** Seek to an absolute frame and wait two animation frames for GSAP + layout. */
export async function seekFrame(page, frame) {
  await page.evaluate(async (f) => {
    window.__seek(f);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }, frame);
}

export async function screenshot(page, file) {
  await page.screenshot({
    path: file,
    type: 'png',
    animations: 'disabled',
    caret: 'hide',
    scale: 'css',
  });
  return fs.statSync(file).size;
}

// ── PNG helpers (no image dependency) ────────────────────────────────────────

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export function pngInfo(file) {
  let fd;
  try {
    fd = fs.openSync(file, 'r');
    const header = Buffer.alloc(24);
    if (fs.readSync(fd, header, 0, 24, 0) < 24) return null;
    if (!header.subarray(0, 8).equals(PNG_SIGNATURE)) return null;
    if (header.toString('latin1', 12, 16) !== 'IHDR') return null;
    return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
  } catch {
    return null;
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

export function isValidPng(file, width = 1920, height = 1080) {
  if (!fs.existsSync(file)) return false;
  if (fs.statSync(file).size < 2048) return false;
  const info = pngInfo(file);
  return Boolean(info && info.width === width && info.height === height);
}

export function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

// ── ffmpeg / ffprobe ─────────────────────────────────────────────────────────

export function runFfmpeg(args, { encoding = 'utf8', allowFail = false, maxBuffer = 512 * 1024 * 1024 } = {}) {
  const res = spawnSync('ffmpeg', ['-hide_banner', '-nostdin', ...args], {
    cwd: ROOT,
    encoding,
    maxBuffer,
    windowsHide: true,
  });
  if (res.error) throw res.error;
  if (res.status !== 0 && !allowFail) {
    const stderr = String(res.stderr || '');
    throw new Error(`ffmpeg failed (exit ${res.status}): ${stderr.slice(-2000)}`);
  }
  return res;
}

export function ffprobeJson(file, extra = []) {
  const res = spawnSync(
    'ffprobe',
    ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', ...extra, file],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, windowsHide: true },
  );
  if (res.error) throw res.error;
  if (res.status !== 0) throw new Error(`ffprobe failed (exit ${res.status}): ${res.stderr}`);
  return JSON.parse(res.stdout);
}

export function mediaDuration(file) {
  try {
    const probe = ffprobeJson(file);
    return Number(probe.format?.duration);
  } catch {
    return null;
  }
}

/** Decode an audio stream to mono 16-bit PCM at `rate` (default 8 kHz). */
export function decodePcm(file, { map = '0:a:0', rate = 8000 } = {}) {
  const res = spawnSync(
    'ffmpeg',
    ['-v', 'error', '-nostdin', '-i', file, '-map', map, '-ac', '1', '-ar', String(rate), '-f', 's16le', '-acodec', 'pcm_s16le', '-'],
    { encoding: 'buffer', maxBuffer: 1024 * 1024 * 1024, windowsHide: true },
  );
  if (res.error || res.status !== 0 || !res.stdout?.length) return null;
  const bytes = res.stdout;
  const copy = Buffer.from(bytes);
  const samples = new Int16Array(copy.buffer, copy.byteOffset, Math.floor(copy.byteLength / 2));
  return { rate, samples, seconds: samples.length / rate };
}

export function rmsAt(pcm, timeSec, windowSec = 0.35) {
  const start = Math.max(0, Math.floor(timeSec * pcm.rate));
  const end = Math.min(pcm.samples.length, Math.floor((timeSec + windowSec) * pcm.rate));
  if (end <= start) return 0;
  let sum = 0;
  for (let i = start; i < end; i += 1) {
    const v = pcm.samples[i] / 32768;
    sum += v * v;
  }
  return Math.sqrt(sum / (end - start));
}

export const toDb = (amplitude) => (amplitude > 0 ? 20 * Math.log10(amplitude) : -120);

export function ffmpegPeak(file) {
  const res = runFfmpeg(['-i', file, '-af', 'volumedetect', '-f', 'null', '-'], { allowFail: true });
  const text = String(res.stderr || '');
  const max = /max_volume:\s*(-?[\d.]+) dB/.exec(text);
  const mean = /mean_volume:\s*(-?[\d.]+) dB/.exec(text);
  return {
    peakDb: max ? Number(max[1]) : null,
    meanDb: mean ? Number(mean[1]) : null,
  };
}
