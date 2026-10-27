// ─────────────────────────────────────────────────────────────────────────────
// Score builder — 44 bars @ 120 BPM in A minor, derived from cues.MUSIC.
// Bar N covers [N*2s, N*2s + 2s). cues.MUSIC startBar/endBar are 1-indexed and
// inclusive, so bar 1..3 === 0..6s. See SECTION_MAP below.
// ─────────────────────────────────────────────────────────────────────────────

import { TAU, mtof, noise, Svf, Bus } from './dsp.mjs';

export const BAR_SECONDS = 2;
export const BARS = 44;

// 0-indexed bar ranges, inclusive.
export const SECTION_MAP = [
  { name: 'intro', from: 0, to: 2, note: 'filtered pad, sub pulse, ticks' },
  { name: 'tension', from: 3, to: 5, note: 'arp enters, reverse riser' },
  { name: 'drop-1', from: 6, to: 8, note: 'kick, bass, clap, hats' },
  { name: 'groove-a', from: 9, to: 11, note: 'full groove' },
  { name: 'knowledge', from: 12, to: 14, note: 'pluck + data ticks' },
  { name: 'guardrails', from: 15, to: 17, note: 'build, filter sweep' },
  { name: 'portal-breakdown', from: 18, to: 22, note: 'kick out, warm pad, soft ticks' },
  { name: 'chat-groove', from: 23, to: 26, note: 'kick returns, tight bass' },
  { name: 'peak-a', from: 27, to: 30, note: 'peak energy' },
  { name: 'peak-b', from: 31, to: 33, note: 'peak with counter-melody' },
  { name: 'trust-tension', from: 34, to: 36, note: 'strip to pulse + riser' },
  { name: 'audit', from: 37, to: 39, note: 'build' },
  { name: 'finale', from: 40, to: 43, note: 'impact, shimmer, tail' },
];

function sectionOf(bar) {
  for (const s of SECTION_MAP) if (bar >= s.from && bar <= s.to) return s;
  return SECTION_MAP[SECTION_MAP.length - 1];
}

// ── Harmony ──────────────────────────────────────────────────────────────────
const CHORDS = {
  Am: { root: 33, notes: [57, 60, 64] }, // A1 | A3 C4 E4
  Am7: { root: 33, notes: [57, 60, 64, 67] },
  Am9: { root: 33, notes: [57, 60, 64, 67, 71] },
  F: { root: 29, notes: [53, 57, 60] }, // F1 | F3 A3 C4
  Fmaj7: { root: 29, notes: [53, 57, 60, 64] },
  C: { root: 36, notes: [60, 64, 67] }, // C2 | C4 E4 G4
  Cmaj7: { root: 36, notes: [60, 64, 67, 71] },
  G: { root: 31, notes: [55, 59, 62] }, // G1 | G3 B3 D4
  E: { root: 28, notes: [52, 56, 59] }, // E1 | E3 G#3 B3
};

const CYCLE = ['Am', 'F', 'C', 'G'];
const CHORD_NAMES = new Array(BARS);
for (let b = 0; b < BARS; b += 1) CHORD_NAMES[b] = CYCLE[b % 4];
const OVERRIDE = {
  18: 'Am7',
  19: 'Fmaj7',
  20: 'Cmaj7',
  21: 'G',
  22: 'Fmaj7',
  23: 'Am',
  24: 'F',
  25: 'C',
  26: 'G',
  31: 'Am',
  32: 'F',
  33: 'G',
  34: 'Am',
  35: 'F',
  36: 'G',
  37: 'Am',
  38: 'F',
  39: 'E',
  40: 'Am9',
  41: 'Am9',
  42: 'Fmaj7',
  43: 'Am9',
};
for (const [k, v] of Object.entries(OVERRIDE)) CHORD_NAMES[Number(k)] = v;

