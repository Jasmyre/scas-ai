// ─────────────────────────────────────────────────────────────────────────────
// Three.js atmosphere layer — public entry point.
//
//   initAtmosphere(canvas)            global background (called by main.js via
//                                     stage/three/atmosphere.js directly)
//   createDustField(count, opts)      ambient motes (used by atmosphere)
//   createFlowField(count, opts)      particle streams for scenes
//   createShardBurst(count, opts)     glass shard burst for scenes
//   createStreakBands(opts)           caustic band data
//   buildStreakGLSL(bands)            compile band data to GLSL
//
// Scene note: createShardBurst returns a THREE.Group you can add directly;
// createFlowField returns a controller whose `.points` you add. Both expect
// 1920×1080 pixel coordinates centred on (0,0) — use an
// OrthographicCamera(-960, 960, 540, -540). They are optional: UI-only scenes
// can ignore them.
// ─────────────────────────────────────────────────────────────────────────────

export { initAtmosphere } from './atmosphere.js';
export { createDustField, createFlowField } from './particles.js';
export { createShardBurst } from './shards.js';
export { createStreakBands, buildStreakGLSL, STREAK_GLSL, STREAK_COUNT } from './streaks.js';
