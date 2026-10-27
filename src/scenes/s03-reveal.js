import { SCENE_BY_ID } from '../timeline/cues.js';
import { headline } from '../design/headline.js';
import { scasAiMark } from '../design/logo.js';

const scene = SCENE_BY_ID.s03;

export default {
  id: 's03',
  start: scene.start,
  end: scene.end,
  build(ctx) {
    const { gsap } = ctx;
    ctx.layer.el.classList.add('ts-scene', 'ts-scene--s03');

    const root = document.createElement('div');
    root.className = 'ts-s03';
    root.innerHTML = `
      <div class="ts-s03__bloom"></div>
      <div class="ts-s03__ring ts-s03__ring--b"></div>
      <div class="ts-s03__ring ts-s03__ring--a"></div>
      <div class="ts-s03__orbit-dot"></div>
      <div class="ts-s03__shards"></div>
      <div class="ts-s03__chip">Thu</div>
      <div class="ts-s03__orb">${scasAiMark(220, true)}</div>
      <div class="ts-s03__flare"></div>
      <div class="ts-s03__flare ts-s03__flare--v"></div>
      <div class="ts-s03__flash"></div>`;
    ctx.content.append(root);

    const head = headline(
      [
        { text: 'Meet', className: 'ts-s03__meet' },
        {
          text: '<span class="ts-s03__wm-l">SCAS</span><span class="ts-s03__wm-r">AI.</span>',
          className: 'ts-s03__wm',
        },
      ],
      {
        className: 'display ts-head ts-head--center ts-s03__head',
        top: '560px',
        left: '0px',
        width: '1920px',
        align: 'center',
      }
    );
    root.append(head);

    const chip = root.querySelector('.ts-s03__chip');
    const shardLayer = root.querySelector('.ts-s03__shards');
    const orb = root.querySelector('.ts-s03__orb');
    const bloom = root.querySelector('.ts-s03__bloom');
    const flareH = root.querySelector('.ts-s03__flare');
    const flareV = root.querySelector('.ts-s03__flare--v');
    const flash = root.querySelector('.ts-s03__flash');
    const dot = root.querySelector('.ts-s03__orbit-dot');
    const ringA = root.querySelector('.ts-s03__ring--a');
    const ringB = root.querySelector('.ts-s03__ring--b');
    const meet = head.querySelector('.ts-s03__meet');
    const wmL = head.querySelector('.ts-s03__wm-l');
    const wmR = head.querySelector('.ts-s03__wm-r');

    const shards = [];
    for (let i = 0; i < 16; i += 1) {
      const el = document.createElement('div');
      el.className = 'ts-shard';
      const w = i % 4 === 0 ? 32 : 18 + (i % 3) * 5;
      const h = 90 + ((i * 37) % 138);
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      el.style.marginLeft = `${-w / 2}px`;
      el.style.marginTop = `${-h / 2}px`;
      shardLayer.append(el);

      const a = (i / 16) * Math.PI * 2 + 0.45;
      const radius = 188 + (i % 4) * 54;
      shards.push({
        el,
        sx: Math.cos(a) * radius,
        sy: Math.sin(a) * radius * 0.68,
        rot: 24 + ((i * 47) % 320),
        cx: Math.cos(a + 1.15) * 26,
        cy: Math.sin(a + 1.15) * 19,
      });
    }

    gsap.set(ctx.cam, { transformOrigin: '50% 50%' });
    gsap.set(shards.map((s) => s.el), {
      opacity: 0,
      scale: 0.18,
      x: 0,
      y: 0,
      rotation: (i) => 18 + i * 23,
    });
    gsap.set(orb, { opacity: 0, scale: 0.55 });
    gsap.set(bloom, { opacity: 0, scale: 0.72 });
    gsap.set(flareH, { opacity: 0, scaleX: 0.22 });
    gsap.set(flareV, { opacity: 0, scaleY: 0.18 });
    gsap.set(flash, { opacity: 0 });
    gsap.set([wmL, wmR], { opacity: 0 });
    gsap.set(meet, { opacity: 1, letterSpacing: '0.08em', yPercent: 0 });

    const tl = gsap.timeline();

    // Dolly out across the whole beat.
    tl.fromTo(
      ctx.cam,
      { scale: 1.08, y: 6 },
      { scale: 1, y: 0, duration: (scene.end - scene.start) / 24, ease: 'sine.out' },
      0
    );

    // Match cut: the portal day-chip is on screen at frame one.
    tl.fromTo(chip, { scale: 0.9, opacity: 1 }, { scale: 1, duration: 0.14, ease: 'power2.out' }, 0);
    tl.to(meet, { letterSpacing: '-0.035em', duration: 0.9, ease: 'power4.out' }, 0.02);

    // The chip fractures into glass.
    tl.to(chip, { scale: 1.24, opacity: 0, duration: 0.22, ease: 'power2.in' }, 0.16);

    shards.forEach((s, i) => {
      tl.to(s.el, { opacity: 0.95, duration: 0.12, ease: 'power1.out' }, 0.18 + i * 0.008);
      tl.to(
        s.el,
        { x: s.sx, y: s.sy, scale: 1, rotation: s.rot, duration: 0.78, ease: 'power3.out' },
        0.18 + i * 0.012
      );
      tl.to(
        s.el,
        {
          x: s.cx,
          y: s.cy,
          scale: 0.32,
          rotation: s.rot + 96,
          duration: 1.1,
          ease: 'power2.inOut',
        },
        1.35 + i * 0.02
      );
      tl.to(s.el, { opacity: 0, scale: 0.08, duration: 0.26, ease: 'power2.in' }, 2.5 + i * 0.015);
    });

    // Bloom + orbital rings.
    tl.to(bloom, { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' }, 1.9);
    tl.to(bloom, { scale: 1.04, duration: 1.8, ease: 'sine.inOut' }, 3);
    tl.fromTo(ringA, { opacity: 0, scale: 0.86 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'power2.out' }, 2.0);
    tl.fromTo(ringB, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'power2.out' }, 2.08);

    // The mark assembles from the shards.
    tl.to(orb, { opacity: 1, scale: 1, duration: 0.62, ease: 'back.out(2.2)' }, 1.9);
    tl.fromTo(orb, { y: 8 }, { y: -4, duration: 1.7, ease: 'sine.inOut' }, 3.2);

    // Lens flare.
    tl.to(flareH, { opacity: 0.95, scaleX: 1, duration: 0.5, ease: 'power3.out' }, 2.16);
    tl.to(flareV, { opacity: 0.8, scaleY: 1, duration: 0.5, ease: 'power3.out' }, 2.22);
    tl.to(flareH, { opacity: 0.24, duration: 0.5, ease: 'sine.out' }, 3.0);
    tl.to(flareV, { opacity: 0.18, duration: 0.5, ease: 'sine.out' }, 3.06);

    // Orbit dot travels the ring so the hero frame keeps breathing.
    tl.to(dot, { x: 194, y: 4, duration: 0.55, ease: 'sine.inOut' }, 2.0);
    tl.to(dot, { x: 0, y: 56, duration: 0.55, ease: 'sine.inOut' }, 2.58);
    tl.to(dot, { x: -194, y: 0, duration: 0.55, ease: 'sine.inOut' }, 3.16);

    // Wordmark locks from opposite sides with a magnetic snap.
    tl.fromTo(
      wmL,
      { x: -300, rotationY: -24, opacity: 0 },
      { x: 0, rotationY: 0, opacity: 1, duration: 0.62, ease: 'power4.out' },
      2.94
    );
    tl.fromTo(
      wmR,
      { x: 300, rotationY: 24, opacity: 0 },
      { x: 0, rotationY: 0, opacity: 1, duration: 0.62, ease: 'power4.out' },
      2.94
    );
    // f278 · impact.
    const lockAt = (278 - scene.start) / 24; // 3.5833
    tl.fromTo(wmL, { x: 0 }, { x: 7, duration: 0.07, ease: 'power2.out' }, lockAt);
    tl.fromTo(wmR, { x: 0 }, { x: -7, duration: 0.07, ease: 'power2.out' }, lockAt);
    tl.to(wmL, { x: 0, duration: 0.14, ease: 'power2.inOut' }, lockAt + 0.075);
    tl.to(wmR, { x: 0, duration: 0.14, ease: 'power2.inOut' }, lockAt + 0.075);
    tl.fromTo(flash, { opacity: 0.42 }, { opacity: 0, duration: 0.3, ease: 'power2.out', immediateRender: false }, lockAt + 0.02);
    ctx.stage.shake(lockAt, 10);

    // Settle on a clean hero frame.
    tl.to([flareH, flareV], { opacity: 0.12, duration: 0.4, ease: 'sine.out' }, 3.8);

    return tl;
  },
};
