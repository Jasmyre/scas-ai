import { SCENE_BY_ID } from '../timeline/cues.js';
import { headline } from '../design/headline.js';
import { scasAiMark } from '../design/logo.js';

const scene = SCENE_BY_ID.s14;

const MINI_KEY = `
<svg viewBox="0 0 120 120" width="72" height="72" aria-hidden="true">
  <g fill="none" stroke="#2f6bff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="40" cy="60" r="20"/><circle cx="40" cy="60" r="7.5" stroke-opacity=".55"/>
    <path d="M60 60h42M92 60v15M101 60v10"/>
  </g>
</svg>`;

function fragmentMarkup() {
  return `
    <div class="ts-s14__frag ts-s14__frag--nav">
      <span class="ts-ghost-seal"></span>
      <span class="ts-ghost-brand"><span>Sumulong College of Arts</span><span>and Sciences</span></span>
      <span class="ts-s14__frag-links"><span></span><span></span></span>
    </div>

    <div class="ts-s14__frag ts-s14__frag--table">
      <span class="bar" style="width:58%;margin-bottom:10px"></span>
      <div class="row"><span class="day">Thu</span><span class="bar" style="width:46%"></span></div>
      <div class="row"><span class="day">Wed</span><span class="bar" style="width:64%"></span></div>
      <div class="row"><span class="day">Mon</span><span class="bar" style="width:52%"></span></div>
      <div class="row" style="border-bottom:0"><span class="day">Thu</span><span class="bar" style="width:40%"></span></div>
    </div>

    <div class="ts-s14__frag ts-s14__frag--balance">
      <span class="bar bar--short" style="width:34%;margin-bottom:14px"></span>
      <span class="bar" style="width:72%;height:10px;background:rgba(211,47,47,.22)"></span>
    </div>

    <div class="ts-s14__frag ts-s14__frag--chat">
      <span class="bubble">thinking</span>
      <span class="bar bar--short" style="width:56%;margin-top:12px"></span>
    </div>

    <div class="ts-s14__frag ts-s14__frag--chip">
      <span class="day">Thu</span><span class="bar" style="width:34px"></span>
    </div>

    <div class="ts-s14__frag ts-s14__frag--key">${MINI_KEY}</div>`;
}

function makeRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