// ── Arrangement parameters ───────────────────────────────────────────────────
const PARAMS = {
  intro: {
    kick: 'none', clap: 0, hats: 'none', bass: 'none', arp: 0,
    pad: 0.5, padCut: 900, padAttack: 1.2, padRelease: 0.8, lead: 0,
    subPulse: 0.55, subHit: 0,
  },
  tension: {
    kick: 'none', clap: 0, hats: 'sparse', bass: 'none', arp: 0.5,
    pad: 0.42, padCut: 1400, padAttack: 0.6, padRelease: 0.5, lead: 0,
    subPulse: 0.4, subHit: 0,
  },
  'drop-1': {
    kick: 'four', clap: 1, hats: '16', bass: '8', arp: 0.62,
    pad: 0.4, padCut: 2400, padAttack: 0.12, padRelease: 0.4, lead: 0,
    subPulse: 0, subHit: 0,
  },
  'groove-a': {
    kick: 'four', clap: 1, hats: '16', bass: '8', arp: 0.75,
    pad: 0.4, padCut: 2800, padAttack: 0.1, padRelease: 0.35, lead: 0,
    subPulse: 0, subHit: 0,
  },
  knowledge: {
    kick: 'four', clap: 1, hats: '16', bass: '16', arp: 0.95,
    pad: 0.34, padCut: 3200, padAttack: 0.08, padRelease: 0.3, lead: 0,
    subPulse: 0, subHit: 0,
  },
  guardrails: {
    kick: 'four', clap: 1, hats: '16', bass: '8', arp: 0.7,
    pad: 0.4, padCut: 2000, padAttack: 0.1, padRelease: 0.3, lead: 0,
    subPulse: 0, subHit: 0,
  },
  'portal-breakdown': {
    kick: 'half', clap: 0, hats: 'none', bass: 'none', arp: 0.4,
    pad: 0.72, padCut: 1100, padAttack: 0.9, padRelease: 1.0, lead: 1,
    subPulse: 0.5, subHit: 0,
  },
  'chat-groove': {
    kick: 'four', clap: 1, hats: '16', bass: 'tight', arp: 0.72,
    pad: 0.4, padCut: 2600, padAttack: 0.08, padRelease: 0.3, lead: 0,
    subPulse: 0, subHit: 0,
  },
  'peak-a': {
    kick: 'four+', clap: 1, hats: '16o', bass: '8', arp: 0.88,
    pad: 0.44, padCut: 3400, padAttack: 0.06, padRelease: 0.28, lead: 0.45,
    subPulse: 0, subHit: 0,
  },
  'peak-b': {
    kick: 'four+', clap: 1, hats: '16o', bass: '8', arp: 0.82,
    pad: 0.44, padCut: 3600, padAttack: 0.06, padRelease: 0.28, lead: 1,
    subPulse: 0, subHit: 0,
  },
  'trust-tension': {
    kick: 'none', clap: 0, hats: 'sparse', bass: 'none', arp: 0.3,
    pad: 0.5, padCut: 900, padAttack: 0.7, padRelease: 0.6, lead: 0,
    subPulse: 0.5, subHit: 0,
  },
  audit: {
    kick: 'build', clap: 'roll', hats: '16', bass: '8', arp: 0.78,
    pad: 0.4, padCut: 1800, padAttack: 0.1, padRelease: 0.3, lead: 0,
    subPulse: 0, subHit: 0,
  },
  finale: {
    kick: 'heart', clap: 0, hats: 'none', bass: 'none', arp: 0.3,
    pad: 0.8, padCut: 2200, padAttack: 1.4, padRelease: 1.6, lead: 0,
    subPulse: 0, subHit: 0,
  },
};

const HAT_VEL = [1, 0.22, 0.5, 0.28, 0.85, 0.24, 0.55, 0.3, 1, 0.2, 0.48, 0.34, 0.8, 0.26, 0.6, 0.38];
const ARP_STEPS = [0, 1, 2, 3, 4, 5, 4, 3, 2, 3, 4, 5, 4, 3, 2, 1];

const BASS_8 = { steps: [0, 1, 2, 3, 4, 5, 6, 7], offs: [0, 0, 0, 0, 0, 0, 12, 0] };
const BASS_16 = {
  steps: [0, 2, 3, 5, 6, 8, 10, 11, 13, 14],
  offs: [0, 0, 0, 0, 0, 0, 12, 0, 0, 12],
};
const BASS_TIGHT = {
  steps: [0, 2, 4, 6, 8, 10, 12, 14, 15],
  offs: [0, 0, 0, 0, 0, 0, 12, 0, 0],
};

