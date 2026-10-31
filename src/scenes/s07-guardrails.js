import { scasSeal } from '../design/logo.js';
import { headline, revealHeadline, retractHeadline } from '../design/headline.js';
import { SCENE_BY_ID } from '../timeline/cues.js';

const SCENE = SCENE_BY_ID.s07;

const LAYERS = [
  {
    n: '01',
    key: 'identity',
    title: 'Identity',
    copy: 'Token-scoped student. The prompt never carries a name.',
    sub: 'token → identity',
    tag: 'VERIFIED',
  },
  {
    n: '02',
    key: 'scope',
    title: 'Scope',
    copy: 'Own records only. Cross-student queries are refused.',
    sub: 'record → owner',
    tag: 'ENFORCED',
  },
  {
    n: '03',
    key: 'grounding',
    title: 'Grounding',
    copy: 'Every claim resolves to an indexed source or it is dropped.',
    sub: 'claim → source',
    tag: '98.7%',
  },
  {
    n: '04',
    key: 'refusal',
    title: 'Refusal',
    copy: 'No source, no answer. Silence over a guess.',
    sub: 'no source → no answer',
    tag: 'SILENT',
  },
];

const SHIELD = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 2.8 20 5.7v6c0 4.6-3.3 7.8-8 9.4-4.7-1.6-8-4.8-8-9.4v-6L12 2.8Z"/></svg>`;
const SHIELD_X = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.8 20 5.7v6c0 4.6-3.3 7.8-8 9.4-4.7-1.6-8-4.8-8-9.4v-6L12 2.8Z"/><path d="m9.4 9.4 5.2 5.2M14.6 9.4l-5.2 5.2"/></svg>`;
const SHIELD_OK = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.8 20 5.7v6c0 4.6-3.3 7.8-8 9.4-4.7-1.6-8-4.8-8-9.4v-6L12 2.8Z"/><path d="m8.4 11.6 2.5 2.5 4.7-5"/></svg>`;

