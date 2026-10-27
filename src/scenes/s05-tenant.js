import { createDashboard } from '../ui/dashboard/index.js';
import { scasSeal } from '../design/logo.js';
import { DASHBOARD_DATA } from '../timeline/cues.js';

export default {
  id: 's05',
  start: 432,
  end: 576,
  build(ctx) {
    const { gsap, content, ia, cam } = ctx;
    const f = (n) => (n - 432) / 24;

    const scene = document.createElement('div');
    scene.className = 'wiz-scene';

    const bg = document.createElement('div');
    bg.className = 'wiz-bg';
    bg.append(createDashboard({ interactive: false }));
    scene.append(bg);

    scene.insertAdjacentHTML(
      'beforeend',
      `
      <div class="wiz-veil"></div>
      <div class="wiz-pulse"></div>

      <section class="wiz" role="dialog" aria-label="New assistant">
        <header class="wiz__head">
          <div class="wiz__id">
            ${scasSeal(30)}
            <div><span>New assistant</span><strong>Deploy on a portal</strong></div>
          </div>
          <button class="wiz__close" type="button" aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m3.5 3.5 9 9M12.5 3.5l-9 9"/></svg>
          </button>
        </header>

        <div class="wiz__steps">
          <span class="is-on"><i>1</i>Portal</span>
          <span><i>2</i>Identity</span>
          <span><i>3</i>Guardrails</span>
          <span><i>4</i>Deploy</span>
        </div>

        <div class="wiz__body">
          <label class="wz-label">Portal</label>
          <div class="wz-select">
            <span class="wz-select__mark">EU</span>
            <div><strong>SCAS Edusuite UNI</strong><span>scas.edusuite.asia · 214 sources</span></div>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m4 6 4 4 4-4"/></svg>
          </div>

          <label class="wz-label">Assistant name</label>
          <div id="assistant-name" class="wz-field" role="textbox" aria-label="Assistant name">
            <span class="field-text"></span><span class="caret"></span>
            <span class="wz-ph">Name this assistant</span>
            <span class="wz-field__scope">read-only</span>
          </div>

          <div id="toggle-personal" class="wz-toggle">
            <div class="wz-toggle__copy"><strong>Personal answers</strong><span>Own records only · token-scoped identity</span></div>
            <span class="wz-switch"><i></i></span>
          </div>

          <label class="wz-label">Guardrail preset</label>
          <div class="wz-presets">
            <button id="preset-grounded" class="wz-preset" type="button">
              <span class="wz-preset__icon">
                <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M9 2.2 15 4.4v4.3c0 3.6-2.5 6-6 7.1-3.5-1.1-6-3.5-6-7.1V4.4L9 2.2Z"/><path d="m6.6 8.8 1.7 1.7 3.2-3.3"/></svg>
              </span>
              <div><strong>Grounded + Silent</strong><span>Cite a source or refuse. Never guess.</span></div>
              <span class="wz-preset__check"><svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="m2 6.2 2.6 2.6L10 3.4"/></svg></span>
            </button>
            <button class="wz-preset is-muted" type="button">
              <span class="wz-preset__icon">
                <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="9" cy="9" r="6.4"/><path d="M3 9h12M9 2.6c2 2 2.9 4.1 2.9 6.4S11 13.4 9 15.4C7 13.4 6.1 11.3 6.1 9S7 4.6 9 2.6Z"/></svg>
              </span>
              <div><strong>Public only</strong><span>No identity, no personal data.</span></div>
              <span class="wz-preset__check"><svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="m2 6.2 2.6 2.6L10 3.4"/></svg></span>
            </button>
          </div>
        </div>

        <footer class="wiz__foot">
          <span class="wiz__hint"><i></i>Read-only · every answer cited or refused</span>
          <button id="deploy" class="wiz-deploy" type="button">
            <span class="wiz-deploy__ring">
              <svg viewBox="0 0 36 36" width="18" height="18"><circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="2.6"/><circle class="wiz-deploy__fill" cx="18" cy="18" r="15" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" transform="rotate(-90 18 18)" stroke-dasharray="94.2" stroke-dashoffset="94.2"/></svg>
            </span>
            <span class="wiz-deploy__label">Deploy assistant</span>
          </button>
        </footer>
      </section>

      <aside class="deploy-card" id="deploy-card">
        <div class="deploy-card__top">
          <span class="deploy-card__mark">${scasSeal(30)}</span>
          <span class="deploy-card__live"><i></i>Live</span>
        </div>
        <strong>SCAS Edusuite UNI</strong>
        <span class="deploy-card__meta">assistant · scas.edusuite.asia</span>
        <div class="deploy-card__tags">
          <span>${DASHBOARD_DATA.portals[0].sources}</span>
          <span>${DASHBOARD_DATA.portals[0].guardrail}</span>
        </div>
      </aside>`
    );
    content.append(scene);

    const wiz = scene.querySelector('.wiz');
    const card = scene.querySelector('.deploy-card');
    const deployBtn = scene.querySelector('#deploy');
    const toggle = scene.querySelector('#toggle-personal');
    const preset = scene.querySelector('#preset-grounded');
    const dof = scene.closest('.scene')?.querySelector('.ia-dof');

    // Measure interaction targets before any entrance transforms.
    ia.click('#assistant-name', { at: f(444), zoom: 1.8, focusDuration: 0.26 });
    ia.type('#assistant-name', 'SCAS Edusuite UNI', { at: f(450), cps: 8, zoom: 1.85 });
    ia.click('#toggle-personal', { at: f(508), zoom: 1.4, focusDuration: 0.3 });
    ia.click('#preset-grounded', { at: f(516), zoom: 1.3, focusDuration: 0.28 });
    ia.click('#deploy', { at: f(540), zoom: 1.5, focusDuration: 0.26 });
    ia.release({ at: f(546), duration: 0.3 });

    const tl = gsap.timeline();

    tl.fromTo(wiz, { xPercent: -50, yPercent: -50, y: 10, scale: 0.985, opacity: 1 }, { xPercent: -50, yPercent: -50, y: 0, scale: 1, opacity: 1, duration: 0.42, ease: 'power3.out' }, 0);
    tl.fromTo(scene.querySelector('.wiz-veil'), { opacity: 0.78 }, { opacity: 0, duration: 0.18, ease: 'power2.out' }, 0);
    tl.fromTo(scene.querySelector('.wiz-pulse'), { scale: 0.7, opacity: 0 }, { scale: 1.5, opacity: 0, duration: 0.7 }, 0);

    tl.call(() => toggle.classList.add('is-on'), null, f(508));
    tl.call(() => preset.classList.add('is-selected'), null, f(516));

    // Deploy: the radial ring completes exactly on f552.
    tl.call(() => {
      deployBtn.classList.add('is-deploying');
      deployBtn.querySelector('.wiz-deploy__label').textContent = 'Deploying…';
    }, null, f(540));
    tl.to(
      deployBtn.querySelector('.wiz-deploy__fill'),
      { strokeDashoffset: 0, duration: f(552) - f(540), ease: 'power2.inOut' },
      f(540)
    );
    tl.to(scene.querySelector('.wiz-pulse'), { scale: 2.4, opacity: 0.4, duration: 0.12 }, f(540));

    tl.call(() => {
      deployBtn.classList.add('is-deployed');
      deployBtn.querySelector('.wiz-deploy__label').textContent = 'Assistant live';
      scene.querySelector('.wiz-pulse').style.opacity = '0';
    }, null, f(552));

    // Drop the focus vignette the moment the run completes so the payoff is sharp.
    // The backdrop filter must be animated away: fading opacity alone still blurs.
    tl.to(dof, { opacity: 0, backdropFilter: 'blur(0px) saturate(1)', duration: 0.14 }, f(548));

    // Background resolves, then the new portal card materialises.
    tl.to(bg, { filter: 'blur(0px) saturate(1)', opacity: 0.9, duration: 0.55, ease: 'power2.out' }, f(552));
    tl.to(scene.querySelector('.wiz-veil'), { opacity: 0, duration: 0.4 }, f(552));
    tl.fromTo(card, { y: 26, scale: 0.94, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.45, ease: 'power3.out' }, f(550));
    tl.fromTo(
      card.querySelectorAll('.deploy-card__tags span'),
      { opacity: 0, y: 6 },
      { opacity: 1, y: 0, duration: 0.24, stagger: 0.06 },
      f(555)
    );

    const live = card.querySelector('.deploy-card__live');
    tl.to(live, { scale: 1.1, duration: 0.12, repeat: 3, yoyo: true, ease: 'sine.inOut', transformOrigin: '50% 50%' }, f(560));
    tl.to(card, { boxShadow: '0 34px 80px rgba(20,40,80,.18), 0 0 0 4px rgba(47,107,255,.1)', duration: 0.4 }, f(560));

    tl.to(wiz, { y: -18, scale: 0.965, opacity: 0, duration: 0.36, ease: 'power1.in' }, f(558));

    return tl;
  },
};
