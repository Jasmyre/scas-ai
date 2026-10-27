// ─────────────────────────────────────────────────────────────────────────────
// Deterministic DSP primitives for the SCAS AI launch score.
// Everything here is hand-written: no samples, no dependencies, seeded noise.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

export const TAU = Math.PI * 2;
export const SR = 48000;
export const FFMPEG = process.env.FFMPEG || 'ffmpeg';
export const FFPROBE = process.env.FFPROBE || 'ffprobe';

export const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
export const dbToLin = (db) => 10 ** (db / 20);
export const linToDb = (x) => 20 * Math.log10(Math.max(Math.abs(x), 1e-12));

// mulberry32 — tiny, fast, fully deterministic.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function noise(seed) {
  const r = mulberry32(seed >>> 0);
  return () => r() * 2 - 1;
}

// ── Bus ──────────────────────────────────────────────────────────────────────
// A stereo float bus with an optional reverb send.
export class Bus {
  constructor(sr, len) {
    this.sr = sr;
    this.len = len;
    this.l = new Float32Array(len);
    this.r = new Float32Array(len);
  }

  add(t0, dur, fn, o = {}) {
    const { gain = 1, pan = 0, rev = 0, revBus = null } = o;
    const start = Math.round(t0 * this.sr);
    const n = Math.round(dur * this.sr);
    if (n <= 0 || start >= this.len) return;
    const a = ((Math.max(-1, Math.min(1, pan)) + 1) * Math.PI) / 4;
    const gl = Math.cos(a);
    const gr = Math.sin(a);
    const sr = this.sr;
    for (let i = 0; i < n; i += 1) {
      const idx = start + i;
      if (idx >= this.len) break;
      if (idx < 0) continue;
      const s = fn(i / sr, i) * gain;
      const sl = s * gl;
      const sr2 = s * gr;
      this.l[idx] += sl;
      this.r[idx] += sr2;
      if (revBus && rev > 0) {
        revBus.l[idx] += sl * rev;
        revBus.r[idx] += sr2 * rev;
      }
    }
  }

  // Independent L/R generator (already stereo).
  addLR(t0, dur, fnL, fnR, o = {}) {
    const { gain = 1, rev = 0, revBus = null } = o;
    const start = Math.round(t0 * this.sr);
    const n = Math.round(dur * this.sr);
    if (n <= 0 || start >= this.len) return;
    const sr = this.sr;
    for (let i = 0; i < n; i += 1) {
      const idx = start + i;
      if (idx >= this.len) break;
      if (idx < 0) continue;
      const t = i / sr;
      const sl = fnL(t, i) * gain;
      const sr2 = fnR(t, i) * gain;
      this.l[idx] += sl;
      this.r[idx] += sr2;
      if (revBus && rev > 0) {
        revBus.l[idx] += sl * rev;
        revBus.r[idx] += sr2 * rev;
      }
    }
  }
}

// ── Filters ──────────────────────────────────────────────────────────────────
// Cytomic-style state variable filter (TPT). One `set()` per block is enough.
export class Svf {
  constructor(sr) {
    this.sr = sr;
    this.ic1 = 0;
    this.ic2 = 0;
    this.lp = 0;
    this.bp = 0;
    this.hp = 0;
    this.k = 1;
  }

  set(fc, q = 0.7071) {
    const f = Math.min(Math.max(fc, 8), this.sr * 0.45);
    const g = Math.tan((Math.PI * f) / this.sr);
    const k = 1 / Math.max(q, 0.05);
    this.a1 = 1 / (1 + g * (g + k));
    this.a2 = g * this.a1;
    this.a3 = g * this.a2;
    this.k = k;
    return this;
  }

  run(x) {
    const v3 = x - this.ic2;
    const v1 = this.a1 * this.ic1 + this.a2 * v3;
    const v2 = this.ic2 + this.a2 * this.ic1 + this.a3 * v3;
    this.ic1 = 2 * v1 - this.ic1;
    this.ic2 = 2 * v2 - this.ic2;
    this.lp = v2;
    this.bp = v1;
    this.hp = x - this.k * v1 - v2;
    return v2;
  }
}

