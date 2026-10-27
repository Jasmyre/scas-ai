import './design.css';

export function headline(lines, options = {}) {
  const {
    className = 'display display-lg',
    top = '120px',
    left = '120px',
    width = '1500px',
    align = 'left',
    color = '',
  } = options;

  const wrap = document.createElement('div');
  wrap.className = 'headline';
  wrap.style.top = top;
  wrap.style.left = left;
  wrap.style.width = width;
  wrap.style.textAlign = align;
  if (color) wrap.style.color = color;

  const list = Array.isArray(lines) ? lines : [lines];
  for (const item of list) {
    const line = document.createElement('span');
    line.className = 'headline__line';
    const inner = document.createElement('span');
    inner.className = 'headline__inner';
    if (typeof item === 'string') {
      inner.innerHTML = item;
    } else {
      inner.innerHTML = item.text;
      if (item.className) inner.classList.add(...item.className.split(' '));
    }
    line.append(inner);
    wrap.append(line);
  }
  wrap.classList.add(...className.split(' '));
  return wrap;
}

export function revealHeadline(tl, el, { at = 0, stagger = 0.09, duration = 0.62, y = '110%' } = {}) {
  const inners = el.querySelectorAll('.headline__inner');
  tl.fromTo(
    inners,
    { yPercent: 110, skewY: 4, opacity: 0 },
    { yPercent: 0, skewY: 0, opacity: 1, duration, stagger, ease: 'power4.out' },
    at
  );
  return at + duration + stagger * Math.max(0, inners.length - 1);
}

export function retractHeadline(tl, el, { at = 0, duration = 0.4, stagger = 0.04 } = {}) {
  const inners = el.querySelectorAll('.headline__inner');
  tl.to(
    inners,
    { yPercent: -110, skewY: -3, opacity: 0, duration, stagger, ease: 'power3.in' },
    at
  );
  return at + duration;
}
