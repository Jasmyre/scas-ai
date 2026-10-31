#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// SCAS AI — 116s launch score. 120 BPM, A minor, 58 bars, 48k/16-bit stereo.
// Everything is synthesized from code and cues.js. No samples, no voiceover.
//
//   node audio/synth.mjs            full render + measured normalization
//   node audio/synth.mjs --check    render in memory, print duration/peak/cues
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FPS, DURATION, SFX, TYPING, MUSIC } from '../src/timeline/cues.js';
import {
  SR,
  dbToLin,
  linToDb,
  peakOf,
  rmsDb,
  writeWav,
  limit,
  reverb,
  pingPong,
  measureLoudness,
  probeDuration,
  Svf,
  Bus,
} from './lib/dsp.mjs';
import { buildMusic, SECTION_MAP, BARS, BAR_SECONDS } from './lib/music.mjs';
import { makeSfx, typingTickSchedule, SFX_TYPES } from './lib/sfx.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const CHECK = process.argv.includes('--check');

const TARGET_LUFS = -14;
const TARGET_TP = -1.0;
const MUSIC_GAIN = 0.52;
const SFX_GAIN = 0.5;
const WET = 0.5;

const LEN = Math.round(SR * DURATION);
const bar = BAR_SECONDS;

// ── Envelopes ────────────────────────────────────────────────────────────────
function sidechainEnv(times, depth, release = 0.075) {
  const env = new Float32Array(LEN).fill(1);
  const attack = 0.005;
  const span = Math.round(0.6 * SR);
  for (const time of times) {
    const s = Math.round(time * SR);
    for (let i = 0; i < span; i += 1) {
      const idx = s + i;
      if (idx >= LEN) break;
      const t = i / SR;
      const g =
        t < attack
          ? 1 - (1 - depth) * (t / attack)
          : depth + (1 - depth) * (1 - Math.exp(-(t - attack) / release));
      if (g < env[idx]) env[idx] = g;
    }
  }
  return env;
}

function duckInto(env, { start, end, depth, attack = 0.02, release = 0.3 }) {
  const s = Math.max(0, Math.floor(start * SR));
  const e = Math.min(LEN, Math.ceil((end + release) * SR));
  for (let i = s; i < e; i += 1) {
    const t = (i - s) / SR;
    let g;
    if (t < attack) g = 1 - (1 - depth) * (t / attack);
    else if (i / SR <= end) g = depth;
    else g = depth + (1 - depth) * (1 - Math.exp(-((i / SR) - end) / release));
    if (g < env[i]) env[i] = g;
  }
}

// ── Build ────────────────────────────────────────────────────────────────────
const t0 = Date.now();
const music = buildMusic({ sr: SR, len: LEN });
const sections = SECTION_MAP.map((s) => ({
  name: s.name,
  bars: [s.from + 1, s.to + 1],
  start: s.from * bar,
  end: (s.to + 1) * bar,
  note: s.note,
}));
process.stderr.write(`  score        ${BARS} bars · ${Date.now() - t0}ms\n`);

// Sidechain: kick-driven pump on bass/sub, lighter on harmony.
const scHeavy = sidechainEnv(music.kicks, 0.34, 0.075);
const scLight = sidechainEnv(music.kicks, 0.62, 0.095);

// Reverb + delay.
const musicWet = reverb(music.rev, { decay: 0.865, damp: 0.28 });
const arpWide = pingPong(music.arp, { time: 0.25, feedback: 0.32, mix: 0.34 });

// ── SFX bus ──────────────────────────────────────────────────────────────────
const sfxBus = new Bus(SR, LEN);
const sfxRev = new Bus(SR, LEN);
const cueStats = {};
let sfxEvents = 0;

for (const cue of SFX) {
  const voice = makeSfx(cue.type, { dur: cue.dur, seed: cue.frame * 13 + 7 });
  cueStats[cue.type] = (cueStats[cue.type] || 0) + 1;
  sfxEvents += 1;
  sfxBus.add(cue.frame / FPS, voice.dur, voice.fn, {
    gain: (cue.gain ?? 0.4) * 0.85,
    pan: cue.pan ?? 0,
    rev: 0.14,
    revBus: sfxRev,
  });
}