export class OnePole {
  constructor(sr, hz) {
    this.a = Math.exp((-TAU * hz) / sr);
    this.y = 0;
  }
  run(x) {
    this.y = x * (1 - this.a) + this.y * this.a;
    return this.y;
  }
}

// ── Utility envelopes ────────────────────────────────────────────────────────
export const expEnv = (t, k) => Math.exp(-t * k);
export const clip = (t, a, b) => Math.min(b, Math.max(a, t));
export const smoothstep = (t) => {
  const x = clip(t, 0, 1);
  return x * x * (3 - 2 * x);
};

// ── Limiter ──────────────────────────────────────────────────────────────────
function minFilter(a, win) {
  const n = a.length;
  const out = new Float32Array(n);
  const dq = new Int32Array(n);
  let head = 0;
  let tail = 0;
  for (let j = 0; j < n; j += 1) {
    const i = n - 1 - j;
    while (tail > head && a[dq[tail - 1]] >= a[i]) tail -= 1;
    dq[tail] = i;
    tail += 1;
    while (dq[head] > i + win) head += 1;
    out[i] = a[dq[head]];
  }
  return out;
}

// Look-ahead brickwall at base rate. The forward-window minimum guarantees the
// gain is already down before a transient arrives; release is one-pole.
export function limit(L, R, ceiling, sr, releaseSec = 0.09) {
  const n = L.length;
  const win = Math.max(1, Math.round(0.005 * sr));
  const need = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    const p = Math.max(Math.abs(L[i]), Math.abs(R[i]));
    need[i] = p > ceiling ? ceiling / p : 1;
  }
  const fwd = minFilter(need, win);
  const rel = 1 - Math.exp(-1 / (releaseSec * sr));
  let g = 1;
  for (let i = 0; i < n; i += 1) {
    const target = fwd[i];
    if (target < g) g = target;
    else g = Math.min(target, g + (1 - g) * rel);
    L[i] *= g;
    R[i] *= g;
  }
  for (let i = 0; i < n; i += 1) {
    if (L[i] > ceiling) L[i] = ceiling;
    else if (L[i] < -ceiling) L[i] = -ceiling;
    if (R[i] > ceiling) R[i] = ceiling;
    else if (R[i] < -ceiling) R[i] = -ceiling;
  }
}

// ── Reverb (Freeverb-lite: 8 combs + 4 allpasses per channel) ────────────────
export function reverb(inBus, { decay = 0.855, damp = 0.28, scale = 1 } = {}) {
  const { sr, len } = inBus;
  const out = new Bus(sr, len);
  const combT = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const apT = [556, 441, 341, 225];
  const mk = (t, spread) => Math.max(1, Math.round(((t + spread) * scale * sr) / 44100));

  for (const [ch, spread] of [
    [0, 0],
    [1, 23],
  ]) {
    const src = ch === 0 ? inBus.l : inBus.r;
    const dst = ch === 0 ? out.l : out.r;
    const combs = combT.map((t) => ({ buf: new Float32Array(mk(t, spread)), i: 0, s: 0 }));
    const aps = apT.map((t) => ({ buf: new Float32Array(mk(t, spread)), i: 0 }));
    const fb = decay;
    const d1 = damp;
    const d2 = 1 - damp;

    for (let n = 0; n < len; n += 1) {
      const x = src[n] * 0.018;
      let y = 0;
      for (let c = 0; c < combs.length; c += 1) {
        const cm = combs[c];
        const o = cm.buf[cm.i];
        cm.s = o * d2 + cm.s * d1;
        cm.buf[cm.i] = x + cm.s * fb;
        cm.i += 1;
        if (cm.i >= cm.buf.length) cm.i = 0;
        y += o;
      }
      for (let a = 0; a < aps.length; a += 1) {
        const ap = aps[a];
        const b = ap.buf[ap.i];
        ap.buf[ap.i] = y + b * 0.5;
        ap.i += 1;
        if (ap.i >= ap.buf.length) ap.i = 0;
        y = b - y;
      }
      dst[n] = y;
    }
  }
  return out;
}

