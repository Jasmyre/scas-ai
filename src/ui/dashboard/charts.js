// Deterministic SVG chart helpers for the SCAS dashboard.

function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i === 0 ? 0 : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

export function sparklineSVG(values, { w = 112, h = 34, stroke = 'var(--brand)' } = {}) {
  const pad = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => ({
    x: pad + (i / Math.max(1, values.length - 1)) * (w - pad * 2),
    y: h - pad - ((v - min) / span) * (h - pad * 2),
  }));
  const line = smoothPath(pts);
  const area = `${line} L ${pts[pts.length - 1].x.toFixed(2)} ${h} L ${pts[0].x.toFixed(2)} ${h} Z`;
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
    <path class="spark-area" d="${area}" fill="${stroke}" opacity=".07"/>
    <path class="spark-line" d="${line}" pathLength="1" fill="none" stroke="${stroke}" stroke-width="1.6" stroke-linecap="round"/>
  </svg>`;
}

export function conversationChart(values, { w = 700, h = 220 } = {}) {
  const padL = 6;
  const padR = 6;
  const padT = 18;
  const padB = 8;
  const max = 1800;
  const step = (w - padL - padR) / values.length;
  const barW = Math.min(46, step * 0.52);
  const base = h - padB;
  const plotH = base - padT;

  const bars = values
    .map((v, i) => {
      const height = (v / max) * plotH;
      const x = padL + step * i + (step - barW) / 2;
      return `<rect class="chart-bar" x="${x.toFixed(2)}" y="${(base - height).toFixed(2)}" width="${barW.toFixed(
        2
      )}" height="${height.toFixed(2)}" rx="6" fill="var(--brand)" opacity=".12"/>`;
    })
    .join('');

  const pts = values.map((v, i) => ({
    x: padL + step * i + step / 2,
    y: base - (v / max) * plotH,
  }));
  const line = smoothPath(pts);
  const area = `${line} L ${pts[pts.length - 1].x.toFixed(2)} ${base} L ${pts[0].x.toFixed(2)} ${base} Z`;
  const dots = pts
    .map((p, i) => {
      const on = i === pts.length - 1;
      return `<circle class="chart-dot ${on ? 'is-last' : ''}" cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(
        2
      )}" r="${on ? 4.5 : 2.4}" fill="${on ? 'var(--brand)' : '#fff'}" stroke="var(--brand)" stroke-width="${
        on ? 0 : 1.6
      }" opacity="${on ? 1 : 0.55}"/>`;
    })
    .join('');

  const grid = [0.25, 0.5, 0.75]
    .map((p) => {
      const y = padT + plotH * p;
      return `<line x1="${padL}" x2="${w - padR}" y1="${y.toFixed(2)}" y2="${y.toFixed(
        2
      )}" stroke="#eef0f4" stroke-width="1" stroke-dasharray="2 5"/>`;
    })
    .join('');

  return `<svg class="chart-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
    ${grid}
    <defs>
      <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2f6bff" stop-opacity=".16"/>
        <stop offset="1" stop-color="#2f6bff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${bars}
    <path class="chart-area" d="${area}" fill="url(#chartFill)"/>
    <path class="chart-line" d="${line}" pathLength="1" fill="none" stroke="var(--brand)" stroke-width="2.4" stroke-linecap="round"/>
    ${dots}
  </svg>`;
}
