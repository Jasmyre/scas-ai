// Shared building blocks for the SCAS portal replica + chat scene chrome.
// Everything here is 1920x1080 native; scenes animate with GSAP timelines.

/** Official-looking scalloped seal (pure SVG, no external assets). */
export function portalSeal(size = 42) {
  const lobes = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const cx = 32 + Math.cos(a) * 25.5;
    const cy = 32 + Math.sin(a) * 25.5;
    return `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="6.6" fill="#3a7bf0"/>`;
  }).join('');

  return `
  <svg class="portal-seal__svg" width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="32" cy="32" r="26.4" fill="#2f6bff"/>
    ${lobes}
    <circle cx="32" cy="32" r="26.4" fill="#2f6bff"/>
    <circle cx="32" cy="32" r="22.6" fill="#f3f4ff"/>
    <circle cx="32" cy="32" r="21.2" fill="none" stroke="#b9c4e8" stroke-width="1.1"/>
    <circle cx="32" cy="32" r="18.6" fill="#fbfbff" stroke="#d7dcf2" stroke-width="0.9"/>
    <path d="M21.5 21.5h21v13.2c0 4.6-4.7 8.3-10.5 10.6-5.8-2.3-10.5-6-10.5-10.6V21.5Z" fill="#f7f8ff" stroke="#c2c8e2" stroke-width="0.9"/>
    <path d="M32 22.2v22.3" stroke="#c2c8e2" stroke-width="0.8"/>
    <path d="M22.2 30h19.6" stroke="#c2c8e2" stroke-width="0.8"/>
    <circle cx="27.2" cy="26.4" r="2.9" fill="#4c9a6a"/>
    <path d="M26.2 26.4a1.5 1.5 0 0 1 2.9 0" stroke="#d9f0df" stroke-width="0.7"/>
    <path d="M36 23.2c1.8 0 3.1 1.5 3.1 3.4 0 2.3-2 3.6-4.4 4.3" stroke="#e07a2f" stroke-width="1.7" stroke-linecap="round"/>
    <path d="M25.4 33.4v2.5a2.6 2.6 0 0 0 5.2 0v-2.5" stroke="#4c9a6a" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M34.2 35.9l1.3-3.5 4.6 1.2-1.1 3.2-4.8-.9Z" fill="#c9a06f"/>
    <path d="M34.2 35.9l4.8.9" stroke="#a9825a" stroke-width="0.7"/>
    <rect x="23.4" y="42.1" width="17.2" height="2.5" rx="1.2" fill="#8a71c4"/>
    <rect x="26.2" y="46.3" width="11.6" height="1.9" rx="0.95" fill="#9d8bd0"/>
  </svg>`;
}

export function portalHomeIcon(size = 26) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2.9 2.9 10.2A3.1 3.1 0 0 0 1.8 12.6v5.2A3.2 3.2 0 0 0 5 21h14a3.2 3.2 0 0 0 3.2-3.2v-5.2a3.1 3.1 0 0 0-1.1-2.4L12 2.9Z"
      fill="#4ec3f5" stroke="#4ec3f5" stroke-width="2.4" stroke-linejoin="round"/>
    <rect x="9.9" y="16.1" width="4.2" height="1.7" rx="0.85" fill="#ffffff"/>
  </svg>`;
}

export function portalPaymentsIcon(size = 28) {
  const h = (size * 26) / 30;
  return `<svg width="${size}" height="${h}" viewBox="0 0 30 26" fill="none" aria-hidden="true">
    <rect x="2" y="6.3" width="26" height="17.2" rx="3.4" stroke="#4a4a4a" stroke-width="2.1"/>
    <path d="M10.4 6.3V4.7a2.4 2.4 0 0 1 2.4-2.4h4.4a2.4 2.4 0 0 1 2.4 2.4v1.6"
      stroke="#4a4a4a" stroke-width="2.1" stroke-linecap="round"/>
    <text x="15" y="18.8" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="11.4"
      font-weight="700" fill="#4a4a4a">$</text>
  </svg>`;
}

export function portalChevron(size = 12, color = '#8e8e8e') {
  return `<svg width="${size}" height="${size}" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.4 4.4 6 8l3.6-3.6" stroke="${color}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