const ticks = typingTickSchedule(TYPING, FPS);
for (const tick of ticks) {
  const voice = makeSfx('type', { seed: tick.seed });
  const v = (tick.seed % 5) / 5;
  sfxBus.add(tick.time, voice.dur, voice.fn, {
    gain: 0.42 + v * 0.12,
    pan: 0.1 + v * 0.2,
    rev: 0.04,
    revBus: sfxRev,
  });
}
process.stderr.write(`  sfx          ${sfxEvents} cues · ${ticks.length} typing ticks · ${Date.now() - t0}ms\n`);

const sfxWet = reverb(sfxRev, { decay: 0.8, damp: 0.45 });

// ── Duck music under impacts and typing ──────────────────────────────────────
const duck = new Float32Array(LEN).fill(1);
for (const cue of SFX) {
  const t = cue.frame / FPS;
  if (cue.type === 'impact') duckInto(duck, { start: t, end: t + 0.2, depth: 0.46, attack: 0.006, release: 0.55 });
  else if (cue.type === 'boom') duckInto(duck, { start: t, end: t + 0.15, depth: 0.55, attack: 0.008, release: 0.45 });
  else if (cue.type === 'lock' || cue.type === 'vault') duckInto(duck, { start: t, end: t + 0.12, depth: 0.62, attack: 0.006, release: 0.35 });
  else if (cue.type === 'error') duckInto(duck, { start: t, end: t + 0.1, depth: 0.7, attack: 0.01, release: 0.3 });
}
for (const cue of TYPING) {
  const start = cue.start / FPS;
  const lastFrame = Math.round(cue.start + ((cue.text.length - 1) * FPS) / cue.cps);
  duckInto(duck, { start, end: lastFrame / FPS, depth: 0.62, attack: 0.06, release: 0.32 });
}

// ── Sum music ────────────────────────────────────────────────────────────────
const baseL = new Float32Array(LEN);
const baseR = new Float32Array(LEN);
const stampL = new Float32Array(LEN);
const stampR = new Float32Array(LEN);

const hpL = new Svf(SR).set(26, 0.7);
const hpR = new Svf(SR).set(26, 0.7);
const airL = new Svf(SR).set(5200, 0.7);
const airR = new Svf(SR).set(5200, 0.7);

// Music cut 200ms before the finale impact.
const cutA = 105.82;
const cutB = 105.9;
const cutC = 105.99;

for (let i = 0; i < LEN; i += 1) {
  const t = i / SR;
  let ml =
    music.drums.l[i] * 1.05 +
    music.bass.l[i] * 0.85 * scHeavy[i] +
    (music.pad.l[i] * 0.62 + arpWide.l[i] * 0.95 + music.lead.l[i] * 0.7) * scLight[i] +
    music.sub.l[i] * 0.8 * scHeavy[i] +
    musicWet.l[i] * WET;
  let mr =
    music.drums.r[i] * 1.05 +
    music.bass.r[i] * 0.85 * scHeavy[i] +
    (music.pad.r[i] * 0.62 + arpWide.r[i] * 0.95 + music.lead.r[i] * 0.7) * scLight[i] +
    music.sub.r[i] * 0.8 * scHeavy[i] +
    musicWet.r[i] * WET;

  let cut = 1;
  if (t > cutA && t < cutC) {
    cut = t < cutB ? 1 - (t - cutA) / (cutB - cutA) : 0;
  }
  if (t >= cutC && t < cutC + 0.02) cut = (t - cutC) / 0.02;

  const fadeOut = Math.min(1, Math.max(0, (DURATION - t) / 1.4));
  const fadeIn = Math.min(1, t / 0.004);

  ml *= duck[i] * cut * fadeOut * fadeIn;
  mr *= duck[i] * cut * fadeOut * fadeIn;

  hpL.run(ml);
  hpR.run(mr);
  ml = hpL.hp;
  mr = hpR.hp;

  // Gentle air shelf (+2.4 dB above ~5 kHz).
  airL.run(ml);
  airR.run(mr);
  ml += airL.hp * 0.3;
  mr += airR.hp * 0.3;

  baseL[i] = ml * MUSIC_GAIN;
  baseR[i] = mr * MUSIC_GAIN;

  stampL[i] = (sfxBus.l[i] + sfxWet.l[i] * 0.55) * SFX_GAIN;
  stampR[i] = (sfxBus.r[i] + sfxWet.r[i] * 0.55) * SFX_GAIN;
}

