// ─────────────────────────────────────────────────────────────────────────────
// Deterministic particles for the SCAS AI launch film.
//
// Two factories, both seeded (mulberry32, no Math.random):
//
//   createDustField(count = 960, opts)      ambient motes for the atmosphere
//     -> { points, material, update(t), setOpacity(v), dispose() }
//     Positions live in normalised device space (x ∈ [-1,1], y ∈ [-0.58,0.58]),
//     designed for the fullscreen ortho camera in atmosphere.js (-1..1 / -1..1).
//     Alpha is reduced near frame centre so motes stay in the negative space.
//
//   createFlowField(count = 180, opts)      particle streams (ingestion / ribbon)
//     -> { points, material, update(t), setProgress(p), setOpacity(v), dispose() }
//     Positions are in 1920×1080 pixel space centred on (0,0): x ∈ [-960,960],
//     y ∈ [-540,540]. Add `field.points` to a scene with an ortho camera of that
//     frustum. Path is a quadratic bezier from `from` to `to` bowed by `bow`.
//
// Both use a single THREE.Points draw call and a soft round sprite generated in
// the fragment shader (no external textures).
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

const DUST_COUNT = 960;

const DUST_VERT = `
precision highp float;

uniform float uTime;
uniform float uOpacity;

attribute float aSize;
attribute float aSpeed;
attribute float aSeed;
attribute float aDepth;
attribute float aAlpha;
attribute vec3 aTint;

varying vec3 vTint;
varying float vAlpha;

void main() {
  vec3 pos = position;

  // Slow parallax drift: nearer motes move a touch faster.
  float depth = 0.35 + aDepth * 0.9;
  float t = uTime;
  pos.x += t * (0.0016 + aSpeed * 0.0022) * depth
         + sin(t * 0.043 + aSeed * 6.2831) * 0.0045 * depth;
  pos.y += cos(t * 0.031 + aSeed * 9.4248) * 0.0035 * depth
         - t * 0.00055 * aSpeed;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

  float sizePx = aSize * (0.72 + aDepth * 0.55);
  gl_PointSize = clamp(sizePx, 0.9, 14.0);

  vTint = aTint;
  vAlpha = aAlpha * uOpacity * (0.55 + 0.45 * aDepth);
}
`;

const DUST_FRAG = `
precision highp float;

uniform vec2 uResolution;

varying vec3 vTint;
varying float vAlpha;

void main() {
  vec2 pc = gl_PointCoord - 0.5;
  float d = length(pc) * 2.0;
  float soft = 1.0 - smoothstep(0.12, 1.0, d);
  soft *= soft;

  // Keep the middle of frame clear — that is where headline / product UI sits.
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec2 c = (uv - 0.5) * vec2(uResolution.x / max(uResolution.y, 1.0), 1.0);
  float radial = length(c * vec2(0.92, 1.12));
  float centreFade = mix(0.28, 1.0, smoothstep(0.16, 0.66, radial));

  vec2 edge = smoothstep(vec2(0.0), vec2(0.035), uv)
            * (1.0 - smoothstep(vec2(0.965), vec2(1.0), uv));
  float edgeFade = edge.x * edge.y;

  float alpha = soft * vAlpha * centreFade * edgeFade;
  if (alpha < 0.0025) discard;

  gl_FragColor = vec4(vTint, alpha);
}
`;

/**
 * Ambient dust motes.
 * @param {number} [count]
 * @param {{ seed?: number }} [opts]
 */