// Ping-pong delay with damped feedback.
export function pingPong(inBus, { time = 0.25, feedback = 0.36, mix = 0.45, dampHz = 5200 } = {}) {
  const { sr, len } = inBus;
  const d = Math.max(1, Math.round(time * sr));
  const bl = new Float32Array(d);
  const br = new Float32Array(d);
  let il = 0;
  let ir = 0;
  const lpL = new OnePole(sr, dampHz);
  const lpR = new OnePole(sr, dampHz);
  const out = new Bus(sr, len);
  for (let n = 0; n < len; n += 1) {
    const dl = bl[il];
    const dr = br[ir];
    bl[il] = inBus.l[n] + lpR.run(dr) * feedback;
    br[ir] = inBus.r[n] + lpL.run(dl) * feedback;
    il += 1;
    if (il >= d) il = 0;
    ir += 1;
    if (ir >= d) ir = 0;
    out.l[n] = inBus.l[n] + dl * mix;
    out.r[n] = inBus.r[n] + dr * mix;
  }
  return out;
}

// ── Analysis / IO ────────────────────────────────────────────────────────────
export function peakOf(L, R) {
  let p = 0;
  for (let i = 0; i < L.length; i += 1) {
    const a = Math.abs(L[i]);
    const b = Math.abs(R[i]);
    if (a > p) p = a;
    if (b > p) p = b;
  }
  return p;
}

export function rmsDb(L, R, from = 0, to = L.length) {
  let sum = 0;
  let n = 0;
  for (let i = from; i < to; i += 1) {
    sum += L[i] * L[i] + R[i] * R[i];
    n += 2;
  }
  return n ? 10 * Math.log10(Math.max(sum / n, 1e-20)) : -120;
}

export function writeWav(file, L, R, sr, { seed = 0x5ca5 } = {}) {
  const n = L.length;
  const pcm = Buffer.alloc(n * 4);
  const rnd = mulberry32(seed);
  for (let i = 0; i < n; i += 1) {
    // TPDF dither, ~1 LSB
    const dl = (rnd() - rnd()) / 32768;
    const dr = (rnd() - rnd()) / 32768;
    const l = Math.max(-1, Math.min(1, L[i] + dl));
    const r = Math.max(-1, Math.min(1, R[i] + dr));
    pcm.writeInt16LE(Math.round(l * 32767), i * 4);
    pcm.writeInt16LE(Math.round(r * 32767), i * 4 + 2);
  }

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(2, 22);
  header.writeUInt32LE(sr, 24);
  header.writeUInt32LE(sr * 4, 28);
  header.writeUInt16LE(4, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);

  fs.writeFileSync(file, Buffer.concat([header, pcm]));
}

// ffmpeg loudnorm pass 1 gives integrated LUFS + true peak in one go.
export function measureLoudness(file) {
  const res = spawnSync(
    FFMPEG,
    [
      '-hide_banner',
      '-nostats',
      '-i',
      file,
      '-af',
      'loudnorm=I=-14:TP=-1:LRA=11:print_format=json',
      '-f',
      'null',
      '-',
    ],
    { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
  );
  const text = `${res.stderr || ''}\n${res.stdout || ''}`;
  const blocks = text.match(/\{[\s\S]*?\}/g) || [];
  const last = blocks[blocks.length - 1];
  if (!last) return null;
  try {
    const j = JSON.parse(last);
    return {
      inputI: Number(j.input_i),
      inputTp: Number(j.input_tp),
      inputLra: Number(j.input_lra),
      inputThresh: Number(j.input_thresh),
      targetOffset: Number(j.target_offset),
    };
  } catch {
    return null;
  }
}

export function probeDuration(file) {
  const res = spawnSync(
    FFPROBE,
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file],
    { encoding: 'utf8' },
  );
  const v = Number((res.stdout || '').trim());
  return Number.isFinite(v) ? v : null;
}