// Mid/side lift — keeps kick and bass centred, pushes pad/arp/reverb outward.
for (let i = 0; i < LEN; i += 1) {
  const mid = (baseL[i] + baseR[i]) * 0.5;
  const side = (baseL[i] - baseR[i]) * 0.5 * 1.22;
  baseL[i] = mid + side;
  baseR[i] = mid - side;
}
process.stderr.write(`  mix          ${Date.now() - t0}ms\n`);

// ── Normalize ────────────────────────────────────────────────────────────────
function masterAt(gainDb, ceilingDb) {
  const L = new Float32Array(LEN);
  const R = new Float32Array(LEN);
  const g = dbToLin(gainDb);
  for (let i = 0; i < LEN; i += 1) {
    L[i] = baseL[i] * g + stampL[i] * g;
    R[i] = baseR[i] * g + stampR[i] * g;
  }
  limit(L, R, dbToLin(ceilingDb), SR);
  return { L, R };
}

const outDir = path.join(root, 'out');
const stemDir = path.join(outDir, 'audio');
const masterFile = path.join(outDir, 'scas-ai-master.wav');
const tmpFile = path.join(stemDir, '.measure.wav');

if (CHECK) {
  const rawL = new Float32Array(LEN);
  const rawR = new Float32Array(LEN);
  for (let i = 0; i < LEN; i += 1) {
    rawL[i] = baseL[i] + stampL[i];
    rawR[i] = baseR[i] + stampR[i];
  }
  const sfxTypes = [...new Set(SFX.map((c) => c.type))];
  console.log('');
  console.log('SCAS AI — audio check');
  console.log(`  duration      ${(LEN / SR).toFixed(3)} s  (${(LEN / SR) * FPS} frames)`);
  console.log(`  peak          ${linToDb(peakOf(rawL, rawR)).toFixed(2)} dBFS (pre-master)`);
  console.log(`  rms           ${rmsDb(rawL, rawR).toFixed(2)} dBFS (pre-master)`);
  console.log(`  music bus     peak ${linToDb(peakOf(baseL, baseR)).toFixed(2)} dBFS · rms ${rmsDb(baseL, baseR).toFixed(2)} dBFS`);
  console.log(`  sfx bus       peak ${linToDb(peakOf(stampL, stampR)).toFixed(2)} dBFS · rms ${rmsDb(stampL, stampR).toFixed(2)} dBFS`);
  console.log(`  SFX cues      ${SFX.length}`);
  console.log(`  typing ticks  ${ticks.length}`);
  console.log(`  sections      ${sections.length}`);
  console.log(`  cue types     ${sfxTypes.length} (${sfxTypes.join(', ')})`);
  console.log('');
  const busStats = [
    ['drums', music.drums],
    ['bass', music.bass],
    ['pad', music.pad],
    ['arp', music.arp],
    ['lead', music.lead],
    ['sub', music.sub],
    ['sfx', sfxBus],
  ];
  for (const [name, b] of busStats) {
    console.log(
      `  ${name.padEnd(6)} peak ${linToDb(peakOf(b.l, b.r)).toFixed(1).padStart(6)} dBFS   rms ${rmsDb(b.l, b.r).toFixed(1).padStart(6)} dBFS`,
    );
  }
  console.log('');
  const missing = [...new Set(SFX.map((c) => c.type))].filter((t) => !SFX_TYPES.includes(t));
  if (missing.length) console.log(`  MISSING RECIPES: ${missing.join(', ')}`);
  process.exit(0);
}

fs.mkdirSync(stemDir, { recursive: true });

let gainDb = 6;
let ceilingDb = -1.5;
let result = null;
let measured = null;

for (let it = 0; it < 6; it += 1) {
  const { L, R } = masterAt(gainDb, ceilingDb);
  writeWav(tmpFile, L, R, SR);
  const m = measureLoudness(tmpFile);
  if (!m) {
    process.stderr.write('  ! ffmpeg loudnorm unavailable, falling back to sample-peak normalize\n');
    measured = null;
    result = { L, R };
    break;
  }
  const lufsErr = TARGET_LUFS - m.inputI;
  const tpOver = m.inputTp - TARGET_TP;
  process.stderr.write(
    `  pass ${it + 1}    ${m.inputI.toFixed(2)} LUFS  ${m.inputTp.toFixed(2)} dBTP  gain ${gainDb.toFixed(2)}dB  ceil ${ceilingDb.toFixed(2)}dB\n`,
  );
  result = { L, R };
  measured = m;
  if (Math.abs(lufsErr) <= 0.08 && tpOver <= 0) break;
  gainDb += lufsErr;
  if (tpOver > 0) ceilingDb -= tpOver + 0.12;
}

