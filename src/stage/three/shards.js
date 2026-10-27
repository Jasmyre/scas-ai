// ─────────────────────────────────────────────────────────────────────────────
// Glass shards — a deterministic burst of thin, translucent planes.
//
// Usage (scene agent):
//   import { createShardBurst } from '../stage/three/shards.js';
//   const burst = createShardBurst(26, { seed: 7, spread: 520 });
//   sceneGroup.add(burst);                 // or attach to any 3D group
//   burst.setProgress(0);                  // 0 = gathered, 1 = dispersed & gone
//   gsap.to({ p: 0 }, { p: 1, duration: 1.2, onUpdate: () => burst.setProgress(p) });
//
// Coordinate space: 1920×1080 pixel units, centred on (0,0) — matches an
// OrthographicCamera(-960, 960, 540, -540). The group itself can be positioned,
// scaled or rotated like any THREE.Group.
//
// API
//   createShardBurst(count = 24, opts) -> THREE.Group
//     group.setProgress(p)   // 0..1, pure function of p (seek-safe)
//     group.setOpacity(v)
//     group.dispose()
//     group.userData = { kind: 'shardBurst', count, seed }
//
// Rendering: one indexed mesh, one draw call, no texture assets.
// ─────────────────────────────────────────────────────────────────────────────

import * as THREE from 'three';

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

const VERT = `
precision highp float;

uniform float uProgress;

attribute vec2 aCorner;   // quad vertex, -1..1 both axes
attribute vec2 aStart;    // burst origin (px)
attribute vec2 aEnd;      // drift destination (px)
attribute vec2 aSize;     // length, thickness (px)
attribute float aDelay;
attribute float aSpin;
attribute float aSeed;
attribute vec3 aTint;

varying vec2 vUv;
varying vec3 vTint;
varying float vAlpha;

void main() {
  float local = clamp((uProgress - aDelay * 0.5) / 0.5, 0.0, 1.0);
  float eased = 1.0 - pow(1.0 - local, 3.0);

  float fadeIn = smoothstep(0.0, 0.1, local);
  float fadeOut = 1.0 - smoothstep(0.55, 1.0, local);

  vec2 pos = mix(aStart, aEnd, eased);
  pos.y -= eased * eased * 26.0; // gentle gravity as pieces drift

  float angle = aSpin * eased + aSeed * 6.2831;
  vec2 dir = vec2(cos(angle), sin(angle));
  vec2 nrm = vec2(-dir.y, dir.x);

  float scale = fadeIn * (1.0 - 0.3 * eased);
  vec2 offset = dir * (aCorner.x * aSize.x * 0.5) + nrm * (aCorner.y * aSize.y * 0.5);
  pos += offset * scale;

  vUv = aCorner * 0.5 + 0.5;
  vTint = aTint;
  vAlpha = fadeIn * fadeOut;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;

uniform float uOpacity;

varying vec2 vUv;
varying vec3 vTint;
varying float vAlpha;

void main() {
  vec2 c = abs(vUv - 0.5) * 2.0;

  float rect = 1.0 - smoothstep(0.82, 1.0, max(c.x, c.y));
  float sheen = (1.0 - smoothstep(0.0, 0.55, abs(c.y - 0.38))) * 0.55;
  float rim = smoothstep(0.72, 1.0, max(c.x, c.y)) * 0.9;
  float body = 0.16 + sheen * 0.22;

  float alpha = (body + rim * 0.55) * rect * vAlpha * uOpacity;
  if (alpha < 0.003) discard;

  // Glass: pale cobalt body, cool rim, near-white highlight band.
  vec3 col = mix(vTint, vec3(0.97, 0.98, 1.0), sheen * 0.7 + rim * 0.15);
  col = mix(col, vTint * 0.86, rim * 0.5);

  gl_FragColor = vec4(col, alpha);
}
`;

/**
 * @param {number} [count]
 * @param {{
 *   seed?: number,
 *   origin?: [number, number],
 *   spread?: number,
 *   drift?: number,
 *   length?: [number, number],
 *   thickness?: [number, number],
 *   tint?: [number, number, number],
 *   opacity?: number,
 * }} [opts]
 * @returns {THREE.Group}
 */
export function createShardBurst(
  count = 24,
  {
    seed = 0x5a3d,
    origin = [0, 0],
    spread = 480,
    drift = 1.35,
    length = [14, 50],
    thickness = [4, 14],
    tint = [0.53, 0.63, 0.86],
    opacity = 0.72,
  } = {}
) {
  const n = Math.max(1, Math.round(count));
  const rand = mulberry32(seed);

  const corners = [];
  const starts = [];
  const ends = [];
  const sizes = [];
  const delays = [];
  const spins = [];
  const seeds = [];
  const tints = [];
  const indices = [];

  for (let i = 0; i < n; i++) {
    const baseAngle = (i / n) * Math.PI * 2 + rand() * 0.7;
    const distance = spread * (0.4 + rand() * 0.8) * drift;
    const sx = origin[0] + (rand() * 2 - 1) * 26;
    const sy = origin[1] + (rand() * 2 - 1) * 18;
    const dx = Math.cos(baseAngle);
    const dy = Math.sin(baseAngle);
    const tx = -dy;
    const ty = dx;

    const ex = sx + dx * distance + tx * (rand() * 2 - 1) * spread * 0.22;
    const ey = sy + dy * distance + ty * (rand() * 2 - 1) * spread * 0.22;

    const len = length[0] + rand() * (length[1] - length[0]);
    const thick = thickness[0] + rand() * (thickness[1] - thickness[0]);
    const tintShift = (rand() - 0.5) * 0.06;
    const delay = rand() * 0.9;
    const spin = (rand() * 2 - 1) * 2.6;
    const shardSeed = rand();

    for (let v = 0; v < 4; v++) {
      corners.push(v === 0 || v === 3 ? -1 : 1, v < 2 ? -1 : 1);
      starts.push(sx, sy);
      ends.push(ex, ey);
      sizes.push(len, thick);
      delays.push(delay);
      spins.push(spin);
      seeds.push(shardSeed);
      tints.push(tint[0] + tintShift, tint[1] + tintShift, tint[2]);
    }

    const base = i * 4;
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 4 * 3), 3));
  geometry.setAttribute('aCorner', new THREE.BufferAttribute(new Float32Array(corners), 2));
  geometry.setAttribute('aStart', new THREE.BufferAttribute(new Float32Array(starts), 2));
  geometry.setAttribute('aEnd', new THREE.BufferAttribute(new Float32Array(ends), 2));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(sizes), 2));
  geometry.setAttribute('aDelay', new THREE.BufferAttribute(new Float32Array(delays), 1));
  geometry.setAttribute('aSpin', new THREE.BufferAttribute(new Float32Array(spins), 1));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(seeds), 1));
  geometry.setAttribute('aTint', new THREE.BufferAttribute(new Float32Array(tints), 3));
  geometry.setIndex(indices);
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4096);

  const material = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uProgress: { value: 0 },
      uOpacity: { value: opacity },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 4;

  const group = new THREE.Group();
  group.add(mesh);
  group.userData = { kind: 'shardBurst', count: n, seed };

  group.setProgress = (value) => {
    material.uniforms.uProgress.value = Math.max(0, Math.min(1, value));
    return group;
  };
  group.setOpacity = (value) => {
    material.uniforms.uOpacity.value = Math.max(0, Math.min(1, value));
    return group;
  };
  group.dispose = () => {
    geometry.dispose();
    material.dispose();
  };
  group.setProgress(0);

  return group;
}
