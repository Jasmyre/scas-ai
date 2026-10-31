import { SCENE_BY_ID } from '../timeline/cues.js';
import { headline } from '../design/headline.js';

const scene = SCENE_BY_ID.s12;

const KEY_SVG = `
<svg viewBox="0 0 120 120" width="120" height="120" aria-hidden="true">
  <g fill="none" stroke="#2f6bff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="40" cy="60" r="20"/>
    <circle cx="40" cy="60" r="7.5" stroke-opacity=".55"/>
    <path d="M60 60h42"/>
    <path d="M92 60v15"/>
    <path d="M101 60v10"/>
  </g>
</svg>`;

const rowMarkup = (lit, label, value) => `
  <div class="ts-s12__row" data-lit="${lit ? '1' : '0'}">
    ${lit ? `<b>${label}</b><i>${value}</i>` : '<span class="ts-s12__dots">•••</span>'}
  </div>`;

export default {
  id: 's12',
  start: scene.start,
  end: scene.end,
  build(ctx) {
    const { gsap } = ctx;
    ctx.layer.el.classList.add('ts-scene', 'ts-scene--s12');

    const root = document.createElement('div');
    root.className = 'ts-s12';
    root.innerHTML = `
      <div class="ts-s12__grid" aria-hidden="true"></div>
      <div class="ts-s12__stage">
        <svg class="ts-s12__trail" viewBox="0 0 1920 1080" aria-hidden="true">
          <path class="ts-s12__trail-a" d="M550 632 Q 782 548 1010 632" fill="none"
            stroke="rgba(47,107,255,.34)" stroke-width="1.5" stroke-dasharray="620" stroke-dashoffset="620"/>
          <path class="ts-s12__trail-b" d="M1010 632 Q 1150 686 1332 668" fill="none"
            stroke="rgba(47,107,255,.28)" stroke-width="1.5" stroke-dasharray="420" stroke-dashoffset="420"/>
        </svg>

        <div class="ts-s12__host">
          <div class="ts-s12__host-nav">
            <span class="ts-s12__host-dot"></span>
            <span class="ts-s12__host-brand"><i></i><span><b></b><em></em></span></span>
            <span class="ts-s12__host-links"><span></span><span></span></span>
          </div>
          <div class="ts-s12__host-body">
            <h4>classes</h4>
            <span class="bar bar--a"></span>
            <span class="bar bar--b"></span>
            <span class="bar bar--c"></span>
          </div>
          <span class="ts-s12__host-tag">host page</span>
        </div>

        <div class="ts-s12__token">
          <i></i><b>id_token</b><span>signed</span>
        </div>

        <div class="ts-s12__key">${KEY_SVG}</div>

        <div class="ts-s12__vault">
          <div class="ts-s12__dial">
            <div class="ts-s12__dial-ring"></div>
            <div class="ts-s12__dial-core"></div>
            <span class="ts-s12__dial-tick"></span>
            <span class="ts-s12__dial-tick" style="transform: rotate(30deg) translateY(0); transform-origin: 50% 84px;"></span>
            <span class="ts-s12__dial-tick" style="transform: rotate(60deg); transform-origin: 50% 84px;"></span>
            <span class="ts-s12__dial-tick" style="transform: rotate(90deg); transform-origin: 50% 84px;"></span>
            <span class="ts-s12__dial-tick" style="transform: rotate(120deg); transform-origin: 50% 84px;"></span>
            <span class="ts-s12__dial-tick" style="transform: rotate(150deg); transform-origin: 50% 84px;"></span>
            <span class="ts-s12__dial-tick" style="transform: rotate(180deg); transform-origin: 50% 84px;"></span>
            <span class="ts-s12__dial-tick" style="transform: rotate(210deg); transform-origin: 50% 84px;"></span>
            <span class="ts-s12__dial-tick" style="transform: rotate(240deg); transform-origin: 50% 84px;"></span>
            <span class="ts-s12__dial-tick" style="transform: rotate(270deg); transform-origin: 50% 84px;"></span>
            <span class="ts-s12__dial-tick" style="transform: rotate(300deg); transform-origin: 50% 84px;"></span>
            <span class="ts-s12__dial-tick" style="transform: rotate(330deg); transform-origin: 50% 84px;"></span>
          </div>
          <div class="ts-s12__vault-label">student vault</div>
          <div class="ts-s12__rows">
            <p class="ts-s12__rows-title">your records</p>
            ${rowMarkup(true, 'GWA', '1.42')}
            ${rowMarkup(false)}
            ${rowMarkup(true, 'Balance', '₱4,756.94')}
            ${rowMarkup(false)}
            ${rowMarkup(true, 'Clearance', '2 of 3')}
            ${rowMarkup(false)}
          </div>
        </div>

        <div class="ts-s12__shock"></div>
        <div class="ts-s12__spark"></div>
      </div>`;
    ctx.content.append(root);

    const head = headline([{ text: 'Private to you<span class="ts-accent">.</span>' }], {
      className: 'display ts-head ts-s12__head',
      top: '104px',
      left: '120px',
      width: '1600px',
    });
    // Screen-fixed: appended to the scene shell, above the camera, so the
    // camera dolly can never crop or hide it. It is revealed once, late.
    ctx.layer.el.append(head);

    const host = root.querySelector('.ts-s12__host');
    const token = root.querySelector('.ts-s12__token');
    const key = root.querySelector('.ts-s12__key');
    const vault = root.querySelector('.ts-s12__vault');
    const dial = root.querySelector('.ts-s12__dial');
    const dialRing = root.querySelector('.ts-s12__dial-ring');
    const dialCore = root.querySelector('.ts-s12__dial-core');
    const shock = root.querySelector('.ts-s12__shock');
    const spark = root.querySelector('.ts-s12__spark');
    const trailA = root.querySelector('.ts-s12__trail-a');
    const trailB = root.querySelector('.ts-s12__trail-b');
    const rows = [...root.querySelectorAll('.ts-s12__row')];
    const litRows = rows.filter((r) => r.dataset.lit === '1');
    const inner = head.querySelector('.headline__inner');

    gsap.set(ctx.cam, { transformOrigin: '50% 50%' });
    gsap.set(host, { opacity: 0, y: 20 });
    gsap.set(vault, { opacity: 0, y: 24 });
    gsap.set(token, { x: 550, y: 605, opacity: 0, scale: 0.92 });
    gsap.set(key, { opacity: 0, scale: 0.55, rotation: -74 });
    gsap.set([shock, spark], { opacity: 0 });
    gsap.set(inner, { opacity: 0, yPercent: 118, skewY: 4, letterSpacing: '0.06em' });

    const tl = gsap.timeline();

    // Prop build-out.
    tl.to(host, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, 0.18);
    tl.to(vault, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.34);

    // Identity handoff: the signed token leaves the host page.
    tl.to(token, { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }, 0.42);
    tl.fromTo(trailA, { strokeDashoffset: 620 }, { strokeDashoffset: 0, duration: 1.15, ease: 'power2.inOut' }, 0.7);
    tl.to(token, { x: 726, y: 548, duration: 0.68, ease: 'power2.inOut' }, 0.82);
    tl.to(token, { rotationY: 56, duration: 0.72, ease: 'power2.inOut' }, 0.82);
    tl.to(token, { x: 882, y: 605, duration: 0.4, ease: 'power3.inOut' }, 1.45);
    tl.to(token, { rotationY: 74, duration: 0.3, ease: 'power2.inOut' }, 1.45);

    // Camera macro dolly through the token.
    tl.to(ctx.cam, { scale: 1.13, duration: 1.2, ease: 'power2.inOut' }, 0.98);
    tl.to(token, { scale: 1.16, duration: 0.72, ease: 'sine.inOut' }, 1.15);
    tl.to(token, { scale: 0.94, duration: 0.26, ease: 'power2.inOut' }, 1.62);

    // f2112 · the token folds into a key. Two-frame hold on the lock.
    const lockAt = 2.0;
    tl.to(token, { scaleX: 0.3, scaleY: 0.06, opacity: 0, duration: 0.11, ease: 'power3.in' }, 1.88);
    tl.fromTo(
      key,
      { opacity: 0, scale: 0.5, rotation: -74 },
      { opacity: 1, scale: 1, rotation: 0, duration: 0.16, ease: 'back.out(2.6)' },
      1.9
    );
    ctx.stage.shake(lockAt, 4);

    // Key travels to the vault and turns.
    tl.to(key, { x: 240, y: 22, scale: 0.62, rotation: 38, duration: 0.72, ease: 'power2.inOut' }, 2.22);
    tl.fromTo(trailB, { strokeDashoffset: 420 }, { strokeDashoffset: 0, duration: 0.72, ease: 'power2.inOut' }, 2.22);
    tl.to(key, { opacity: 0, scale: 0.42, duration: 0.2, ease: 'power2.in' }, 2.92);
    tl.to(dialRing, { rotation: 120, duration: 0.4, ease: 'power3.inOut' }, 2.94);

    // f2136 · vault unlock. Six-frame pulse.
    const unlockAt = 3.0;
    tl.fromTo(
      shock,
      { scale: 0.55, opacity: 0.85 },
      { scale: 2.25, opacity: 0, duration: 0.5, ease: 'power2.out', immediateRender: false },
      unlockAt
    );
    tl.fromTo(
      spark,
      { scale: 0.6, opacity: 1 },
      { scale: 2.4, opacity: 0, duration: 0.34, ease: 'power2.out', immediateRender: false },
      unlockAt
    );
    tl.to(dialCore, { scale: 1.16, duration: 0.1, ease: 'power2.out' }, unlockAt);
    tl.to(dialCore, { scale: 1, duration: 0.34, ease: 'power2.inOut' }, unlockAt + 0.12);
    ctx.stage.shake(unlockAt, 8);

    // Rows belonging to this student illuminate; the rest stay frosted.
    litRows.forEach((row, i) => {
      const at = 3.12 + i * 0.17;
      tl.call(() => row.classList.add('is-yours'), null, at);
      tl.fromTo(
        row,
        { filter: 'blur(2px)', opacity: 0.42 },
        { filter: 'blur(0px)', opacity: 1, duration: 0.4, ease: 'power2.out' },
        at
      );
      tl.fromTo(row.querySelector('b'), { opacity: 0 }, { opacity: 1, duration: 0.26 }, at + 0.03);
      tl.fromTo(row.querySelector('i'), { opacity: 0 }, { opacity: 1, duration: 0.26 }, at + 0.08);
    });

    // Camera releases; the vault keeps a low drift.
    tl.to(ctx.cam, { scale: 1.13, duration: 0.9, ease: 'none' }, 2.2);
    tl.to(ctx.cam, { scale: 1, duration: 0.95, ease: 'power3.inOut' }, 3.4);
    tl.to(vault, { y: -6, duration: 2.6, ease: 'sine.inOut' }, 3.4);
    tl.to(dialRing, { rotation: 138, duration: 2.6, ease: 'sine.inOut' }, 3.4);

    // Title lands once, over the proof, and stays until the cut.
    tl.to(
      inner,
      {
        yPercent: 0,
        skewY: 0,
        opacity: 1,
        letterSpacing: '-0.045em',
        duration: 0.72,
        ease: 'power4.out',
      },
      3.55
    );

    return tl;
  },
};
