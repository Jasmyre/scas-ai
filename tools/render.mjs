#!/usr/bin/env node
/**
 * Deterministic frame capture for the SCAS AI launch film.
 *
 *   node tools/render.mjs                     # 2,112 frames -> render/frames
 *   node tools/render.mjs --dry-run           # 2 frames, then exit
 *   node tools/render.mjs --stills            # 28 review stills -> out/stills
 *   node tools/render.mjs --from=864 --to=1103 --resume
 *   node tools/render.mjs --scene=s09 --step=2 --out=render/s09
 *
 * The preview server is always torn down in a finally block, and port 4173 is
 * verified free before the process exits.
 */

import fs from 'node:fs';
import path from 'node:path';

import { SCENES } from '../src/timeline/cues.js';
import {
  FPS,
  TOTAL_FRAMES,
  RENDER,
  OUT,
  STILLS_DIR,
  FRAMES_DIR,
  parseArgs,
  clampInt,
  pad,
  fmtDuration,
  startServer,
  stopServer,
  runViteBuild,
  ensurePortFree,
  launchBrowser,
  openRenderPage,
  seekFrame,
  screenshot,
  isValidPng,
  pngInfo,
} from './lib/pipeline.mjs';

const cli = parseArgs();
const stillsMode = cli.has('stills');
const dryRun = cli.has('dry-run');
const resume = cli.has('resume');
const useDev = cli.has('dev');
const port = clampInt(cli.num('port', 4173), 1024, 65535);
const step = Math.max(1, Math.floor(cli.num('step', 1)));
const build = cli.bool('build', true);
const logPath = path.join(RENDER, 'render-log.json');
const startedAt = new Date();

const log = {
  startedAt: startedAt.toISOString(),
  finishedAt: null,
  ok: false,
  mode: dryRun ? 'dry-run' : stillsMode ? 'stills' : 'frames',
  config: {
    viewport: '1920x1080',
    dpr: 1,
    fps: FPS,
    from: null,
    to: null,
    step,
    scene: [],
    output: null,
    port,
    resume,
    build,
  },
  counts: { planned: 0, captured: 0, skipped: 0, failed: 0 },
  timing: { elapsedMs: 0, captureMs: 0, renderFps: null, avgFrameMs: null },
  missing: [],
  failures: [],
  pageErrors: [],
  notes: [],
};