// ── Instruments ──────────────────────────────────────────────────────────────
function kick(bus, t0, { gain = 1, depth = 1, rev = 0, revBus, tune = 1 } = {}) {
  const sr = bus.sr;
  let ph = 0;
  bus.add(
    t0,
    0.52,
    (t) => {
      const f = (44 + 178 * Math.exp(-t * 34)) * tune;
      ph += (TAU * f) / sr;
      const body = Math.sin(ph) * Math.exp(-t * 6.2 * depth);
      const click =
        (Math.sin(TAU * 1750 * t) * 0.45 + Math.sin(TAU * 3300 * t) * 0.28) * Math.exp(-t * 320);
      return Math.tanh((body * 1.7 + click * 0.4) * 1.15) * 0.92;
    },
    { gain, pan: 0, rev, revBus },
  );
}

function clap(bus, t0, { gain = 1, rnd, rev = 0.15, revBus, wide = 0 } = {}) {
  const bp = new Svf(bus.sr).set(1550, 1.1);
  const hp = new Svf(bus.sr).set(600, 0.7);
  const bursts = [0, 0.008, 0.017, 0.026];
  bus.add(
    t0,
    0.24,
    (t) => {
      let env = 0;
      for (let i = 0; i < bursts.length; i += 1) {
        const d = t - bursts[i];
        if (d >= 0) env += Math.exp(-d * 165);
      }
      env += Math.exp(-t * 15) * 0.5;
      const n = hp.run(rnd());
      bp.run(n);
      const tone = Math.sin(TAU * 1900 * t) * 0.2;
      return (bp.bp * 1.5 + tone) * env;
    },
    { gain, pan: 0.05 + wide, rev, revBus },
  );
}

function hat(bus, t0, { gain = 1, open = false, pan = 0.28, rnd, rev = 0.05, revBus } = {}) {
  const f = new Svf(bus.sr).set(open ? 7000 : 8400, 0.85);
  bus.add(
    t0,
    open ? 0.26 : 0.07,
    (t) => {
      f.run(rnd());
      return f.hp * Math.exp(-t * (open ? 17 : 72));
    },
    { gain, pan, rev, revBus },
  );
}

function bassNote(bus, t0, midiNote, dur, { gain = 1, cutoff = 420, rev = 0, revBus } = {}) {
  const sr = bus.sr;
  const f = mtof(midiNote);
  const lp = new Svf(sr);
  let ph = 0;
  let ph2 = 0;
  let n = 0;
  bus.add(
    t0,
    dur + 0.06,
    (t) => {
      if ((n++ & 15) === 0) lp.set(cutoff * (1 + 2.2 * Math.exp(-t * 16)), 1.2);
      ph += (TAU * f) / sr;
      ph2 += (TAU * f * 2.004) / sr;
      const saw = 2 * ((ph / TAU) % 1) - 1;
      const sub = Math.sin(ph);
      const x = saw * 0.5 + sub * 0.7 + Math.sin(ph2) * 0.12;
      lp.run(x);
      const env = Math.min(1, t / 0.005) * Math.exp(-t * 2.6);
      const tail = t > dur ? Math.max(0, 1 - (t - dur) / 0.06) : 1;
      return Math.tanh(lp.lp * 1.25) * env * tail;
    },
    { gain, pan: 0, rev, revBus },
  );
}

function pluck(bus, t0, midiNote, { gain = 1, pan = 0, cutoff = 2600, rev = 0.12, revBus } = {}) {
  const sr = bus.sr;
  const f = mtof(midiNote);
  const lp = new Svf(sr).set(cutoff, 1.3);
  let ph = 0;
  bus.add(
    t0,
    0.34,
    (t) => {
      ph += (TAU * f) / sr;
      const saw = 2 * ((ph / TAU) % 1) - 1;
      const x = Math.sin(ph) * 0.72 + saw * 0.38;
      lp.run(x);
      const env = Math.min(1, t / 0.002) * Math.exp(-t * 15);
      return lp.lp * env;
    },
    { gain, pan, rev, revBus },
  );
}

