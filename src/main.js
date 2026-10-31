import '@fontsource-variable/inter';
import gsap from 'gsap';

import './styles/tokens.css';
import './styles/base.css';
import './styles/type.css';
import './styles/preview.css';
import './stage/interaction.css';
import './ui/dashboard/dashboard.css';
import './ui/portal/portal.css';
import './ui/portal/chat.css';

import { createStage } from './stage/stage.js';
import { createInteraction } from './stage/interaction.js';
import { initAtmosphere } from './stage/three/atmosphere.js';
import { buildTransitions } from './timeline/transitions.js';
import { scenes } from './scenes/manifest.js';
import { FPS, DURATION, TOTAL_FRAMES, SCENES, sceneAtFrame } from './timeline/cues.js';

gsap.ticker.lagSmoothing(0);
gsap.defaults({ ease: 'none' });

const params = new URLSearchParams(window.location.search);
const isRender = params.has('render');
const sceneFilter = params.get('scene');
document.body.classList.toggle('render-mode', isRender);

const stage = createStage({ root: document.getElementById('stage') });
const master = gsap.timeline({ paused: true });
const built = [];

function buildFilm() {
  const list = sceneFilter ? scenes.filter((s) => s.id === sceneFilter) : scenes;

  for (const scene of list) {
    const layer = stage.addScene(scene);
    const ia = createInteraction({ layer, scene });

    // Scene-facing stage facade: `shake()` takes LOCAL seconds as documented,
    // while the rig runs on absolute master time.
    const sceneStage = {
      ...stage,
      shake: (localSeconds, amp = 8) => stage.shake(scene.start / FPS + localSeconds, amp),
    };

    const ctx = {
      gsap,
      stage: sceneStage,
      scene,
      layer,
      content: layer.content,
      cam: layer.camBase,
      ia,
    };

    let tl;
    try {
      tl = scene.build(ctx) || gsap.timeline();
    } catch (error) {
      console.error(`[scene:${scene.id}] build failed`, error);
      const fallback = document.createElement('div');
      fallback.style.cssText =
        'position:absolute;inset:0;display:grid;place-items:center;font:700 64px Inter;color:#0b0c0e';
      fallback.textContent = scene.headline;
      layer.content.append(fallback);
      tl = gsap.timeline();
    }

    master.add(tl, scene.start / FPS);
    master.add(ia.timeline, scene.start / FPS);
    const budget = (scene.end - scene.start) / FPS;
    if (tl.duration() > budget + 0.05) {
      console.warn(
        `[scene:${scene.id}] timeline ${tl.duration().toFixed(2)}s exceeds budget ${budget.toFixed(2)}s`
      );
    }
    if (ia.timeline.duration() > budget + 0.05) {
      console.warn(
        `[scene:${scene.id}] interaction timeline ${ia.timeline.duration().toFixed(2)}s exceeds budget ${budget.toFixed(2)}s`
      );
    }
    built.push({ scene, layer, ia, tl });
  }

  const transitions = buildTransitions(gsap, {
    rigEl: stage.rigEl,
    flashEl: document.getElementById('flash'),
    stage,
    fps: FPS,
  });
  master.add(transitions, 0);

  master.to({ _lock: 1 }, { duration: DURATION, ease: 'none' }, 0);
  stage.sync(0);
}

