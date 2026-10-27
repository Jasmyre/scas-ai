// SCAS AI — global atmosphere, single fullscreen pass.
//
// High-key launch-film backdrop: warm white canvas, very pale cobalt / violet /
// cyan fields (sources #2F6BFF, #7C5CFF, #22D3EE, mixed at roughly 8–15%),
// soft caustic bands, an impact-driven bloom, a whisper of vignette and film
// grain. Everything is authored in sRGB values and rendered with
// LinearSRGBColorSpace output, so the shader constants match the CSS palette
// (#F6F6F4 etc.) exactly.
//
// Uniforms: uNoise (seeded fbm), uTime, uIntensity (0..1 bloom), uBloomCenter,
//           uResolution, uGrain.
// The streakField() function is injected from streaks.js below.

precision highp float;

varying vec2 vUv;

uniform sampler2D uNoise;
uniform float uTime;
uniform float uIntensity;
uniform vec2 uBloomCenter;
uniform vec2 uResolution;
uniform float uGrain;

/*__STREAKS__*/

const vec3 CANVAS = vec3(0.9647, 0.9647, 0.9569); // #F6F6F4
const vec3 TINT_BLUE = vec3(0.878, 0.918, 1.0); // pale cobalt
const vec3 TINT_VIOLET = vec3(0.910, 0.892, 1.0); // pale violet
const vec3 TINT_CYAN = vec3(0.876, 0.960, 0.990); // pale cyan

float dot2(vec2 v) {
  return dot(v, v);
}

float blob(vec2 p, vec2 c, float sharp) {
  return exp(-dot2(p - c) * sharp);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);

  float t = uTime;

  // ── slow flow ───────────────────────────────────────────────────────────
  vec2 flowA = vec2(0.0026, -0.0019) * t;
  vec2 flowB = vec2(-0.0017, 0.0024) * t;

  float nBroad = texture2D(uNoise, uv * 0.72 + flowA).r;
  float nMid = texture2D(uNoise, uv * 1.35 - flowB).g;
  float nFine = texture2D(uNoise, uv * 2.60 + flowB * 1.7).b;
  float nDetail = texture2D(uNoise, uv * 4.10 - flowA * 2.2).a;

  // Warp the sampling space so the fields never read as circles.
  vec2 q = p + (vec2(nBroad, nMid) - 0.5) * 0.42;

  float w1 = smoothstep(0.28, 0.86, nBroad * 0.65 + nMid * 0.35);
  float w2 = smoothstep(0.30, 0.88, nMid * 0.60 + nFine * 0.40);
  float w3 = smoothstep(0.36, 0.92, nFine * 0.55 + nDetail * 0.45);

  float breath = 0.5 + 0.5 * sin(t * 0.19);

  // ── colour fields, anchored in the negative space ───────────────────────
  vec2 cBlue = vec2(-0.78 + sin(t * 0.031) * 0.05, 0.34 + cos(t * 0.024) * 0.04);
  vec2 cViolet = vec2(0.80 + cos(t * 0.027) * 0.05, 0.30 + sin(t * 0.021) * 0.04);
  vec2 cCyan = vec2(0.34 + sin(t * 0.019) * 0.05, -0.70 + cos(t * 0.026) * 0.04);
  vec2 cBlueLow = vec2(-0.58 + cos(t * 0.022) * 0.06, -0.66 + sin(t * 0.018) * 0.05);

  float mBlue = blob(q, cBlue, 2.9) * (0.42 + 0.58 * w1) * (0.88 + 0.12 * breath);
  float mViolet = blob(q, cViolet, 3.6) * (0.40 + 0.60 * w2);
  float mCyan = blob(q, cCyan, 3.8) * (0.40 + 0.60 * w3);
  float mBlueLow = blob(q, cBlueLow, 4.6) * (0.35 + 0.65 * w2);

  // Broad directional washes keep the frame airy rather than spotty.
  float topWash = smoothstep(-0.15, 0.62, p.y) * (0.55 + 0.45 * nBroad);
  float lowWash = (1.0 - smoothstep(-0.62, 0.10, p.y)) * (0.50 + 0.50 * nMid);

  vec3 col = CANVAS;
  col = mix(col, TINT_BLUE, clamp(mBlue, 0.0, 1.0) * 0.62);
  col = mix(col, TINT_VIOLET, clamp(mViolet, 0.0, 1.0) * 0.58);
  col = mix(col, TINT_CYAN, clamp(mCyan, 0.0, 1.0) * 0.55);
  col = mix(col, TINT_BLUE, clamp(mBlueLow, 0.0, 1.0) * 0.42);
  col = mix(col, vec3(0.905, 0.930, 0.988), topWash * 0.20);
  col = mix(col, vec3(0.900, 0.952, 0.966), lowWash * 0.14);

  // A broad, slowly moving white sweep gives the plate a lit side — the sheen
  // of light across a wall rather than a flat tint.
  vec2 lightPos = vec2(-0.30 + sin(t * 0.013) * 0.12, 0.20 + cos(t * 0.017) * 0.08);
  float lit = exp(-dot2(p - lightPos) * 1.9);
  col = mix(col, vec3(1.0), lit * 0.30);

  // ── caustic bands ───────────────────────────────────────────────────────
  float detail = clamp(nDetail * 0.60 + nFine * 0.40, 0.0, 1.0);
  vec3 streakTint;
  float streak = streakField(p, t, detail, streakTint);
  streak = clamp(streak, 0.0, 1.0);
  col = mix(col, mix(col, streakTint, 0.62), streak * 0.20);

  // ── impact bloom (uIntensity 0..1) ──────────────────────────────────────
  vec2 bd = (p - uBloomCenter) * vec2(0.86, 1.2);
  float halo = exp(-dot2(bd) * 2.8);
  float core = exp(-dot2(bd) * 8.5);
  float bloom = clamp(uIntensity, 0.0, 1.0);
  // On a near-white plate a lift alone disappears, so the bloom reads as a
  // pale azure haze with a clean white centre.
  col = mix(col, vec3(0.72, 0.82, 1.0), halo * bloom * 0.38);
  col += vec3(0.035, 0.038, 0.042) * core * bloom;

  // ── finishing: soft vignette, grain, dither ─────────────────────────────
  float vig = smoothstep(0.46, 1.18, length(p * vec2(0.82, 0.96)));
  col *= 1.0 - vig * 0.022;

  float frame = floor(t * 24.0);
  float g1 = hash12(gl_FragCoord.xy + vec2(frame * 17.0, frame * 29.0));
  float g2 = hash12(gl_FragCoord.xy * 1.37 + vec2(frame * 31.0, frame * 13.0));
  col += (g1 + g2 - 1.0) * uGrain;

  // A touch of ordered dither kills 8-bit banding in the wide gradients.
  col += (hash12(gl_FragCoord.xy + 0.5) - 0.5) * (1.0 / 255.0);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
