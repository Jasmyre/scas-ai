// ─────────────────────────────────────────────────────────────────────────────
// SCAS AI — global atmosphere.
//
// Replaces the flat gradient with a premium, high-key "launch film" backdrop:
//
//   • one fullscreen shader  — warm white canvas (#F6F6F4), very pale cobalt
//     (#2F6BFF), violet (#7C5CFF) and cyan (#22D3EE) fields flowing over a
//     seeded fbm texture, 6 slow caustic bands, impact bloom, soft vignette
//     and 24fps-locked film grain + dither. One draw call, one pass.
//   • 960 seeded dust motes  — THREE.Points, parallax drift, alpha pulled back
//     in the middle of frame so the negative space gets the texture.
//
// The renderer contract is unchanged: initAtmosphere(canvas) -> { render(t) }.
//
// Scene-facing API (also published as window.__ATMOSPHERE for scene agents):
//
//   setIntensity(value, time?)   value 0..1.
//                                no time  → static level
//                                with time→ one-shot impulse at absolute second
//   addPulse(time, value, decay) schedule an impulse (absolute seconds)
//   clearPulses()                drop impulses scheduled via setIntensity/addPulse
//   getIntensity(time)           resolved 0..1 value (debug / scene sync)
//   setDustOpacity(value)        0..1
//
// A curated set of SFX cues from timeline/cues.js already drives the bloom, so
// cuts and impacts light the frame without any scene code.
//
// Determinism: seeded mulberry32 only; every animated value is a pure function
// of t. Seeking backwards is safe. No external assets.
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three';

import vertSource from './shaders/atmosphere.vert.glsl?raw';
import fragTemplate from './shaders/atmosphere.frag.glsl?raw';
import { STREAK_GLSL } from './streaks.js';
import { createDustField } from './particles.js';
import { SFX } from '../../timeline/cues.js';

const WIDTH = 1920;
const HEIGHT = 1080;
const FPS = 24;

const BASE_INTENSITY = 0.12;

// Which SFX types get to kiss the frame with light, and how hard.
const CUE_GAIN = {
  impact: 0.95,
  boom: 0.62,
  lock: 0.4,
  shimmer: 0.34,
  success: 0.32,
  confirm: 0.28,
};
const CUE_DECAY = {
  impact: 2.1,
  boom: 1.8,
  lock: 2.6,
  shimmer: 3.2,
  success: 2.4,
  confirm: 2.6,
};

const FRAG = fragTemplate.replace('/*__STREAKS__*/', () => STREAK_GLSL);

/** Deterministic PRNG (mulberry32). */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Periodic value noise on a `grid × grid` lattice (tileable seamlessly). */
function makeOctave(grid, rand) {
  const cell = new Float32Array(grid * grid);
  for (let i = 0; i < cell.length; i++) cell[i] = rand();
  return { grid, cell };
}

function sampleOctave(octave, u, v) {
  const { grid, cell } = octave;
  const x = u * grid;
  const y = v * grid;
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);

  const x0 = ((xi % grid) + grid) % grid;
  const y0 = ((yi % grid) + grid) % grid;
  const x1 = (x0 + 1) % grid;
  const y1 = (y0 + 1) % grid;

  const a = cell[y0 * grid + x0];
  const b = cell[y0 * grid + x1];
  const c = cell[y1 * grid + x0];
  const d = cell[y1 * grid + x1];

  const top = a + (b - a) * sx;
  const bottom = c + (d - c) * sx;
  return top + (bottom - top) * sy;
}

/**
 * Seeded fbm packed into an RGBA texture: one frequency character per channel
 * (broad red / mid green / fine blue / detail alpha). Sampling a texture is an
 * order of magnitude cheaper on SwiftShader than 48 sin-hashes per pixel.
 */