function padNote(bus, t0, midiNote, dur, o) {
  const { gain = 0.1, cutoff = 1600, attack = 0.4, release = 0.5, pan = 0, rev = 0.5, revBus, seed = 1 } = o;
  const sr = bus.sr;
  const f = mtof(midiNote);
  const lp = new Svf(sr).set(cutoff, 0.85);
  const det = [-0.0048, 0, 0.0051];
  const ph = [0.11 + (seed % 7) * 0.03, 0.47, 0.79];
  const lfoRate = 0.06 + (seed % 5) * 0.017;
  let n = 0;
  bus.add(
    t0,
    dur + release,
    (t) => {
      if ((n++ & 63) === 0) lp.set(cutoff * (1 + 0.16 * Math.sin(TAU * lfoRate * t)), 0.85);
      let x = 0;
      for (let k = 0; k < 3; k += 1) {
        ph[k] += (TAU * f * (1 + det[k])) / sr;
        x += 2 * ((ph[k] / TAU) % 1) - 1;
      }
      x *= 0.33;
      lp.run(x);
      const a = Math.min(1, t / Math.max(attack, 0.001));
      const rel = t < dur ? 1 : Math.max(0, 1 - (t - dur) / release);
      return lp.lp * a * rel;
    },
    { gain, pan, rev, revBus },
  );
}

function leadNote(bus, t0, midiNote, dur, { gain = 1, pan = 0, rev = 0.3, revBus } = {}) {
  const sr = bus.sr;
  const f = mtof(midiNote);
  const lp = new Svf(sr).set(3400, 0.9);
  let ph = 0;
  bus.add(
    t0,
    dur + 0.3,
    (t) => {
      const vib = Math.sin(TAU * 5.1 * t) * 0.0035 * Math.min(1, t / 0.15);
      ph += (TAU * f * (1 + vib)) / sr;
      const tri = (2 / Math.PI) * Math.asin(Math.sin(ph));
      const x = tri * 0.72 + Math.sin(ph * 2) * 0.14;
      lp.run(x);
      const env = Math.min(1, t / 0.018) * Math.exp(-t * 0.9);
      const tail = t > dur ? Math.max(0, 1 - (t - dur) / 0.3) : 1;
      return lp.lp * env * tail;
    },
    { gain, pan, rev, revBus },
  );
}

function subPulse(bus, t0, midiNote, { gain = 0.5, dur = 0.5 } = {}) {
  const sr = bus.sr;
  const f = mtof(midiNote);
  let ph = 0;
  bus.add(
    t0,
    dur,
    (t) => {
      ph += (TAU * f) / sr;
      return Math.sin(ph) * Math.min(1, t / 0.012) * Math.exp(-t * 3.4);
    },
    { gain, pan: 0 },
  );
}

// Sub boom for cuts. Fades in over 2ms so frame 0 never clicks.
function subImpact(bus, t0, { gain = 0.7, len = 1.7, rev = 0.1, revBus } = {}) {
  const sr = bus.sr;
  let ph = 0;
  bus.add(
    t0,
    len,
    (t) => {
      const f = 32 + 118 * Math.exp(-t * 5.2);
      ph += (TAU * f) / sr;
      const body = Math.sin(ph) * Math.exp(-t * 2.3) * Math.min(1, t / 0.004);
      const grit = Math.sin(TAU * 78 * t) * Math.exp(-t * 9) * 0.12;
      return body + grit;
    },
    { gain, pan: 0, rev, revBus },
  );
}

// Reverse riser: energy peaks exactly at t0 + dur (the cut).
export function riser(bus, t0, dur, { gain = 0.5, rev = 0.35, revBus, seed = 7, endHz = 9000 } = {}) {
  const sr = bus.sr;
  const bp = new Svf(sr);
  const rnd = noise(seed);
  let ph = 0;
  bus.add(
    t0,
    dur,
    (t, i) => {
      const p = Math.min(1, t / dur);
      if ((i & 31) === 0) bp.set(280 * (endHz / 280) ** p, 2.4);
      const n = rnd();
      bp.run(n);
      ph += (TAU * 110 * 2 ** (p * 2.7)) / sr;
      const env = p ** 2.3;
      return (bp.bp * 1.1 + Math.sin(ph) * 0.1) * env;
    },
    { gain, pan: 0, rev, revBus },
  );
}

