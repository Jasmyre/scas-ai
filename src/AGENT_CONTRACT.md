# Agent Contract — SCAS AI Launch Film

Read this before writing code. The foundation is frozen; these rules prevent merge conflicts.

## The film

- 1920×1080, 24 FPS, 116.000s, 2,784 frames.
- 120 BPM. 1 bar = 48 frames = 2s. Cuts land on the bar grid.
- Light mode only. No dark hero shots, no voiceover, no pricing, no CTA, no body-copy paragraphs.
- Headlines are the narration. All other text is mocked product UI.

## Single source of truth

`src/timeline/cues.js` owns scene timing, headlines, SFX, typing beats, interaction beats, portal data, and dashboard data. Do not change it. If a beat must move, report it to integration instead.

## Scene API

Every `src/scenes/sXX-*.js` default-exports:

```js
export default {
  id: 's09',
  start: 1104,
  end: 1296,
  build(ctx) {
    const tl = ctx.gsap.timeline();
    // append DOM to ctx.content
    // times are LOCAL seconds (0 = scene start)
    return tl;
  },
};
```

`ctx` contains:

| Key | Meaning |
|---|---|
| `gsap` | GreenSock instance |
| `stage` | `{ shake(seconds, amp), getLayer() }` — `shake` uses local seconds |
| `scene` | the scene record from cues |
| `layer` | `{ el, cam, content, dof, cursorLayer }` |
| `content` | the DOM node inside the camera. Append all scene UI here. |
| `cam` | the scene camera transform node (origin 0 0) |
| `ia` | interaction director, see below |

The master timeline offsets your scene automatically. Your scene timeline must end by `(end - start) / 24` seconds.

### Camera composition

`ctx.cam` is your scene camera node. Focus zooms from `ctx.ia` run on a separate outer node, so scene dollies and interaction zooms compose instead of overwriting each other. Keep using `ctx.cam` for scene moves.

`ctx.stage.shake(localSeconds, amp)` is **local** to your scene. Integration converts it to master time.

### Layer visibility

Your layer is displayed from `start` to `end + 6` frames. The 6-frame post-roll is hidden underneath the next scene and only exists so a cut flash never reveals the bare canvas. Treat `end` as your last frame.

### Portal calibration

`/?render=1&portal=1` mounts the portal at identity transform with no scene camera, grain, or vignette. Diff against `tmp/portal.png` there — never against an s08 frame, which is always mid-glide.

```bash
node tools/shoot-scene.mjs --portal --port=5197 --out=out/cal
node tools/measure-portal.mjs      # reference geometry vs live DOM
node tools/calibrate-portal.mjs    # top-aligned blend + PSNR/SSIM
```

## Interaction director

`ctx.ia` builds the cursor, click rings, key pulses, typewriter, and depth-of-field overlay.

```js
ia.focus(selector, { at, scale, duration, dof, blur });
ia.release({ at, duration });
ia.click(selector, { at, zoom, move, focusDuration });
ia.type(selector, text, { at, cps, zoom });
ia.drop(selector, { at, zoom, from });
ia.moveCursor(selector, { at, duration });
ia.highlight(selector, { at, duration, color });
ia.showCursor(at); ia.hideCursor(at);
```

- `at` is local seconds.
- Interactions already add to `ia.timeline`; integration adds it to the master at scene start. You do not need to add it to your scene timeline.
- Typewriter targets should contain `<span class="field-text"></span><span class="caret"></span>` for the caret.
- Use the absolute frame numbers from `INTERACTIONS` / `TYPING` in cues.js to set `at = (frame - scene.start) / 24`.
- Camera focus is 1.6–2.0× for typing, 1.3–1.6× for clicks. Do not zoom without a cursor action.
- `ia.release` must follow every focus sequence before the scene ends.

## Design rules

- Display type: `.display` with Inter Variable, weight 850, tracking −0.045em.
- Headline sizes: 120–190px. Max 2 lines. Never let text clip.
- Palette: `--ink #0b0c0e`, `--brand #2f6bff`, `--canvas #f6f6f4`, white surfaces.
- Glass only for the chat widget and modals. Light shadows. One accent.
- Every scene needs continuous camera life. The stage rig already applies global sway; add scene-specific moves on `ctx.cam`.
- 24 FPS feel: 2–3 frame holds on snaps, stepped overshoots, whip cuts at boundaries.
- No emoji, no stock images, no lorem ipsum, no generic SaaS illustrations.
- Portal replica uses Arial/Helvetica (`var(--font-portal)`), not Inter.

## File ownership

Only edit the files listed for your role. Never edit:

- `index.html`, `package.json`, `vite.config.js`
- `src/main.js`, `src/timeline/**`
- `src/stage/stage.js`, `src/stage/camera.js`
- `src/styles/base.css`, `src/styles/tokens.css`, `src/styles/preview.css`
- `src/ui/**` outside your role
- `tools/render.mjs`, `tools/encode.mjs`

If you need a shared change, report it in your final message instead of editing.

## Testing

Use a unique port per agent. Never run the full 2,784-frame render.

```bash
node tools/shoot-scene.mjs --scene=s09 --frames=900,1000,1100 --port=5191
```

This starts a Vite dev server, seeks the frames, and writes `out/agent/s09_XXXX.png`. Read those images to check your work. Iterate until the frame is clean.

Before finishing:
- `npm run build` must pass. (Run it only when no other agent is building; if it fails on someone else's file, report it.)
- Your scene must render at 3 frames: start+24, midpoint, end−24.
- No console errors.

## Deliverable report

Return:
1. Files changed.
2. What is implemented.
3. The 3 screenshot paths.
4. Any cue mismatch or shared-file request.
5. Known gaps.
