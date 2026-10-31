// ─────────────────────────────────────────────────────────────────────────────
// THE CUE SHEET IS THE SINGLE SOURCE OF TRUTH.
// Visual timelines, interaction beats, and audio synthesis all read from here.
// Do not change timing in a scene without changing it here first.
// 24 FPS · 116.000s · 2,784 frames · 120 BPM (1 beat = 12f, 1 bar = 48f)
// ─────────────────────────────────────────────────────────────────────────────

export const FPS = 24;
export const DURATION = 116;
export const TOTAL_FRAMES = FPS * DURATION; // 2784
export const BPM = 120;
export const FRAMES_PER_BEAT = (FPS * 60) / BPM; // 12
export const FRAMES_PER_BAR = FRAMES_PER_BEAT * 4; // 48

export const SCENES = [
  { id: 's01', slug: 'cold-open', name: 'Cold Open', act: 'I', start: 0, end: 96, headline: 'The portal knows everything.' },
  { id: 's02', slug: 'silence', name: 'The Silence', act: 'I', start: 96, end: 192, headline: 'It just never says it.' },
  { id: 's03', slug: 'reveal', name: 'Reveal', act: 'I', start: 192, end: 288, headline: 'Meet SCAS AI.' },
  { id: 's04', slug: 'dashboard', name: 'The Dashboard', act: 'II', start: 288, end: 432, headline: 'The dashboard.' },
  { id: 's05', slug: 'tenant', name: 'New Assistant', act: 'II', start: 432, end: 576, headline: 'Spin up a brain.' },
  { id: 's06', slug: 'knowledge', name: 'Knowledge', act: 'II', start: 576, end: 720, headline: 'Upload relevant context.' },
  { id: 's07', slug: 'guardrails', name: 'Guardrails', act: 'II', start: 720, end: 912, headline: 'It responds with relevant & reliable information.' },
  { id: 's08', slug: 'portal', name: 'The Portal', act: 'III', start: 912, end: 1152, headline: 'Your portal. Now it talks.' },
  { id: 's09', slug: 'balance', name: 'Balance', act: 'III', start: 1152, end: 1344, headline: 'Ask about your balance.' },
  { id: 's10', slug: 'multimodal', name: 'Multimodal', act: 'III', start: 1344, end: 1632, headline: 'It reads what you give it.' },
  { id: 's11', slug: 'proactive', name: 'Proactive', act: 'III', start: 1632, end: 1776, headline: 'Ask about your portal.' },
  { id: 's11b', slug: 'announcements', name: 'Announcements', act: 'III', start: 1776, end: 1920, headline: 'Ask about announcements.' },
  { id: 's11c', slug: 'news', name: 'News & Events', act: 'III', start: 1920, end: 2064, headline: 'Ask about news and events.' },
  { id: 's12', slug: 'trust', name: 'Trust', act: 'IV', start: 2064, end: 2208, headline: 'Private to you.' },
  { id: 's13', slug: 'audit', name: 'Audit', act: 'IV', start: 2208, end: 2352, headline: 'Monitor every response.' },
  { id: 's11d', slug: 'features', name: 'Features', act: 'IV', start: 2352, end: 2544, headline: 'More than answers.' },
  { id: 's14', slug: 'finale', name: 'Finale', act: 'IV', start: 2544, end: 2784, headline: 'Ask anything.' },
];

export const MUSIC = {
  bpm: 120,
  key: 'A minor',
  bars: 58,
  sections: [
    { name: 'intro', startBar: 1, endBar: 3, note: 'filtered pad, sub pulse, ticks' },
    { name: 'tension', startBar: 4, endBar: 6, note: 'arp enters, reverse riser' },
    { name: 'drop-1', startBar: 7, endBar: 9, note: 'kick, bass, clap, hats' },
    { name: 'groove-a', startBar: 10, endBar: 12, note: 'full groove' },
    { name: 'knowledge', startBar: 13, endBar: 15, note: 'pluck + data ticks' },
    { name: 'guardrails', startBar: 16, endBar: 19, note: 'build, filter sweep, held answer' },
    { name: 'portal-breakdown', startBar: 20, endBar: 24, note: 'kick out, warm pad, soft ticks' },
    { name: 'chat-groove', startBar: 25, endBar: 28, note: 'kick returns, tight bass' },
    { name: 'peak-a', startBar: 29, endBar: 32, note: 'peak energy' },
    { name: 'peak-b', startBar: 33, endBar: 34, note: 'peak with counter-melody' },
    { name: 'proactive', startBar: 35, endBar: 37, note: 'bright pluck, alert pings' },
    { name: 'announce', startBar: 38, endBar: 40, note: 'raised pad, bulletin ticks' },
    { name: 'news', startBar: 41, endBar: 43, note: 'open groove, wide arp' },
    { name: 'trust-tension', startBar: 44, endBar: 46, note: 'strip to pulse + riser' },
    { name: 'audit', startBar: 47, endBar: 49, note: 'build' },
    { name: 'features', startBar: 50, endBar: 53, note: 'full peak, feature pops' },
    { name: 'finale', startBar: 54, endBar: 58, note: 'impact, shimmer, 8s tail' },
  ],
};

