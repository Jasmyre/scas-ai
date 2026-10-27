# SCAS AI — 88s Launch Film

Code-generated product film for the SCAS AI Assistant. 1920×1080, locked 24 FPS, 88.000s (2,112 frames), 120 BPM sound design.

## Commands

```bash
npm install
npm run dev          # realtime preview with scrubber
npm run render:stills # key frames for review
npm run audio        # synthesize music + SFX
npm run render       # 2,112 frames through Playwright
npm run encode       # H.264 + AAC MP4
npm run verify       # ffprobe + audio report
npm run pipeline     # audio → render → encode → verify
```

## Contracts

- `src/timeline/cues.js` is the single source of truth for scene timing, headlines, SFX, typing, interactions, and portal data.
- Scenes export `{ id, start, end, build(ctx) }`. `ctx` = `{ gsap, stage, scene, layer, content, cam, ia }`.
- `ia` is the interaction director: `focus`, `release`, `click`, `type`, `drop`, `highlight`.
- Scenes are built at their own local time (0 = scene start). The master timeline offsets them.
- Do not edit shared files from a scene module. Shared files: `index.html`, `src/main.js`, `src/timeline/*`, `src/stage/stage.js`, `src/stage/interaction.js`.

## Preview routes

- `/?render=1` — deterministic capture mode, no preview chrome.
- `/?scene=s09` — isolate one scene.
- Scrubber: space = play/pause, arrows = step frames.

## Output

- `out/scas-ai-showcase-1080p24.mp4`
- `out/scas-ai-master.wav`
- `out/stills/` — review frames
- `out/render-report.json`
- `render/frames/` — PNG sequence (gitignored)
