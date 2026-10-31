import { SCENE_BY_ID } from '../timeline/cues.js';
import { scasSeal } from '../design/logo.js';
import { headline, revealHeadline, retractHeadline } from '../design/headline.js';

const SCENE = SCENE_BY_ID.s11d;

const BELL = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9.6a6 6 0 0 1 12 0c0 3.9 1.4 5.3 1.4 5.3H4.6S6 13.5 6 9.6Z"/><path d="M10 18.2a2.2 2.2 0 0 0 4 0"/></svg>`;
const BELL_DOT = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9.6a6 6 0 0 1 12 0c0 3.9 1.4 5.3 1.4 5.3H4.6S6 13.5 6 9.6Z"/><path d="M10 18.2a2.2 2.2 0 0 0 4 0"/><circle cx="17.6" cy="6.4" r="2.6" fill="currentColor" stroke="none"/></svg>`;
const CALC = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4.6" y="3.4" width="14.8" height="17.2" rx="3"/><path d="M8.2 7.6h7.6"/><path d="M8.4 12h.01M12 12h.01M15.6 12h.01M8.4 16.2h.01M12 16.2h.01M15.6 16.2h.01"/></svg>`;
const SHIELD_OK = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.2 19 6v6c0 4.3-3 7.3-7 8.8-4-1.5-7-4.5-7-8.8V6l7-2.8Z"/><path d="m8.8 12 2.2 2.2 4.2-4.4"/></svg>`;

const CARDS = [
  {
    n: '01',
    icon: BELL,
    label: 'SCAS announcements',
    value: 'Final exams',
    span: 'Nov 5–11',
    sub: 'Posted by the registrar and pinned straight into your chat.',
    preview: `
      <span class="ft-prev__row is-new"><i></i><b>Final examinations</b><em>Nov 5–11</em></span>
      <span class="ft-prev__row"><i></i><b>Room assignments</b><em>Posted</em></span>`,
  },
  {
    n: '02',
    icon: BELL_DOT,
    label: 'Notifications',
    value: '4,756.94',
    span: 'balance · due Nov 15',
    sub: 'Deadlines and room changes reach you before they matter.',
    preview: `
      <span class="ft-prev__row is-warn"><i></i><b>1st Term balance</b><em>Nov 15</em></span>
      <span class="ft-prev__row is-new"><i></i><b>Exam room posted</b><em>new</em></span>`,
  },
  {
    n: '03',
    icon: CALC,
    label: 'Auto grade calculator',
    value: '90 → 1.38',
    span: 'finals score → projected GWA',
    sub: 'Type a grade, see where the term lands before it posts.',
    preview: `
      <span class="ft-meter"><span class="ft-meter__fill"></span><span class="ft-meter__mark"></span></span>
      <span class="ft-meter__cap"><span>Finals 90</span><span>GWA 1.38</span></span>`,
  },
  {
    n: '04',
    icon: SHIELD_OK,
    label: 'Clearance tracker',
    value: '2 of 3',
    span: 'cleared',
    sub: 'Every desk, in one list — with the one still open.',
    preview: `
      <span class="ft-prev__row is-ok"><i></i><b>Library</b><em>Cleared</em></span>
      <span class="ft-prev__row is-ok"><i></i><b>Registrar</b><em>Cleared</em></span>
      <span class="ft-prev__row is-warn"><i></i><b>Guidance</b><em>Pending</em></span>`,
  },
];

export default {
  id: 's11d',
  start: SCENE.start,
  end: SCENE.end,
  build(ctx) {
    const { gsap, cam, content } = ctx;
    const f = (n) => (n - SCENE.start) / 24;

    const scene = document.createElement('div');
    scene.className = 'ft';
    scene.innerHTML = `
      <div class="ft-grid-bg"></div>
      <div class="ft-bloom"></div>

      <header class="ft-head">
        <div class="ft-brand">${scasSeal(26)}<div><b>SCAS AI</b><span>Features</span></div></div>
        <span class="ft-crumb">Student portal / Assistant</span>
        <span class="ft-policy"><i></i>Always on</span>
      </header>

      <div class="ft-eyebrow">Everything else the assistant does</div>
      <h1 class="display display-sm ft-title">More than answers.</h1>

      <div class="ft-grid">
        ${CARDS.map(
          (card) => `
          <article class="ft-card" data-n="${card.n}">
            <span class="ft-card__num">${card.n}</span>
            <span class="ft-card__ico">${card.icon}</span>
            <span class="ft-card__label">${card.label}</span>
            <strong class="ft-card__value">${card.value}<span>${card.span}</span></strong>
            <span class="ft-card__sub">${card.sub}</span>
            <div class="ft-card__preview">${card.preview}</div>
          </article>`
        ).join('')}
      </div>`;
    content.append(scene);

    const hr = headline(['More than answers.'], {
      className: 'display display-sm',
      top: '132px',
      left: '120px',
      width: '1500px',
    });
    scene.querySelector('.ft-title').replaceWith(hr);

    const cards = [...scene.querySelectorAll('.ft-card')];
    const values = cards.map((c) => c.querySelector('.ft-card__value'));
    const meter = scene.querySelector('.ft-meter__fill');

    gsap.set(cards, { opacity: 0, y: 42, scale: 0.97 });
    gsap.set(meter, { scaleX: 0, transformOrigin: '0% 50%' });

    const tl = gsap.timeline();

    tl.fromTo(scene.querySelector('.ft-head'), { y: -14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.36, ease: 'power2.out' }, 0);
    tl.fromTo(scene.querySelector('.ft-eyebrow'), { opacity: 0 }, { opacity: 1, duration: 0.28 }, 0.12);
    revealHeadline(tl, hr, { at: 0.1, duration: 0.56, stagger: 0.05 });

    // ── Four surfaces land one by one on the pops (f2362 → f2380).
    cards.forEach((card, i) => {
      tl.to(
        card,
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.52,
          ease: 'power3.out',
          immediateRender: false,
        },
        0.42 + i * 0.25
      );
    });

    // ── The numbers settle on the ticks (f2390 → f2402).
    values.forEach((value, i) => {
      tl.fromTo(
        value,
        { y: 8, opacity: 0.4 },
        { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out', immediateRender: false },
        1.58 + i * 0.22
      );
    });

    // ── The calculator is the star: it lights on the chime (f2410).
    tl.call(() => cards[2].classList.add('is-live'), null, 2.42);
    tl.fromTo(
      cards[2],
      { scale: 1 },
      { scale: 1.018, duration: 0.16, yoyo: true, repeat: 1, ease: 'sine.inOut' },
      2.42
    );
    tl.to(meter, { scaleX: 1, duration: 0.9, ease: 'power2.out' }, 2.5);

    // ── A low sweep keeps the still frame alive through the hold.
    tl.fromTo(
      scene.querySelector('.ft-bloom'),
      { x: -260, opacity: 0.5 },
      { x: 260, opacity: 0.9, duration: 2.3, ease: 'sine.inOut', yoyo: true, repeat: 1 },
      3.2
    );
    tl.to(cam, { scale: 1.028, duration: 3.2, ease: 'sine.inOut' }, 2.4);

    // ── Hand off to the finale: the title clears, the frame pushes in.
    retractHeadline(tl, hr, { at: 6.3, duration: 0.38 });
    tl.to(scene.querySelector('.ft-eyebrow'), { opacity: 0, duration: 0.24 }, 6.3);
    tl.to(cam, { scale: 1.06, duration: 1.1, ease: 'power2.in' }, f(2508));

    return tl;
  },
};