export default {
  id: 's07',
  start: SCENE.start,
  end: SCENE.end,
  build(ctx) {
    const { gsap, content, ia } = ctx;
    const f = (n) => (n - SCENE.start) / 24;

    const scene = document.createElement('div');
    scene.className = 'gr';
    scene.innerHTML = `
      <div class="gr-grid"></div>

      <header class="gr-head">
        <div class="gr-brand">${scasSeal(26)}<div><strong>SCAS AI</strong><span>Guardrails</span></div></div>
        <div class="gr-portal"><span class="gr-portal__mark">EU</span>SCAS Edusuite<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m4 6 4 4 4-4"/></svg></div>
        <span class="gr-crumb">Administration / Guardrails</span>
        <span class="gr-policy"><i></i>Policy v2.4 · enforced</span>
      </header>

      <div class="gr-eyebrow">Guardrails · answer policy</div>
      <h1 class="display display-sm gr-title">It responds with relevant &amp; reliable information.</h1>

      <div class="gr-body">
        <section class="gr-console">
          <header class="gr-console__head">
            <div><strong>Guardrail test console</strong><span>Simulated student · read-only tools</span></div>
            <span class="gr-console__live"><i></i>Live policy</span>
          </header>

          <div class="gr-thread">
            <div class="gr-runmeta"><span>RUN <b id="gr-run">01</b></span><em id="gr-state">Awaiting prompt</em><span class="gr-clock">09:41:12</span></div>
            <div class="gr-recent">
              <span><i></i>09:40:58 · getSchedule · cited</span>
              <span><i></i>09:40:41 · getBalance · cited</span>
              <span><i></i>09:40:12 · refused · out-of-scope</span>
            </div>

            <article class="gr-answer" id="gr-answer">
              <div class="gr-face gr-face--idle is-on">
                <div class="gr-face__top">
                  <span class="gr-face__icon">${SHIELD}</span>
                  <div><span class="gr-eyebrow2">Awaiting prompt</span><strong>No answer until it's grounded.</strong></div>
                </div>
                <p class="gr-face__copy">Identity, scope, grounding and refusal run in order. The first failed layer stops the turn.</p>
                <span class="gr-face__hint">Try “How much do I still owe?” — then try asking for someone else's record.</span>
                <div class="gr-trace">
                  <span><i></i>IDENTITY</span><b></b>
                  <span><i></i>SCOPE</span><b></b>
                  <span><i></i>GROUNDING</span><b></b>
                  <span><i></i>REFUSAL</span>
                </div>
              </div>

              <div class="gr-face gr-face--block">
                <div class="gr-face__top">
                  <span class="gr-face__icon">${SHIELD_X}</span>
                  <div><span class="gr-eyebrow2">Blocked · scope</span><strong>I can't show another student's grades.</strong></div>
                </div>
                <p class="gr-face__copy">That request asks for a record outside your session. I can only read the identity attached to your sign-in.</p>
                <div class="gr-face__foot">
                  <span class="gr-tag gr-tag--block">Cross-student · refused</span>
                  <span class="gr-tag">identity ••31</span>
                  <span class="gr-face__ms">42 ms</span>
                </div>
              </div>

              <div class="gr-face gr-face--pass">
                <div class="gr-face__top">
                  <span class="gr-face__icon">${SHIELD_OK}</span>
                  <div><span class="gr-eyebrow2">Grounded · cited</span><strong>Here's how to clear your account.</strong></div>
                </div>
                <p class="gr-face__copy">Settle your outstanding balance of <b>₱4,756.94</b>, then request clearance from the registrar.</p>
                <div class="gr-face__foot">
                  <span class="gr-cite">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 1.8h5l3 3v9.4H4z"/><path d="M9 1.8v3.2h3M6.2 8h4M6.2 10.4h2.8"/></svg>
                    Student ledger · Oct 2026
                  </span>
                  <span class="gr-face__ms">214 ms</span>
                </div>
              </div>
            </article>
          </div>

          <div class="gr-composer">
            <div id="guardrail-prompt" class="gr-field" role="textbox" aria-label="Guardrail test prompt">
              <span class="gr-field__spark">
                <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M9 2.4 10.8 7l4.6 1.8-4.6 1.8L9 15.2l-1.8-4.6L2.6 8.8 7.2 7 9 2.4Z"/></svg>
              </span>
              <span class="field-text"></span><span class="caret"></span>
              <span class="gr-ph">Ask as student ••31…</span>
              <span class="gr-field__scope">identity scoped</span>
            </div>
            <button id="guardrail-send" class="gr-run" type="button"><span>Run guardrail test</span><kbd>↵</kbd></button>
            <div class="gr-foot"><span><i></i>Every run written to audit</span><span>Tools: read-only</span></div>
          </div>
        </section>

        <aside class="gr-stack">
          <div class="gr-stack__head"><div><strong>Four layers</strong><span>Applied to every turn</span></div><span class="gr-stack__count">04</span></div>
          ${LAYERS.map(
            (l) => `<div class="gr-layer" data-layer="${l.key}">
              <span class="gr-layer__n">${l.n}</span>
              <div class="gr-layer__body"><strong>${l.title}</strong><p>${l.copy}</p><span class="gr-layer__sub">${l.sub}</span></div>
              <span class="gr-layer__tag">${l.tag}</span>
            </div>`
          ).join('')}
          <div class="gr-stack__foot"><span>Cross-student reads</span><strong>0</strong><span>Uncited answers</span><strong>0</strong></div>
        </aside>
      </div>`;
    content.append(scene);

    const hr = headline(
      ['It responds with relevant &', 'reliable information.'],
      {
        className: 'display display-sm',
        top: '96px',
        left: '120px',
        width: '1660px',
      }
    );
    scene.querySelector('.gr-title').replaceWith(hr);

    // Measure targets before any entrance transform. Every push-in is clamped to
    // the console: the panel is shorter than the frame at 1.45x, so centring the
    // field would park the camera on bare page. Clamping keeps the console's
    // bottom edge flush and crops the (already established) header instead.
    const frame = { clamp: '.gr-console' };
    ia.type('#guardrail-prompt', "Show me another student's grades", { at: f(778), cps: 16, zoom: 1.55, ...frame });
    ia.click('#guardrail-send', { at: f(824), zoom: 1.5, focusDuration: 0.26, ...frame });
    ia.type('#guardrail-prompt', 'How do I clear my account?', { at: f(830), cps: 18, zoom: 1.45, ...frame });
    ia.click('#guardrail-send', { at: f(865), zoom: 1.45, focusDuration: 0.1, ...frame });
    ia.release({ at: f(866), duration: 0.12 });

    const tl = gsap.timeline();

    const layers = [...scene.querySelectorAll('.gr-layer')];
    const answer = scene.querySelector('#gr-answer');
    const idle = scene.querySelector('.gr-face--idle');
    const block = scene.querySelector('.gr-face--block');
    const pass = scene.querySelector('.gr-face--pass');
    const runLabel = scene.querySelector('#gr-run');
    const stateLabel = scene.querySelector('#gr-state');
    const caret = scene.querySelector('#guardrail-prompt .caret');

    tl.fromTo(scene.querySelector('.gr-head'), { y: -14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.36, ease: 'power2.out' }, 0);
    tl.fromTo(scene.querySelector('.gr-eyebrow'), { opacity: 0 }, { opacity: 1, duration: 0.28 }, 0.1);
    revealHeadline(tl, hr, { at: 0.04, duration: 0.5, stagger: 0.045 });
    retractHeadline(tl, hr, { at: 2.0, duration: 0.28 });
    tl.to(scene.querySelector('.gr-eyebrow'), { opacity: 0, duration: 0.24 }, 2.0);

    tl.fromTo(scene.querySelector('.gr-console'), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }, 0.1);
    tl.fromTo(scene.querySelector('.gr-stack'), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.44, ease: 'power3.out' }, 0.18);
    // The recent-runs panel used to fade at 0.82s, which left ~300px of dead
    // console above the answer for the whole test beat. It now stays: past runs
    // are the context that makes the refused run read as a pattern.

    // The push-in leaves the rail fully outside the frame; retire it so the
    // tighter zoom never catches a sliver of the column at the right edge.
    tl.set(scene.querySelector('.gr-stack'), { opacity: 0 }, f(782));

    // Four ticks, four layers.
    layers.forEach((layer, i) => {
      tl.fromTo(layer, { x: 18, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: 'power3.out' }, f(720 + i * 6));
    });

    // First run: refuse the cross-student request.
    tl.set(idle, { opacity: 0 }, f(824));
    tl.set(block, { opacity: 1 }, f(824));
    tl.fromTo(block, { y: 8, scale: 0.985 }, { y: 0, scale: 1, duration: 0.22, ease: 'power3.out' }, f(824));
    tl.set(answer, { borderColor: 'rgba(229,72,77,.32)', backgroundColor: '#fffdfd' }, f(824));
    tl.call(() => {
      runLabel.textContent = '01';
      stateLabel.textContent = 'Blocked · scope';
      stateLabel.classList.add('is-block');
      scene.querySelector('.gr-layer[data-layer="scope"]').classList.add('is-block');
    }, null, f(824));
    tl.fromTo(
      scene.querySelector('.gr-face--block .gr-face__icon'),
      { scale: 0.86 },
      { scale: 1, duration: 0.2, ease: 'back.out(2.4)', transformOrigin: '50% 50%' },
      f(828)
    );
    tl.to(caret, { opacity: 0, duration: 0.08 }, f(824));

    // Second run: own-record clearance question, grounded and cited.
    tl.set(block, { opacity: 0 }, f(865));
    tl.set(pass, { opacity: 1 }, f(865));
    tl.fromTo(pass, { y: 8, scale: 0.985 }, { y: 0, scale: 1, duration: 0.22, ease: 'power3.out' }, f(865));
    tl.set(answer, { borderColor: 'rgba(14,164,122,.34)', backgroundColor: '#fdfefd' }, f(865));
    tl.call(() => {
      stateLabel.textContent = 'Grounded · cited';
      stateLabel.classList.remove('is-block');
      stateLabel.classList.add('is-pass');
      scene.querySelector('.gr-layer[data-layer="scope"]').classList.remove('is-block');
      scene.querySelector('.gr-layer[data-layer="grounding"]').classList.add('is-pass');
    }, null, f(865));
    tl.set(scene.querySelector('.gr-cite'), { opacity: 1, y: 0 }, f(865));
    tl.fromTo(
      scene.querySelector('.gr-cite'),
      { scale: 1 },
      { scale: 1.045, duration: 0.1, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '0% 50%' },
      f(869)
    );

    // Hold the grounded answer on screen: the scene now runs to 8s so the
    // response is readable instead of flashing for a quarter of a second.
    tl.to(scene.querySelector('.gr-console'), { y: -5, duration: 1.7, ease: 'sine.inOut' }, f(870));
    tl.to(scene.querySelector('.gr-stack'), { y: -4, duration: 1.7, ease: 'sine.inOut' }, f(870));

    return tl;
  },
};