function startPreview(startFrame = 0) {
  const pp = document.getElementById('pp');
  const scrub = document.getElementById('scrub');
  const frameOut = document.getElementById('frame-readout');
  const timeOut = document.getElementById('time-readout');
  const sceneOut = document.getElementById('scene-readout');

  const focused = sceneFilter ? SCENES.find((s) => s.id === sceneFilter) : null;
  const minFrame = focused ? focused.start : 0;
  const maxFrame = focused ? focused.end - 1 : TOTAL_FRAMES - 1;
  scrub.min = String(minFrame);
  scrub.max = String(maxFrame);

  let playing = true;
  master.totalTime(startFrame / FPS, false);
  master.play();

  const tick = () => {
    const t = master.time();
    const f = Math.min(TOTAL_FRAMES - 1, Math.round(t * FPS));
    stage.sync(t);
    scrub.value = String(f);
    frameOut.textContent = String(f).padStart(4, '0');
    timeOut.textContent = `${t.toFixed(2)}s`;
    const s = sceneAtFrame(f);
    sceneOut.textContent = `${s.id.toUpperCase()} · ${s.name}`;
  };
  gsap.ticker.add(tick);

  const setPlaying = (next) => {
    playing = next;
    if (playing) {
      master.play();
      pp.textContent = 'Pause';
    } else {
      master.pause();
      pp.textContent = 'Play';
    }
  };

  pp.addEventListener('click', () => setPlaying(!playing));
  scrub.addEventListener('input', () => {
    setPlaying(false);
    master.totalTime(Number(scrub.value) / FPS, false);
    stage.sync(master.time());
  });

  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
      event.preventDefault();
      setPlaying(!playing);
    }
    if (event.code === 'ArrowRight') {
      setPlaying(false);
      master.totalTime(Math.min(maxFrame / FPS, master.time() + 1 / FPS), false);
    }
    if (event.code === 'ArrowLeft') {
      setPlaying(false);
      master.totalTime(Math.max(minFrame / FPS, master.time() - 1 / FPS), false);
    }
  });
  return tick;
}

async function boot() {
  await document.fonts.ready;
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  // Prototype stills: real components, identity camera, no film finishing.
  if (params.has('proto')) {
    document.body.classList.add('render-mode', 'cal-mode');
    const shot = params.get('proto') || 'dashboard';
    const { mountPrototype } = await import('./prototype/index.js');
    mountPrototype(shot, { stage });

    window.__READY = true;
    window.__PROTO = shot;
    window.__FPS = FPS;
    window.__DURATION = DURATION;
    window.__TOTAL_FRAMES = TOTAL_FRAMES;
    window.__seek = () => 0;
    window.dispatchEvent(new CustomEvent('scas:ready'));
    return;
  }

  // `?portal=1` mounts the portal at identity transform, with no scene camera,
  // grain or vignette. This is the only honest frame to diff against
  // tmp/portal.png; every s08 frame is intentionally zoomed mid-glide.
  if (params.has('portal')) {
    document.body.classList.add('render-mode', 'cal-mode');
    const { createPortal } = await import('./ui/portal/index.js');
    const { createChatWidget } = await import('./ui/portal/chat.js');
    const mount = document.getElementById('scene-mount');
    mount.append(createPortal(), createChatWidget());
    window.__READY = true;
    window.__PORTAL_ONLY = true;
    window.__FPS = FPS;
    window.__DURATION = DURATION;
    window.__TOTAL_FRAMES = TOTAL_FRAMES;
    window.__seek = () => 0;
    // Kill the rig's idle sway: at t=0 it applies ~(3, 8)px and +0.25% scale,
    // which would bake a false offset into every calibration measurement.
    stage.rigEl.style.transform = 'none';
    window.dispatchEvent(new CustomEvent('scas:ready'));
    return;
  }

  try {
    const canvas = document.getElementById('webgl');
    if (canvas) stage.setAtmosphere(initAtmosphere(canvas));
  } catch (error) {
    console.warn('WebGL atmosphere unavailable; continuing with CSS canvas.', error);
  }

  buildFilm();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const focusScene = sceneFilter ? SCENES.find((s) => s.id === sceneFilter) : null;
  const startFrame = focusScene ? focusScene.start : 0;
  stage.setTime(startFrame / FPS, master);

  window.__FPS = FPS;
  window.__DURATION = DURATION;
  window.__TOTAL_FRAMES = TOTAL_FRAMES;
  window.__SCENES = built.map(({ scene }) => ({
    id: scene.id,
    name: scene.name,
    start: scene.start,
    end: scene.end,
  }));
  window.__seek = (frame) => {
    const f = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(frame)));
    stage.setTime(f / FPS, master);
    return f;
  };
  window.__frame = () => Math.round(master.time() * FPS);
  window.__TIMELINES = built.map(({ scene, tl, ia }) => ({
    id: scene.id,
    budget: (scene.end - scene.start) / FPS,
    duration: tl.duration(),
    interactions: ia.timeline.duration(),
  }));
  window.__READY = true;

  if (!isRender) startPreview(startFrame);
  else stage.sync(master.time());

  window.dispatchEvent(new CustomEvent('scas:ready'));
}

boot();