if (!measured) {
  // Fallback: normalize sample peak to -1.5 dBFS.
  const p = peakOf(result.L, result.R);
  const g = dbToLin(-1.5) / Math.max(p, 1e-9);
  for (let i = 0; i < LEN; i += 1) {
    result.L[i] *= g;
    result.R[i] *= g;
  }
}

// Final renders.
writeWav(masterFile, result.L, result.R, SR);
const normGain = dbToLin(gainDb);
// Stems keep the master gain but get a safety trim so they never clip in 16-bit
// and sum below the master ceiling.
const stemGain = normGain * dbToLin(-2.2);
const stemMusicL = new Float32Array(LEN);
const stemMusicR = new Float32Array(LEN);
const stemSfxL = new Float32Array(LEN);
const stemSfxR = new Float32Array(LEN);
for (let i = 0; i < LEN; i += 1) {
  stemMusicL[i] = baseL[i] * stemGain;
  stemMusicR[i] = baseR[i] * stemGain;
  stemSfxL[i] = stampL[i] * stemGain;
  stemSfxR[i] = stampR[i] * stemGain;
}
writeWav(path.join(stemDir, 'music.wav'), stemMusicL, stemMusicR, SR);
writeWav(path.join(stemDir, 'sfx.wav'), stemSfxL, stemSfxR, SR);

// Re-measure the actual delivered file (post 16-bit quantization).
const finalMeasure = measureLoudness(masterFile) || measured;
const duration = probeDuration(masterFile) ?? LEN / SR;
const peak = peakOf(result.L, result.R);

const report = {
  file: 'out/scas-ai-master.wav',
  duration: Number(duration.toFixed(3)),
  sampleRate: SR,
  channels: 2,
  bitDepth: 16,
  bpm: MUSIC.bpm,
  key: MUSIC.key,
  bars: BARS,
  barSeconds: bar,
  integratedLufs: finalMeasure ? Number(finalMeasure.inputI.toFixed(2)) : null,
  truePeakDbtp: finalMeasure ? Number(finalMeasure.inputTp.toFixed(2)) : null,
  loudnessRange: finalMeasure ? Number(finalMeasure.inputLra.toFixed(2)) : null,
  samplePeakDbfs: Number(linToDb(peak).toFixed(2)),
  rmsDbfs: Number(rmsDb(result.L, result.R).toFixed(2)),
  targetLufs: TARGET_LUFS,
  targetTruePeak: TARGET_TP,
  normalization: 'ffmpeg loudnorm measurement + in-process look-ahead limiter',
  limiterCeilingDb: Number(ceilingDb.toFixed(2)),
  normalizationGainDb: Number(gainDb.toFixed(2)),
  sfxCueCount: SFX.length,
  typingTickCount: ticks.length,
  cueTypes: cueStats,
  stems: ['out/audio/music.wav', 'out/audio/sfx.wav'],
  stemTrimDb: -2.2,
  stemPeaksDbfs: {
    music: Number(linToDb(peakOf(stemMusicL, stemMusicR)).toFixed(2)),
    sfx: Number(linToDb(peakOf(stemSfxL, stemSfxR)).toFixed(2)),
  },
  sections,
  generatedAt: new Date().toISOString(),
};
fs.writeFileSync(path.join(stemDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
try {
  fs.unlinkSync(tmpFile);
} catch {
  /* noop */
}

console.log('');
console.log(`Wrote ${path.relative(root, masterFile)}`);
console.log(`  ${duration.toFixed(3)}s · ${SR} Hz · stereo · 16-bit`);
console.log(`  ${report.integratedLufs} LUFS · ${report.truePeakDbtp} dBTP · peak ${report.samplePeakDbfs} dBFS · RMS ${report.rmsDbfs} dBFS`);
console.log(`  ${SFX.length} SFX cues · ${ticks.length} typing ticks · ${sections.length} sections`);
console.log(`  stems: out/audio/music.wav · out/audio/sfx.wav`);
console.log(`  report: out/audio/report.json`);
