import { scasSeal } from '../design/logo.js';
import { headline, revealHeadline, retractHeadline } from '../design/headline.js';
import { DASHBOARD_DATA, PORTAL_DATA } from '../timeline/cues.js';

const A = DASHBOARD_DATA.activity;

const ROWS = [
  {
    time: '09:33:14',
    q: 'How much do I still owe?',
    intent: DASHBOARD_DATA.intents[0].label,
    tool: A[0].tool,
    scope: A[0].scope,
    ms: A[0].ms,
    out: 'Cited',
  },
  {
    time: '09:33:02',
    q: "What's my schedule?",
    intent: DASHBOARD_DATA.intents[1].label,
    tool: A[1].tool,
    scope: A[1].scope,
    ms: A[1].ms,
    out: 'Cited',
  },
  {
    time: '09:32:51',
    q: 'Am I cleared?',
    intent: DASHBOARD_DATA.intents[3].label,
    tool: A[2].tool,
    scope: A[2].scope,
    ms: A[2].ms,
    out: 'Cited',
  },
  {
    time: '09:32:40',
    q: "Show me another student's grades",
    intent: DASHBOARD_DATA.intents[2].label,
    tool: A[3].tool,
    scope: A[3].scope,
    ms: A[3].ms,
    out: 'Refused',
  },
];

const CHEV = `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m6 4 4 4-4 4"/></svg>`;

function rowMarkup(r, i) {
  const refused = r.out === 'Refused';
  const toolParts = r.tool.split(' · ');
  return `<div class="au-row ${refused ? 'is-refused' : ''}" ${i === 0 ? 'id="audit-row-1" data-open="1"' : ''}>
    <span class="au-time">${r.time}</span>
    <span class="au-qs"><strong>${r.q}</strong><em>${r.scope}</em></span>
    <span class="au-intent">${r.intent}</span>
    <span class="au-tool"><b>${toolParts[0]}</b>${toolParts[1] ? `<em>${toolParts[1]}</em>` : ''}</span>
    <span class="au-out ${refused ? 'is-refused' : 'is-cited'}"><i></i>${r.out}</span>
    <span class="au-ms">${r.ms}</span>
    <span class="au-chev">${CHEV}</span>
  </div>`;
}

