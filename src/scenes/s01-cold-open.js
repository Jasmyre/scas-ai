import { SCENE_BY_ID } from '../timeline/cues.js';
import { headline } from '../design/headline.js';

const scene = SCENE_BY_ID.s01;
const q = (root, sel) => root.querySelector(sel);

function ghostMarkup() {
  const rows = 5;
  const head = ['COURSE', 'SCHEDULE', 'PRELIM', 'MIDTERM', 'PREFINAL', 'FINALS', 'SGF'];
  return `
    <div class="ts-s01__ghost" aria-hidden="true">
      <div class="ts-frag ts-frag--nav">
        <span class="ts-ghost-seal"></span>
        <span class="ts-ghost-brand"><span>Sumulong College of Arts</span><span>and Sciences</span></span>
        <span class="ts-ghost-navlinks">
          <span class="ts-ghost-navlink is-on"><i></i>Home</span>
          <span class="ts-ghost-navlink"><i></i>Payments</span>
        </span>
        <span class="ts-ghost-user"><b>JL</b><div><span></span><span></span></div></span>
      </div>

      <div class="ts-frag ts-frag--table">
        <div class="ts-ghost-head">
          <div>
            <div class="ts-ghost-title">Classes</div>
            <div class="ts-ghost-sub">Updated as of 24 October 2026 09:33 AM</div>
          </div>
          <div class="ts-ghost-select">Current (1st Term S.Y. 2026-2027)</div>
        </div>
        <div class="ts-ghost-tabs"><span>Calendar</span><span class="is-on">Grades</span></div>
        <div class="ts-ghost-grid">
          <div class="ts-ghost-row ts-ghost-row--head">${head.map((h) => `<span>${h}</span>`).join('')}</div>
          ${Array.from({ length: rows })
            .map(
              () => `
            <div class="ts-ghost-row">
              <span class="ts-ghost-course"><b></b><i></i></span>
              <span class="ts-ghost-time"><span class="ts-ghost-day">Thu</span><b></b><i></i></span>
              <span></span><span></span><span></span><span></span><span></span>
            </div>`
            )
            .join('')}
        </div>
      </div>

      <div class="ts-frag ts-frag--balance">
        <div class="ts-ghost-balhead">Balance</div>
        <div class="ts-ghost-bal"><span>Outstanding Balance</span><b>4,756.94</b></div>
        <div class="ts-ghost-balnote"></div>
      </div>
    </div>`;
}

