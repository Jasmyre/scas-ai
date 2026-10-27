import { DASHBOARD_DATA } from '../../timeline/cues.js';
import { scasSeal } from '../../design/logo.js';
import { conversationChart, sparklineSVG } from './charts.js';
import './panels.css';

const NAV = [
  ['Overview', 'overview'],
  ['Portals', 'portals'],
  ['Assistants', 'assistants'],
  ['Knowledge', 'knowledge'],
  ['Guardrails', 'guardrails'],
  ['Conversations', 'conversations'],
  ['Audit', 'audit'],
];

const ICONS = {
  overview: '<rect x="2.5" y="2.5" width="5.5" height="5.5" rx="1.4"/><rect x="10" y="2.5" width="5.5" height="5.5" rx="1.4"/><rect x="2.5" y="10" width="5.5" height="5.5" rx="1.4"/><rect x="10" y="10" width="5.5" height="5.5" rx="1.4"/>',
  portals: '<rect x="2.5" y="3.5" width="13" height="11" rx="2"/><path d="M2.5 7.5h13M6 3.5v4"/>',
  assistants: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h5A2.5 2.5 0 0 1 14 6.5v3A2.5 2.5 0 0 1 11.5 12H8l-3 2.4V12A2.5 2.5 0 0 1 4 9.5v-3Z"/><circle cx="7.4" cy="8" r=".8" fill="currentColor" stroke="none"/><circle cx="10.6" cy="8" r=".8" fill="currentColor" stroke="none"/>',
  knowledge: '<path d="M3 4.5A1.5 1.5 0 0 1 4.5 3H8v12H4.5A1.5 1.5 0 0 1 3 13.5v-9Z"/><path d="M15 4.5A1.5 1.5 0 0 0 13.5 3H10v12h3.5a1.5 1.5 0 0 0 1.5-1.5v-9Z"/>',
  guardrails: '<path d="M9 2.6 14.5 4.6v4.2c0 3.4-2.4 5.8-5.5 6.9-3.1-1.1-5.5-3.5-5.5-6.9V4.6L9 2.6Z"/><path d="m6.8 8.7 1.6 1.6 3.1-3.2"/>',
  conversations: '<path d="M3 4.5h12v8H8.5L5 15.4v-2.9H3v-8Z"/><path d="M6 7.6h6M6 9.8h4"/>',
  audit: '<path d="M4 2.8h6.5L14 6.3v8.9H4z"/><path d="M10.2 2.8v3.7H14M6.4 9.2h5.2M6.4 11.6h3.6"/>',
};

const PORTAL_GLYPHS = {
  edusuite:
    '<rect x="3" y="3" width="7" height="7" rx="1.8"/><rect x="12" y="3" width="7" height="7" rx="1.8"/><rect x="3" y="12" width="7" height="7" rx="1.8"/><path d="M15.5 14.5v4M13.5 16.5h4"/>',
  admissions:
    '<path d="M5 2.8h9l4 4v12.4H5z"/><path d="M14 2.8v4.2h4"/>',
  site: '<circle cx="11" cy="11" r="8"/><path d="M3 11h16M11 3c2.4 2.2 3.6 5 3.6 8S13.4 16.8 11 19c-2.4-2.2-3.6-5-3.6-8S8.6 5.2 11 3Z"/>',
};

const KPI_SPARKS = [
  [1, 1, 2, 2, 2, 3, 3],
  [9840, 10240, 10980, 11450, 11890, 12110, 12480],
  [97.4, 97.9, 98.1, 98.3, 98.4, 98.6, 98.7],
  [78, 70, 64, 58, 52, 47, 41],
];