// ── SFX ──────────────────────────────────────────────────────────────────────
// frame is absolute. type maps to a synth recipe in audio/synth.mjs.
// gain is linear (1 = unity). pan is -1..1.
export const SFX = [
  // S01 Cold Open
  { frame: 0, type: 'impact', gain: 0.95, pan: 0 },
  { frame: 18, type: 'tick', gain: 0.35, pan: -0.2 },
  { frame: 26, type: 'tick', gain: 0.35, pan: -0.1 },
  { frame: 34, type: 'tick', gain: 0.4, pan: 0 },
  { frame: 72, type: 'boom', gain: 0.7, pan: 0 },
  { frame: 94, type: 'whoosh', gain: 0.5, pan: 0.2 },

  // S02 The Silence
  { frame: 104, type: 'click', gain: 0.4, pan: 0.1 },
  { frame: 124, type: 'hover', gain: 0.25, pan: 0.15 },
  { frame: 148, type: 'click', gain: 0.4, pan: 0.15 },
  { frame: 168, type: 'reverseWhoosh', gain: 0.55, pan: -0.1 },

  // S03 Reveal
  { frame: 192, type: 'riser', gain: 0.55, dur: 3.4, pan: 0 },
  { frame: 240, type: 'shimmer', gain: 0.45, pan: 0 },
  { frame: 272, type: 'glass', gain: 0.5, pan: 0.1 },
  { frame: 278, type: 'lock', gain: 0.7, pan: 0 },

  // S04 Dashboard
  { frame: 288, type: 'whoosh', gain: 0.55, pan: -0.2 },
  { frame: 300, type: 'tick', gain: 0.25, pan: -0.2 },
  { frame: 306, type: 'tick', gain: 0.25, pan: -0.1 },
  { frame: 312, type: 'tick', gain: 0.25, pan: 0 },
  { frame: 330, type: 'tick', gain: 0.25, pan: 0.1 },
  { frame: 360, type: 'data', gain: 0.28, pan: 0.2 },
  { frame: 408, type: 'hover', gain: 0.3, pan: 0.2 },
  { frame: 414, type: 'click', gain: 0.5, pan: 0.2 },
  { frame: 420, type: 'zoomWhoosh', gain: 0.5, pan: 0.2 },

  // S05 New Assistant — keyboard + clicks are deliberately forward in the mix.
  { frame: 432, type: 'pop', gain: 0.5, pan: 0.1 },
  { frame: 444, type: 'click', gain: 0.5, pan: 0.2 },
  { frame: 450, type: 'click', gain: 0.42, pan: 0.2 },
  { frame: 508, type: 'click', gain: 0.45, pan: 0.2 },
  { frame: 516, type: 'toggle', gain: 0.44, pan: 0.2 },
  { frame: 540, type: 'click', gain: 0.45, pan: 0.2 },
  { frame: 552, type: 'press', gain: 0.6, pan: 0.1 },
  { frame: 560, type: 'success', gain: 0.55, pan: 0 },
  { frame: 574, type: 'whoosh', gain: 0.45, pan: -0.2 },

  // S06 Knowledge
  { frame: 578, type: 'swoosh', gain: 0.45, pan: -0.3 },
  { frame: 586, type: 'swoosh', gain: 0.45, pan: 0 },
  { frame: 594, type: 'swoosh', gain: 0.45, pan: 0.3 },
  { frame: 612, type: 'drop', gain: 0.5, pan: -0.2 },
  { frame: 636, type: 'drop', gain: 0.5, pan: 0.1 },
  { frame: 660, type: 'drop', gain: 0.5, pan: 0.25 },
  { frame: 672, type: 'shimmer', gain: 0.4, pan: 0 },
  { frame: 700, type: 'chime', gain: 0.45, pan: 0.1 },

  // S07 Guardrails
  { frame: 720, type: 'tick', gain: 0.3, pan: -0.2 },
  { frame: 726, type: 'tick', gain: 0.3, pan: -0.1 },
  { frame: 732, type: 'tick', gain: 0.3, pan: 0.1 },
  { frame: 738, type: 'tick', gain: 0.3, pan: 0.2 },
  { frame: 824, type: 'error', gain: 0.6, pan: 0 },
  { frame: 828, type: 'shield', gain: 0.5, pan: 0 },
  { frame: 865, type: 'confirm', gain: 0.45, pan: 0.1 },
  { frame: 869, type: 'chime', gain: 0.4, pan: 0.1 },
  { frame: 890, type: 'shimmer', gain: 0.26, pan: 0 },

  // S08 Portal
  { frame: 912, type: 'ambientSwell', gain: 0.35, pan: 0, dur: 2 },
  { frame: 928, type: 'whoosh', gain: 0.35, pan: -0.25 },
  { frame: 984, type: 'hover', gain: 0.3, pan: 0.3 },
  { frame: 1032, type: 'click', gain: 0.5, pan: 0.3 },
  { frame: 1056, type: 'widgetWhoosh', gain: 0.55, pan: 0.2 },
  { frame: 1104, type: 'chime', gain: 0.45, pan: 0.2 },
  { frame: 1112, type: 'tick', gain: 0.24, pan: 0.2 },

  // S09 Balance
  { frame: 1152, type: 'click', gain: 0.4, pan: 0.2 },
  { frame: 1168, type: 'click', gain: 0.36, pan: 0.2 },
  { frame: 1228, type: 'send', gain: 0.45, pan: 0.2 },
  { frame: 1236, type: 'tick', gain: 0.2, pan: 0.2 },
  { frame: 1242, type: 'tick', gain: 0.2, pan: 0.2 },
  { frame: 1248, type: 'chime', gain: 0.5, pan: 0.2 },
  { frame: 1296, type: 'shimmer', gain: 0.35, pan: 0.1 },

  // S10 Multimodal — new chat, drag, drop, scan, extract, answer
  { frame: 1344, type: 'swoosh', gain: 0.45, pan: 0.2 },
  { frame: 1352, type: 'click', gain: 0.4, pan: 0.2 },
  { frame: 1384, type: 'whoosh', gain: 0.35, pan: 0.15 },
  { frame: 1404, type: 'drop', gain: 0.55, pan: 0.2 },
  { frame: 1428, type: 'tick', gain: 0.28, pan: 0.2 },
  { frame: 1434, type: 'tick', gain: 0.25, pan: 0.2 },
  { frame: 1476, type: 'data', gain: 0.3, pan: 0.2 },
  { frame: 1488, type: 'pop', gain: 0.35, pan: 0.15 },
  { frame: 1496, type: 'pop', gain: 0.35, pan: 0.2 },
  { frame: 1504, type: 'pop', gain: 0.35, pan: 0.22 },
  { frame: 1512, type: 'pop', gain: 0.35, pan: 0.25 },
  { frame: 1520, type: 'pop', gain: 0.3, pan: 0.25 },
  { frame: 1560, type: 'chime', gain: 0.5, pan: 0.2 },
  { frame: 1568, type: 'shimmer', gain: 0.3, pan: 0.1 },

  // S11 Proactive — ask about the portal
  { frame: 1632, type: 'ping', gain: 0.5, pan: 0.25 },
  { frame: 1644, type: 'click', gain: 0.4, pan: 0.3 },
  { frame: 1656, type: 'ping', gain: 0.42, pan: 0.25 },
  { frame: 1673, type: 'pop', gain: 0.4, pan: 0.2 },
  { frame: 1685, type: 'click', gain: 0.4, pan: 0.2 },
  { frame: 1723, type: 'send', gain: 0.4, pan: 0.2 },
  { frame: 1740, type: 'chime', gain: 0.5, pan: 0.2 },
  { frame: 1748, type: 'tick', gain: 0.25, pan: 0.1 },
  { frame: 1768, type: 'whoosh', gain: 0.35, pan: 0 },

  // S11b Announcements
  { frame: 1776, type: 'pop', gain: 0.45, pan: 0.2 },
  { frame: 1786, type: 'hover', gain: 0.26, pan: 0.2 },
  { frame: 1794, type: 'click', gain: 0.4, pan: 0.2 },
  { frame: 1835, type: 'send', gain: 0.42, pan: 0.2 },
  { frame: 1844, type: 'tick', gain: 0.22, pan: 0.2 },
  { frame: 1852, type: 'chime', gain: 0.52, pan: 0.2 },
  { frame: 1900, type: 'shimmer', gain: 0.3, pan: 0.1 },

  // S11c News & Events
  { frame: 1920, type: 'pop', gain: 0.45, pan: 0.2 },
  { frame: 1930, type: 'hover', gain: 0.26, pan: 0.2 },
  { frame: 1938, type: 'click', gain: 0.4, pan: 0.2 },
  { frame: 1975, type: 'send', gain: 0.42, pan: 0.2 },
  { frame: 1984, type: 'tick', gain: 0.22, pan: 0.2 },
  { frame: 1992, type: 'chime', gain: 0.52, pan: 0.2 },
  { frame: 2040, type: 'shimmer', gain: 0.3, pan: 0.1 },

  // S12 Trust
  { frame: 2064, type: 'riser', gain: 0.5, dur: 3.0, pan: 0 },
  { frame: 2112, type: 'lock', gain: 0.6, pan: 0 },
  { frame: 2136, type: 'vault', gain: 0.65, pan: 0 },
  { frame: 2184, type: 'shimmer', gain: 0.4, pan: 0 },

  // S13 Audit
  { frame: 2208, type: 'tick', gain: 0.28, pan: -0.2 },
  { frame: 2232, type: 'tick', gain: 0.28, pan: -0.1 },
  { frame: 2256, type: 'whoosh', gain: 0.4, pan: 0.1 },
  { frame: 2272, type: 'tick', gain: 0.25, pan: 0.1 },
  { frame: 2292, type: 'tick', gain: 0.25, pan: 0.2 },
  { frame: 2304, type: 'confirm', gain: 0.5, pan: 0.1 },
  { frame: 2330, type: 'riser', gain: 0.45, dur: 0.9, pan: 0 },

  // S11d Features
  { frame: 2352, type: 'pop', gain: 0.45, pan: 0.1 },
  { frame: 2360, type: 'shimmer', gain: 0.3, pan: 0 },
  { frame: 2362, type: 'pop', gain: 0.34, pan: -0.2 },
  { frame: 2368, type: 'pop', gain: 0.34, pan: 0.2 },
  { frame: 2374, type: 'pop', gain: 0.34, pan: -0.2 },
  { frame: 2380, type: 'pop', gain: 0.34, pan: 0.2 },
  { frame: 2390, type: 'tick', gain: 0.24, pan: 0.1 },
  { frame: 2396, type: 'tick', gain: 0.24, pan: 0.15 },
  { frame: 2402, type: 'tick', gain: 0.24, pan: 0.2 },
  { frame: 2410, type: 'chime', gain: 0.48, pan: 0.1 },
  { frame: 2496, type: 'riser', gain: 0.52, dur: 2.0, pan: 0 },
  { frame: 2528, type: 'shimmer', gain: 0.35, pan: 0 },

  // S14 Finale — soft hand-off, 8s locked logo, long tail
  { frame: 2544, type: 'whoosh', gain: 0.34, pan: 0 },
  { frame: 2544, type: 'impact', gain: 0.8, pan: 0 },
  { frame: 2592, type: 'lock', gain: 0.7, pan: 0 },
  { frame: 2616, type: 'shimmer', gain: 0.45, pan: 0 },
  { frame: 2664, type: 'boom', gain: 0.4, pan: 0 },
  { frame: 2712, type: 'shimmer', gain: 0.3, pan: 0 },
  { frame: 2750, type: 'shimmer', gain: 0.22, pan: 0 },
];