fs.mkdirSync(RENDER, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

function writeLog() {
  log.finishedAt = new Date().toISOString();
  fs.writeFileSync(logPath, `${JSON.stringify(log, null, 2)}\n`);
}

function die(message, code = 1) {
  console.error(`error: ${message}`);
  log.failures.push({ frame: null, error: message });
  writeLog();
  process.exit(code);
}

// ── Resolve range + scene filter ─────────────────────────────────────────────

const sceneIds = String(cli.get('scene', '') || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const unknownScenes = sceneIds.filter((id) => !SCENES.some((s) => s.id === id));
if (unknownScenes.length) die(`unknown scene id(s): ${unknownScenes.join(', ')}`);

const sceneList = sceneIds.length ? SCENES.filter((s) => sceneIds.includes(s.id)) : SCENES;
log.config.scene = sceneIds;

const defaultFrom = sceneIds.length ? Math.min(...sceneList.map((s) => s.start)) : 0;
const defaultTo = sceneIds.length ? Math.max(...sceneList.map((s) => s.end - 1)) : TOTAL_FRAMES - 1;

const from = clampInt(cli.num('from', defaultFrom), 0, TOTAL_FRAMES - 1);
const to = clampInt(cli.num('to', defaultTo), 0, TOTAL_FRAMES - 1);
if (to < from) die(`--to=${to} is before --from=${from}`);

log.config.from = from;
log.config.to = to;

if (!stillsMode && !dryRun && from === 0 && to === TOTAL_FRAMES - 1) {
  console.log('full-film render: 2,112 frames at 24 fps (use --dry-run first if this is a smoke test)');
}

// ── Target frames ────────────────────────────────────────────────────────────

/** Two stills per scene: one second in, and the midpoint. Never a bare cut. */
function buildStillTargets(scenes) {
  const frames = [];
  for (const scene of scenes) {
    const length = scene.end - scene.start;
    for (const offset of [Math.min(24, Math.floor(length / 2)), Math.floor(length / 2)]) {
      const frame = clampInt(scene.start + offset, scene.start, scene.end - 1);
      if (!frames.includes(frame)) frames.push(frame);
    }
  }
  return frames.sort((a, b) => a - b);
}

let targets;
if (stillsMode) {
  targets = buildStillTargets(sceneList).filter((f) => f >= from && f <= to);
} else {
  targets = [];
  for (let f = from; f <= to; f += step) targets.push(f);
}

if (!targets.length) die('no frames selected');

// A dry run always writes to its own scratch directory, so it can never be
// mistaken for a real render and never wipes one.
const outDir = dryRun
  ? path.join(RENDER, 'dry-run')
  : path.resolve(String(cli.get('out', stillsMode ? STILLS_DIR : FRAMES_DIR)));
log.config.output = outDir;
fs.mkdirSync(outDir, { recursive: true });

const frameWidth = stillsMode || dryRun ? 4 : 5;
const frameFile = (frame) =>
  path.join(outDir, `${stillsMode || dryRun ? 'still' : 'frame'}_${pad(frame, frameWidth)}.png`);

if (dryRun) {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const first = targets[0];
  const last = targets[targets.length - 1];
  targets =
    first === last
      ? first < TOTAL_FRAMES - 1
        ? [first, first + 1]
        : [Math.max(0, first - 1), first]
      : [first, last];
  if (cli.has('out')) log.notes.push('--out is ignored during --dry-run; output goes to render/dry-run');
  log.notes.push(`dry run: capturing frames ${targets.join(' and ')}`);
}

// Stills are a review artefact: drop stale stills from previous frame layouts
// so the contact sheet never mixes renders.
if (stillsMode && !resume && outDir === STILLS_DIR) {
  const wanted = new Set(targets.map((f) => path.basename(frameFile(f))));
  for (const name of fs.readdirSync(outDir)) {
    if (/^still_\d+\.png$/.test(name) && !wanted.has(name)) {
      fs.rmSync(path.join(outDir, name), { force: true });
    }
  }
}

log.counts.planned = targets.length;

// ── Capture ──────────────────────────────────────────────────────────────────

let server = null;
let browser = null;
let context = null;
let pageRef = null;
let interrupted = false;
const renderStart = Date.now();

process.on('SIGINT', () => {
  if (interrupted) process.exit(130);
  interrupted = true;
  console.error('\ninterrupted: finishing the current frame, then shutting down...');
});

async function main() {
  try {
    if (build) runViteBuild();

    server = await startServer({
      mode: useDev ? 'dev' : 'preview',
      port,
      label: useDev ? 'vite' : 'preview',
    });

    browser = await launchBrowser();

    const params = new URLSearchParams({ render: '1' });
    // A single-scene run only needs that scene built; multi-scene runs build all.
    if (sceneIds.length === 1) params.set('scene', sceneIds[0]);
    const url = `${server.url}?${params.toString()}`;

    pageRef = await openRenderPage(browser, url, { freezeCss: !cli.has('keep-css-anim') });
    const { page, errors } = pageRef;
    log.pageErrors = errors;
    const total = targets.length;
    let captured = 0;
    let skipped = 0;
    let failed = 0;
    const captureStart = Date.now();

    for (let i = 0; i < total; i += 1) {
      if (interrupted) break;

      const frame = targets[i];
      const file = frameFile(frame);

      if (resume && isValidPng(file)) {
        skipped += 1;
        continue;
      }

      try {
        await seekFrame(page, frame);
        await screenshot(page, file);

        const info = pngInfo(file);
        if (!info || info.width !== 1920 || info.height !== 1080) {
          throw new Error(`screenshot was ${info ? `${info.width}x${info.height}` : 'unreadable'}, expected 1920x1080`);
        }

        captured += 1;
      } catch (error) {
        failed += 1;
        log.failures.push({ frame, error: String(error.message || error) });
        console.error(`\nframe ${frame} failed: ${error.message}`);
      }

      const done = captured + skipped + failed;
      const every = stillsMode || dryRun ? 1 : 24;
      if (done % every === 0 || done === total) {
        const elapsedMs = Date.now() - captureStart;
        const rate = done / Math.max(0.001, elapsedMs / 1000);
        const eta = rate > 0 ? ((total - done) / rate) * 1000 : 0;
        console.log(
          `[${done}/${total}] frame ${frame} · ${fmtDuration(elapsedMs)} · ${rate.toFixed(2)} fps · ETA ${fmtDuration(eta)}`,
        );
        log.counts.captured = captured;
        log.counts.skipped = skipped;
        log.counts.failed = failed;
        log.timing.captureMs = elapsedMs;
        log.timing.renderFps = Number(rate.toFixed(3));
        writeLog();
      }
    }

    log.counts.captured = captured;
    log.counts.skipped = skipped;
    log.counts.failed = failed;

    // Validate the whole plan, not just this run's writes: --resume can leave
    // holes and a hole breaks ffmpeg's image sequence.
    const missing = targets.filter((f) => !isValidPng(frameFile(f)));
    log.missing = missing;
    if (missing.length) {
      log.notes.push(
        `${missing.length} of ${total} planned frame(s) missing on disk (first: ${missing.slice(0, 8).join(', ')})`,
      );
    }

    const elapsedMs = Date.now() - renderStart;
    const captureMs = Date.now() - captureStart;
    log.timing.elapsedMs = elapsedMs;
    log.timing.captureMs = captureMs;
    log.timing.renderFps = captured > 0 ? Number((captured / Math.max(0.001, captureMs / 1000)).toFixed(3)) : null;
    log.timing.avgFrameMs = captured > 0 ? Number((captureMs / captured).toFixed(0)) : null;

    log.ok = failed === 0 && missing.length === 0 && !interrupted;

    console.log('');
    console.log(
      `${log.mode} ${log.ok ? 'complete' : 'incomplete'} · ${captured} captured · ${skipped} skipped · ${failed} failed · ${fmtDuration(elapsedMs)}`,
    );
    console.log(`frames: ${outDir}`);
    console.log(`log:    ${logPath}`);
    if (interrupted) console.log('interrupted: rerun with --resume to continue.');

    if (!log.ok) process.exitCode = interrupted ? 130 : 1;
  } catch (error) {
    console.error(error.stack || error.message);
    log.failures.push({ frame: null, error: String(error.message || error) });
    log.ok = false;
    process.exitCode = 1;
  } finally {
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    const free = await stopServer(server);
    if (!free) {
      log.ok = false;
      log.notes.push(`port ${port} was still held after shutdown`);
      process.exitCode = process.exitCode || 1;
    }
    log.pageErrors = pageRef?.errors ?? log.pageErrors;
    writeLog();
    if (!server) {
      // Nothing was listening, but make sure a previous crashed run is gone.
      await ensurePortFree(port, { timeoutMs: 2000 });
    }
  }
}

main();