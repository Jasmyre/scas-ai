#!/usr/bin/env node
/**
 * Encode render/frames -> H.264 High / AAC deliverable, then verify the result
 * with ffprobe. Fails loudly on a missing frame sequence, wrong duration,
 * wrong resolution, wrong fps, or a silent file when audio was expected.
 *
 *   node tools/encode.mjs
 *   node tools/encode.mjs --no-audio
 *   node tools/encode.mjs --loudnorm                 # -14 LUFS
 *   node tools/encode.mjs --from=864 --to=1103 --out=out/s08.mp4 --expected-duration=10
 */

import fs from 'node:fs';
import path from 'node:path';

import {
  OUT,
  FRAMES_DIR,
  AUDIO_MASTER,
  VIDEO,
  DURATION,
  TOTAL_FRAMES,
  parseArgs,
  pad,
  fmtDuration,
  runFfmpeg,
  ffprobeJson,
} from './lib/pipeline.mjs';

const cli = parseArgs();
const framesDir = path.resolve(String(cli.get('frames', FRAMES_DIR)));
const outFile = path.resolve(String(cli.get('out', VIDEO)));
const explicitAudio = cli.get('audio', null);
const noAudio = cli.has('no-audio') || explicitAudio === 'none';
const audioFile = path.resolve(String(explicitAudio && explicitAudio !== 'none' ? explicitAudio : AUDIO_MASTER));
const loudnorm = cli.has('loudnorm');
const crf = String(cli.num('crf', 16));
const preset = String(cli.get('preset', 'slow'));
const expectedDuration = cli.num('expected-duration', DURATION);
const expectedFrames = Math.round(expectedDuration * 24);
const reportPath = path.join(OUT, 'encode-report.json');

const report = {
  startedAt: new Date().toISOString(),
  finishedAt: null,
  ok: false,
  input: { framesDir, audio: null },
  output: outFile,
  settings: { codec: 'libx264', profile: 'High', crf: Number(crf), preset, pixFmt: 'yuv420p', fps: 24, audio: null },
  probe: null,
  checks: [],
  notes: [],
};

function fail(message) {
  report.notes.push(message);
  console.error(`error: ${message}`);
}

function check(name, ok, detail) {
  report.checks.push({ name, ok: Boolean(ok), detail });
  return Boolean(ok);
}

function writeReport() {
  fs.mkdirSync(OUT, { recursive: true });
  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
}

// ── Frame sequence ───────────────────────────────────────────────────────────

if (!fs.existsSync(framesDir)) {
  fail(`frames directory not found: ${framesDir}. Run: npm run render`);
  writeReport();
  process.exit(1);
}

const frameNumbers = fs
  .readdirSync(framesDir)
  .map((name) => /^frame_(\d{5})\.png$/.exec(name))
  .filter(Boolean)
  .map((m) => Number(m[1]))
  .sort((a, b) => a - b);

if (!frameNumbers.length) {
  fail(`no frame_XXXXX.png files in ${framesDir}. Run: npm run render`);
  writeReport();
  process.exit(1);
}

const first = frameNumbers[0];
const last = frameNumbers[frameNumbers.length - 1];
const present = new Set(frameNumbers);
const gaps = [];
for (let f = first; f <= last; f += 1) {
  if (!present.has(f)) gaps.push(f);
}

report.input.frames = {
  dir: framesDir,
  count: frameNumbers.length,
  first,
  last,
  expectedFrames,
  gaps: gaps.slice(0, 50),
  gapCount: gaps.length,
};

if (first !== 0) {
  fail(`frame sequence starts at ${pad(first, 5)}; ffmpeg needs frame_00000.png. Render the full film or pass --frames.`);
  writeReport();
  process.exit(1);
}

if (gaps.length) {
  fail(
    `${gaps.length} missing frame(s) between ${pad(first, 5)} and ${pad(last, 5)} (first: ${gaps
      .slice(0, 10)
      .map((f) => pad(f, 5))
      .join(', ')}). Re-run: npm run render -- --resume`,
  );
  writeReport();
  process.exit(1);
}

// ── Audio decision ───────────────────────────────────────────────────────────

let audioPath = null;
if (noAudio) {
  report.notes.push('--no-audio: encoding a silent video.');
} else if (fs.existsSync(audioFile)) {
  audioPath = audioFile;
} else if (explicitAudio) {
  fail(`audio file not found: ${audioFile}`);
  writeReport();
  process.exit(1);
} else {
  report.notes.push(`no audio master at ${audioFile}; encoding silent (run npm run audio to add it)`);
}

report.input.audio = audioPath;
report.settings.audio = audioPath
  ? { codec: 'aac', bitrate: '320k', sampleRate: 48000, channels: 2, loudnorm: loudnorm ? 'I=-14:TP=-1.5:LRA=11' : null }
  : null;

// ── Encode ───────────────────────────────────────────────────────────────────

const args = [
  '-y',
  '-framerate',
  '24',
  '-start_number',
  '0',
  '-i',
  path.join(framesDir, 'frame_%05d.png'),
];

if (audioPath) args.push('-i', audioPath);

args.push('-map', '0:v:0');
if (audioPath) args.push('-map', '1:a:0');