// ── Typing ───────────────────────────────────────────────────────────────────
// cps = characters per second. Visual typewriter and audio ticks share this.
export const TYPING = [
  { scene: 's05', target: '#assistant-name', start: 450, cps: 8, text: 'SCAS Edusuite UNI' },
  { scene: 's07', target: '#guardrail-prompt', start: 778, cps: 16, text: "Show me another student's grades" },
  { scene: 's07', target: '#guardrail-prompt', start: 830, cps: 18, text: 'How do I clear my account?' },
  { scene: 's09', target: '#chat-input', start: 1176, cps: 12, text: 'How much do I still owe?' },
  { scene: 's11', target: '#chat-input', start: 1685, cps: 13, text: "What's my schedule?" },
  { scene: 's11b', target: '#chat-input', start: 1794, cps: 14, text: 'Any new announcements?' },
  { scene: 's11c', target: '#chat-input', start: 1938, cps: 14, text: 'Any news or events?' },
];

// ── Interaction beats ────────────────────────────────────────────────────────
// zoom = camera scale. The interaction director reads these for cursor/click/DOF.
export const INTERACTIONS = [
  { scene: 's04', frame: 408, action: 'hover', target: '#new-assistant', zoom: 1.0 },
  { scene: 's04', frame: 414, action: 'click', target: '#new-assistant', zoom: 1.9 },
  { scene: 's05', frame: 444, action: 'click', target: '#assistant-name', zoom: 1.8 },
  { scene: 's05', frame: 450, action: 'type', target: '#assistant-name', zoom: 1.85 },
  { scene: 's05', frame: 508, action: 'click', target: '#toggle-personal', zoom: 1.4 },
  { scene: 's05', frame: 516, action: 'click', target: '#preset-grounded', zoom: 1.3 },
  { scene: 's05', frame: 540, action: 'click', target: '#deploy', zoom: 1.5 },
  { scene: 's05', frame: 552, action: 'release', target: '#deploy', zoom: 1.0 },
  { scene: 's07', frame: 778, action: 'type', target: '#guardrail-prompt', zoom: 1.8 },
  { scene: 's07', frame: 824, action: 'click', target: '#guardrail-send', zoom: 1.6 },
  { scene: 's07', frame: 830, action: 'type', target: '#guardrail-prompt', zoom: 1.55 },
  { scene: 's07', frame: 865, action: 'click', target: '#guardrail-send', zoom: 1.45 },
  { scene: 's08', frame: 1008, action: 'hover', target: '#chat-launcher', zoom: 1.0 },
  { scene: 's08', frame: 1032, action: 'click', target: '#chat-launcher', zoom: 1.25 },
  { scene: 's09', frame: 1152, action: 'focus', target: '#chat-composer', zoom: 1.34 },
  { scene: 's09', frame: 1176, action: 'type', target: '#chat-input', zoom: 1.34 },
  { scene: 's09', frame: 1228, action: 'click', target: '#chat-send', zoom: 1.34 },
  { scene: 's10', frame: 1352, action: 'click', target: '#chat-composer', zoom: 1.34 },
  { scene: 's10', frame: 1384, action: 'drag', target: '#chat-drag-source', zoom: 1.34 },
  { scene: 's10', frame: 1404, action: 'drop', target: '#chat-dropzone', zoom: 1.34 },
  { scene: 's11', frame: 1644, action: 'click', target: '#chat-badge', zoom: 1 },
  { scene: 's11', frame: 1685, action: 'type', target: '#chat-input', zoom: 1.34 },
  { scene: 's11', frame: 1723, action: 'click', target: '#chat-send', zoom: 1.34 },
  { scene: 's11b', frame: 1794, action: 'type', target: '#chat-input', zoom: 1.34 },
  { scene: 's11b', frame: 1835, action: 'click', target: '#chat-send', zoom: 1.34 },
  { scene: 's11c', frame: 1938, action: 'type', target: '#chat-input', zoom: 1.34 },
  { scene: 's11c', frame: 1975, action: 'click', target: '#chat-send', zoom: 1.34 },
  { scene: 's13', frame: 2256, action: 'click', target: '#audit-row-1', zoom: 1.1 },
];

