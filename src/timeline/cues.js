// ─────────────────────────────────────────────────────────────────────────────
// THE CUE SHEET IS THE SINGLE SOURCE OF TRUTH.
// Visual timelines, interaction beats, and audio synthesis all read from here.
// Do not change timing in a scene without changing it here first.
// 24 FPS · 88.000s · 2,112 frames · 120 BPM (1 beat = 12f, 1 bar = 48f)
// ─────────────────────────────────────────────────────────────────────────────

export const FPS = 24;
export const DURATION = 88;
export const TOTAL_FRAMES = FPS * DURATION; // 2112
export const BPM = 120;
export const FRAMES_PER_BEAT = (FPS * 60) / BPM; // 12
export const FRAMES_PER_BAR = FRAMES_PER_BEAT * 4; // 48

export const SCENES = [
  { id: 's01', slug: 'cold-open', name: 'Cold Open', act: 'I', start: 0, end: 96, headline: 'The portal knows everything.' },
  { id: 's02', slug: 'silence', name: 'The Silence', act: 'I', start: 96, end: 192, headline: 'It just never says it.' },
  { id: 's03', slug: 'reveal', name: 'Reveal', act: 'I', start: 192, end: 288, headline: 'Meet SCAS AI.' },
  { id: 's04', slug: 'dashboard', name: 'The Control Room', act: 'II', start: 288, end: 432, headline: 'The control room.' },
  { id: 's05', slug: 'tenant', name: 'New Assistant', act: 'II', start: 432, end: 576, headline: 'Spin up a brain.' },
  { id: 's06', slug: 'knowledge', name: 'Knowledge', act: 'II', start: 576, end: 720, headline: 'Feed it everything.' },
  { id: 's07', slug: 'guardrails', name: 'Guardrails', act: 'II', start: 720, end: 864, headline: 'Grounded. Or silent.' },
  { id: 's08', slug: 'portal', name: 'The Portal', act: 'III', start: 864, end: 1104, headline: 'Your portal. Now it talks.' },
  { id: 's09', slug: 'balance', name: 'Balance', act: 'III', start: 1104, end: 1296, headline: 'Ask about your balance.' },
  { id: 's10', slug: 'multimodal', name: 'Multimodal', act: 'III', start: 1296, end: 1488, headline: 'It reads what you give it.' },
  { id: 's11', slug: 'proactive', name: 'Proactive', act: 'III', start: 1488, end: 1632, headline: 'It already knew.' },
  { id: 's12', slug: 'trust', name: 'Trust', act: 'IV', start: 1632, end: 1776, headline: 'Yours alone.' },
  { id: 's13', slug: 'audit', name: 'Audit', act: 'IV', start: 1776, end: 1920, headline: 'Every answer. Accounted for.' },
  { id: 's14', slug: 'finale', name: 'Finale', act: 'IV', start: 1920, end: 2112, headline: 'Ask anything.' },
];