export default {
  id: 's01',
  start: scene.start,
  end: scene.end,
  build(ctx) {
    const { gsap } = ctx;
    ctx.layer.el.classList.add('ts-scene', 'ts-scene--s01');

    const root = document.createElement('div');
    root.className = 'ts-s01';
    root.innerHTML = `
      <div class="ts-s01__world">
        <div class="ts-s01__seed"></div>
        <div class="ts-s01__rule"></div>
        <div class="ts-s01__underline"></div>
        ${ghostMarkup()}
      </div>
      <div class="ts-s01__flash"></div>`;
    ctx.content.append(root);

    const world = q(root, '.ts-s01__world');
    const head = headline(
      [
        { text: 'The portal' },
        { text: 'knows' },
        { text: 'everything<span class="ts-accent">.</span>' },
      ],
      {
        className: 'display ts-head ts-s01__head',
        top: '300px',
        left: '150px',
        width: '1260px',
      }
    );
    world.append(head);

    const seed = q(root, '.ts-s01__seed');
    const rule = q(root, '.ts-s01__rule');
    const underline = q(root, '.ts-s01__underline');
    const ghost = q(root, '.ts-s01__ghost');
    const flash = q(root, '.ts-s01__flash');
    const inners = [...head.querySelectorAll('.headline__inner')];
    const frags = [...ghost.querySelectorAll('.ts-frag')];

    gsap.set(ctx.cam, { transformOrigin: '50% 50%' });
    // Everything stays visible from frame one: the seed, the rule, and line one
    // are already on screen before the first tween resolves.
    gsap.set(seed, { scale: 0.001, opacity: 0 });
    gsap.set(rule, { scaleX: 0.001 });
    gsap.set(underline, { scaleX: 0 });
    gsap.set(inners[0], { opacity: 1, yPercent: 0, skewY: 2.4, letterSpacing: '0.2em' });
    gsap.set(inners[1], { opacity: 0, yPercent: 128, skewY: 6, letterSpacing: '0.16em' });
    gsap.set(inners[2], { opacity: 0, yPercent: 128, skewY: 6, letterSpacing: '0.2em' });

    const tl = gsap.timeline();

    // Camera: slow push and a two-degree roll that settles.
    tl.fromTo(
      ctx.cam,
      { scale: 1.04, rotation: 2, y: 8 },
      { scale: 1, rotation: 0.4, y: 0, duration: (scene.end - scene.start) / 24, ease: 'sine.out' },
      0
    );

    // Seed → hairline rule.
    tl.to(seed, { scale: 1, opacity: 1, duration: 0.16, ease: 'power2.out' }, 0);
    tl.to(seed, { scale: 3.6, opacity: 0, duration: 0.42, ease: 'power2.in' }, 0.26);
    tl.to(rule, { scaleX: 1, duration: 0.62, ease: 'power4.inOut' }, 0.04);
    tl.to(rule, { opacity: 0.55, duration: 0.5, ease: 'sine.out' }, 1.4);

    // Ghosted portal fragments, 4–6% opacity, drifting in 3D.
    tl.to(ghost, { opacity: 0.062, duration: 0.9, ease: 'power2.out' }, 0.34);
    frags.forEach((frag, i) => {
      tl.fromTo(
        frag,
        {
          rotationY: -15 + i * 5,
          rotationX: 5 - i * 2,
          x: -30 + i * 14,
          y: 22 - i * 11,
          z: -60 + i * 20,
        },
        {
          rotationY: 9 - i * 3,
          rotationX: -3 + i * 1.5,
          x: 26 - i * 12,
          y: -16 + i * 9,
          z: 20,
          duration: 3.9,
          ease: 'sine.inOut',
        },
        0.34 + i * 0.09
      );
    });

    // Line one is on screen at 0; its tracking compresses from +0.2em to −0.045em.
    tl.to(inners[0], { skewY: 0, letterSpacing: '-0.045em', duration: 1.15, ease: 'power4.out' }, 0.03);

    // Masked line wipes.
    tl.to(
      inners[1],
      {
        yPercent: 0,
        skewY: 0,
        opacity: 1,
        letterSpacing: '-0.045em',
        duration: 0.78,
        ease: 'power4.out',
      },
      0.72
    );
    tl.to(
      inners[2],
      {
        yPercent: 0,
        skewY: 0,
        opacity: 1,
        letterSpacing: '-0.045em',
        duration: 0.86,
        ease: 'power4.out',
      },
      1.38
    );

    // f72 · everything. lands with a 2-frame hold and a scale overshoot.
    tl.set(inners[2], { transformOrigin: '0% 82%' }, 2.9);
    tl.fromTo(inners[2], { scale: 1.05 }, { scale: 1, duration: 0.18, ease: 'power3.out' }, 2.92);
    tl.fromTo(underline, { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.34, ease: 'power4.out' }, 2.88);
    tl.to(underline, { opacity: 0.35, duration: 0.4, ease: 'sine.out' }, 3.4);

    // Directional blur / white flash into S02.
    tl.to(world, { filter: 'blur(18px)', x: -130, scale: 1.04, opacity: 0.45, duration: 0.42, ease: 'power2.in' }, 3.55);
    tl.to(flash, { opacity: 1, duration: 0.4, ease: 'power2.in' }, 3.58);

    return tl;
  },
};
