import { headline, revealHeadline, retractHeadline } from '../design/headline.js';
import { createDashboard, animateDashboard } from '../ui/dashboard/index.js';

export default {
  id: 's04',
  start: 288,
  end: 432,
  build(ctx) {
    const { gsap, content, ia, cam } = ctx;
    const f = (n) => (n - 288) / 24;

    const scene = document.createElement('div');
    scene.className = 'dash-scene';
    scene.innerHTML = `
      <div class="dash-scene__bg">
        <div class="dash-scene__glow"></div>
        <div class="dash-scene__grid"></div>
      </div>
      <div class="dash-stage"><div class="dash-orbit"></div></div>
      <div class="dash-scrim"></div>
      <div class="dash-bloom"><i></i><b></b></div>`;
    content.append(scene);

    const orbit = scene.querySelector('.dash-orbit');
    const dash = createDashboard();
    orbit.append(dash);

    const hl = headline(['The control room.'], {
      className: 'display display-md',
      top: '8px',
      left: '120px',
      width: '1460px',
    });
    scene.append(hl);

    // Interactions are measured while the dashboard is still flat.
    ia.moveCursor('#new-assistant', { at: f(390), duration: 0.3 });
    ia.callback(() => {
      const btn = document.querySelector('#new-assistant');
      if (btn) btn.classList.add('is-hover');
    }, f(408));
    ia.callback(() => {
      const btn = document.querySelector('#new-assistant');
      if (btn) btn.classList.remove('is-hover');
    }, f(415));
    ia.click('#new-assistant', { at: f(414), zoom: 1.9, focusDuration: 0.26 });
    ia.release({ at: f(426), duration: 0.24 });
    ia.hideCursor(f(429), 0.06);

    const tl = gsap.timeline();

    gsap.set(dash, {
      rotateY: -14,
      rotateX: 8,
      z: -340,
      scale: 0.9,
      transformPerspective: 2400,
      transformOrigin: '50% 44%',
      opacity: 1,
    });

    tl.fromTo(
      dash,
      { rotateY: -14, rotateX: 8, z: -340, scale: 0.9, opacity: 1 },
      { rotateY: 0, rotateX: 0, z: 0, scale: 1, opacity: 1, duration: 1.2, ease: 'power4.out' },
      0
    );

    tl.fromTo(
      orbit,
      { rotateY: 2.4, x: 10 },
      { rotateY: -1.6, x: -6, duration: 5.4, ease: 'sine.inOut' },
      0
    );

    animateDashboard(tl, dash, { at: 0.5, stagger: 0.25, countAt: 0.55, drawAt: 0.8 });

    const bg = scene.querySelector('.dash-scene__bg');
    tl.fromTo(bg, { opacity: 0.9 }, { opacity: 1, duration: 0.5 }, 0);

    tl.fromTo(
      scene.querySelector('.dash-scrim'),
      { opacity: 0 },
      { opacity: 1, duration: 0.24, ease: 'power2.out' },
      0.06
    );

    revealHeadline(tl, hl, { at: 0.04, duration: 0.66, stagger: 0.06 });
    retractHeadline(tl, hl, { at: 3.58, duration: 0.34 });
    tl.to(scene.querySelector('.dash-scrim'), { opacity: 0, duration: 0.5, ease: 'power2.inOut' }, 3.48);

    // Camera settles fully when the button is already pressed.
    tl.to(cam, { rotation: 0, duration: 0.2 }, 0);

    // Click bloom: white expands from the button after the ring.
    tl.to(scene.querySelector('.dash-bloom i'), { scale: 58, duration: 0.33, ease: 'power1.in' }, f(424));
    tl.to(scene.querySelector('.dash-bloom b'), { scale: 6, opacity: 0, duration: 0.3, ease: 'power2.in' }, f(424));
    tl.set(scene.querySelector('.dash-bloom'), { opacity: 1 }, f(424));
    tl.set(scene.querySelector('.dash-bloom b'), { opacity: 0.55 }, f(424));

    return tl;
  },
};