export const MUSIC = {
  bpm: 120,
  key: 'A minor',
  bars: 44,
  sections: [
    { name: 'intro', startBar: 1, endBar: 3, note: 'filtered pad, sub pulse, ticks' },
    { name: 'tension', startBar: 4, endBar: 6, note: 'arp enters, reverse riser' },
    { name: 'drop-1', startBar: 7, endBar: 9, note: 'kick, bass, clap, hats' },
    { name: 'groove-a', startBar: 10, endBar: 12, note: 'full groove' },
    { name: 'knowledge', startBar: 13, endBar: 15, note: 'pluck + data ticks' },
    { name: 'guardrails', startBar: 16, endBar: 18, note: 'build, filter sweep' },
    { name: 'portal-breakdown', startBar: 19, endBar: 23, note: 'kick out, warm pad, soft ticks' },
    { name: 'chat-groove', startBar: 24, endBar: 27, note: 'kick returns, tight bass' },
    { name: 'peak-a', startBar: 28, endBar: 31, note: 'peak energy' },
    { name: 'peak-b', startBar: 32, endBar: 34, note: 'peak with counter-melody' },
    { name: 'trust-tension', startBar: 35, endBar: 37, note: 'strip to pulse + riser' },
    { name: 'audit', startBar: 38, endBar: 40, note: 'build' },
    { name: 'finale', startBar: 41, endBar: 44, note: 'impact, shimmer, tail' },
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

  // S05 New Assistant
  { frame: 432, type: 'pop', gain: 0.5, pan: 0.1 },
  { frame: 444, type: 'click', gain: 0.45, pan: 0.2 },
  { frame: 508, type: 'click', gain: 0.4, pan: 0.2 },
  { frame: 516, type: 'toggle', gain: 0.4, pan: 0.2 },
  { frame: 540, type: 'click', gain: 0.4, pan: 0.2 },
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
  { frame: 812, type: 'error', gain: 0.6, pan: 0 },
  { frame: 816, type: 'shield', gain: 0.5, pan: 0 },
  { frame: 858, type: 'confirm', gain: 0.45, pan: 0.1 },
  { frame: 862, type: 'chime', gain: 0.4, pan: 0.1 },

  // S08 Portal
  { frame: 864, type: 'ambientSwell', gain: 0.35, pan: 0, dur: 2 },
  { frame: 880, type: 'whoosh', gain: 0.35, pan: -0.25 },
  { frame: 936, type: 'hover', gain: 0.3, pan: 0.3 },
  { frame: 984, type: 'click', gain: 0.5, pan: 0.3 },
  { frame: 1008, type: 'widgetWhoosh', gain: 0.55, pan: 0.2 },
  { frame: 1056, type: 'chime', gain: 0.45, pan: 0.2 },

  // S09 Balance
  { frame: 1104, type: 'click', gain: 0.4, pan: 0.2 },
  { frame: 1180, type: 'send', gain: 0.45, pan: 0.2 },
  { frame: 1188, type: 'tick', gain: 0.2, pan: 0.2 },
  { frame: 1194, type: 'tick', gain: 0.2, pan: 0.2 },
  { frame: 1200, type: 'chime', gain: 0.5, pan: 0.2 },
  { frame: 1248, type: 'shimmer', gain: 0.35, pan: 0.1 },

  // S10 Multimodal
  { frame: 1296, type: 'swoosh', gain: 0.45, pan: 0.2 },
  { frame: 1310, type: 'swoosh', gain: 0.4, pan: 0.25 },
  { frame: 1324, type: 'drop', gain: 0.5, pan: 0.2 },
  { frame: 1332, type: 'drop', gain: 0.45, pan: 0.2 },
  { frame: 1350, type: 'tick', gain: 0.22, pan: 0.2 },
  { frame: 1356, type: 'tick', gain: 0.22, pan: 0.2 },
  { frame: 1362, type: 'tick', gain: 0.22, pan: 0.2 },
  { frame: 1368, type: 'tick', gain: 0.22, pan: 0.2 },
  { frame: 1374, type: 'tick', gain: 0.22, pan: 0.2 },
  { frame: 1380, type: 'tick', gain: 0.22, pan: 0.2 },
  { frame: 1386, type: 'tick', gain: 0.22, pan: 0.2 },
  { frame: 1392, type: 'pop', gain: 0.35, pan: 0.15 },
  { frame: 1398, type: 'pop', gain: 0.35, pan: 0.2 },
  { frame: 1404, type: 'pop', gain: 0.35, pan: 0.25 },
  { frame: 1416, type: 'chime', gain: 0.5, pan: 0.2 },

  // S11 Proactive
  { frame: 1488, type: 'ping', gain: 0.5, pan: 0.25 },
  { frame: 1500, type: 'click', gain: 0.4, pan: 0.3 },
  { frame: 1512, type: 'ping', gain: 0.45, pan: 0.25 },
  { frame: 1536, type: 'pop', gain: 0.4, pan: 0.2 },
  { frame: 1588, type: 'send', gain: 0.4, pan: 0.2 },
  { frame: 1608, type: 'chime', gain: 0.5, pan: 0.2 },
  { frame: 1620, type: 'tick', gain: 0.25, pan: 0.1 },
  { frame: 1630, type: 'whoosh', gain: 0.35, pan: 0 },

  // S12 Trust
  { frame: 1632, type: 'riser', gain: 0.5, dur: 2.8, pan: 0 },
  { frame: 1680, type: 'lock', gain: 0.6, pan: 0 },
  { frame: 1704, type: 'vault', gain: 0.65, pan: 0 },
  { frame: 1752, type: 'shimmer', gain: 0.4, pan: 0 },

  // S13 Audit
  { frame: 1776, type: 'tick', gain: 0.28, pan: -0.2 },
  { frame: 1800, type: 'tick', gain: 0.28, pan: -0.1 },
  { frame: 1824, type: 'whoosh', gain: 0.4, pan: 0.1 },
  { frame: 1840, type: 'tick', gain: 0.25, pan: 0.1 },
  { frame: 1860, type: 'tick', gain: 0.25, pan: 0.2 },
  { frame: 1872, type: 'confirm', gain: 0.5, pan: 0.1 },
  { frame: 1908, type: 'riser', gain: 0.45, dur: 0.9, pan: 0 },

  // S14 Finale
  { frame: 1920, type: 'impact', gain: 0.9, pan: 0 },
  { frame: 1968, type: 'lock', gain: 0.65, pan: 0 },
  { frame: 1992, type: 'shimmer', gain: 0.4, pan: 0 },
  { frame: 2040, type: 'boom', gain: 0.4, pan: 0 },
];

// ── Typing ───────────────────────────────────────────────────────────────────
// cps = characters per second. Visual typewriter and audio ticks share this.
export const TYPING = [
  { scene: 's05', target: '#assistant-name', start: 450, cps: 8, text: 'SCAS Edusuite UNI' },
  { scene: 's07', target: '#guardrail-prompt', start: 744, cps: 12, text: "Show me another student's grades" },
  { scene: 's07', target: '#guardrail-prompt', start: 820, cps: 16, text: 'How do I clear my account?' },
  { scene: 's09', target: '#chat-input', start: 1128, cps: 12, text: 'How much do I still owe?' },
  { scene: 's11', target: '#chat-input', start: 1548, cps: 12, text: "What's my schedule?" },
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
  { scene: 's07', frame: 744, action: 'type', target: '#guardrail-prompt', zoom: 1.8 },
  { scene: 's07', frame: 812, action: 'click', target: '#guardrail-send', zoom: 1.6 },
  { scene: 's07', frame: 820, action: 'type', target: '#guardrail-prompt', zoom: 1.55 },
  { scene: 's07', frame: 858, action: 'click', target: '#guardrail-send', zoom: 1.45 },
  { scene: 's08', frame: 960, action: 'hover', target: '#chat-launcher', zoom: 1.0 },
  { scene: 's08', frame: 984, action: 'click', target: '#chat-launcher', zoom: 1.25 },
  { scene: 's09', frame: 1120, action: 'click', target: '#chat-input', zoom: 1.8 },
  { scene: 's09', frame: 1128, action: 'type', target: '#chat-input', zoom: 1.8 },
  { scene: 's09', frame: 1180, action: 'click', target: '#chat-send', zoom: 1.6 },
  { scene: 's09', frame: 1186, action: 'release', target: '#chat-send', zoom: 1.35 },
  { scene: 's10', frame: 1320, action: 'drop', target: '#chat-dropzone', zoom: 1.6 },
  { scene: 's10', frame: 1368, action: 'click', target: '#chat-composer', zoom: 1.9 },
  { scene: 's10', frame: 1400, action: 'release', target: '#chat-composer', zoom: 1.25 },
  { scene: 's11', frame: 1500, action: 'click', target: '#chat-badge', zoom: 1.5 },
  { scene: 's11', frame: 1548, action: 'click', target: '#chat-input', zoom: 1.7 },
  { scene: 's11', frame: 1548, action: 'type', target: '#chat-input', zoom: 1.7 },
  { scene: 's11', frame: 1588, action: 'click', target: '#chat-send', zoom: 1.5 },
  { scene: 's11', frame: 1594, action: 'release', target: '#chat-send', zoom: 1.25 },
  { scene: 's13', frame: 1824, action: 'click', target: '#audit-row-1', zoom: 1.5 },
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