args.push(
  '-c:v',
  'libx264',
  '-profile:v',
  'high',
  '-level',
  '4.2',
  '-preset',
  preset,
  '-crf',
  crf,
  '-pix_fmt',
  'yuv420p',
  '-r',
  '24',
  '-fps_mode',
  'cfr',
  '-color_primaries',
  'bt709',
  '-color_trc',
  'bt709',
  '-colorspace',
  'bt709',
  '-movflags',
  '+faststart',
);

if (audioPath) {
  if (loudnorm) args.push('-af', 'loudnorm=I=-14:TP=-1.5:LRA=11');
  args.push('-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-ac', '2', '-shortest');
} else {
  args.push('-an');
}

args.push(outFile);

console.log(`encoding ${report.input.frames.count} frames -> ${outFile}`);
if (audioPath) console.log(`audio: ${audioPath}${loudnorm ? ' (loudnorm -14 LUFS)' : ''}`);
console.log(`ffmpeg ${args.join(' ')}`);

const started = Date.now();
try {
  runFfmpeg(args, { encoding: 'utf8' });
} catch (error) {
  fail(error.message.split('\n').slice(0, 6).join(' '));
  writeReport();
  process.exit(1);
}
const encodeMs = Date.now() - started;
report.encodeMs = encodeMs;

if (!fs.existsSync(outFile) || fs.statSync(outFile).size < 1024) {
  fail(`encoder produced no usable output at ${outFile}`);
  writeReport();
  process.exit(1);
}

// ── Probe & gate ─────────────────────────────────────────────────────────────

let probe;
try {
  probe = ffprobeJson(outFile);
} catch (error) {
  fail(`ffprobe failed on the output: ${error.message}`);
  writeReport();
  process.exit(1);
}

const v = probe.streams.find((s) => s.codec_type === 'video');
const a = probe.streams.find((s) => s.codec_type === 'audio');
const duration = Number(probe.format?.duration);
const fps = v?.avg_frame_rate || v?.r_frame_rate;
const nbFrames = Number(v?.nb_frames);

report.probe = {
  container: probe.format?.format_name,
  sizeBytes: fs.statSync(outFile).size,
  duration,
  fps,
  nbFrames,
  video: v
    ? {
        codec: v.codec_name,
        profile: v.profile,
        width: v.width,
        height: v.height,
        pixFmt: v.pix_fmt,
        bitRate: Number(v.bit_rate),
      }
    : null,
  audio: a
    ? {
        codec: a.codec_name,
        sampleRate: Number(a.sample_rate),
        channels: a.channels,
        bitRate: Number(a.bit_rate),
      }
    : null,
};

check('video stream present', Boolean(v), v ? `${v.codec_name} ${v.width}x${v.height}` : 'none');
check('codec is h264', v?.codec_name === 'h264', v?.codec_name);
check('profile is High', String(v?.profile).toLowerCase() === 'high', v?.profile);
check('1920x1080', v?.width === 1920 && v?.height === 1080, `${v?.width}x${v?.height}`);
check('24 fps CFR', fps === '24/1', fps);
check('yuv420p', v?.pix_fmt === 'yuv420p', v?.pix_fmt);
check(`pixel count is ${TOTAL_FRAMES} frames`, nbFrames === expectedFrames, `${nbFrames} / ${expectedFrames}`);
check(
  `duration ${expectedDuration.toFixed(1)}s ±0.1`,
  Number.isFinite(duration) && Math.abs(duration - expectedDuration) <= 0.1,
  Number.isFinite(duration) ? `${duration.toFixed(3)}s` : 'unknown',
);

if (audioPath) {
  check('audio stream muxed', Boolean(a), a ? `${a.codec_name} ${a.sample_rate}Hz ${a.channels}ch` : 'missing');
  check('audio codec is aac', a?.codec_name === 'aac', a?.codec_name);
  check('audio is 48 kHz stereo', Number(a?.sample_rate) === 48000 && Number(a?.channels) === 2, `${a?.sample_rate}Hz ${a?.channels}ch`);
  const audioKbps = a ? Math.round(Number(a.bit_rate) / 1000) : 0;
  check('audio ≈320 kb/s', audioKbps >= 240 && audioKbps <= 420, `${audioKbps} kb/s`);
} else {
  report.checks.push({ name: 'audio stream', ok: true, detail: 'skipped (silent encode)' });
}

// faststart: the moov atom must precede mdat for progressive playback.
const head = fs.readFileSync(outFile).subarray(0, Math.min(4 * 1024 * 1024, fs.statSync(outFile).size));
const moovAt = head.indexOf('moov');
const mdatAt = head.indexOf('mdat');
check('faststart (moov before mdat)', moovAt >= 0 && (mdatAt === -1 || moovAt < mdatAt), `moov@${moovAt} mdat@${mdatAt}`);

report.ok = report.checks.every((c) => c.ok);
report.encodeMs = encodeMs;

writeReport();

console.log('');
for (const c of report.checks) console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}${c.detail ? ` (${c.detail})` : ''}`);
console.log('');
console.log(`${report.ok ? 'PASS' : 'FAIL'} · ${path.relative(process.cwd(), outFile)} · ${fmtDuration(encodeMs)} encode`);
console.log(`report: ${reportPath}`);
process.exitCode = report.ok ? 0 : 1;
