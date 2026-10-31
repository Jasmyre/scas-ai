#!/usr/bin/env node
/**
 * Delivery QA for the SCAS AI launch film.
 *
 *   node tools/verify.mjs
 *   node tools/verify.mjs --allow-missing-video
 *
 * Checks: video/audio specs, 2,784-frame count, audio peak + duration,
 * contact sheet, frozen-frame windows, and audio energy at cue frames.
 *
 * Exit codes: 0 PASS · 1 FAIL · 2 INCOMPLETE (video missing)
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { SCENES, SFX } from '../src/timeline/cues.js';
import {
  OUT,
  RENDER,
  FRAMES_DIR,
  STILLS_DIR,
  VIDEO,
  AUDIO_MASTER,
  TOTAL_FRAMES,
  FPS,
  DURATION,
  parseArgs,
  pad,
  pngInfo,
  ffprobeJson,
  runFfmpeg,
  ffmpegPeak,
  decodePcm,
  rmsAt,
  toDb,
} from './lib/pipeline.mjs';

const cli = parseArgs();
const allowMissingVideo = cli.has('allow-missing-video');
const videoFile = path.resolve(String(cli.get('video', VIDEO)));
const reportPath = path.join(OUT, 'render-report.json');
const sheetPath = path.join(OUT, 'contact-sheet.jpg');

const report = {
  checkedAt: new Date().toISOString(),
  verdict: null,
  exitCode: null,
  checks: [],
  notes: [],
  video: null,
  frames: null,
  audio: null,
  stills: null,
  contactSheet: null,
  deadFrames: null,
  avSync: null,
};

function check(name, status, detail, { fatal = true } = {}) {
  report.checks.push({ name, status, detail, fatal });
}

function note(message) {
  report.notes.push(message);
  console.log(`note: ${message}`);
}

const sceneOf = (frame) => SCENES.find((s) => frame >= s.start && frame < s.end) || null;

fs.mkdirSync(OUT, { recursive: true });

// ── 1. Video ─────────────────────────────────────────────────────────────────

const videoPresent = fs.existsSync(videoFile);
let videoProbe = null;
let videoStream = null;
let videoAudio = null;
let videoDuration = null;

if (videoPresent) {
  try {
    videoProbe = ffprobeJson(videoFile);
    videoStream = videoProbe.streams.find((s) => s.codec_type === 'video') || null;
    videoAudio = videoProbe.streams.find((s) => s.codec_type === 'audio') || null;
    videoDuration = Number(videoProbe.format?.duration);
  } catch (error) {
    note(`ffprobe could not read the video: ${error.message}`);
  }
}

if (!videoPresent) {
  note(`video missing: ${path.relative(process.cwd(), videoFile)} — run npm run render && npm run encode`);
  check('video present', 'skip', 'missing', { fatal: false });
} else if (!videoStream) {
  check('video stream present', 'fail', 'no video stream in container');
} else {
  const fps = videoStream.avg_frame_rate || videoStream.r_frame_rate;
  const expectedFrames =
    Number(videoStream.nb_frames) || Math.round((videoDuration || 0) * FPS);

  report.video = {
    file: path.relative(process.cwd(), videoFile),
    sizeBytes: fs.statSync(videoFile).size,
    container: videoProbe.format?.format_name,
    codec: videoStream.codec_name,
    profile: videoStream.profile,
    width: videoStream.width,
    height: videoStream.height,
    pixFmt: videoStream.pix_fmt,
    fps,
    frames: expectedFrames,
    duration: videoDuration,
    audio: videoAudio
      ? {
          codec: videoAudio.codec_name,
          sampleRate: Number(videoAudio.sample_rate),
          channels: videoAudio.channels,
          bitRate: Number(videoAudio.bit_rate),
        }
      : null,
  };

  check('video present', 'pass', path.basename(videoFile));
  check('1920x1080', videoStream.width === 1920 && videoStream.height === 1080 ? 'pass' : 'fail', `${videoStream.width}x${videoStream.height}`);
  check('24 fps CFR', fps === '24/1' ? 'pass' : 'fail', fps);
  check('H.264 High / yuv420p', videoStream.codec_name === 'h264' && String(videoStream.profile).toLowerCase() === 'high' && videoStream.pix_fmt === 'yuv420p' ? 'pass' : 'fail', `${videoStream.codec_name} ${videoStream.profile} ${videoStream.pix_fmt}`);
  check(
    `duration ${DURATION.toFixed(1)}s ±0.1`,
    Number.isFinite(videoDuration) && Math.abs(videoDuration - DURATION) <= 0.1 ? 'pass' : 'fail',
    Number.isFinite(videoDuration) ? `${videoDuration.toFixed(3)}s` : 'unknown',
  );
  check(
    `frame count ${TOTAL_FRAMES}`,
    expectedFrames === TOTAL_FRAMES ? 'pass' : 'fail',
    `${expectedFrames} frames`,
  );
  check('audio stream muxed', videoAudio ? 'pass' : 'fail', videoAudio ? `${videoAudio.codec_name} ${videoAudio.sample_rate}Hz ${videoAudio.channels}ch` : 'none');
}

// ── 2. Rendered frames on disk ───────────────────────────────────────────────

const frameFiles = fs.existsSync(FRAMES_DIR)
  ? fs.readdirSync(FRAMES_DIR).filter((f) => /^frame_\d{5}\.png$/.test(f))
  : [];
const frameNumbers = frameFiles.map((f) => Number(/^frame_(\d{5})\.png$/.exec(f)[1])).sort((a, b) => a - b);
const presentFrames = new Set(frameNumbers);
const missingRanges = [];
{
  let runStart = null;
  for (let f = 0; f < TOTAL_FRAMES; f += 1) {
    const missing = !presentFrames.has(f);
    if (missing && runStart === null) runStart = f;
    if (!missing && runStart !== null) {
      missingRanges.push({ from: runStart, to: f - 1 });
      runStart = null;
    }
  }
  if (runStart !== null) missingRanges.push({ from: runStart, to: TOTAL_FRAMES - 1 });
}

report.frames = {
  dir: path.relative(process.cwd(), FRAMES_DIR),
  count: frameNumbers.length,
  expected: TOTAL_FRAMES,
  first: frameNumbers[0] ?? null,
  last: frameNumbers[frameNumbers.length - 1] ?? null,
  missingCount: TOTAL_FRAMES - presentFrames.size,
  missingRanges: missingRanges.slice(0, 20),
};
if (missingRanges.length > 20) report.frames.missingRangesTruncated = true;

check(
  `PNG frames on disk ${TOTAL_FRAMES}`,
  frameNumbers.length === TOTAL_FRAMES ? 'pass' : 'warn',
  `${frameNumbers.length}/${TOTAL_FRAMES}${missingRanges.length ? ` · ${missingRanges.length} gap(s)` : ''}`,
  { fatal: false },
);

// ── 3. Audio master ──────────────────────────────────────────────────────────

const masterPresent = fs.existsSync(AUDIO_MASTER);
const audioProbeFile = masterPresent ? AUDIO_MASTER : videoPresent ? videoFile : null;

if (!audioProbeFile) {
  note('no audio master and no muxed audio — audio checks skipped');
  report.audio = { present: false };
  check('audio peak', 'skip', 'no audio', { fatal: false });
  check('audio duration', 'skip', 'no audio', { fatal: false });
} else {
  const audioProbe = ffprobeJson(audioProbeFile);
  const stream = audioProbe.streams.find((s) => s.codec_type === 'audio');
  const audioDuration = Number(stream?.duration) || Number(audioProbe.format?.duration);
  const { peakDb, meanDb } = ffmpegPeak(audioProbeFile);

  report.audio = {
    source: path.relative(process.cwd(), audioProbeFile),
    master: masterPresent,
    codec: stream?.codec_name ?? null,
    sampleRate: Number(stream?.sample_rate) || null,
    channels: stream?.channels ?? null,
    duration: audioDuration,
    peakDb,
    meanDb,
  };

  if (peakDb === null) {
    check('audio peak', 'fail', 'volumedetect produced no peak');
  } else if (peakDb > -0.1) {
    check('audio peak (no clipping)', 'fail', `${peakDb} dBFS — limited headroom`);
  } else {
    check('audio peak (headroom)', 'pass', `${peakDb} dBFS, mean ${meanDb} dBFS`);
  }

  check(
    `audio duration ${DURATION.toFixed(1)}s ±0.1`,
    Number.isFinite(audioDuration) && Math.abs(audioDuration - DURATION) <= 0.1 ? 'pass' : 'fail',
    Number.isFinite(audioDuration) ? `${audioDuration.toFixed(3)}s` : 'unknown',
  );

  if (peakDb !== null && peakDb < -12) note(`master is quiet (${peakDb} dBFS); consider --loudnorm on encode`);
}

// ── 4. Stills inventory ──────────────────────────────────────────────────────

const stillFiles = fs.existsSync(STILLS_DIR)
  ? fs
      .readdirSync(STILLS_DIR)
      .map((name) => {
        const m = /^still_(\d+)\.png$/.exec(name);
        return m ? { frame: Number(m[1]), file: path.join(STILLS_DIR, name), name } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.frame - b.frame)
  : [];

const badStills = [];
for (const still of stillFiles) {
  const info = pngInfo(still.file);
  if (!info || info.width !== 1920 || info.height !== 1080) badStills.push(still.name);
}

const perScene = SCENES.map((scene) => ({
  id: scene.id,
  start: scene.start,
  end: scene.end,
  stills: stillFiles.filter((s) => s.frame >= scene.start && s.frame < scene.end).map((s) => s.frame),
}));
const scenesWithoutStills = perScene.filter((s) => s.stills.length === 0).map((s) => s.id);

report.stills = {
  dir: path.relative(process.cwd(), STILLS_DIR),
  count: stillFiles.length,
  frames: stillFiles.map((s) => s.frame),
  invalid: badStills,
  perScene,
};

if (!stillFiles.length) {
  check('review stills', 'warn', 'none in out/stills — run npm run render:stills', { fatal: false });
} else {
  check(
    'review stills 1920x1080',
    badStills.length === 0 ? 'pass' : 'fail',
    `${stillFiles.length} stills${badStills.length ? ` · invalid: ${badStills.slice(0, 4).join(', ')}` : ''}`,
  );
  check(
    'every scene has a still',
    scenesWithoutStills.length === 0 ? 'pass' : 'warn',
    scenesWithoutStills.length ? `missing: ${scenesWithoutStills.join(', ')}` : `${SCENES.length}/${SCENES.length} scenes`,
    { fatal: false },
  );
}

// ── 5. Contact sheet ─────────────────────────────────────────────────────────

report.contactSheet = { file: path.relative(process.cwd(), sheetPath), built: false };

if (!stillFiles.length) {
  check('contact sheet', 'skip', 'no stills', { fatal: false });
} else {
  const columns = 5;
  const rows = 6;
  const cell = 384;
  const padPx = 8;
  const margin = 16;
  const maxCells = columns * rows;
  const picked = (() => {
    if (stillFiles.length <= maxCells) return stillFiles;
    const out = [];
    for (let i = 0; i < maxCells; i += 1) {
      out.push(stillFiles[Math.round((i * (stillFiles.length - 1)) / (maxCells - 1))]);
    }
    return out;
  })();

  const tmp = path.join(OUT, '.contact-src');
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });

  try {
    picked.forEach((still, i) => {
      fs.copyFileSync(still.file, path.join(tmp, `seq_${pad(i, 2)}.png`));
    });

    runFfmpeg([
      '-y',
      '-v',
      'error',
      '-framerate',
      '1',
      '-start_number',
      '0',
      '-i',
      path.join(tmp, 'seq_%02d.png'),
      '-vf',
      `scale=${cell}:216:force_original_aspect_ratio=decrease,pad=${cell}:216:(ow-iw)/2:(oh-ih)/2:color=white,tile=${columns}x${rows}:padding=${padPx}:margin=${margin}:color=white`,
      '-frames:v',
      '1',
      '-q:v',
      '2',
      sheetPath,
    ]);

    const info = pngInfo(sheetPath) || (() => {
      const probe = ffprobeJson(sheetPath);
      const s = probe.streams.find((st) => st.codec_type === 'video');
      return { width: s?.width, height: s?.height };
    })();

    const expectedWidth = columns * cell + (columns - 1) * padPx + margin * 2;
    const expectedHeight = rows * 216 + (rows - 1) * padPx + margin * 2;

    report.contactSheet = {
      file: path.relative(process.cwd(), sheetPath),
      built: true,
      grid: `${columns}x${rows}`,
      cell: `${cell}x216`,
      images: picked.length,
      width: info?.width ?? null,
      height: info?.height ?? null,
      frames: picked.map((s) => s.frame),
    };

    check(
      'contact sheet',
      fs.existsSync(sheetPath) && fs.statSync(sheetPath).size > 2048 ? 'pass' : 'fail',
      `${path.basename(sheetPath)} · ${picked.length} stills · ${info?.width}x${info?.height}`,
    );
    if (info?.width !== expectedWidth || info?.height !== expectedHeight) {
      note(`contact sheet is ${info?.width}x${info?.height}, expected ${expectedWidth}x${expectedHeight}`);
    }
    fs.writeFileSync(
      path.join(OUT, 'contact-sheet.json'),
      `${JSON.stringify({ grid: `${columns}x${rows}`, cell: `${cell}x216`, order: picked.map((s) => s.frame) }, null, 2)}\n`,
    );
  } catch (error) {
    check('contact sheet', 'fail', String(error.message).split('\n')[0]);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// ── 6. Dead-frame windows ────────────────────────────────────────────────────

const DEAD_STRIDE = 12;
const DEAD_W = 160;
const DEAD_H = 90;

report.deadFrames = { mode: 'none', stride: DEAD_STRIDE, sampled: 0, windows: [] };

if (videoPresent) {
  try {
    const res = runFfmpeg(
      [
        '-v',
        'error',
        '-i',
        videoFile,
        '-an',
        '-vf',
        `select=not(mod(n\\,${DEAD_STRIDE})),scale=${DEAD_W}:${DEAD_H}:flags=area,format=gray`,
        '-fps_mode',
        'passthrough',
        '-f',
        'rawvideo',
        '-pix_fmt',
        'gray',
        '-',
      ],
      { encoding: 'buffer' },
    );

    const cellBytes = DEAD_W * DEAD_H;
    const frames = [];
    for (let offset = 0; offset + cellBytes <= res.stdout.length; offset += cellBytes) {
      frames.push(res.stdout.subarray(offset, offset + cellBytes));
    }

    const windows = [];
    let frozenSamples = 0;
    for (let i = 1; i < frames.length; i += 1) {
      const prev = frames[i - 1];
      const next = frames[i];
      const identical = prev.equals(next);
      let diffSum = 0;
      for (let p = 0; p < cellBytes; p += 1) diffSum += Math.abs(prev[p] - next[p]);
      const meanDiff = diffSum / cellBytes;
      if (identical) frozenSamples += 1;
      if (identical || meanDiff < 0.05) {
        windows.push({
          fromFrame: (i - 1) * DEAD_STRIDE,
          toFrame: i * DEAD_STRIDE,
          meanDiff: Number(meanDiff.toFixed(4)),
        });
      }
    }

    report.deadFrames = {
      mode: 'video',
      stride: DEAD_STRIDE,
      sampled: frames.length,
      frozenSamples,
      windows,
    };

    check(
      `${DEAD_STRIDE}-frame dead windows`,
      windows.length === 0 ? 'pass' : 'fail',
      windows.length
        ? `${windows.length} identical/near-identical window(s) · first at ${windows[0].fromFrame}–${windows[0].toFrame}`
        : `${frames.length} samples · none`,
    );
  } catch (error) {
    check('dead-frame scan', 'fail', String(error.message).split('\n')[0]);
  }
} else {
  // No video yet: fall back to SSIM over consecutive stills, advisory only.
  const pairs = [];
  for (let i = 1; i < Math.min(stillFiles.length, 21); i += 1) {
    const a = stillFiles[i - 1];
    const b = stillFiles[i];
    const res = runFfmpeg(
      ['-v', 'info', '-i', a.file, '-i', b.file, '-lavfi', '[0:v][1:v]ssim', '-f', 'null', '-'],
      { allowFail: true },
    );
    const match = /All:([\d.]+)/.exec(String(res.stderr || ''));
    if (match) pairs.push({ from: a.frame, to: b.frame, ssim: Number(match[1]) });
  }
  const identical = pairs.filter((p) => p.ssim >= 0.9999);
  report.deadFrames = { mode: 'stills-ssim', pairs: pairs.length, identical };
  check(
    'dead frames (stills advisory)',
    identical.length === 0 ? 'pass' : 'warn',
    `${pairs.length} consecutive pairs · ${identical.length} visually identical`,
    { fatal: false },
  );
}

// ── 7. A/V sync at cue frames ────────────────────────────────────────────────

const KEY_TYPES = new Set([
  'impact',
  'boom',
  'lock',
  'vault',
  'success',
  'error',
  'confirm',
  'glass',
  'press',
  'ping',
  'pop',
  'chime',
]);

const keyCues = SFX.filter((cue) => KEY_TYPES.has(cue.type));
let audioSource = null;
if (videoPresent && videoAudio) audioSource = { file: videoFile, map: '0:a:0', label: 'muxed video audio' };
else if (masterPresent) audioSource = { file: AUDIO_MASTER, map: '0:a:0', label: 'audio master' };

report.avSync = {
  audioSource: audioSource?.label ?? null,
  totalCues: SFX.length,
  cueCount: keyCues.length,
  cueTypes: KEY_TYPES.size,
  scenesWithCues: new Set(SFX.map((c) => sceneOf(c.frame)?.id).filter(Boolean)).size,
  cues: [],
};

if (!audioSource) {
  check('A/V cue energy', 'skip', 'no audio track', { fatal: false });
} else {
  const pcm = decodePcm(audioSource.file, { map: audioSource.map, rate: 8000 });
  if (!pcm || !pcm.samples.length) {
    check('A/V cue energy', 'fail', `could not decode ${audioSource.label}`);
  } else {
    let globalSum = 0;
    for (let i = 0; i < pcm.samples.length; i += 1) {
      const v = pcm.samples[i] / 32768;
      globalSum += v * v;
    }
    const globalDb = toDb(Math.sqrt(globalSum / pcm.samples.length));

    const cues = keyCues.map((cue) => {
      const time = cue.frame / FPS;
      const rms = rmsAt(pcm, time, 0.35);
      const baseline = rmsAt(pcm, Math.max(0, time - 0.55), 0.4);
      const rmsDb = toDb(rms);
      const baselineDb = toDb(baseline);
      return {
        frame: cue.frame,
        scene: sceneOf(cue.frame)?.id ?? null,
        type: cue.type,
        gain: cue.gain,
        rmsDb: Number(rmsDb.toFixed(1)),
        baselineDb: Number(baselineDb.toFixed(1)),
        deltaDb: Number((rmsDb - baselineDb).toFixed(1)),
        ok: rmsDb > -50,
      };
    });

    const passed = cues.filter((c) => c.ok);
    const failed = cues.filter((c) => !c.ok);
    const passRate = cues.length ? passed.length / cues.length : 0;
    const offset = pcm.seconds - (videoDuration || DURATION);

    report.avSync = {
      ...report.avSync,
      audioSource: audioSource.label,
      sampleRate: pcm.rate,
      decodedSeconds: Number(pcm.seconds.toFixed(3)),
      globalRmsDb: Number(globalDb.toFixed(1)),
      audioOffsetSeconds: Number(offset.toFixed(3)),
      cueCount: cues.length,
      passed: passed.length,
      passRate: Number(passRate.toFixed(3)),
      failed: failed.map((c) => `${c.frame} ${c.type}`),
      cues,
    };

    check(
      'A/V cue energy',
      passRate >= 0.9 ? 'pass' : 'fail',
      `${passed.length}/${cues.length} impacts have signal (${(passRate * 100).toFixed(1)}%)`,
    );
    if (videoPresent) {
      check(
        'audio/video duration match',
        Math.abs(offset) <= 0.1 ? 'pass' : 'fail',
        `${offset >= 0 ? '+' : ''}${offset.toFixed(3)}s`,
      );
    } else {
      report.checks.push({
        name: 'audio/video duration match',
        status: 'skip',
        detail: 'video not encoded',
        fatal: false,
      });
    }

    if (failed.length) {
      note(`silent cue windows: ${failed.map((c) => `${c.frame}/${c.type}`).join(', ')}`);
    }
    if (globalDb < -50) note('audio track is effectively silent');
    if (cues.length < 10) note(`only ${cues.length} key cues found in cues.js`);
  }
}

// ── Verdict ──────────────────────────────────────────────────────────────────

const fatalFailures = report.checks.filter((c) => c.status === 'fail' && c.fatal);
const warnings = report.checks.filter((c) => c.status === 'warn');

if (fatalFailures.length) {
  report.verdict = 'FAIL';
  report.exitCode = 1;
} else if (!videoPresent) {
  report.verdict = 'INCOMPLETE';
  report.exitCode = allowMissingVideo ? 0 : 2;
} else {
  report.verdict = 'PASS';
  report.exitCode = 0;
}

report.checkedAt = new Date().toISOString();
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

const label = { pass: 'PASS', fail: 'FAIL', warn: 'WARN', skip: 'SKIP' };
console.log('');
console.log('SCAS AI · delivery QA');
for (const item of report.checks) {
  console.log(`  ${label[item.status].padEnd(4)}  ${item.name.padEnd(30)} ${item.detail ?? ''}`);
}
if (warnings.length) console.log(`\n${warnings.length} warning(s) — see report`);
if (report.notes.length) {
  console.log('');
  for (const message of report.notes) console.log(`  · ${message}`);
}
console.log('');
console.log(`VERDICT: ${report.verdict}${report.verdict === 'INCOMPLETE' ? ' — video not encoded yet' : ''}`);
console.log(`report:  ${path.relative(process.cwd(), reportPath)}`);
if (report.verdict === 'INCOMPLETE') {
  console.log('next:    npm run render && npm run encode && npm run verify');
}

process.exitCode = report.exitCode;
