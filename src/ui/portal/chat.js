import './chat.css';
import { scasAiMark } from '../../design/logo.js';

/* ─────────────────────────────────────────────────────────────────────────────
   SCAS AI chat widget — the only new product surface.
   Glass white, 440x680, bottom-right, orb launcher with pulse + badge.
   Stable ids: #chat-launcher #chat-badge #chat-composer #chat-input #chat-send
               #chat-dropzone #chat-anchor
   ───────────────────────────────────────────────────────────────────────────── */

const SEND_ICON = `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 19V5m0 0-6.2 6.2M12 5l6.2 6.2" stroke="#fff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export function createChatWidget({ open = false, badge = 0, dropzone = false, launcherHidden = false } = {}) {
  const root = document.createElement('div');
  root.className = 'chat-root';
  if (open) root.classList.add('is-open');
  if (launcherHidden) root.classList.add('is-launcher-hidden');
  if (dropzone) root.classList.add('has-dropzone');

  root.innerHTML = `
    <button id="chat-launcher" class="chat-launcher" type="button" aria-label="Open SCAS AI">
      <span class="chat-launcher__pulse"></span>
      <span class="chat-launcher__pulse chat-launcher__pulse--late"></span>
      <span class="chat-launcher__orb">${scasAiMark(44)}</span>
      <span id="chat-badge" class="chat-badge" data-count="${badge}">${badge > 0 ? badge : ''}</span>
    </button>

    <span id="chat-anchor" class="chat-anchor" aria-hidden="true"></span>

    <section id="chat-composer" class="chat-window" aria-label="SCAS AI chat">
      <header class="chat-head">
        <div class="chat-head__id">
          <span class="chat-head__mark">${scasAiMark(34)}</span>
          <div class="chat-head__copy">
            <strong>SCAS AI</strong>
            <span class="chat-head__status"><i class="chat-dot"></i> Grounded in your portal</span>
          </div>
        </div>
        <div class="chat-head__actions">
          <button class="chat-close" type="button" aria-label="Close">×</button>
        </div>
      </header>

      <div class="chat-thread" id="chat-thread"></div>

      <div id="chat-dropzone" class="chat-dropzone${dropzone ? '' : ' is-hidden'}">
        <span class="chat-dropzone__hint">Drop a document, image, or paste text</span>
        <div class="chat-attachments" id="chat-attachments"></div>
      </div>

      <div class="chat-bar">
        <button class="chat-attach" type="button" aria-label="Attach">+</button>
        <div class="chat-field">
          <div id="chat-input" class="chat-input"><span class="field-text"></span><span class="caret"></span></div>
        </div>
        <button id="chat-send" class="chat-send" type="button" aria-label="Send">${SEND_ICON}</button>
      </div>
      <div class="chat-foot">SCAS AI can make mistakes. Answers are grounded in your records.</div>
    </section>`;

  return root;
}

export function chatThread(root) {
  return root.querySelector('#chat-thread');
}

export function chatGreeting() {
  const el = document.createElement('div');
  el.className = 'chat-msg chat-msg--ai chat-greeting';
  el.id = 'chat-greeting';
  el.innerHTML = `
    <span class="chat-msg__who">${scasAiMark(20)}<b>SCAS AI</b><span>now</span></span>
    <p>Hi Jazmyre. Ask me about your balance, grades, schedule, or clearance.</p>
    <div class="chat-sources"><span class="chat-source">Your portal records</span></div>`;
  return el;
}

export function chatMessage({ role = 'ai', html = '', id = '', sources = [], say = 'now' }) {
  const el = document.createElement('div');
  el.className = `chat-msg chat-msg--${role}`;
  if (id) el.id = id;
  if (role === 'ai') {
    el.innerHTML = `
      <span class="chat-msg__who">${scasAiMark(20)}<b>SCAS AI</b><span>${say}</span></span>
      <p>${html}</p>
      ${sources.length ? `<div class="chat-sources">${sources.map((s) => `<span class="chat-source">${s}</span>`).join('')}</div>` : ''}`;
  } else {
    el.innerHTML = `<p>${html}</p>`;
  }
  return el;
}

export function chatNudges(items) {
  const el = document.createElement('div');
  el.className = 'chat-nudges';
  el.id = 'chat-nudges';
  el.innerHTML = items
    .map(
      (n, i) => `<button class="chat-nudge" data-n="${i + 1}" type="button">
        <span class="chat-nudge__icon">${n.icon || ''}</span>
        <span class="chat-nudge__copy"><b>${n.title}</b><span>${n.meta}</span></span>
        <span class="chat-nudge__chev">›</span>
      </button>`
    )
    .join('');
  return el;
}

export function chatThinking() {
  const el = document.createElement('div');
  el.className = 'chat-msg chat-msg--ai chat-thinking';
  el.id = 'chat-thinking';
  el.innerHTML = `
    <span class="chat-msg__who">${scasAiMark(20)}<b>SCAS AI</b><span>reading your portal</span></span>
    <span class="chat-dots"><i></i><i></i><i></i></span>`;
  return el;
}

export function soaThumb() {
  return `<span class="soa-thumb">
    <span class="soa-thumb__bar"></span>
    <span class="soa-thumb__l1"></span>
    <span class="soa-thumb__l2"></span>
    <span class="soa-thumb__l3"></span>
    <span class="soa-thumb__total"></span>
  </span>`;
}

/** The dropped statement, built as a DOM "screenshot" (no external images). */
export function chatStatement() {
  const el = document.createElement('div');
  el.className = 'chat-upload';
  el.id = 'chat-upload';
  el.innerHTML = `
    <div class="chat-shot">
      <div class="soa" id="chat-soa">
        <div class="soa__chrome">
          <span class="soa__file"><i></i>SOA_Oct.png</span>
          <span class="soa__tag">PNG</span>
        </div>
        <div class="soa__sheet">
          <div class="soa__head">
            <div class="soa__brand">
              <b>STATEMENT OF ACCOUNT</b>
              <span>Sumulong College of Arts and Sciences</span>
            </div>
            <span class="soa__term">1st Term<br />S.Y. 2026–2027</span>
          </div>
          <div class="soa__student">Jazmyre Andrei Lanuza <span>· 2026-00042</span></div>
          <div class="soa__lines">
            <div><span>Tuition fee</span><b>3,200.00</b></div>
            <div><span>Miscellaneous</span><b>1,556.94</b></div>
            <div class="soa__line-total"><span>Total due</span><b>4,756.94</b></div>
          </div>
          <div class="soa__due"><span>Due Nov 15, 2026</span><span>2nd installment Dec 15, 2026</span></div>
        </div>
        <span class="soa__scan" id="chat-scan"></span>
      </div>
      <div class="chat-shot__cap"><span>SOA_Oct.png</span><span>1 page · 84 KB</span></div>
    </div>`;
  return el;
}

/** Extracted fields — pop in after the scan. */
export function chatExtract() {
  const el = document.createElement('div');
  el.className = 'chat-extract';
  el.id = 'chat-extract';
  el.innerHTML = `
    <span class="x-chip x1"><em>Tuition</em><b>3,200.00</b></span>
    <span class="x-chip x2"><em>Misc</em><b>1,556.94</b></span>
    <span class="x-chip x3 is-total"><em>Total</em><b>4,756.94</b></span>
    <span class="x-chip x4 is-date"><em>Due</em><b>Nov 15</b></span>
    <span class="x-chip x5 is-date"><em>Due</em><b>Dec 15</b></span>`;
  return el;
}

export function attachChip(kind, label) {
  const el = document.createElement('span');
  el.className = `att att--${kind}`;
  el.innerHTML = `<i></i><span>${label}</span>`;
  return el;
}

/** Floating drag source, sits just left of the widget (S10). */
export function chatDragStack() {
  const el = document.createElement('div');
  el.className = 'chat-drag';
  el.id = 'chat-drag';
  el.innerHTML = `
    <div class="chat-drag__head">From your device</div>
    <div class="chat-drag__item is-src" id="chat-drag-source">
      ${soaThumb()}
      <span class="chat-drag__copy"><b>SOA_Oct.png</b><span>Image · 84 KB</span></span>
    </div>
    <div class="chat-drag__item">
      <span class="file-ico file-ico--pdf">PDF</span>
      <span class="chat-drag__copy"><b>Tuition_Guide.pdf</b><span>PDF · 12 pages</span></span>
    </div>
    <div class="chat-drag__item">
      <span class="file-ico file-ico--txt">TXT</span>
      <span class="chat-drag__copy"><b>Pasted text</b><span>214 characters</span></span>
    </div>
    <div class="chat-drag__hint">Drag into the chat</div>`;
  return el;
}
