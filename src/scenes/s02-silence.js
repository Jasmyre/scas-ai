import { SCENE_BY_ID, PORTAL_DATA } from '../timeline/cues.js';
import { headline } from '../design/headline.js';
import { scasAiMark } from '../design/logo.js';

const scene = SCENE_BY_ID.s02;
const q = (root, sel) => root.querySelector(sel);

const center = (el) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

function portalMarkup() {
  const rows = PORTAL_DATA.courses.slice(0, 7);
  return `
    <div class="ts-s02__chrome" aria-hidden="true">
      <div class="ts-s02__nav">
        <span class="ts-ghost-seal"></span>
        <span class="ts-ghost-brand"><span>Sumulong College of Arts</span><span>and Sciences</span></span>
        <span class="ts-ghost-navlinks">
          <span class="ts-ghost-navlink is-on"><i></i>Home</span>
          <span class="ts-ghost-navlink"><i></i>Payments</span>
        </span>
        <span class="ts-ghost-user"><b>JL</b><div><span></span><span></span></div></span>
      </div>

      <div class="ts-s02__card ts-s02__classes">
        <div class="ts-ghost-head">
          <div>
            <div class="ts-ghost-title">Classes</div>
            <div class="ts-ghost-sub">${PORTAL_DATA.updated}</div>
          </div>
          <div class="ts-ghost-select">${PORTAL_DATA.term}</div>
        </div>
        <div class="ts-ghost-tabs"><span>Calendar</span><span class="is-on">Grades</span></div>
        <div class="ts-ghost-grid">
          <div class="ts-ghost-row ts-ghost-row--head">${PORTAL_DATA.columns.map((c) => `<span>${c}</span>`).join('')}</div>
          ${rows
            .map(
              (c, i) => `
            <div class="ts-ghost-row">
              <span class="ts-s02__course"><b>${c.code} – ${c.title}</b><i>${c.professor}</i></span>
              <span class="ts-s02__sched" data-course="${i}" data-grade="schedule">
                <span class="ts-ghost-day">${c.day}</span>
                <span class="ts-portal-time">${c.time}</span>
                <em>${c.room}</em>
              </span>
              ${['PRELIM', 'MIDTERM', 'PREFINAL', 'FINALS']
                .map(
                  (g) =>
                    `<span class="ts-s02__tcell" data-course="${i}" data-grade="${g}"></span>`
                )
                .join('')}
              <span class="ts-s02__tcell" data-course="${i}" data-grade="SGF"></span>
            </div>`
            )
            .join('')}
        </div>
      </div>

      <div class="ts-s02__card ts-s02__balance">
        <div class="ts-ghost-balhead">Balance</div>
        <div class="ts-ghost-bal"><span>${PORTAL_DATA.balance.label}</span><b>${PORTAL_DATA.balance.amount}</b></div>
        <div class="ts-ghost-balnote"></div>
      </div>
    </div>`;
}