export function createDustField(count = DUST_COUNT, { seed = 0x9e3779b9 } = {}) {
  const n = Math.max(700, Math.min(1200, Math.round(count)));
  const rand = mulberry32(seed);

  const positions = new Float32Array(n * 3);
  const sizes = new Float32Array(n);
  const speeds = new Float32Array(n);
  const seeds = new Float32Array(n);
  const depths = new Float32Array(n);
  const alphas = new Float32Array(n);
  const tints = new Float32Array(n * 3);

  // Dust is a whisper: dark enough to read on #F6F6F4, never a texture.
  const palette = [
    [0.56, 0.62, 0.73],
    [0.63, 0.6, 0.73],
    [0.5, 0.57, 0.68],
    [0.66, 0.7, 0.79],
  ];

  for (let i = 0; i < n; i++) {
    positions[i * 3] = (rand() * 2 - 1) * 1.03;
    positions[i * 3 + 1] = (rand() * 2 - 1) * 0.585;
    positions[i * 3 + 2] = 0;

    const bokeh = rand() < 0.07;
    const r = rand();
    sizes[i] = bokeh ? 5.5 + r * 8.0 : 1.0 + Math.pow(r, 2.1) * 2.6;
    speeds[i] = 0.1 + rand() * 0.9;
    seeds[i] = rand();
    depths[i] = rand();
    alphas[i] = bokeh ? 0.05 + rand() * 0.05 : 0.16 + Math.pow(rand(), 1.6) * 0.26;

    const tint = palette[Math.floor(rand() * palette.length)];
    tints[i * 3] = tint[0];
    tints[i * 3 + 1] = tint[1];
    tints[i * 3 + 2] = tint[2];
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute('aDepth', new THREE.BufferAttribute(depths, 1));
  geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
  geometry.setAttribute('aTint', new THREE.BufferAttribute(tints, 3));

  const material = new THREE.ShaderMaterial({
    vertexShader: DUST_VERT,
    fragmentShader: DUST_FRAG,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 1 },
      uResolution: { value: new THREE.Vector2(1920, 1080) },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 2;

  return {
    points,
    material,
    update(t) {
      material.uniforms.uTime.value = t;
    },
    setOpacity(value) {
      material.uniforms.uOpacity.value = Math.max(0, Math.min(1, value));
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

const FLOW_COUNT = 180;

const FLOW_VERT = `
precision highp float;

uniform float uTime;
uniform float uProgress;
uniform float uOpacity;
uniform float uSpeed;
uniform vec2 uFrom;
uniform vec2 uControl;
uniform vec2 uTo;
uniform float uSpread;

attribute float aSeed;
attribute float aLane;
attribute float aSize;
attribute float aAlpha;

varying float vAlpha;

vec2 bezier(float s) {
  float inv = 1.0 - s;
  return inv * inv * uFrom + 2.0 * inv * s * uControl + s * s * uTo;
}

void main() {
  float s = fract(aSeed + uTime * uSpeed * 0.028 + uProgress * 0.88);

  vec2 pos = bezier(s);
  vec2 chord = normalize(uTo - uFrom + vec2(0.0001, 0.0));
  vec2 nrm = vec2(-chord.y, chord.x);

  // Pinched at both ends so streams converge instead of clipping a box.
  float pinch = sin(3.14159265 * s);
  pos += nrm * aLane * uSpread * pinch;
  pos += nrm * sin(s * 12.566 + aSeed * 6.2831) * uSpread * 0.09 * pinch;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 0.0, 1.0);

  gl_PointSize = clamp(aSize * (0.8 + 0.4 * pinch), 1.0, 5.0);

  float ends = smoothstep(0.0, 0.1, s) * (1.0 - smoothstep(0.86, 1.0, s));
  vAlpha = aAlpha * ends * uOpacity * (0.55 + 0.45 * pinch);
}
`;

const FLOW_FRAG = `
precision highp float;

uniform vec3 uTint;

varying float vAlpha;

void main() {
  vec2 pc = gl_PointCoord - 0.5;
  float d = length(pc) * 2.0;
  float soft = 1.0 - smoothstep(0.18, 1.0, d);
  soft *= soft;

  float alpha = soft * vAlpha;
  if (alpha < 0.0025) discard;

  gl_FragColor = vec4(uTint, alpha);
}
`;

/**
 * Particle stream along a quadratic bezier. Useful for knowledge ingestion,
 * token ribbons, "data into the portal" beats.
 *
 * @param {number} [count]
 * @param {{
 *   seed?: number,
 *   from?: [number, number],
 *   to?: [number, number],
 *   bow?: number,
 *   spread?: number,
 *   speed?: number,
 *   size?: [number, number],
 *   tint?: [number, number, number],
 *   opacity?: number,
 * }} [opts]
 */
export function createFlowField(
  count = FLOW_COUNT,
  {
    seed = 0x5eed1234,
    from = [-740, 40],
    to = [620, -30],
    bow = -120,
    spread = 56,
    speed = 1,
    size = [1.4, 3.2],
    tint = [0.25, 0.42, 0.9],
    opacity = 0.7,
  } = {}
) {
  const n = Math.max(12, Math.round(count));
  const rand = mulberry32(seed);

  const positions = new Float32Array(n * 3);
  const seeds = new Float32Array(n);
  const lanes = new Float32Array(n);
  const sizes = new Float32Array(n);
  const alphas = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    positions[i * 3] = 0;
    positions[i * 3 + 1] = 0;
    positions[i * 3 + 2] = 0;
    // Even spacing along the path + jitter: reads as a stream, not a cloud.
    seeds[i] = (i / n + (rand() * 0.4) / n) % 1;
    lanes[i] = (rand() * 2 - 1) * (0.35 + rand() * 0.65);
    sizes[i] = size[0] + rand() * (size[1] - size[0]);
    alphas[i] = 0.35 + rand() * 0.6;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute('aLane', new THREE.BufferAttribute(lanes, 1));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));

  const mid = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2];
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;

  const material = new THREE.ShaderMaterial({
    vertexShader: FLOW_VERT,
    fragmentShader: FLOW_FRAG,
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uOpacity: { value: opacity },
      uSpeed: { value: speed },
      uFrom: { value: new THREE.Vector2(from[0], from[1]) },
      uControl: { value: new THREE.Vector2(mid[0] - (dy / len) * bow, mid[1] + (dx / len) * bow) },
      uTo: { value: new THREE.Vector2(to[0], to[1]) },
      uSpread: { value: spread },
      // Plain vector: colours are authored as sRGB 0..1, no colour-space conversion.
      uTint: { value: new THREE.Vector3(tint[0], tint[1], tint[2]) },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.renderOrder = 3;

  return {
    points,
    material,
    update(t) {
      material.uniforms.uTime.value = t;
    },
    setProgress(value) {
      material.uniforms.uProgress.value = Math.max(0, Math.min(1, value));
    },
    setOpacity(value) {
      material.uniforms.uOpacity.value = Math.max(0, Math.min(1, value));
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
