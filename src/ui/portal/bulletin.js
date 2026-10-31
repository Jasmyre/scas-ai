import './portal.css';

/* ─────────────────────────────────────────────────────────────────────────────
   Bulletin board — the portal's announcements / news page, blown up as a
   screen-fixed panel beside the chat widget (s11b · s11c).
   Native 1920x1080; scenes animate rows with GSAP.
   ───────────────────────────────────────────────────────────────────────────── */

export function bulletinBoard({ eyebrow, title, count, items, variant = 'list' }) {
  const root = document.createElement('section');
  root.className = `bulletin bulletin--${variant}`;
  root.id = 'bulletin-board';
  root.innerHTML = `
    <header class="bulletin__head">
      <div class="bulletin__titles">
        <span class="bulletin__eyebrow">${eyebrow}</span>
        <h2 class="bulletin__title">${title}</h2>
      </div>
      <span class="bulletin__count">${count}</span>
    </header>
    <div class="bulletin__list">
      ${items
        .map(
          (item) => `
        <article class="bulletin__row${item.hot ? ' is-hot' : ''}">
          <span class="bulletin__date">${item.date}</span>
          <div class="bulletin__copy">
            <b>${item.headline}</b>
            <span>${item.sub}</span>
          </div>
          <span class="bulletin__pill">${item.pill}</span>
        </article>`
        )
        .join('')}
    </div>`;
  return root;
}