const CHART_VALUES = [1180, 1320, 1260, 1580, 1490, 1720, 1610];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function icon(name, size = 16) {
  return `<svg class="dash-ico" width="${size}" height="${size}" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

function portalGlyph(kind) {
  return `<span class="dash-portal__mark"><svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PORTAL_GLYPHS[kind]}</svg></span>`;
}

function countAttrs(value) {
  const suffix = value.includes('%') ? '%' : '';
  const comma = value.includes(',') ? '1' : '0';
  const raw = value.replace(/,/g, '').replace('%', '');
  const decimals = raw.includes('.') ? raw.split('.')[1].length : 0;
  return `data-count="${raw}" data-decimals="${decimals}" data-comma="${comma}" data-suffix="${suffix}"`;
}

function fmtCount(v, decimals = 0, comma = false, suffix = '') {
  const fixed = Number(v).toFixed(decimals);
  const out = comma ? Number(fixed).toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : fixed;
  return `${out}${suffix}`;
}

export function createDashboard({ interactive = true } = {}) {
  const el = document.createElement('div');
  el.className = 'dash';

  const nav = NAV.map(
    ([label, key], i) =>
      `<div class="dash-nav__item ${i === 0 ? 'is-active' : ''}">${icon(key)}<span>${label}</span>${
        key === 'audit' ? '<em class="dash-nav__count">8</em>' : ''
      }</div>`
  ).join('');

  const kpis = DASHBOARD_DATA.kpis
    .map((k, i) => {
      const down = k.delta.trim().startsWith('−') || k.delta.trim().startsWith('-');
      return `<div class="dash-kpi">
        <div class="dash-kpi__top"><span>${k.label}</span>${sparklineSVG(KPI_SPARKS[i], {
          stroke: i === 2 ? 'var(--success)' : 'var(--brand)',
        })}</div>
        <strong ${countAttrs(k.value)}>${k.value}</strong>
        <em class="${down ? 'is-down' : ''}"><i></i>${k.delta}</em>
      </div>`;
    })
    .join('');

  const portals = DASHBOARD_DATA.portals
    .map((p, i) => {
      const kind = i === 0 ? 'edusuite' : i === 1 ? 'admissions' : 'site';
      const live = p.status === 'Live';
      return `<div class="dash-portal" data-portal="${i}">
        <div class="dash-portal__top">${portalGlyph(kind)}<span class="dash-status ${
        live ? 'is-live' : 'is-draft'
      }"><i></i>${p.status}</span></div>
        <strong class="dash-portal__name">${p.name}</strong>
        <span class="dash-portal__meta">${p.meta}</span>
        <div class="dash-portal__tags"><span>${p.sources}</span><span>${p.guardrail}</span></div>
        <div class="dash-portal__foot"><span class="dash-portal__meter"><i></i><i></i><i></i><i></i><i></i></span><span>Open ↗</span></div>
      </div>`;
    })
    .join('');

  const intents = DASHBOARD_DATA.intents
    .map(
      (it) =>
        `<div class="dash-intent"><div class="dash-intent__row"><label>${it.label}</label><em>${it.pct}%</em></div><div class="dash-intent__track"><span data-w="${it.pct}"></span></div></div>`
    )
    .join('');

  const activity = DASHBOARD_DATA.activity
    .map((a) => {
      const refused = a.tool.startsWith('refused');
      return `<div class="dash-act ${refused ? 'is-refused' : ''}">
        <span class="dash-act__dot"></span>
        <div class="dash-act__main"><strong>${a.tool}</strong><span>${a.scope}</span></div>
        <span class="dash-act__out">${refused ? 'Refused' : 'Cited'}</span>
        <span class="dash-act__ms">${a.ms}</span>
      </div>`;
    })
    .join('');

  const newBtn = interactive
    ? '<button id="new-assistant" class="dash-new" type="button"><span class="dash-new__plus">+</span>New assistant</button>'
    : '<button class="dash-new" type="button"><span class="dash-new__plus">+</span>New assistant</button>';

  el.innerHTML = `
    <aside class="dash-side">
      <div class="dash-brand">
        ${scasSeal(34)}
        <div><strong>SCAS AI</strong><span>${DASHBOARD_DATA.admin}</span></div>
      </div>
      <div class="dash-navlabel">Workspace</div>
      <nav class="dash-nav">${nav}</nav>
      <div class="dash-side__foot">
        <div class="dash-sys"><span class="dash-sys__dot"></span><div><strong>All systems grounded</strong><span>Policy active on 3 portals</span></div></div>
        <div class="dash-admin">
          <div class="dash-admin__avatar">JL</div>
          <div><strong>Jazmyre Andrei</strong><span>School Admin</span></div>
          <span class="dash-admin__chev">⌄</span>
        </div>
      </div>
    </aside>
    <main class="dash-main">
      <header class="dash-head">
        <div>
          <div class="dash-eyebrow">SCAS · 1st Term S.Y. 2026–2027</div>
          <h2>Overview</h2>
        </div>
        <div class="dash-head__actions">
          <div class="dash-search"><svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="5"/><path d="m12 12 3.2 3.2"/></svg><span>Search conversations, portals…</span><kbd>⌘K</kbd></div>
          <div class="dash-iconbtn"><svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M9 2.5a4.2 4.2 0 0 0-4.2 4.2v3L3.4 12h11.2l-1.4-2.3v-3A4.2 4.2 0 0 0 9 2.5Z"/><path d="M7.2 14.2a2 2 0 0 0 3.6 0"/></svg><i></i></div>
          ${newBtn}
        </div>
      </header>

      <section class="dash-kpis">${kpis}</section>

      <section class="dash-grid">
        <div class="dash-card dash-chart">
          <div class="dash-card__head">
            <div><strong>Conversations</strong><span>Last 7 days</span></div>
            <div class="dash-chart__total"><strong>12,480</strong><em>+18.4%</em></div>
          </div>
          <div class="dash-chart__plot">${conversationChart(CHART_VALUES)}</div>
          <div class="dash-chart__days">${DAYS.map((d) => `<span>${d}</span>`).join('')}</div>
        </div>

        <div class="dash-card dash-intents">
          <div class="dash-card__head"><div><strong>Top intents</strong><span>This term</span></div><span class="dash-mini">Share</span></div>
          <div class="dash-intents__list">${intents}</div>
          <div class="dash-intents__foot"><span>Intent router</span><strong>4 domains</strong></div>
        </div>

        <div class="dash-card dash-activity">
          <div class="dash-card__head"><div><strong>Recent tool activity</strong><span>Live · read-only</span></div><span class="dash-live"><i></i>Live</span></div>
          <div class="dash-acts">${activity}</div>
          <div class="dash-activity__foot"><span>Every call scoped to a verified student.</span></div>
        </div>
      </section>

      <section class="dash-portals">
        <div class="dash-section-head"><div><strong>Portals</strong><span>${DASHBOARD_DATA.portals.length} configured · SCAS only</span></div><span class="dash-mini">Manage</span></div>
        <div class="dash-portal-grid">${portals}</div>
      </section>
    </main>`;
  return el;
}

export function animateDashboard(tl, dash, { at = 0, stagger = 0.25, countAt = 0.7, drawAt = 0.9 } = {}) {
  const q = (sel) => Array.from(dash.querySelectorAll(sel));

  const cards = [
    ...q('.dash-kpi'),
    ...q('.dash-chart'),
    ...q('.dash-intents'),
    ...q('.dash-activity'),
    ...q('.dash-portals .dash-portal'),
  ];
  tl.fromTo(
    cards,
    { y: 26, opacity: 0.34 },
    { y: 0, opacity: 1, duration: 0.5, stagger, ease: 'power3.out' },
    at
  );

  tl.fromTo(
    q('.dash-portals .dash-section-head'),
    { y: 12, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
    at + 0.2
  );

  q('.dash-kpi strong').forEach((el, i) => {
    const target = Number(el.dataset.count);
    const decimals = Number(el.dataset.decimals || 0);
    const comma = el.dataset.comma === '1';
    const suffix = el.dataset.suffix || '';
    const obj = { v: 0 };
    el.textContent = fmtCount(0, decimals, comma, suffix);
    tl.to(
      obj,
      {
        v: target,
        duration: 1.35,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = fmtCount(obj.v, decimals, comma, suffix);
        },
        onComplete: () => {
          el.textContent = fmtCount(target, decimals, comma, suffix);
        },
      },
      at + countAt + i * 0.05
    );
  });

  q('.spark-line').forEach((path, i) => {
    tl.fromTo(
      path,
      { strokeDashoffset: 1, opacity: 0 },
      { strokeDashoffset: 0, opacity: 1, duration: 1.1, ease: 'power2.inOut' },
      at + drawAt + i * 0.06
    );
  });

  tl.fromTo(
    q('.chart-bar'),
    { scaleY: 0 },
    { scaleY: 1, duration: 0.6, stagger: 0.045, ease: 'power2.out' },
    at + 0.55
  );
  tl.fromTo(
    q('.chart-line'),
    { strokeDashoffset: 1, opacity: 0 },
    { strokeDashoffset: 0, opacity: 1, duration: 1.25, ease: 'power2.inOut' },
    at + 0.85
  );
  tl.fromTo(q('.chart-area, .chart-dot'), { opacity: 0 }, { opacity: 1, duration: 0.8, stagger: 0.05 }, at + 1.1);

  q('.dash-intent__track span').forEach((bar, i) => {
    const w = Number(bar.dataset.w);
    tl.fromTo(bar, { width: '0%' }, { width: `${w}%`, duration: 0.75, ease: 'power3.out' }, at + 1.15 + i * 0.07);
  });
}
