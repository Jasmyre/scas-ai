import { gsap } from 'gsap';

const CURSOR_SVG = `
<svg viewBox="0 0 26 26" width="26" height="26" aria-hidden="true">
  <path d="M5 2.2 20.4 12.6l-6.9 1.2 3.7 6.7-2.9 1.6-3.7-6.7-5.1 4.8V2.2Z"
    fill="#ffffff" stroke="#0b0c0e" stroke-width="1.35" stroke-linejoin="round"/>
</svg>`;

/**
 * Interaction director.
 * Build-time API: adds deterministic tweens to its own timeline.
 * Add `ia.timeline` to the scene timeline at 0.
 */
export function createInteraction({ layer, scene }) {
  const cam = layer.cam;
  const cursorLayer = layer.cursorLayer;
  const dofEl = layer.dof;
  const tl = gsap.timeline();
  let camState = { x: 0, y: 0, scale: 1 };

  const cursor = document.createElement('div');
  cursor.className = 'ia-cursor';
  cursor.innerHTML = CURSOR_SVG;
  cursor.style.opacity = '0';
  cursorLayer.append(cursor);

  function rectOf(selector) {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el) {
      console.warn(`[interaction:${scene.id}] missing target`, selector);
      return { left: 860, top: 480, width: 200, height: 60, cx: 960, cy: 510 };
    }
    const r = el.getBoundingClientRect();
    return {
      left: r.left,
      top: r.top,
      width: r.width,
      height: r.height,
      cx: r.left + r.width / 2,
      cy: r.top + r.height / 2,
    };
  }

  function screenOf(rect) {
    return {
      x: rect.cx * camState.scale + camState.x,
      y: rect.cy * camState.scale + camState.y,
    };
  }

  function showCursor(at) {
    tl.set(cursor, { opacity: 1 }, at);
  }

  function hideCursor(at, duration = 0.2) {
    tl.to(cursor, { opacity: 0, duration }, at);
  }

  function makeRing(x, y, at, size = 26) {
    const ring = document.createElement('div');
    ring.className = 'ia-ring';
    ring.style.width = `${size}px`;
    ring.style.height = `${size}px`;
    ring.style.left = `${x}px`;
    ring.style.top = `${y}px`;
    ring.style.opacity = '0';
    cursorLayer.append(ring);
    tl.set(ring, { xPercent: -50, yPercent: -50, opacity: 1, scale: 0.35 }, at);
    tl.to(ring, { scale: 2.8, opacity: 0, duration: 0.42, ease: 'power2.out' }, at);
  }

  function makeKeyPulse(x, y, at) {
    const dot = document.createElement('div');
    dot.className = 'ia-key';
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    cursorLayer.append(dot);
    tl.set(dot, { xPercent: -50, yPercent: -50, opacity: 0.9, scale: 0.4 }, at);
    tl.to(dot, { scale: 2.2, opacity: 0, duration: 0.22, ease: 'power2.out' }, at);
  }

  function press(selector, at) {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el) return;
    tl.fromTo(
      el,
      { filter: 'brightness(1)' },
      { filter: 'brightness(0.93)', duration: 0.045, yoyo: true, repeat: 1, ease: 'none' },
      at
    );
  }

  function setDof(x, y, w, h, blur = 9) {
    dofEl.style.setProperty('--dof-x', `${x}px`);
    dofEl.style.setProperty('--dof-y', `${y}px`);
    dofEl.style.setProperty('--dof-w', `${Math.max(120, w + 56)}px`);
    dofEl.style.setProperty('--dof-h', `${Math.max(72, h + 40)}px`);
    dofEl.style.setProperty('--dof-blur', `${blur}px`);
  }

  /**
   * Clamp a centred transform so `region` still covers the frame.
   *
   * Centring a control is only safe when the surrounding surface is big enough
   * to fill the viewport. A console that is shorter than the frame at 1.45x
   * would otherwise leave bare page under the zoom. When the region is smaller
   * than the frame at this scale, it is centred instead — there is nothing to
   * clamp against.
   */
  function clampTo(region, scale, tx, ty) {
    const sx = region.width * scale;
    const sy = region.height * scale;
    if (sx >= 1920) {
      const lo = 1920 - (region.left + region.width) * scale;
      const hi = -region.left * scale;
      tx = Math.min(hi, Math.max(lo, tx));
    } else {
      tx = 960 - region.cx * scale;
    }
    if (sy >= 1080) {
      const lo = 1080 - (region.top + region.height) * scale;
      const hi = -region.top * scale;
      ty = Math.min(hi, Math.max(lo, ty));
    } else {
      ty = 540 - region.cy * scale;
    }
    return { tx, ty };
  }

  function focus(selector, { at = 0, scale = 1.6, duration = 0.3, dof = true, blur = 9, clamp = null } = {}) {
    const r = rectOf(selector);
    let tx = 960 - r.cx * scale;
    let ty = 540 - r.cy * scale;
    if (clamp) ({ tx, ty } = clampTo(rectOf(clamp), scale, tx, ty));

    tl.to(cam, { x: tx, y: ty, scale, duration, ease: 'power3.inOut' }, at);
    camState = { x: tx, y: ty, scale };

    // Where the control actually lands on screen (not the frame centre) — the
    // cursor and the depth-of-field plate have to agree with the composition.
    const screenX = r.cx * scale + tx;
    const screenY = r.cy * scale + ty;

    if (dof) {
      tl.call(() => setDof(screenX, screenY, r.width * scale, r.height * scale, blur), null, at + 0.02);
      tl.to(dofEl, { opacity: 1, duration: 0.14 }, at + 0.02);
    }
    return { tx, ty, scale, screenX, screenY, rect: r };
  }

  function moveCursor(selector, { at = 0, duration = 0.2 } = {}) {
    const r = rectOf(selector);
    const p = screenOf(r);
    showCursor(at - duration);
    tl.to(cursor, { x: p.x, y: p.y, duration, ease: 'power2.out' }, at - duration);
    return p;
  }

  function click(selector, { at = 0, zoom = 1.4, move = 0.22, focusDuration = 0.3, clamp = null, blur = 9 } = {}) {
    const r = rectOf(selector);
    const from = screenOf(r);
    showCursor(at - move);
    tl.to(cursor, { x: from.x, y: from.y, duration: move, ease: 'power2.out' }, at - move);
    press(selector, at);

    if (zoom && zoom !== 1) {
      const f = focus(selector, { at, scale: zoom, duration: focusDuration, clamp, blur });
      tl.to(cursor, { x: f.screenX, y: f.screenY, duration: focusDuration, ease: 'power3.inOut' }, at);
      makeRing(f.screenX, f.screenY, at + focusDuration);
      return at + focusDuration;
    }

    makeRing(from.x, from.y, at);
    return at;
  }

  function release({ at = 0, duration = 0.34, hide = true } = {}) {
    tl.to(cam, { x: 0, y: 0, scale: 1, duration, ease: 'power3.inOut' }, at);
    camState = { x: 0, y: 0, scale: 1 };
    tl.to(dofEl, { opacity: 0, duration: 0.2 }, at + 0.04);
    if (hide) hideCursor(at + duration * 0.45, 0.2);
  }

  function type(selector, text, { at = 0, cps = 12, zoom = 1.8, focusDuration = 0.28, dof = true, blur = 9, clamp = null } = {}) {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el) {
      console.warn(`[interaction:${scene.id}] missing type target`, selector);
      return at;
    }
    const field = el.querySelector('.field-text') || el;
    const caret = el.querySelector('.caret');
    const r = rectOf(el);
    const from = screenOf(r);
    const chars = [...text];

    showCursor(at - 0.18);
    tl.to(cursor, { x: from.x, y: from.y, duration: 0.18, ease: 'power2.out' }, at - 0.18);

    let typed = { screenX: 960, screenY: 540 };
    if (zoom && zoom !== 1) {
      typed = focus(el, { at: at - 0.12, scale: zoom, duration: focusDuration, dof, blur, clamp });
      tl.to(cursor, { x: typed.screenX, y: typed.screenY, duration: focusDuration, ease: 'power3.inOut' }, at - 0.12);
      makeRing(typed.screenX, typed.screenY, at - 0.12 + focusDuration);
    } else {
      makeRing(from.x, from.y, at);
    }

    // Deterministic typewriter: state is a pure function of timeline progress.
    const proxy = { p: 0 };
    tl.set(field, { textContent: '' }, 0);
    tl.to(
      proxy,
      {
        p: 1,
        duration: chars.length / cps,
        ease: 'none',
        onUpdate: () => {
          const n = Math.round(proxy.p * chars.length);
          field.textContent = chars.slice(0, n).join('');
        },
      },
      at
    );

    const step = 1 / cps;
    for (let i = 0; i < chars.length; i += 1) {
      makeKeyPulse(typed.screenX, typed.screenY + Math.min(28, r.height * 0.22), at + i * step);
    }

    const end = at + chars.length / cps;

    if (caret) {
      tl.set(caret, { opacity: 1 }, at - 0.1);
      const blinks = Math.max(1, Math.ceil((end - at) / 0.5));
      for (let i = 0; i < blinks; i += 1) {
        tl.to(caret, { opacity: 0, duration: 0.04 }, at + i * 0.5 + 0.25);
        tl.to(caret, { opacity: 1, duration: 0.04 }, at + i * 0.5 + 0.29);
      }
    }

    return end;
  }

  function drop(selector, { at = 0, zoom = 1.6, from = '#drag-source' } = {}) {
    const target = rectOf(selector);
    const source = rectOf(from);
    const p0 = screenOf(source);
    const p1 = screenOf(target);
    showCursor(at - 0.5);
    tl.to(cursor, { x: p0.x, y: p0.y, duration: 0.18, ease: 'power2.out' }, at - 0.5);
    tl.to(cursor, { x: p1.x, y: p1.y, duration: 0.34, ease: 'power2.inOut' }, at - 0.3);
    press(selector, at);
    makeRing(p1.x, p1.y, at, 30);
    if (zoom !== 1) focus(selector, { at, scale: zoom, duration: 0.3 });
    return at + 0.3;
  }

  function highlight(selector, { at = 0, duration = 0.45, color = 'rgba(47,107,255,.14)' } = {}) {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (!el) return;
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    const overlay = document.createElement('div');
    overlay.className = 'ia-highlight';
    overlay.style.background = color;
    overlay.style.opacity = '0';
    el.append(overlay);
    tl.to(overlay, { opacity: 1, duration: 0.1, ease: 'none' }, at);
    tl.to(overlay, { opacity: 0, duration: 0.25, ease: 'none' }, at + Math.max(0.12, duration - 0.25));
  }

  function callback(fn, at) {
    tl.call(fn, null, at);
  }

  return {
    timeline: tl,
    cursor,
    focus,
    release,
    click,
    type,
    moveCursor,
    drop,
    highlight,
    press,
    showCursor,
    hideCursor,
    rectOf,
    screenOf,
    callback,
  };
}