/** Big screen-fixed narration headline. Lives above the camera, inside the scene layer. */
export function sceneHeadline(ctx, lines, options = {}) {
  const {
    top = null,
    bottom = null,
    left = 108,
    width = 1700,
    size = 120,
    align = 'left',
    scrim = false,
    scrimAlign = 'left',
    id = '',
  } = options;

  const wrap = document.createElement('div');
  wrap.className = 'scene-headline';
  if (id) wrap.id = id;
  wrap.style.left = `${left}px`;
  wrap.style.width = `${width}px`;
  wrap.style.fontSize = `${size}px`;
  wrap.style.textAlign = align;
  if (top !== null) wrap.style.top = `${top}px`;
  if (bottom !== null) wrap.style.bottom = `${bottom}px`;

  const list = Array.isArray(lines) ? lines : [lines];
  wrap.innerHTML =
    (scrim ? `<span class="scene-headline__scrim is-${scrimAlign}"></span>` : '') +
    list
      .map(
        (line) =>
          `<span class="scene-headline__line"><span class="scene-headline__inner">${line}</span></span>`
      )
      .join('');

  ctx.layer.el.append(wrap);
  return wrap;
}

export function revealHeadline(tl, el, { at = 0, stagger = 0.075, duration = 0.72 } = {}) {
  tl.fromTo(
    el.querySelectorAll('.scene-headline__inner'),
    { yPercent: 112, opacity: 0 },
    { yPercent: 0, opacity: 1, duration, stagger, ease: 'power4.out' },
    at
  );
  if (el.querySelector('.scene-headline__scrim')) {
    tl.fromTo(el.querySelector('.scene-headline__scrim'), { opacity: 0 }, { opacity: 1, duration: 0.5 }, at);
  }
  return at + duration + stagger;
}

export function retractHeadline(tl, el, { at = 0, duration = 0.44, stagger = 0.035 } = {}) {
  if (el.querySelector('.scene-headline__scrim')) {
    tl.to(el.querySelector('.scene-headline__scrim'), { opacity: 0, duration: 0.3 }, at);
  }
  const inners = el.querySelectorAll('.scene-headline__inner');
  tl.to(inners, { yPercent: -112, duration, stagger, ease: 'power3.in' }, at);
  // Fade out ahead of the slide: the tail of the last descender is the only ink left
  // at the end of the move, and at full slide alpha it reads as a stray grey speck.
  tl.to(inners, { opacity: 0, duration: duration * 0.62, stagger: stagger * 0.5, ease: 'power2.in' }, at);
  return at + duration + stagger;
}

/** Camera move, clamped to the 1920x1080 page. Look at (cx,cy) with `scale`. */
export function camTo(
  tl,
  cam,
  { at = 0, duration = 0.6, cx = 960, cy = 540, scale = 1, ease = 'power3.inOut', clamp = true } = {}
) {
  let x = 960 - cx * scale;
  let y = 540 - cy * scale;
  if (clamp) {
    x = Math.min(0, Math.max(1920 - 1920 * scale, x));
    y = Math.min(0, Math.max(1080 - 1080 * scale, y));
  }
  return tl.to(cam, { x, y, scale, duration, ease }, at);
}

export function money(value) {
  return Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Count an amount up/down. Element text is replaced with formatted money. */
export function countAmount(tl, el, to, { at = 0, duration = 1, from = 0, ease = 'power2.out' } = {}) {
  const proxy = { v: from };
  tl.to(
    proxy,
    {
      v: to,
      duration,
      ease,
      onUpdate: () => {
        el.textContent = money(proxy.v);
      },
    },
    at
  );
  return at + duration;
}

/** Expanding ripple used for launcher / notification beats. */
export function ripple(ctx, x, y, { at = 0, tl, size = 46, color = 'rgba(47,107,255,.45)', duration = 0.75 } = {}) {
  const ring = document.createElement('span');
  ring.className = 'scene-ripple';
  ring.style.left = `${x}px`;
  ring.style.top = `${y}px`;
  ring.style.width = `${size}px`;
  ring.style.height = `${size}px`;
  ring.style.borderColor = color;
  ctx.layer.el.append(ring);
  tl.fromTo(
    ring,
    { scale: 0.35, opacity: 0.9 },
    { scale: 2.6, opacity: 0, duration, ease: 'power2.out' },
    at
  );
  return ring;
}