// Short uplift before a cut (no pitch sweep, just filtered air).
function swell(bus, t0, dur, { gain = 0.18, rev = 0.3, revBus, seed = 3 } = {}) {
  const sr = bus.sr;
  const bp = new Svf(sr);
  const rnd = noise(seed);
  bus.add(
    t0,
    dur,
    (t, i) => {
      const p = Math.min(1, t / dur);
      if ((i & 31) === 0) bp.set(400 * (5200 / 400) ** p, 1.8);
      bp.run(rnd());
      return bp.bp * p ** 2;
    },
    { gain, pan: 0, rev, revBus },
  );
}

function airBed(bus, t0, dur, { gain = 0.05, seed = 11 } = {}) {
  const sr = bus.sr;
  const hp = new Svf(sr).set(3200, 0.7);
  const rnd = noise(seed);
  bus.add(
    t0,
    dur,
    (t) => {
      hp.run(rnd());
      const env = Math.min(1, t / 1.5) * Math.min(1, (dur - t) / 1.5);
      return hp.hp * env;
    },
    { gain, pan: 0, rev: 0.4 },
  );
}

// ── Score ────────────────────────────────────────────────────────────────────
export function buildMusic({ sr, len }) {
  const bus = {
    drums: new Bus(sr, len),
    bass: new Bus(sr, len),
    pad: new Bus(sr, len),
    arp: new Bus(sr, len),
    lead: new Bus(sr, len),
    sub: new Bus(sr, len),
    rev: new Bus(sr, len),
  };
  const kicks = [];
  const marks = [];

  const barDur = BAR_SECONDS;

  for (let bar = 0; bar < BARS; bar += 1) {
    const t0 = bar * barDur;
    const sec = sectionOf(bar);
    const p = PARAMS[sec.name];
    const ch = CHORDS[CHORD_NAMES[bar]];
    const notes = ch.notes;
    const pool = [...notes, ...notes.map((n) => n + 12)];
    const seedBase = bar * 977 + 13;

    // ── pad ────────────────────────────────────────────────────────────────
    const padCut =
      bar <= 2
        ? 380 * (900 / 380) ** (bar / 3)
        : bar >= 15 && bar <= 17
          ? 700 * (3600 / 700) ** ((bar - 15) / 3)
          : bar >= 37 && bar <= 39
            ? 800 * (5000 / 800) ** ((bar - 37) / 3)
            : p.padCut;
    for (let i = 0; i < notes.length; i += 1) {
      padNote(bus.pad, t0, notes[i], barDur, {
        gain: p.pad / Math.max(2, notes.length) * 1.9,
        cutoff: padCut,
        attack: p.padAttack,
        release: p.padRelease,
        pan: i % 2 === 0 ? -0.46 : 0.46,
        rev: 0.55,
        revBus: bus.rev,
        seed: seedBase + i,
      });
    }
    // Root an octave down for weight.
    padNote(bus.pad, t0, ch.root + 12, barDur, {
      gain: p.pad * 0.3,
      cutoff: Math.max(260, padCut * 0.5),
      attack: p.padAttack,
      release: p.padRelease,
      pan: 0,
      rev: 0.35,
      revBus: bus.rev,
      seed: seedBase + 9,
    });

    // ── sub pulse (intro / breakdown / trust) ──────────────────────────────
    if (p.subPulse > 0) {
      const every = sec.name === 'trust-tension' ? 2 : 1;
      for (let b = 0; b < 4; b += every) {
        subPulse(bus.sub, t0 + b * 0.5, ch.root, {
          gain: p.subPulse * (b === 0 ? 1 : 0.72),
          dur: 0.62,
        });
      }
    }

    // ── kick ───────────────────────────────────────────────────────────────
    const k = (t, g = 1) => {
      kick(bus.drums, t, { gain: g, rev: 0.06, revBus: bus.rev, depth: sec.name === 'drop-1' ? 1.05 : 1 });
      kicks.push(t);
    };
    if (p.kick === 'four' || p.kick === 'four+') {
      for (let b = 0; b < 4; b += 1) k(t0 + b * 0.5, 0.92);
      if (p.kick === 'four+') {
        k(t0 + 3.75, 0.28); // ghost before the bar turn
      }
    } else if (p.kick === 'half') {
      k(t0, 0.4);
      if (bar !== 18 && bar !== 22) k(t0 + 1.0, 0.26);
    } else if (p.kick === 'build') {
      for (let b = 0; b < 4; b += 1) k(t0 + b * 0.5, 0.62 + b * 0.06);
    } else if (p.kick === 'heart') {
      if (bar === 40) {
        k(t0, 1.0);
        k(t0 + 0.375, 0.5);
      } else if (bar === 41) {
        k(t0, 0.55);
        k(t0 + 1.0, 0.28);
      } else if (bar === 42) {
        k(t0, 0.3);
      }
    }

    // ── clap / roll ────────────────────────────────────────────────────────
    if (p.clap === 1) {
      const rndA = noise(seedBase + 101);
      const rndB = noise(seedBase + 202);
      clap(bus.drums, t0 + 0.5, { gain: 0.5, rnd: rndA, rev: 0.18, revBus: bus.rev });
      clap(bus.drums, t0 + 1.5, { gain: 0.54, rnd: rndB, rev: 0.18, revBus: bus.rev, wide: -0.04 });
    } else if (p.clap === 'roll') {
      const rnd = noise(seedBase + 303);
      const div = bar === 37 ? 2 : bar === 38 ? 4 : 8;
      const step = 0.5 / div;
      for (let i = 0; i < div * 4; i += 1) {
        const tt = t0 + i * step;
        if (bar === 39 && tt >= 79.75) break;
        clap(bus.drums, tt, { gain: 0.12 + 0.05 * (i / (div * 4)) + (i % 4 === 0 ? 0.06 : 0), rnd, rev: 0.1, revBus: bus.rev });
      }
    }

    // ── hats ───────────────────────────────────────────────────────────────
    if (p.hats === '16' || p.hats === '16o') {
      const rnd = noise(seedBase + 404);
      for (let s = 0; s < 16; s += 1) {
        const vel = HAT_VEL[s];
        const jitter = (((seedBase + s * 37) % 11) - 5) * 0.0004;
        hat(bus.drums, t0 + s * 0.125 + jitter, {
          gain: 0.088 * vel,
          pan: s % 2 ? 0.52 : -0.5,
          rnd,
          rev: 0.04,
          revBus: bus.rev,
        });
        if (p.hats === '16o' && (s === 2 || s === 6 || s === 10 || s === 14)) {
          hat(bus.drums, t0 + s * 0.125, { gain: 0.072, open: true, pan: 0.46, rnd, rev: 0.1, revBus: bus.rev });
        }
      }
    } else if (p.hats === 'sparse') {
      const rnd = noise(seedBase + 505);
      for (const s of [2, 6, 10, 14]) {
        hat(bus.drums, t0 + s * 0.125, { gain: 0.05, pan: 0.42, rnd, rev: 0.05, revBus: bus.rev });
      }
    }

    // ── bass ───────────────────────────────────────────────────────────────
    if (p.bass !== 'none') {
      const pat = p.bass === '8' ? BASS_8 : p.bass === '16' ? BASS_16 : BASS_TIGHT;
      const stepDur = p.bass === '8' ? 0.25 : 0.125;
      const noteDur = p.bass === '8' ? 0.2 : 0.095;
      const cut = bar >= 15 && bar <= 17 ? 520 * (1600 / 520) ** ((bar - 15) / 3) : 480;
      for (let i = 0; i < pat.steps.length; i += 1) {
        const tt = t0 + pat.steps[i] * stepDur;
        if (tt >= 79.75) continue;
        bassNote(bus.bass, tt, ch.root + pat.offs[i], noteDur, {
          gain: 0.95,
          cutoff: cut,
          rev: 0.03,
          revBus: bus.rev,
        });
      }
    }

    // ── arp ────────────────────────────────────────────────────────────────
    if (p.arp > 0) {
      const arpCut =
        bar >= 15 && bar <= 17
          ? 900 * (7200 / 900) ** ((bar - 15) / 3)
          : bar >= 37 && bar <= 39
            ? 1100 * (9000 / 1100) ** ((bar - 37) / 3)
            : 2200 + p.arp * 3000;
      for (let s = 0; s < 16; s += 1) {
        const tt = t0 + s * 0.125;
        if (tt >= 79.75) continue;
        if (sec.name === 'portal-breakdown' && s % 2 === 1) continue; // half-time in the breakdown
        const idx = ARP_STEPS[s] % pool.length;
        const accent = s % 4 === 0 ? 1.25 : 1;
        pluck(bus.arp, tt, pool[idx], {
          gain: 0.5 * p.arp * accent,
          pan: s % 2 ? 0.58 : -0.56,
          cutoff: Math.min(9000, arpCut * (1 + s / 26)),
          rev: 0.16,
          revBus: bus.rev,
        });
      }
    }

    // ── counter-melody ─────────────────────────────────────────────────────
    if (p.lead > 0 && (sec.name === 'portal-breakdown' || sec.name === 'peak-b')) {
      const motif =
        sec.name === 'portal-breakdown'
          ? bar === 19 || bar === 20
            ? MOTIF_A
            : bar === 21 || bar === 22
              ? MOTIF_B
              : null
          : bar === 31 || bar === 32
            ? MOTIF_A
            : bar === 33
              ? MOTIF_B
              : null;
      if (motif) {
        for (const [beat, dur, midi] of motif) {
          leadNote(bus.lead, t0 + beat * 0.5, midi, dur * 0.5, {
            gain: 0.26 * p.lead,
            pan: 0.06,
            rev: 0.42,
            revBus: bus.rev,
          });
          // third-below harmony in the peak
          if (sec.name === 'peak-b') {
            leadNote(bus.lead, t0 + beat * 0.5, midi - 3, dur * 0.5, {
              gain: 0.09 * p.lead,
              pan: -0.22,
              rev: 0.42,
              revBus: bus.rev,
            });
          }
        }
      }
    }
  }

  // ── transitions ────────────────────────────────────────────────────────────
  // Reverse risers into the three structural cuts (12s, 36s, 80s).
  riser(bus.pad, 8.0, 4.0, { gain: 0.3, seed: 101, revBus: bus.rev });
  riser(bus.pad, 33.0, 3.0, { gain: 0.24, seed: 202, revBus: bus.rev });
  riser(bus.pad, 76.0, 4.0, { gain: 0.34, seed: 303, endHz: 11000, revBus: bus.rev });

  // Small reverse swells into every other bar-grid cut.
  const cuts = [6, 18, 24, 30, 46, 54, 62, 68, 74];
  let si = 400;
  for (const c of cuts) {
    swell(bus.pad, c - 0.9, 0.9, { gain: 0.1, seed: si++, revBus: bus.rev });
  }

  // Sub hits on cuts.
  const hits = [
    [12, 0.42],
    [24, 0.22],
    [36, 0.5],
    [46, 0.3],
    [54, 0.24],
    [62, 0.3],
    [68, 0.22],
    [74, 0.26],
    [80, 0.72],
  ];
  for (const [t, g] of hits) subImpact(bus.sub, t, { gain: g, rev: 0.08, revBus: bus.rev });

  // Intro air bed + a final room tone for the tail.
  airBed(bus.pad, 0.2, 6.0, { gain: 0.05, seed: 909 });

  // ── cut-out 0.2s before the finale impact ─────────────────────────────────
  marks.push({ t: 79.8, kind: 'music-cut' });

  return { ...bus, kicks, marks, sections: SECTION_MAP, chords: CHORD_NAMES };
}

const MOTIF_A = [
  [0, 3, 76],
  [1.5, 1, 74],
  [2, 2, 72],
  [3, 2, 69],
  [4, 3, 72],
  [5.5, 1, 74],
  [6, 4, 76],
];

const MOTIF_B = [
  [0, 2, 79],
  [1, 2, 76],
  [2, 3, 74],
  [3.5, 1, 72],
  [4, 2, 69],
  [5, 2, 72],
  [6, 3, 74],
  [7.5, 1, 72],
];
