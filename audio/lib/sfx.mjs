// ─────────────────────────────────────────────────────────────────────────────
// SFX recipes. Every cue type referenced in cues.SFX has an entry here.
// Each factory returns { dur, fn(t) } with its own filter/oscillator state.
// ─────────────────────────────────────────────────────────────────────────────

import { TAU, SR, noise, Svf } from './dsp.mjs';

const EXPO = (a, b, p) => a * (b / a) ** Math.min(1, Math.max(0, p));

const FACTORY = {
  // Low end — impacts, booms, cuts.
  impact({ rnd }) {
    let ph = 0;
    const lp = new Svf(SR).set(1900, 0.8);
    return {
      dur: 1.9,
      fn(t) {
        ph += (TAU * (36 + 112 * Math.exp(-t * 6))) / SR;
        const body = Math.sin(ph) * Math.exp(-t * 1.9);
        const sub = Math.sin(ph * 0.5) * Math.exp(-t * 1.15) * 0.42;
        const air = lp.run(rnd()) * Math.exp(-t * 20);
        const metal = (Math.sin(TAU * 418 * t) + Math.sin(TAU * 613 * t) * 0.6) * Math.exp(-t * 9) * 0.14;
        return Math.tanh((body + sub + air * 0.6 + metal) * 1.15) * Math.min(1, t / 0.003);
      },
    };
  },

  boom({ rnd }) {
    let ph = 0;
    return {
      dur: 2.0,
      fn(t) {
        ph += (TAU * (30 + 40 * Math.exp(-t * 8))) / SR;
        const body = Math.sin(ph) * Math.exp(-t * 1.5);
        const rumble = rnd() * Math.exp(-t * 6) * 0.16;
        return Math.tanh(body * 1.4 + rumble) * Math.min(1, t / 0.004);
      },
    };
  },

  // Clicks and ticks.
  tick({ rnd }) {
    const bp = new Svf(SR).set(2500, 3.2);
    return {
      dur: 0.05,
      fn(t) {
        bp.run(rnd());
        return (bp.bp * 1.4 + Math.sin(TAU * 1950 * t) * 0.35) * Math.exp(-t * 300);
      },
    };
  },

  click({ rnd }) {
    const bp = new Svf(SR).set(1900, 2.0);
    return {
      dur: 0.08,
      fn(t) {
        bp.run(rnd());
        const tone = Math.sin(TAU * 1450 * t) * 0.55 + Math.sin(TAU * 2900 * t) * 0.2;
        return (tone + bp.bp * 0.5) * Math.exp(-t * 170);
      },
    };
  },

  // Softer key tick used for the TYPING cue schedule.
  type({ rnd }) {
    const bp = new Svf(SR).set(2100, 2.6);
    let ph = 0;
    return {
      dur: 0.07,
      fn(t) {
        bp.run(rnd());
        ph += (TAU * 920) / SR;
        const thock = Math.sin(ph) * Math.exp(-t * 190) * 0.45;
        return (bp.bp * 1.1 + thock) * Math.exp(-t * 210);
      },
    };
  },

  hover() {
    return {
      dur: 0.12,
      fn(t) {
        return Math.sin(TAU * 880 * t) * Math.min(1, t / 0.01) * Math.exp(-t * 34) * 0.6;
      },
    };
  },

  toggle({ rnd }) {
    const bp = new Svf(SR).set(2400, 2.4);
    return {
      dur: 0.09,
      fn(t) {
        bp.run(rnd());
        return (Math.sin(TAU * 1600 * t) * 0.4 + bp.bp * 0.6) * Math.exp(-t * 210);
      },
    };
  },

  press({ rnd }) {
    return {
      dur: 0.22,
      fn(t) {
        const body = Math.sin(TAU * (70 + 210 * Math.exp(-t * 20)) * t) * Math.exp(-t * 28);
        return Math.tanh(body * 1.5 + rnd() * Math.exp(-t * 90) * 0.2);
      },
    };
  },

  data({ rnd }) {
    const bp = new Svf(SR).set(3200, 4);
    return {
      dur: 0.1,
      fn(t) {
        bp.run(rnd());
        return (Math.sin(TAU * 1800 * t) * 0.5 + bp.bp * 0.3) * Math.exp(-t * 90);
      },
    };
  },

  // Movement — whooshes and sweeps.
  whoosh({ rnd }) {
    const bp = new Svf(SR);
    return {
      dur: 0.65,
      fn(t, i) {
        const p = Math.min(1, t / 0.3);
        if ((i & 15) === 0) bp.set(EXPO(300, 3800, p), 1.6);
        bp.run(rnd());
        return bp.bp * Math.min(1, t / 0.006) * Math.exp(-t * 5.2) * 1.7;
      },
    };
  },

  reverseWhoosh({ rnd }) {
    const bp = new Svf(SR);
    const d = 0.95;
    return {
      dur: d,
      fn(t, i) {
        const p = Math.min(1, t / d);
        if ((i & 15) === 0) bp.set(EXPO(4200, 360, p), 1.5);
        bp.run(rnd());
        return bp.bp * p ** 2.2 * 1.6;
      },
    };
  },

  swoosh({ rnd }) {
    const bp = new Svf(SR);
    return {
      dur: 0.45,
      fn(t, i) {
        const p = Math.min(1, t / 0.28);
        if ((i & 15) === 0) bp.set(EXPO(340, 3200, p), 1.8);
        bp.run(rnd());
        return bp.bp * Math.min(1, t / 0.006) * Math.exp(-t * 7) * 1.6;
      },
    };
  },

  zoomWhoosh({ rnd }) {
    const bp = new Svf(SR);
    let ph = 0;
    return {
      dur: 0.32,
      fn(t, i) {
        const p = Math.min(1, t / 0.22);
        if ((i & 15) === 0) bp.set(EXPO(750, 7200, p), 2.4);
        bp.run(rnd());
        ph += (TAU * 220 * 2 ** (p * 2.2)) / SR;
        return (bp.bp * 1.2 + Math.sin(ph) * 0.16) * Math.min(1, t / 0.005) * Math.exp(-t * 10);
      },
    };
  },

  widgetWhoosh({ rnd }) {
    const bp = new Svf(SR);
    return {
      dur: 0.55,
      fn(t, i) {
        const p = Math.min(1, t / 0.35);
        if ((i & 15) === 0) bp.set(EXPO(260, 2300, p), 3.4);
        bp.run(rnd());
        return bp.bp * Math.min(1, t / 0.008) * Math.exp(-t * 6) * 1.9;
      },
    };
  },

  send({ rnd }) {
    const bp = new Svf(SR);
    let ph = 0;
    return {
      dur: 0.4,
      fn(t, i) {
        const p = Math.min(1, t / 0.25);
        if ((i & 15) === 0) bp.set(EXPO(620, 4200, p), 2);
        bp.run(rnd());
        ph += (TAU * 520 * 2 ** (p * 1.1)) / SR;
        return (bp.bp * 1.1 + Math.sin(ph) * 0.2) * Math.min(1, t / 0.006) * Math.exp(-t * 8);
      },
    };
  },

  riser({ rnd }, dur) {
    const bp = new Svf(SR);
    let ph = 0;
    const d = dur || 1.2;
    return {
      dur: d,
      fn(t, i) {
        const p = Math.min(1, t / d);
        if ((i & 15) === 0) bp.set(EXPO(240, 10000, p), 2.2);
        bp.run(rnd());
        ph += (TAU * 90 * 2 ** (p * 3)) / SR;
        return (bp.bp * 1.3 + Math.sin(ph) * 0.13) * p ** 2;
      },
    };
  },

  ambientSwell({ rnd }, dur) {
    const lp = new Svf(SR).set(700, 0.7);
    let ph = 0;
    const d = dur || 2;
    return {
      dur: d,
      fn(t) {
        lp.run(rnd());
        ph += (TAU * 110) / SR;
        const env = Math.sin((Math.PI * Math.min(1, t / d)) / 2) ** 2;
        return (lp.lp * 0.9 + Math.sin(ph) * 0.12) * env;
      },
    };
  },

  // Musical accents.
  pop({ rnd }) {
    let ph = 0;
    return {
      dur: 0.16,
      fn(t) {
        ph += (TAU * (260 + 780 * Math.exp(-t * 26))) / SR;
        const body = Math.sin(ph) * Math.exp(-t * 22);
        return Math.tanh(body * 1.6 + rnd() * Math.exp(-t * 200) * 0.3) * 0.9;
      },
    };
  },

  chime() {
    return {
      dur: 1.7,
      fn(t) {
        const mod = Math.sin(TAU * 880 * 2.76 * t) * 3.1 * Math.exp(-t * 2.8);
        const bell = Math.sin(TAU * 880 * t + mod) * Math.exp(-t * 2.3);
        const fifth = Math.sin(TAU * 1320 * t) * Math.exp(-t * 3.4) * 0.28;
        const oct = Math.sin(TAU * 1760 * t) * Math.exp(-t * 4.6) * 0.14;
        return (bell + fifth + oct) * Math.min(1, t / 0.004);
      },
    };
  },

  success() {
    const notes = [523.25, 659.25, 783.99];
    return {
      dur: 1.2,
      fn(t) {
        let s = 0;
        for (let i = 0; i < notes.length; i += 1) {
          const d = t - i * 0.085;
          if (d < 0) continue;
          const f = notes[i];
          const m = Math.sin(TAU * f * 2.01 * d) * 1.8 * Math.exp(-d * 5);
          s += Math.sin(TAU * f * d + m) * Math.exp(-d * 3.4) * (1 - i * 0.14);
        }
        return s * 0.55 * Math.min(1, t / 0.004);
      },
    };
  },

  confirm() {
    return {
      dur: 0.55,
      fn(t) {
        const a = t < 0.09 ? 0 : Math.exp(-(t - 0.09) * 9) * Math.sin(TAU * 1568 * (t - 0.09));
        return (Math.sin(TAU * 1046 * t) * Math.exp(-t * 12) * 0.5 + a * 0.45) * Math.min(1, t / 0.003);
      },
    };
  },

  ping() {
    return {
      dur: 0.95,
      fn(t) {
        const m = Math.sin(TAU * 1568 * 2.4 * t) * 1.4 * Math.exp(-t * 6);
        return Math.sin(TAU * 1568 * t + m) * Math.exp(-t * 5.2) * 0.8;
      },
    };
  },

  shimmer() {
    const parts = [2637, 3136, 3951, 5274, 6272];
    return {
      dur: 2.0,
      fn(t) {
        let s = 0;
        for (let i = 0; i < parts.length; i += 1) {
          const trem = 0.72 + 0.28 * Math.sin(TAU * (5.5 + i * 1.3) * t + i);
          s += Math.sin(TAU * parts[i] * t + i * 0.7) * trem * (1 - i * 0.13);
        }
        return (s / parts.length) * Math.exp(-t * 2.4) * Math.min(1, t / 0.05);
      },
    };
  },

  glass() {
    const parts = [
      [1, 1],
      [2.76, 0.42],
      [5.4, 0.22],
      [8.93, 0.1],
    ];
    return {
      dur: 1.0,
      fn(t) {
        let s = 0;
        for (const [r, g] of parts) s += Math.sin(TAU * 2400 * r * t) * g * Math.exp(-t * (2.2 + r));
        return s * 0.6 * Math.min(1, t / 0.002);
      },
    };
  },

  lock({ rnd }) {
    return {
      dur: 0.55,
      fn(t) {
        const a = Math.sin(TAU * 208 * t) * Math.exp(-t * 26);
        const b = Math.sin(TAU * 96 * t) * Math.exp(-t * 13) * 0.85;
        const c = rnd() * Math.exp(-t * 280) * 0.4;
        return Math.tanh((a + b + c) * 1.3);
      },
    };
  },

  vault({ rnd }) {
    let ph = 0;
    const bp = new Svf(SR).set(2200, 5);
    return {
      dur: 1.2,
      fn(t) {
        ph += (TAU * (52 + 26 * Math.exp(-t * 12))) / SR;
        const body = Math.sin(ph) * Math.exp(-t * 2.2);
        const clank = bp.run(rnd()) * Math.exp(-t * 30) * 1.6;
        const ring = Math.sin(TAU * 1180 * t) * Math.exp(-t * 7) * 0.1;
        return Math.tanh(body * 1.5 + clank + ring);
      },
    };
  },

  error() {
    let ph = 0;
    let ph2 = 0;
    return {
      dur: 0.65,
      fn(t) {
        const f = 240 * Math.exp(-t * 1.3) + 96;
        ph += (TAU * f) / SR;
        ph2 += (TAU * f * 1.414) / SR;
        const saw = 2 * ((ph / TAU) % 1) - 1;
        const buzz = Math.sign(Math.sin(TAU * 42 * t)) * 0.16;
        return Math.tanh((saw * 0.55 + Math.sin(ph2) * 0.3 + buzz) * 1.4) * Math.exp(-t * 3.2) * Math.min(1, t / 0.004);
      },
    };
  },

  shield({ rnd }) {
    const bp = new Svf(SR);
    let ph = 0;
    return {
      dur: 0.95,
      fn(t, i) {
        const p = Math.min(1, t / 0.95);
        if ((i & 15) === 0) bp.set(EXPO(600, 5200, p), 3);
        bp.run(rnd());
        ph += (TAU * 1500) / SR;
        const tone = (Math.sin(ph) * 0.4 + Math.sin(ph * 1.5) * 0.25) * Math.min(1, t / 0.06) * Math.exp(-t * 3.2);
        return bp.bp * 1.1 * p ** 1.2 + tone;
      },
    };
  },

  drop({ rnd }) {
    let ph = 0;
    const lp = new Svf(SR).set(1400, 0.8);
    return {
      dur: 0.55,
      fn(t) {
        ph += (TAU * (55 + 90 * Math.exp(-t * 18))) / SR;
        const body = Math.sin(ph) * Math.exp(-t * 12);
        const puff = lp.run(rnd()) * Math.exp(-t * 26) * 0.5;
        return Math.tanh(body * 1.4 + puff);
      },
    };
  },
};

export function makeSfx(type, { dur, seed = 1 } = {}) {
  const fb = FACTORY[type];
  if (!fb) {
    return { dur: 0.2, fn: () => 0, missing: true };
  }
  const rnd = noise(seed);
  const out = fb({ rnd, seed }, dur);
  return { ...out, missing: false };
}

export const SFX_TYPES = Object.keys(FACTORY);

// One tick per character, quantized to the 24fps frame grid so audio and the
// typewriter land on the same frames.
export function typingTickSchedule(TYPING, FPS) {
  const ticks = [];
  for (let c = 0; c < TYPING.length; c += 1) {
    const cue = TYPING[c];
    const chars = [...cue.text];
    for (let i = 0; i < chars.length; i += 1) {
      const frame = Math.round(cue.start + (i * FPS) / cue.cps);
      ticks.push({
        scene: cue.scene,
        index: i,
        char: chars[i],
        frame,
        time: frame / FPS,
        seed: (cue.start + i * 31 + c * 7919) % 65536,
      });
    }
  }
  return ticks;
}