// ── Portal reference data (exact copy of tmp/portal.png) ─────────────────────
export const PORTAL_DATA = {
  school: 'Sumulong College of Arts and Sciences',
  user: { first: 'Hello!', name: 'Jazmyre Andrei Lanuza', initials: 'JL' },
  updated: 'Updated as of 24 October 2026 09:33 AM',
  term: 'Current (1st Term S.Y. 2026-2027)',
  columns: ['COURSE', 'SCHEDULE', 'PRELIM', 'MIDTERM', 'PREFINAL', 'FINALS', 'SGF'],
  courses: [
    { code: 'GEO0007', title: 'Art Appreciation', professor: 'Laserna, Corazon', day: 'Thu', time: '11:00 AM – 02:00 PM', room: 'ONLINE 8' },
    { code: 'CC1003', title: 'Data Structures and Algorithms', professor: 'Dee Leen, Jeb', day: 'Wed', time: '12:00 PM – 03:00 PM', room: 'LABORATORY - COMLAB2' },
    { code: 'ITPC002', title: 'Information Assurance and Security 2', professor: 'Feola, Nino Mar', day: 'Thu', time: '06:00 PM – 09:00 PM', room: 'ONLINE 8' },
    { code: 'ITPC004', title: 'Networking 1', professor: 'Sese, Kyle Silas', day: 'Mon', time: '01:00 PM – 04:00 PM', room: 'DILIGENT -ANX' },
    { code: 'GEO0006', title: 'Science, Technology and Society', professor: 'Manongdo, Allan Kevin', day: 'Mon', time: '06:00 PM – 09:00 PM', room: 'ONLINE 4' },
    { code: 'CC1004', title: 'Application Development and Emerging Technologies', professor: 'Feola, Nino Mar', day: 'Wed', time: '06:00 PM – 09:00 PM', room: 'GENEROSITY -ANX' },
    { code: 'GEE0002', title: 'Entrepreneurial Mind', professor: 'Ruiz, Gamaliel Ivan', day: 'Tue', time: '11:00 AM – 02:00 PM', room: 'ONLINE 4' },
    { code: 'PTHFIT 3', title: 'Physical Activities Towards Health and Fitness 3- Sports', professor: 'Mendoza, Marrinelle Mae', day: 'Wed', time: '04:00 PM – 06:00 PM', room: 'PRUDENCE -NEW BLDG-' },
  ],
  balance: {
    label: 'Outstanding Balance',
    amount: '4,756.94',
    note: 'Amounts displayed in parentheses indicate an overpayment or credit balance.',
  },
  terms: [
    { title: 'For the current Term', term: '1st Term S.Y. 2026-2027', totalLabel: 'Total payable amount', total: '28,745.75' },
    { title: 'For the next Term', term: '2nd Term S.Y. 2026-2027', totalLabel: 'Total payable amount', total: '0.00' },
  ],
};

