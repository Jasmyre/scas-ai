// Prototype surface renderer.
//
// Mounts the SAME components the film uses (dashboard, portal, chat widget,
// new-assistant dialog, audit page) at identity transform, with the film's
// camera moves, cursor, DOF, grain and headlines removed. The stills are
// therefore product UI, not frames of the movie.
//
// Reached with `?proto=<shot>`; consumed by tools/prototype.mjs.

import gsap from 'gsap';

import { FPS } from '../timeline/cues.js';
import { createDashboard, animateDashboard } from '../ui/dashboard/index.js';
import { createPortal } from '../ui/portal/index.js';
import { createChatWidget, chatGreeting, chatNudges, chatThread } from '../ui/portal/chat.js';
import { createInteraction } from '../stage/interaction.js';
import s05 from '../scenes/s05-tenant.js';
import s13 from '../scenes/s13-audit.js';

const CAL_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5" width="17" height="15.5" rx="3" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 9.6h17M8 3.4v3.2M16 3.4v3.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
const SHIELD_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 3.2 19 6v6c0 4.3-3 7.3-7 8.8-4-1.5-7-4.5-7-8.8V6l7-2.8Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`;

/** Run the dashboard's entrance to its end state (charts drawn, counters final). */
function settleDashboard(root) {
  const dash = root.querySelector('.dash');
  if (!dash) return;
  const tl = gsap.timeline({ paused: true });
  animateDashboard(tl, dash, { at: 0, stagger: 0.05, countAt: 0.1, drawAt: 0.2 });
  tl.progress(1);
}

function mountDashboard(mount) {
  mount.append(createDashboard({ interactive: false }));
  settleDashboard(mount);
}

function mountPortal(mount, { open }) {
  mount.append(createPortal());
  const chat = createChatWidget({ open, launcherHidden: open });
  mount.append(chat);

  if (!open) return;

  const thread = chatThread(chat);
  thread.append(
    chatGreeting(),
    chatNudges([
      { title: 'What do I still owe?', meta: 'Balance · due Nov 15', icon: CAL_ICON },
      { title: "What's my schedule?", meta: 'CC1003 · Wed 12:00 PM', icon: SHIELD_ICON },
    ])
  );
}

/**
 * Reuse a film scene, seek its timeline to `frame`, then strip the film
 * direction: camera transforms, cursor, DOF, headline and eyebrow.
 */
function mountScene(stage, sceneModule, frame) {
  const layer = stage.addScene(sceneModule);
  const ia = createInteraction({ layer, scene: sceneModule });
  const ctx = {
    gsap,
    stage,
    scene: sceneModule,
    layer,
    content: layer.content,
    cam: layer.camBase,
    ia,
  };

  const tl = sceneModule.build(ctx);
  tl.pause();
  ia.timeline.pause();

  const local = (frame - sceneModule.start) / FPS;
  tl.time(local, false);
  ia.timeline.time(local, false);

  gsap.set([layer.cam, layer.camBase], { clearProps: 'all' });
  layer.el.querySelectorAll('.headline, .au-eyebrow, .ft-eyebrow, .know-eyebrow').forEach((el) => el.remove());
  layer.cursorLayer.style.display = 'none';
  layer.dof.style.display = 'none';

  // The audit card lives low in the film to clear the headline. As a page,
  // it sits under a real page title instead.
  if (sceneModule.id === 's13') {
    const card = layer.el.querySelector('.au-card');
    if (card) {
      card.style.top = '190px';
      card.style.bottom = 'auto';
    }

    const head = document.createElement('header');
    head.className = 'dash-head';
    head.style.cssText =
      'position:absolute;top:92px;left:120px;right:120px;display:flex;align-items:flex-end;justify-content:space-between;';
    head.innerHTML = `<div><div class="dash-eyebrow">SCAS · 1st Term S.Y. 2026–2027</div><h2>Message audit</h2></div>`;
    layer.content.querySelector('.au').prepend(head);
  }

  // Background dashboards in wizard scenes also land on their final state.
  settleDashboard(layer.el);
  return layer;
}

const SHOTS = {
  dashboard(mount) {
    mountDashboard(mount);
  },

  // local 4.33s: name typed, personal answers on, grounded preset selected.
  'new-assistant'(mount, stage) {
    mountScene(stage, s05, 536);
  },

  // local 4.0s: first row expanded, trace + replay + verified stamp visible.
  'message-audit'(mount, stage) {
    mountScene(stage, s13, 2304);
  },

  'portal-launcher'(mount) {
    mountPortal(mount, { open: false });
  },

  'portal-chat'(mount) {
    mountPortal(mount, { open: true });
  },
};

export function mountPrototype(shot, { stage }) {
  const mount = document.getElementById('scene-mount');
  if (!mount) throw new Error('prototype: #scene-mount is missing');

  const render = SHOTS[shot];
  if (!render) throw new Error(`prototype: unknown shot "${shot}"`);

  mount.innerHTML = '';
  render(mount, stage);

  // No idle rig sway: the UI must sit at identity.
  stage.rigEl.style.transform = 'none';
  stage.rigEl.style.transformOrigin = '0 0';
  return shot;
}