function buildFbmTexture(size = 256, seed = 0xa17e0f) {
  const rand = mulberry32(seed);
  const channels = [
    { grids: [4, 9, 18], amps: [0.58, 0.28, 0.14] },
    { grids: [6, 13, 27], amps: [0.55, 0.3, 0.15] },
    { grids: [3, 7, 15], amps: [0.6, 0.26, 0.14] },
    { grids: [10, 21, 42], amps: [0.5, 0.3, 0.2] },
  ].map(({ grids, amps }) => ({
    amps,
    octaves: grids.map((grid) => makeOctave(grid, rand)),
  }));

  const data = new Uint8Array(size * size * 4);
  const inv = 1 / size;

  for (let y = 0; y < size; y++) {
    const v = y * inv;
    for (let x = 0; x < size; x++) {
      const u = x * inv;
      const texel = (y * size + x) * 4;
      for (let c = 0; c < 4; c++) {
        const channel = channels[c];
        let value = 0;
        for (let o = 0; o < channel.octaves.length; o++) {
          value += channel.amps[o] * sampleOctave(channel.octaves[o], u, v);
        }
        value = value * 0.94 + 0.03;
        data[texel + c] = Math.round(Math.max(0, Math.min(1, value)) * 255);
      }
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function buildCuePulses() {
  return SFX.filter((cue) => CUE_GAIN[cue.type]).map((cue) => ({
    time: cue.frame / FPS,
    amp: CUE_GAIN[cue.type] * (cue.gain ?? 0.6),
    decay: CUE_DECAY[cue.type] ?? 2.4,
  }));
}

export function initAtmosphere(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    stencil: false,
    depth: false,
    preserveDrawingBuffer: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(1);
  renderer.setSize(WIDTH, HEIGHT, false);
  // Shader colours are authored in sRGB; keep them byte-for-byte identical to
  // the CSS palette instead of re-encoding through the linear pipeline.
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  // Linear output means the clear value is written verbatim, so pass the sRGB
  // canvas tone directly instead of a hex that would be gamma-decoded.
  renderer.setClearColor(new THREE.Color(0.9647, 0.9647, 0.9569), 1);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  camera.position.z = 1;

  const noise = buildFbmTexture();

  const material = new THREE.ShaderMaterial({
    vertexShader: vertSource,
    fragmentShader: FRAG,
    uniforms: {
      uNoise: { value: noise },
      uTime: { value: 0 },
      uIntensity: { value: BASE_INTENSITY },
      uBloomCenter: { value: new THREE.Vector2(0.1, 0.05) },
      uResolution: { value: new THREE.Vector2(WIDTH, HEIGHT) },
      uGrain: { value: 0.006 },
    },
    depthTest: false,
    depthWrite: false,
  });

  const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  plane.frustumCulled = false;
  plane.renderOrder = 0;
  scene.add(plane);

  const dust = createDustField(960, { seed: 0x9e3779b9 });
  dust.points.renderOrder = 2;
  scene.add(dust.points);

  const cuePulses = buildCuePulses();
  const manualPulses = [];
  let baseIntensity = BASE_INTENSITY;

  function resolveIntensity(time) {
    let value = baseIntensity;
    for (let i = 0; i < cuePulses.length; i++) {
      const pulse = cuePulses[i];
      const dt = time - pulse.time;
      if (dt >= 0) value += pulse.amp * Math.exp(-dt * pulse.decay);
    }
    for (let i = 0; i < manualPulses.length; i++) {
      const pulse = manualPulses[i];
      const dt = time - pulse.time;
      if (dt >= 0) value += pulse.amp * Math.exp(-dt * pulse.decay);
    }
    return Math.min(1, Math.max(0, value));
  }

  const api = {
    renderer,
    scene,
    camera,
    material,
    noise,
    dust,

    render(t) {
      const time = Number.isFinite(t) ? t : 0;
      material.uniforms.uTime.value = time;
      material.uniforms.uIntensity.value = resolveIntensity(time);
      material.uniforms.uBloomCenter.value.set(
        0.1 + Math.sin(time * 0.017) * 0.24,
        0.05 + Math.cos(time * 0.021) * 0.13
      );
      dust.update(time);
      renderer.render(scene, camera);
    },

    /**
     * @param {number} value 0..1
     * @param {number|null} [time] absolute seconds; omit for a static level,
     *        pass a time to schedule a decaying impulse at that moment.
     */
    setIntensity(value, time = null) {
      const v = Math.max(0, Math.min(1, Number(value) || 0));
      if (time === null || !Number.isFinite(time)) {
        baseIntensity = v;
      } else {
        manualPulses.push({ time: Number(time), amp: v, decay: 2.2 });
      }
      return api;
    },

    addPulse(time, value, decay = 2.2) {
      manualPulses.push({
        time: Number(time) || 0,
        amp: Math.max(0, Math.min(1, Number(value) || 0)),
        decay: Math.max(0.1, Number(decay) || 2.2),
      });
      return api;
    },

    clearPulses() {
      manualPulses.length = 0;
      return api;
    },

    getIntensity(time) {
      return resolveIntensity(Number.isFinite(time) ? time : 0);
    },

    setDustOpacity(value) {
      dust.setOpacity(value);
      return api;
    },

    dispose() {
      dust.dispose();
      plane.geometry.dispose();
      material.dispose();
      noise.dispose();
      renderer.dispose();
    },
  };

  api.render(0);

  // Convenience for scene agents; main.js does not need to change.
  if (typeof window !== 'undefined') window.__ATMOSPHERE = api;

  return api;
}