export const DASHBOARD_DATA = {
  school: 'SCAS',
  admin: 'Administration',
  kpis: [
    { label: 'Portals', value: '3', delta: '+1 this term' },
    { label: 'Conversations', value: '12,480', delta: '+18.4%' },
    { label: 'Grounded', value: '98.7%', delta: '+0.6%' },
    { label: 'Escalations', value: '41', delta: '−12 this week' },
  ],
  portals: [
    { name: 'SCAS Edusuite UNI', meta: 'scas.edusuite.asia', status: 'Live', sources: '214 sources', guardrail: 'Grounded + Silent' },
    { name: 'SCAS Admissions', meta: 'admissions.scas.edu.ph', status: 'Draft', sources: '86 sources', guardrail: 'Public only' },
    { name: 'SCAS Main Site', meta: 'scas.edu.ph', status: 'Live', sources: '128 sources', guardrail: 'Grounded + Silent' },
  ],
  intents: [
    { label: 'Balance & dues', pct: 38 },
    { label: 'Schedule', pct: 27 },
    { label: 'Grades & GWA', pct: 21 },
    { label: 'Clearance', pct: 14 },
  ],
  activity: [
    { tool: 'getBalance', scope: 'student ••42', ms: '214 ms' },
    { tool: 'getSchedule', scope: 'student ••17', ms: '168 ms' },
    { tool: 'getClearance', scope: 'student ••08', ms: '191 ms' },
    { tool: 'refused · out-of-scope', scope: 'student ••31', ms: '—' },
  ],
};

export const SCENE_BY_ID = Object.fromEntries(SCENES.map((s) => [s.id, s]));

export function sceneAtFrame(frame) {
  return SCENES.find((s) => frame >= s.start && frame < s.end) || SCENES[SCENES.length - 1];
}

export function cueFramesInScene(sceneId) {
  return SFX.filter((c) => {
    const s = SCENE_BY_ID[sceneId];
    return s && c.frame >= s.start && c.frame < s.end;
  });
}