export default {
  id: 's02',
  start: scene.start,
  end: scene.end,
  build(ctx) {
    const { gsap } = ctx;
    ctx.layer.el.classList.add('ts-scene', 'ts-scene--s02');

    const root = document.createElement('div');
    root.className = 'ts-s02';
    root.innerHTML = `
      <div class="ts-s02__world">
        ${portalMarkup()}
        <div class="ts-s02__bubble">${scasAiMark(34)}</div>
        <div class="ts-s02__cursor" aria-hidden="true">
          <svg viewBox="0 0 26 26" width="26" height="26">
            <path d="M5 2.2 20.4 12.6l-6.9 1.2 3.7 6.7-2.9 1.6-3.7-6.7-5.1 4.8V2.2Z"
              fill="#ffffff" stroke="#0b0c0e" stroke-width="1.35" stroke-linejoin="round"/>
          </svg>
        </div>
        <div class="ts-s02__ring"></div>
        <div class="ts-s02__ring"></div>
      </div>
      <div class="ts-s02__streak"></div>`;
    ctx.content.append(root);

    const world = q(root, '.ts-s02__world');
    const chrome = q(root, '.ts-s02__chrome');
    const bubble = q(root, '.ts-s02__bubble');
    const cursor = q(root, '.ts-s02__cursor');
    const rings = [...root.querySelectorAll('.ts-s02__ring')];
    const streak = q(root, '.ts-s02__streak');

    const head = headline(
      [
        { text: 'It just never' },
        {
          text:
            '<span class="ts-says"><span class="ts-says__base">says</span>' +
            '<span class="ts-says__fill" aria-hidden="true">says</span>' +
            '<span class="ts-says__sweep"></span></span> it<span class="ts-accent">.</span>',
        },
      ],
      {
        className: 'display ts-head ts-s02__head',
        top: '672px',
        left: '120px',
        width: '1240px',
      }
    );
    world.append(head);

    const inners = [...head.querySelectorAll('.headline__inner')];
    const says = q(head, '.ts-says');
    const fill = q(head, '.ts-says__fill');
    const sweep = q(head, '.ts-says__sweep');
    const saysWidth = says.getBoundingClientRect().width;

    const cell1 = chrome.querySelector('[data-course="1"][data-grade="PRELIM"]');
    const cell2 = chrome.querySelector('[data-course="3"][data-grade="FINALS"]');
    const schedCell = chrome.querySelector('[data-course="2"][data-grade="schedule"]');
    const p1 = center(cell1);
    const p2 = center(schedCell);
    const p3 = center(cell2);

    gsap.set(ctx.cam, { transformOrigin: '50% 50%' });
    gsap.set(chrome, { opacity: 0 });
    gsap.set(inners[0], { opacity: 1, yPercent: 0, skewY: 1.6, letterSpacing: '0.1em' });
    gsap.set(inners[1], { opacity: 0, yPercent: 128, skewY: 5, letterSpacing: '0.12em' });
    gsap.set(cursor, { x: 1520, y: 120, opacity: 0 });
    gsap.set(rings, {
      x: (i) => [p1.x, p3.x][i],
      y: (i) => [p1.y, p3.y][i],
      opacity: 0,
    });

    const tl = gsap.timeline();

    // Lateral drift + two-degree tilt, then the whip.
    tl.fromTo(
      ctx.cam,
      { x: 0, y: 0, rotation: 0, scale: 1 },
      { x: -30, y: 8, rotation: 2, scale: 1.02, duration: 3, ease: 'sine.out' },
      0
    );
    tl.to(
      ctx.cam,
      { x: -118, y: 12, rotation: 3.2, scale: 1.07, duration: 1, ease: 'power2.in' },
      3
    );

    // The ghost portal sharpens.
    tl.to(chrome, { opacity: 0.42, duration: 0.55, ease: 'power2.out' }, 0.1);

    // Headline · line one is already on screen; line two wipes in.
    tl.to(inners[0], { skewY: 0, letterSpacing: '-0.045em', duration: 1, ease: 'power4.out' }, 0.02);
    tl.to(
      inners[1],
      {
        yPercent: 0,
        skewY: 0,
        opacity: 1,
        letterSpacing: '-0.045em',
        duration: 0.76,
        ease: 'power4.out',
      },
      0.18
    );

    // Cursor hunts the Classes table.
    tl.to(cursor, { opacity: 1, duration: 0.1 }, 0.06);
    tl.to(cursor, { x: p1.x - 4, y: p1.y - 3, duration: 0.24, ease: 'power3.out' }, 0.06);
    tl.fromTo(
      rings[0],
      { scale: 0.35, opacity: 0.95 },
      { scale: 2.6, opacity: 0, duration: 0.42, ease: 'power2.out', immediateRender: false },
      0.333
    );
    tl.call(() => cell1.classList.add('is-lit'), null, 0.333);
    tl.call(() => cell1.classList.remove('is-lit'), null, 0.92);

    tl.to(cursor, { x: p2.x - 4, y: p2.y - 3, duration: 0.52, ease: 'power2.inOut' }, 0.62);
    tl.call(() => schedCell.classList.add('is-lit'), null, 1.14);
    tl.call(() => schedCell.classList.remove('is-lit'), null, 1.5);

    tl.to(cursor, { x: p3.x - 4, y: p3.y - 3, duration: 0.55, ease: 'power2.inOut' }, 1.58);
    tl.fromTo(
      rings[1],
      { scale: 0.35, opacity: 0.95 },
      { scale: 2.6, opacity: 0, duration: 0.42, ease: 'power2.out', immediateRender: false },
      2.167
    );
    tl.call(() => cell2.classList.add('is-lit'), null, 2.167);
    tl.call(() => cell2.classList.remove('is-lit'), null, 2.74);

    // Cobalt fill sweep across "says".
    tl.fromTo(
      fill,
      { clipPath: 'inset(0 100% 0 0)' },
      { clipPath: 'inset(0 0% 0 0)', duration: 0.4, ease: 'power2.inOut' },
      1.45
    );
    tl.fromTo(sweep, { x: 0, opacity: 0 }, { opacity: 1, duration: 0.08, ease: 'power1.out' }, 1.45);
    tl.to(sweep, { x: saysWidth, duration: 0.4, ease: 'power2.inOut' }, 1.45);
    tl.to(sweep, { opacity: 0, duration: 0.12 }, 1.83);

    // One-frame reaction across the line.
    tl.to(inners[1], { x: -11, y: 1, duration: 0.018, ease: 'steps(1)' }, 2.05);
    tl.to(inners[1], { x: 6, y: -1, duration: 0.018, ease: 'steps(1)' }, 2.068);
    tl.to(inners[1], { x: 0, y: 0, duration: 0.018, ease: 'steps(1)' }, 2.086);

    // Empty bubble inflates and collapses.
    tl.fromTo(
      bubble,
      { scale: 0.4, opacity: 0 },
      { scale: 1.28, opacity: 1, duration: 0.2, ease: 'back.out(3)' },
      2.32
    );
    tl.to(bubble, { scale: 1, duration: 0.12, ease: 'power2.out' }, 2.52);
    tl.to(bubble, { scale: 0.92, duration: 0.1, ease: 'power1.inOut' }, 2.7);
    tl.to(bubble, { scale: 1.12, duration: 0.1, ease: 'power1.inOut' }, 2.84);
    tl.to(bubble, { scale: 0, opacity: 0, duration: 0.18, ease: 'back.in(2)' }, 3);

    tl.to(cursor, { x: 1240, y: 620, duration: 0.42, ease: 'power2.inOut' }, 2.5);
    tl.to(cursor, { opacity: 0, duration: 0.16 }, 2.92);

    // Whip-blur out.
    tl.to(streak, { opacity: 1, scaleX: 1, duration: 0.26, ease: 'power2.out' }, 2.98);
    tl.to(streak, { opacity: 0, duration: 0.34 }, 3.54);
    tl.to(world, { filter: 'blur(16px)', x: -96, opacity: 0.5, duration: 0.9, ease: 'power2.in' }, 3.04);

    return tl;
  },
};
