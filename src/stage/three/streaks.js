// ─────────────────────────────────────────────────────────────────────────────
// Soft caustic light bands for the global atmosphere.
//
// Bands are authored as plain data (angle, gaussian width, sweep speed, tint)
// and compiled into a GLSL snippet that atmosphere.js injects into the one
// fullscreen fragment shader. Keeping them inside that pass means zero extra
// draw calls / render targets — the background costs a single quad.
//
// Everything is derived from a fixed seed (mulberry32). No Math.random.
//
// API
//   STREAK_COUNT                    default band count (6, range 4–8)
//   createStreakBands(opts)         -> Band[]  { angle, offset, travel, width, amp, tint }
//   buildStreakGLSL(bands)          -> string  defining streakField(vec2,float,float,out vec3)
//   STREAK_GLSL                     default pre-compiled chunk
//
// Coordinates: `p` is aspect-corrected frame space, x ∈ [-0.89, 0.89], y ∈ [-0.5, 0.5].
// ─────────────────────────────────────────────────────────────────────────────

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

export const STREAK_COUNT = 6;

const TINTS = [
  [0.79, 0.86, 1.0], // cobalt-white
  [0.86, 0.845, 1.0], // violet-white
  [0.9, 0.935, 1.0], // neutral white
  [0.845, 0.95, 1.0], // cyan-white
];

/**
 * @param {{ count?: number, seed?: number }} [opts]
 * @returns {Array<{angle:number, offset:number, travel:number, width:number, amp:number, tint:number[]}>}
 */
export function createStreakBands({ count = STREAK_COUNT, seed = 0x5ca5b1 } = {}) {
  const n = Math.max(4, Math.min(8, Math.round(count)));
  const rand = mulberry32(seed);
  const bands = [];

  for (let i = 0; i < n; i++) {
    const spread = n === 1 ? 0 : i / (n - 1);
    // Diagonal-ish, fanning out from -38° to +32°.
    const angle = -0.66 + spread * 1.22 + (rand() - 0.5) * 0.22;
    // Alternate sweep direction so the frame breathes from both sides.
    const dir = i % 2 === 0 ? 1 : -1;
    bands.push({
      angle,
      offset: -0.98 + spread * 1.96 + (rand() - 0.5) * 0.18,
      travel: dir * (0.0035 + rand() * 0.0115),
      width: 0.058 + rand() * 0.09,
      amp: 0.34 + rand() * 0.6,
      tint: TINTS[(i + Math.floor(rand() * TINTS.length)) % TINTS.length],
    });
  }

  return bands;
}

const f = (value) => {
  const fixed = Number(value).toFixed(6);
  return fixed.replace(/0+$/, '').replace(/\.$/, '.0');
};

/**
 * Compile bands into GLSL. The fragment shader calls:
 *   float streakField(vec2 p, float t, float detail, out vec3 tint);
 * `detail` (0..1) modulates the caustic breakup along each band.
 */
export function buildStreakGLSL(bands) {
  const body = bands
    .map((band, index) => {
      const nx = -Math.sin(band.angle);
      const ny = Math.cos(band.angle);
      const k = 1 / (band.width * band.width);
      const [r, g, b] = band.tint;
      // A second, slower oscillation keeps the sweep from reading mechanical.
      const wobbleHz = 0.017 + index * 0.0043;
      const wobbleAmp = 0.018 + (index % 3) * 0.008;
      return `
  // band ${index} — angle ${(band.angle * 57.2958).toFixed(1)}°, width ${band.width.toFixed(3)}
  {
    vec2 nrm = vec2(${f(nx)}, ${f(ny)});
    float offset = ${f(band.offset)} + t * ${f(band.travel)} + sin(t * ${f(wobbleHz)} + ${f(index * 1.7)}) * ${f(wobbleAmp)};
    float d = dot(p, nrm) - offset;
    float band = exp(-d * d * ${f(k)});
    band *= ${f(band.amp)} * (0.5 + 0.5 * detail);
    mask += band;
    acc += band * vec3(${f(r)}, ${f(g)}, ${f(b)});
  }`;
    })
    .join('\n');

  return `float streakField(vec2 p, float t, float detail, out vec3 tint) {
  float mask = 0.0;
  vec3 acc = vec3(0.0);${body}

  tint = acc / max(mask, 0.0001);
  return mask;
}`;
}

export const STREAK_GLSL = buildStreakGLSL(createStreakBands());
