import './portal.css';
import { PORTAL_DATA } from '../../timeline/cues.js';
import { scasWordmark } from '../../design/logo.js';
import { portalSeal, portalHomeIcon, portalPaymentsIcon, portalChevron, money } from './parts.js';
import crestUrl from './assets/crest.png';

// Rows that wrap the meeting time onto a second line in the source portal
// (their row is 60px instead of 46px). Kept as data so the replica keeps the
// same vertical rhythm as tmp/portal.png.
const TALL_ROWS = new Set(['GEO0006', 'CC1004', 'PTHFIT 3']);

function rowId(code) {
  return `portal-row-${code.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

export function createPortal({ countUp = false } = {}) {
  const { courses, columns, user, updated, term, balance, terms } = PORTAL_DATA;

  const el = document.createElement('div');
  el.className = 'portal';
  el.innerHTML = `
    <div class="portal-bleed" aria-hidden="true"></div>
    <header class="portal-nav" id="portal-nav">
      <div class="portal-nav__brand" id="portal-seal">
        <span class="portal-seal"><img class="portal-seal__img" src="${crestUrl}" alt="Sumulong College of Arts and Sciences seal" /></span>
        ${scasWordmark()}
      </div>
      <nav class="portal-nav__links" aria-label="Portal">
        <a class="portal-nav__link is-active">
          <span class="portal-nav__icon">${portalHomeIcon(19)}</span>
          <span>Home</span>
        </a>
        <a class="portal-nav__link">
          <span class="portal-nav__icon">${portalPaymentsIcon(20)}</span>
          <span>Payments</span>
        </a>
      </nav>
      <div class="portal-nav__user">
        <span class="portal-avatar">${user.initials}</span>
        <span class="portal-user-copy">
          <span>${user.first}</span>
          <strong>${user.name}</strong>
        </span>
        <span class="portal-user-chev">${portalChevron(10, '#b6b6b6')}</span>
      </div>
    </header>

    <main class="portal-body">
      <section class="portal-card portal-classes" id="portal-classes">
        <div class="portal-card__head">
          <div class="portal-card__title">
            <h1>Classes</h1>
            <p>${updated}</p>
          </div>
          <button class="portal-term" id="portal-term-select" type="button">
            <span>${term}</span>
            ${portalChevron(11, '#7d7d7d')}
          </button>
        </div>

        <div class="portal-tabs" id="portal-tabs">
          <button class="portal-tab" type="button">Calendar</button>
          <button class="portal-tab is-active" type="button">Grades</button>
        </div>

        <table class="portal-table" id="portal-table">
          <colgroup>
            <col class="c-course" />
            <col class="c-schedule" />
            <col class="c-grade" />
            <col class="c-grade" />
            <col class="c-grade" />
            <col class="c-grade" />
            <col class="c-grade" />
          </colgroup>
          <thead>
            <tr>${columns.map((c) => `<th>${c}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${courses
              .map(
                (c) => `<tr class="portal-row${TALL_ROWS.has(c.code) ? ' is-tall' : ''}" id="${rowId(c.code)}" data-code="${c.code}">
                  <td class="portal-course">
                    <span class="portal-course__title">${c.code} – ${c.title}</span>
                    <em>${c.professor}</em>
                  </td>
                  <td class="portal-schedule">
                    <span class="portal-day">${c.day}</span>
                    <span class="portal-meet">
                      <span class="portal-time">${c.time}</span>
                      <em>${c.room}</em>
                    </span>
                  </td>
                  <td class="portal-grade"></td>
                  <td class="portal-grade"></td>
                  <td class="portal-grade"></td>
                  <td class="portal-grade"></td>
                  <td class="portal-grade"></td>
                </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </section>

      <section class="portal-card portal-balance" id="portal-balance">
        <span class="portal-balance__sync" aria-hidden="true"></span>
        <div class="portal-card__head">
          <div class="portal-card__title">
            <h2>Balance</h2>
            <p>${updated}</p>
          </div>
        </div>
        <div class="portal-balance__hero">
          <span>${balance.label}</span>
          <strong id="portal-balance-amount">${countUp ? money(0) : balance.amount}</strong>
        </div>
        <p class="portal-balance__note">${balance.note}</p>
      </section>

      <section class="portal-terms">
        ${terms
          .map(
            (t) => `<article class="portal-card portal-term-card">
              <h3>${t.title}</h3>
              <p>${t.term}</p>
              <div class="portal-term-card__total">
                <span>${t.totalLabel}</span>
                <strong>${t.total}</strong>
              </div>
            </article>`
          )
          .join('')}
      </section>
    </main>`;

  return el;
}

export function portalRowSelector(code) {
  return `#${rowId(code)}`;
}