export default {
  id: 's14',
  start: scene.start,
  end: scene.end,
  build(ctx) {
    const { gsap } = ctx;
    ctx.layer.el.classList.add('ts-scene', 'ts-scene--s14');

    const root = document.createElement('div');
    root.className = 'ts-s14';
    root.innerHTML = `
      <div class="ts-s14__wash" aria-hidden="true"></div>
      <div class="ts-s14__bloom" aria-hidden="true"></div>
      <div class="ts-s14__dust" aria-hidden="true"></div>
      <div class="ts-s14__halo" aria-hidden="true"></div>
      <div class="ts-s14__frags">${fragmentMarkup()}</div>
      <div class="ts-s14__ring ts-s14__ring--b"></div>
      <div class="ts-s14__ring ts-s14__ring--a"></div>
      <div class="ts-s14__orb">${scasAiMark(200, true)}</div>
      <div class="ts-s14__flare"></div>
      <div class="ts-s14__flash"></div>`;
    ctx.content.append(root);

    const wm = headline(
      [
        {
          text: '<span class="ts-s14__wm-l">SCAS</span><span class="ts-s14__wm-r">AI</span>',
        },
      ],
      {
        className: 'display ts-head ts-head--center ts-s14__wm',
        top: '478px',
        left: '0px',
        width: '1920px',
        align: 'center',
      }
    );
    const tag = headline(
      [{ text: 'Ask <span class="ts-s14__tagfill">anything.</span>' }],
      {
        className: 'display ts-head ts-head--center ts-s14__tag',
        top: '672px',
        left: '0px',
        width: '1920px',
        align: 'center',
      }
    );
    root.append(wm, tag);

    const wash = root.querySelector('.ts-s14__wash');
    const bloom = root.querySelector('.ts-s14__bloom');
    const dust = root.querySelector('.ts-s14__dust');
    const halo = root.querySelector('.ts-s14__halo');
    const orb = root.querySelector('.ts-s14__orb');
    const flare = root.querySelector('.ts-s14__flare');
    const flash = root.querySelector('.ts-s14__flash');
    const ringA = root.querySelector('.ts-s14__ring--a');
    const ringB = root.querySelector('.ts-s14__ring--b');
    const frags = [...root.querySelectorAll('.ts-s14__frag')];
    const wmL = wm.querySelector('.ts-s14__wm-l');
    const wmR = wm.querySelector('.ts-s14__wm-r');
    const wmInner = wm.querySelector('.headline__inner');
    const tagInner = tag.querySelector('.headline__inner');

    // Particle halo around the orb.
    const motes = [];
    for (let i = 0; i < 34; i += 1) {
      const a = (i / 34) * Math.PI * 2;
      const radius = 196 + ((i * 53) % 122);
      const dot = document.createElement('i');
      dot.className = 'ts-s14__mote';
      const size = 2 + (i % 3);
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.transform = `translate(${Math.cos(a) * radius}px, ${Math.sin(a) * radius * 0.64}px)`;
      halo.append(dot);
      motes.push(dot);
    }

    // Dust motes across the frame.
    const random = makeRandom(4815);
    const dustMotes = [];
    for (let i = 0; i < 28; i += 1) {
      const dot = document.createElement('i');
      const size = 2 + Math.round(random() * 2);
      dot.style.left = `${6 + random() * 88}%`;
      dot.style.top = `${8 + random() * 84}%`;
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.opacity = `${0.1 + random() * 0.16}`;
      dust.append(dot);
      dustMotes.push({ el: dot, drift: 16 + random() * 26, dur: 2.9 + random() * 0.6 });
    }

    gsap.set(ctx.cam, { transformOrigin: '50% 50%' });
    gsap.set([wmL, wmR], { opacity: 0, x: (i) => (i === 0 ? -280 : 280), rotationY: (i) => (i === 0 ? -24 : 24) });
    gsap.set(tagInner, { opacity: 0, yPercent: 126, skewY: 4, letterSpacing: '0.1em' });
    gsap.set(flash, { opacity: 0 });
    gsap.set(flare, { opacity: 0, scaleX: 0.3 });
    gsap.set(frags, { opacity: 0.55 });

    const tl = gsap.timeline();

    // Slow pull-back across the whole end card.
    tl.fromTo(
      ctx.cam,
      { scale: 1 },
      { scale: 0.92, duration: (scene.end - scene.start) / 24, ease: 'sine.inOut' },
      0
    );

    // Gradient drift + bloom breath + dust — the card never freezes.
    tl.fromTo(wash, { rotation: 0, scale: 1 }, { rotation: 8, scale: 1.05, duration: 5, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0);
    tl.fromTo(bloom, { scale: 0.92, opacity: 0.6 }, { scale: 1.06, opacity: 0.95, duration: 5, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0);
    tl.fromTo(halo, { rotation: 0 }, { rotation: 26, duration: 10, ease: 'none' }, 0);
    tl.fromTo(orb, { y: 5, scale: 0.985 }, { y: -7, scale: 1, duration: 5, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 0);

    gsap.set([ringA, ringB], { rotationX: 70 });
    tl.fromTo(ringA, { rotationZ: 0 }, { rotationZ: 28, duration: 10, ease: 'none' }, 0);
    tl.fromTo(ringB, { rotationZ: 38 }, { rotationZ: 66, duration: 10, ease: 'none' }, 0);

    motes.forEach((mote, i) => {
      tl.fromTo(
        mote,
        { opacity: 0.1, scale: 0.7 },
        { opacity: 0.72, scale: 1, duration: 3.9, ease: 'sine.inOut', yoyo: true, repeat: 1 },
        0.16 + (i % 9) * 0.07
      );
    });

    dustMotes.forEach(({ el, drift, dur }) => {
      tl.fromTo(
        el,
        { y: 0 },
        { y: -drift, duration: dur + 0.9, ease: 'sine.inOut', yoyo: true, repeat: 1 },
        0
      );
    });

    // Every fragment falls into the orb.
    frags.forEach((frag, i) => {
      const r = frag.getBoundingClientRect();
      const dx = 960 - (r.left + r.width / 2);
      const dy = 320 - (r.top + r.height / 2);
      tl.to(
        frag,
        {
          x: dx,
          y: dy,
          scale: 0.14,
          rotation: (i % 2 ? 1 : -1) * (12 + i * 7),
          opacity: 0,
          duration: 0.78,
          ease: 'power3.in',
        },
        0.12 + i * 0.06
      );
    });

    // f2592 · wordmark locks (+2s). Eight seconds of held logo follow.
    const lockAt = (2592 - scene.start) / 24; // 2.0
    tl.to(wmL, { x: 0, rotationY: 0, opacity: 1, duration: lockAt - 1.5, ease: 'power4.out' }, 1.5);
    tl.to(wmR, { x: 0, rotationY: 0, opacity: 1, duration: lockAt - 1.5, ease: 'power4.out' }, 1.5);
    ctx.stage.shake(lockAt, 9);
    tl.fromTo(flash, { opacity: 0.32 }, { opacity: 0, duration: 0.32, ease: 'power2.out', immediateRender: false }, lockAt + 0.02);
    tl.fromTo(wmInner, { scale: 1.026 }, { scale: 1, duration: 0.18, ease: 'power2.out' }, lockAt + 0.09);

    // Flare streak as the wordmark lands.
    tl.to(flare, { opacity: 0.85, scaleX: 1, duration: 0.45, ease: 'power3.out' }, 1.92);
    tl.to(flare, { opacity: 0.2, duration: 0.7, ease: 'sine.out' }, 2.5);

    // f2592 · the last line.
    tl.to(
      tagInner,
      { opacity: 1, yPercent: 0, skewY: 0, letterSpacing: '-0.045em', duration: 0.46, ease: 'power4.out' },
      1.96
    );

    // ── Eight-second lock-up: keep breathing so the held logo never freezes.
    tl.to(wmInner, { scale: 1.006, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 3.6);
    tl.to(tagInner, { letterSpacing: '-0.038em', duration: 3.0, ease: 'sine.inOut', yoyo: true, repeat: 1 }, 3.8);
    tl.fromTo(flare, { opacity: 0.26 }, { opacity: 0.44, duration: 3.4, ease: 'sine.inOut' }, 5.4);
    tl.fromTo(bloom, { scale: 1.06 }, { scale: 0.99, duration: 2.6, ease: 'sine.inOut' }, 6.4);

    return tl;
  },
};