export default {
  id: 's13',
  start: 1776,
  end: 1920,
  build(ctx) {
    const { gsap, content, ia, cam } = ctx;
    const f = (n) => (n - 1776) / 24;

    const scene = document.createElement('div');
    scene.className = 'au';
    scene.innerHTML = `
      <div class="au-grid"></div>

      <header class="au-head">
        <div class="au-brand">${scasSeal(26)}<div><strong>SCAS AI</strong><span>Audit</span></div></div>
        <div class="au-portal"><span class="au-portal__mark">EU</span>SCAS Edusuite UNI<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m4 6 4 4 4-4"/></svg></div>
        <span class="au-crumb">Administration / Audit</span>
        <span class="au-policy"><i></i>Immutable trail</span>
      </header>

      <div class="au-eyebrow">Audit · every turn on record</div>
      <h1 class="display display-sm au-title">Every answer. Accounted for.</h1>

      <section class="au-card" id="audit-card">
        <header class="au-card__head">
          <div><strong>Audit log</strong><span>8 entries retained · showing 4 · nothing editable</span></div>
          <div class="au-card__tools"><span class="au-range">Last 7 days</span><span class="au-ro"><i></i>Read-only</span></div>
        </header>

        <div class="au-cols">
          <span>Time</span><span>Question</span><span>Intent</span><span>Tool</span><span>Outcome</span><span>Latency</span><span></span>
        </div>

        <div class="au-rows">
          ${rowMarkup(ROWS[0], 0)}
          <div class="au-detail" id="audit-detail">
            <div class="au-detail__inner">
              <div class="au-detail__top">
                <div class="au-detail__asked">
                  <span class="au-label">Asked</span>
                  <p>“How much do I still owe?”</p>
                  <span class="au-meta">${A[0].scope} · 09:33:14 · session 4f2a</span>
                </div>
                <div class="au-chain">
                  <div class="au-chain__item"><span class="au-label">Intent</span><strong>${DASHBOARD_DATA.intents[0].label}</strong></div>
                  <i>→</i>
                  <div class="au-chain__item"><span class="au-label">Tool</span><strong class="au-mono">${A[0].tool}</strong></div>
                  <i>→</i>
                  <div class="au-chain__item"><span class="au-label">Outcome</span><strong class="au-ok"><i></i>Cited</strong></div>
                </div>
                <div class="au-detail__answer">
                  <span class="au-label">Answered</span>
                  <p>Your outstanding balance is <b>₱${PORTAL_DATA.balance.amount}</b>, due Nov 15.</p>
                  <span class="au-cite">
                    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 1.8h5l3 3v9.4H4z"/><path d="M9 1.8v3.2h3M6.2 8h4M6.2 10.4h2.8"/></svg>
                    Student ledger · Oct 2026
                  </span>
                </div>
              </div>

              <div class="au-replay">
                <span class="au-play"><svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M3 1.8 10 6l-7 4.2z"/></svg></span>
                <span class="au-replay__label">Replay</span>
                <div class="au-track">
                  <span class="au-track__fill"></span>
                  <span class="au-track__head"></span>
                  <b style="left:1%"></b>
                  <b style="left:36%"></b>
                  <b style="left:64%"></b>
                  <b style="left:94%"></b>
                </div>
                <span class="au-clock"><b id="au-clock">0:00</b> / 0:42</span>
                <span class="au-verified" id="au-verified"><i></i>Verified · trace 7f3a</span>
              </div>
            </div>
          </div>
          ${rowMarkup(ROWS[1], 1)}
          ${rowMarkup(ROWS[2], 2)}
          ${rowMarkup(ROWS[3], 3)}
        </div>

        <footer class="au-foot">
          <span><i></i>Every answer is written before it is shown. Each entry hashes the one before it.</span>
          <span class="au-hash">trace 7f3a…9c21</span>
        </footer>
      </section>`;
    content.append(scene);

    const hr = headline(['Every answer.', 'Accounted <span class="accent">for.</span>'], {
      className: 'display display-sm',
      top: '100px',
      left: '120px',
      width: '1680px',
    });
    scene.querySelector('.au-title').replaceWith(hr);

    // Measure the row before entrance transforms.
    ia.click('#audit-row-1', { at: f(1824), zoom: 1.1, focusDuration: 0.4 });
    ia.release({ at: f(1860), duration: 0.4 });

    const tl = gsap.timeline();
    const card = scene.querySelector('.au-card');
    const detail = scene.querySelector('#audit-detail');
    const row1 = scene.querySelector('#audit-row-1');
    const rows = [...scene.querySelectorAll('.au-row')];
    const eyebrow = scene.querySelector('.au-eyebrow');
    const chain = [...scene.querySelectorAll('.au-chain__item')];
    const replay = scene.querySelector('.au-replay');
    const fill = scene.querySelector('.au-track__fill');
    const head = scene.querySelector('.au-track__head');
    const clock = scene.querySelector('#au-clock');
    const markers = [...scene.querySelectorAll('.au-track b')];

    gsap.set(detail, { height: 0, opacity: 0 });

    tl.fromTo(scene.querySelector('.au-head'), { y: -14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.36, ease: 'power2.out' }, 0);
    tl.fromTo(scene.querySelector('.au-eyebrow'), { opacity: 0 }, { opacity: 1, duration: 0.28 }, 0.1);
    revealHeadline(tl, hr, { at: 0.04, duration: 0.56, stagger: 0.05 });
    tl.fromTo(card, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.52, ease: 'power3.out' }, 0.1);
    tl.fromTo(scene.querySelector('.au-cols'), { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.34);

    rows.forEach((row, i) => {
      tl.fromTo(row, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.34, ease: 'power3.out' }, 0.18 + i * 0.12);
    });

    // Clear the title as the camera commits to row one.
    retractHeadline(tl, hr, { at: f(1824), duration: 0.24, stagger: 0.04 });
    tl.to(eyebrow, { opacity: 0, duration: 0.2 }, f(1824));

    // Open the trace, then lift the table into the frame as the drawer settles.
    tl.call(() => row1.classList.add('is-open'), null, f(1824));
    tl.to(detail, { height: 224, opacity: 1, duration: 0.4, ease: 'power3.out' }, f(1824));
    tl.fromTo(detail, { y: -6 }, { y: 0, duration: 0.4, ease: 'power3.out' }, f(1824));
    tl.to(cam, { y: -208, duration: 0.4, ease: 'power3.inOut' }, f(1824));
    tl.fromTo(
      [...scene.querySelectorAll('.au-detail__asked, .au-detail__answer')],
      { y: 8, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.3, stagger: 0.08, ease: 'power2.out' },
      f(1826)
    );
    tl.fromTo(
      chain,
      { y: 8, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.26, stagger: 0.07, ease: 'power2.out' },
      f(1834)
    );
    tl.fromTo(replay, { opacity: 0 }, { opacity: 1, duration: 0.22 }, f(1832));
    tl.set(scene.querySelector('#au-verified'), { opacity: 0, scale: 0.94 }, 0);
    tl.set(scene.querySelector('#au-verified'), { opacity: 0, scale: 0.94 }, f(1860));
    tl.to(scene.querySelector('#au-verified'), { opacity: 1, scale: 1, duration: 0.2, ease: 'back.out(2)' }, f(1872));

    // Replay scrubber: one pass to the chime.
    tl.fromTo(fill, { scaleX: 0 }, { scaleX: 1, duration: 1.9, ease: 'none', transformOrigin: '0% 50%' }, f(1860));
    tl.fromTo(head, { left: '0%' }, { left: '100%', duration: 1.9, ease: 'none' }, f(1860));
    const clockProxy = { p: 0 };
    tl.to(
      clockProxy,
      {
        p: 1,
        duration: 1.9,
        ease: 'none',
        onUpdate: () => {
          clock.textContent = `0:${String(Math.round(clockProxy.p * 42)).padStart(2, '0')}`;
        },
      },
      f(1860)
    );
    const beats = [1864, 1876, 1886, 1902];
    beats.forEach((frame, i) => {
      tl.call(() => markers[i]?.classList.add('is-on'), null, f(frame));
    });

    tl.to(scene.querySelector('#au-verified'), { boxShadow: '0 0 0 4px rgba(14,164,122,.1)', duration: 0.2 }, f(1908));
    tl.to(card, { boxShadow: '0 26px 70px rgba(20,40,80,.09), 0 0 0 1px rgba(47,107,255,.08)', duration: 0.2 }, f(1908));

    // The camera settles back out; the title returns to close the scene.
    tl.to(cam, { y: 0, duration: 0.4, ease: 'power3.inOut' }, f(1860));
    revealHeadline(tl, hr, { at: f(1872), duration: 0.5, stagger: 0.04 });
    tl.fromTo(eyebrow, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' }, f(1870));

    return tl;
  },
};
