export function scasSeal(size = 44) {
  return `
  <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="sealBlue" x1="8" y1="6" x2="56" y2="60" gradientUnits="userSpaceOnUse">
        <stop stop-color="#5AA7FF"/><stop offset=".55" stop-color="#2F6BFF"/><stop offset="1" stop-color="#1D3EA8"/>
      </linearGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#sealBlue)"/>
    <circle cx="32" cy="32" r="25.5" stroke="#fff" stroke-opacity=".55" stroke-width="1.2"/>
    <path d="M18 45V29.5L32 20l14 9.5V45" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M24 45V33h16v12" stroke="#fff" stroke-width="1.6"/>
    <path d="M28.5 45v-7h7v7" stroke="#fff" stroke-width="1.4"/>
    <path d="M14 48h36" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>
    <circle cx="32" cy="14.5" r="2.6" fill="#fff"/>
    <path d="M10.5 36c4 1.6 7 1.6 10.5 0s6.5-1.6 10.5 0 7 1.6 10.5 0 6.5-1.6 10.5 0" stroke="#fff" stroke-opacity=".35" stroke-width="1.4"/>
  </svg>`;
}

export function scasAiMark(size = 48, withGlow = false) {
  return `
  <svg width="${size}" height="${size}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="aiOrb" x1="10" y1="8" x2="55" y2="58" gradientUnits="userSpaceOnUse">
        <stop stop-color="#6FA4FF"/><stop offset=".5" stop-color="#2F6BFF"/><stop offset="1" stop-color="#6D4DFF"/>
      </linearGradient>
      ${withGlow ? '<filter id="aiGlow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' : ''}
    </defs>
    <rect x="3" y="3" width="58" height="58" rx="20" fill="url(#aiOrb)" ${withGlow ? 'filter="url(#aiGlow)"' : ''}/>
    <rect x="3" y="3" width="58" height="58" rx="20" stroke="#fff" stroke-opacity=".35" stroke-width="1.2"/>
    <path d="M22 27.5c0-3 2.4-5.5 5.5-5.5h9c3 0 5.5 2.4 5.5 5.5v5c0 3-2.4 5.5-5.5 5.5H31l-6.2 4.2c-.8.5-1.8-.2-1.6-1.1l.8-4.2A5.5 5.5 0 0 1 22 33.5v-6Z" fill="#fff" fill-opacity=".96"/>
    <circle cx="28" cy="30" r="1.8" fill="#2F6BFF"/>
    <circle cx="33.5" cy="30" r="1.8" fill="#2F6BFF"/>
    <circle cx="39" cy="30" r="1.8" fill="#2F6BFF"/>
    <path d="M46 15.5l1.2 3.3 3.3 1.2-3.3 1.2L46 24.5l-1.2-3.3-3.3-1.2 3.3-1.2 1.2-3.3Z" fill="#fff" fill-opacity=".9"/>
  </svg>`;
}

export function scasWordmark() {
  return `
  <div class="scas-wordmark">
    <span class="scas-wordmark__line">Sumulong College of Arts</span>
    <span class="scas-wordmark__line">and Sciences</span>
  </div>`;
}
