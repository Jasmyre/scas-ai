import { scasSeal } from '../design/logo.js';
import { headline, revealHeadline, retractHeadline } from '../design/headline.js';

const NODES = [
  { x: 450, y: 210, r: 26, core: true },
  { x: 190, y: 120, r: 10, cluster: 'doc' },
  { x: 280, y: 196, r: 7, cluster: 'doc' },
  { x: 170, y: 268, r: 8, cluster: 'doc' },
  { x: 300, y: 322, r: 6, cluster: 'doc' },
  { x: 430, y: 92, r: 6 },
  { x: 520, y: 120, r: 5 },
  { x: 612, y: 116, r: 9, cluster: 'img' },
  { x: 716, y: 178, r: 7, cluster: 'img' },
  { x: 760, y: 290, r: 5, cluster: 'img' },
  { x: 612, y: 344, r: 8, cluster: 'txt' },
  { x: 720, y: 320, r: 6, cluster: 'txt' },
  { x: 520, y: 356, r: 5, cluster: 'txt' },
  { x: 340, y: 396, r: 5 },
];

const LABELS = [
  { x: 168, y: 84, text: 'TUITION' },
  { x: 594, y: 80, text: 'IMAGES' },
  { x: 590, y: 392, text: 'FAQ' },
];

function graphSVG() {
  const core = NODES[0];
  const edges = NODES.slice(1)
    .map(
      (n, i) =>
        `<line class="g-edge" x1="${core.x}" y1="${core.y}" x2="${n.x}" y2="${n.y}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>`
    )
    .join('');
  const nodes = NODES.slice(1)
    .map(
      (n, i) => `<g class="g-node" data-cluster="${n.cluster || 'base'}" data-i="${i + 1}" transform="translate(${n.x} ${n.y})">
        <circle class="g-halo" r="${n.r + 7}" fill="rgba(47,107,255,.06)"/>
        <circle class="g-dot" r="${n.r}" fill="#fff" stroke="#c7d3e8" stroke-width="1.6"/>
        ${n.r >= 8 ? `<circle r="${n.r * 0.34}" fill="#2f6bff" opacity=".7"/>` : ''}
      </g>`
    )
    .join('');

  return `<svg class="know-map-svg" viewBox="0 0 900 440" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <g class="g-edges">${edges}</g>
    <g class="g-core" transform="translate(${core.x} ${core.y})">
      <circle class="g-core__halo" r="74" fill="rgba(47,107,255,.05)"/>
      <circle class="g-core__ring" r="48" fill="none" stroke="rgba(47,107,255,.18)" stroke-width="1" stroke-dasharray="3 5"/>
      <circle r="26" fill="#fff" stroke="#2f6bff" stroke-width="1.8"/>
      <circle r="11" fill="#2f6bff" opacity=".9"/>
      <circle r="4" fill="#fff"/>
    </g>
    <g class="g-labels">${LABELS.map((l) => `<text x="${l.x}" y="${l.y}" class="g-label">${l.text}</text>`).join('')}</g>
    ${nodes}
  </svg>`;
}

export default {
  id: 's06',
  start: 576,
  end: 720,
  build(ctx) {
    const { gsap, content, cam } = ctx;
    const f = (n) => (n - 576) / 24;

    const scene = document.createElement('div');
    scene.className = 'know';
    scene.innerHTML = `
      <div class="know-grid"></div>
      <header class="know-head">
        <div class="know-brand">${scasSeal(26)}<div><strong>SCAS AI</strong><span>Knowledge</span></div></div>
        <div class="know-portal"><span class="know-portal__mark">EU</span>SCAS Edusuite UNI<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m4 6 4 4 4-4"/></svg></div>
        <span class="know-sync"><i></i>Synced · 214 sources</span>
      </header>

      <div class="know-eyebrow">Knowledge · ingestion pipeline</div>
      <h1 class="display display-md know-title">Upload relevant context.</h1>

      <div class="know-body">
        <div class="know-left">
          <div class="know-sources">
            <div class="know-src" data-src="doc">
              <span class="know-src__icon">
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M5.5 2.8h7l4 4v12.4h-11z"/><path d="M12.5 2.8v4h4M8.4 11h5.2M8.4 14h4"/></svg>
              </span>
              <div class="know-src__main"><strong>Tuition_Guide.pdf</strong><span>PDF · 3.2 MB · 38 pages</span></div>
              <span class="know-src__type">DOCUMENT</span>
            </div>
            <div class="know-src" data-src="img">
              <span class="know-src__icon">
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="4" width="16" height="14" rx="2"/><circle cx="8" cy="9" r="1.6"/><path d="m4.5 16.5 4.6-4.4 3.2 3 2.4-2.1 3 3.5"/></svg>
              </span>
              <div class="know-src__main"><strong>SOA_Oct.png</strong><span>PNG · 1.4 MB · statement of account</span></div>
              <span class="know-src__type">IMAGE</span>
            </div>
            <div class="know-src" data-src="txt">
              <span class="know-src__icon">
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M4 5h14M4 9h14M4 13h10M4 17h7"/></svg>
              </span>
              <div class="know-src__main"><strong>Pasted raw text</strong><span>TEXT · 1,842 words · registrar FAQ</span></div>
              <span class="know-src__type">TEXT</span>
            </div>
          </div>

          <div class="know-chips">
            <span class="know-chip" data-chip="doc"><i></i>DOCUMENT</span>
            <span class="know-chip" data-chip="img"><i></i>IMAGE</span>
            <span class="know-chip" data-chip="txt"><i></i>TEXT</span>
          </div>

          <div class="know-steps">
            <span data-step="0"><i></i>Chunk</span><b></b>
            <span data-step="1"><i></i>Embed</span><b></b>
            <span data-step="2"><i></i>Index</span>
          </div>

          <div class="know-well" id="know-well">
            <div class="know-well__scan"></div>
            <div class="know-well__bars">${Array.from({ length: 22 }, (_, i) => `<i style="--h:${22 + ((i * 37) % 58)}%"></i>`).join('')}</div>
            <div class="know-well__id">
              <span class="know-well__orb"><i></i><i></i><i></i></span>
              <div><strong>Ingestion well</strong><span>chunk · embed · index</span></div>
            </div>
            <div class="know-well__status"><b>3</b> sources queued</div>
          </div>
        </div>

        <section class="know-graph">
          <div class="know-graph__head">
            <div><strong>Knowledge index</strong><span>SCAS Edusuite UNI · live</span></div>
            <span class="know-grounded"><i></i>98.7% grounded</span>
          </div>
          <div class="know-map" id="know-map">${graphSVG()}</div>
          <div class="know-counters">
            <div><strong data-count="214" data-dec="0">0</strong><span>Chunks</span></div>
            <div><strong data-count="38" data-dec="0">0</strong><span>Pages</span></div>
            <div><strong data-count="6" data-dec="0">0</strong><span>Tables</span></div>
            <div><strong data-count="99.2" data-dec="1" data-suffix="%">0%</strong><span>Coverage</span></div>
          </div>
        </section>
      </div>

      <div class="know-particles"></div>`;
    content.append(scene);

    const tl = gsap.timeline();
    let seed = 29;
    const rnd = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const tiles = [...scene.querySelectorAll('.know-src')];
    const well = scene.querySelector('#know-well');
    const map = scene.querySelector('#know-map');
    const particleLayer = scene.querySelector('.know-particles');
    const steps = [...scene.querySelectorAll('.know-steps span')];

    const head = scene.querySelector('.know-head');
    const eyebrow = scene.querySelector('.know-eyebrow');
    const titleEl = scene.querySelector('.know-title');
    const hr = headline(['Upload relevant context.'], {
      className: 'display display-sm',
      top: '104px',
      left: '120px',
      width: '1700px',
    });
    titleEl.replaceWith(hr);
    revealHeadline(tl, hr, { at: 0.05, duration: 0.62, stagger: 0.06 });

    tl.fromTo(head, { y: -14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }, 0);
    tl.fromTo(eyebrow, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 0.12);
    tl.fromTo(scene.querySelector('.know-graph'), { y: 18, opacity: 0.3 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }, 0.18);
    tl.fromTo(well, { y: 16, scale: 0.98, opacity: 0.4 }, { y: 0, scale: 1, opacity: 1, duration: 0.45, ease: 'power3.out' }, 0.35);
    tl.fromTo(
      scene.querySelectorAll('.know-well__bars i'),
      { scaleY: 0.08, opacity: 0 },
      { scaleY: 1, opacity: 1, duration: 0.55, stagger: 0.018, ease: 'power2.out' },
      0.62
    );

    // Destinations in the index for each modality.
    const wellRect = well.getBoundingClientRect();
    const mapRect = map.getBoundingClientRect();
    const toMap = (x, y) => ({
      x: mapRect.left + (x / 900) * mapRect.width,
      y: mapRect.top + (y / 440) * mapRect.height,
    });
    const targets = { doc: toMap(280, 196), img: toMap(660, 150), txt: toMap(612, 344) };

    const drops = [
      { src: 'doc', at: f(612), tile: tiles[0] },
      { src: 'img', at: f(636), tile: tiles[1] },
      { src: 'txt', at: f(660), tile: tiles[2] },
    ];

    // Sources fly in. Pre-hide at build time so a card can never be visible
    // before its entrance tween runs (fromTo alone renders late on some frames).
    gsap.set(tiles, { opacity: 0 });
    tiles.forEach((tile, i) => {
      tl.fromTo(
        tile,
        { x: -70, y: -8, rotateZ: -2.5, opacity: 0 },
        { x: 0, y: 0, rotateZ: 0, opacity: 1, duration: 0.48, ease: 'power3.out', immediateRender: false },
        0.62 + i * 0.34
      );
    });
    scene.querySelectorAll('.know-chip').forEach((chip, i) => {
      tl.fromTo(chip, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.28 }, 0.9 + i * 0.08);
    });

    // Index draws itself, then reacts as sources land.
    tl.fromTo(scene.querySelectorAll('.g-edge'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.1, stagger: 0.035, ease: 'power2.inOut' }, 0.55);
    tl.fromTo(
      scene.querySelectorAll('.g-node'),
      { scale: 0.4, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, stagger: 0.055, ease: 'back.out(1.7)', transformOrigin: '50% 50%' },
      0.62
    );
    tl.fromTo(scene.querySelector('.g-core'), { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.4)', transformOrigin: '50% 50%' }, 0.5);

    drops.forEach((drop, idx) => {
      const t = drop.at;
      const tr = drop.tile.getBoundingClientRect();
      const dx = wellRect.left + wellRect.width / 2 - (tr.left + tr.width / 2);
      const dy = wellRect.top + 30 - (tr.top + tr.height / 2);

      // A clone flies into the well; the source row stays, dimmed, as a receipt.
      const ghost = drop.tile.cloneNode(true);
      ghost.classList.add('know-src--ghost');
      ghost.style.left = `${tr.left}px`;
      ghost.style.top = `${tr.top}px`;
      ghost.style.width = `${tr.width}px`;
      ghost.style.height = `${tr.height}px`;
      particleLayer.append(ghost);
      gsap.set(ghost, { opacity: 0 });
      tl.set(ghost, { opacity: 1 }, t);
      tl.to(ghost, { x: dx, y: dy, scale: 0.52, opacity: 0, duration: 0.32, ease: 'power2.in' }, t);
      tl.call(
        () => {
          drop.tile.classList.add('is-done');
          drop.tile.querySelector('.know-src__type').textContent = 'INGESTED';
        },
        null,
        t + 0.16
      );

      tl.fromTo(well, { scaleY: 1 }, { scaleY: 0.955, duration: 0.09, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 100%' }, t + 0.12);
      tl.to(
        well.querySelectorAll('.know-well__bars i'),
        { scaleY: 1.09, duration: 0.1, stagger: 0.006, yoyo: true, repeat: 1, ease: 'sine.inOut' },
        t + 0.02
      );
      tl.to(scene.querySelector(`.know-chip[data-chip="${drop.src}"]`), { color: '#1e4fd6', borderColor: 'rgba(47,107,255,.34)', background: '#eef3ff', duration: 0.18 }, t + 0.1);
      tl.to(scene.querySelectorAll(`.g-node[data-cluster="${drop.src}"]`), { scale: 1.28, duration: 0.11, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%' }, t + 0.35);

      // Pipeline steps light up in order as each modality lands.
      tl.call(() => {
        steps[idx]?.classList.add('is-on');
        const link = steps[idx]?.nextElementSibling;
        if (link && link.tagName === 'B') link.classList.add('is-on');
      }, null, t + 0.3);

      // DOM particle stream from the well into the matching cluster.
      const target = targets[drop.src];
      for (let i = 0; i < 18; i += 1) {
        const p = document.createElement('span');
        p.className = 'know-particle';
        particleLayer.append(p);
        const sx = wellRect.left + wellRect.width * 0.5 + (rnd() - 0.5) * 80;
        const sy = wellRect.top + 26 + (rnd() - 0.5) * 18;
        const tx = target.x + (rnd() - 0.5) * 46;
        const ty = target.y + (rnd() - 0.5) * 46;
        const mx = (sx + tx) / 2 + (rnd() - 0.5) * 40;
        const my = Math.min(sy, ty) - 40 - rnd() * 50;
        const d = 0.012 * i;
        gsap.set(p, { x: sx - 2, y: sy - 2, opacity: 0, scale: 0.5 + rnd() * 0.7 });
        tl.to(p, { x: mx, y: my, opacity: 1, duration: 0.16, ease: 'power1.out' }, t + 0.06 + d);
        tl.to(p, { x: tx, y: ty, opacity: 0, scale: 0.35, duration: 0.44, ease: 'power2.in' }, t + 0.22 + d);
      }

      // Small camera push on each drop.
      tl.to(cam, { scale: 1.035, x: -18, y: -26, duration: 0.2, ease: 'power2.out' }, t);
      tl.to(cam, { scale: 1, x: 0, y: 0, duration: 0.28, ease: 'power2.inOut' }, t + 0.24);
      tl.to(well.querySelector('.know-well__status b'), { opacity: 0.35, duration: 0.12, yoyo: true, repeat: 1 }, t);
    });

    // Ambient index dust drifts through the middle of the scene.
    for (let i = 0; i < 42; i += 1) {
      const p = document.createElement('span');
      p.className = 'know-particle know-particle--ambient';
      particleLayer.append(p);
      const x = mapRect.left + 20 + rnd() * (mapRect.width - 40);
      const y = mapRect.top + 20 + rnd() * (mapRect.height - 40);
      const t0 = 1.4 + rnd() * 1.9;
      const life = 1.5 + rnd();
      const driftX = (rnd() - 0.5) * 28;
      const driftY = -18 - rnd() * 46;
      gsap.set(p, { x, y, opacity: 0, scale: 0.4 + rnd() * 0.8 });
      tl.to(p, { opacity: 0.35 + rnd() * 0.3, duration: 0.5, ease: 'sine.out' }, t0);
      tl.to(p, { x: x + driftX, y: y + driftY, duration: life, ease: 'sine.inOut' }, t0);
      tl.to(p, { opacity: 0, duration: 0.5 }, t0 + life - 0.2);
    }

    // Counters race as the sources land.
    scene.querySelectorAll('.know-counters strong').forEach((el, i) => {
      const target = Number(el.dataset.count);
      const dec = Number(el.dataset.dec || 0);
      const suffix = el.dataset.suffix || '';
      const obj = { v: 0 };
      tl.to(
        obj,
        {
          v: target,
          duration: 1.85,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = `${obj.v.toFixed(dec)}${suffix}`;
          },
          onComplete: () => {
            el.textContent = `${target.toFixed(dec)}${suffix}`;
          },
        },
        2.0 + i * 0.06
      );
    });

    tl.to(scene.querySelector('.know-well__status b'), { textContent: '0', duration: 0.01 }, 3.6);
    tl.to(scene.querySelectorAll('.know-particle'), { opacity: 0, duration: 0.3 }, 4.45);

    // Title and source rail clear the frame before the final dolly.
    retractHeadline(tl, hr, { at: 4.05, duration: 0.32 });
    tl.to([eyebrow, scene.querySelector('.know-left')], { opacity: 0, duration: 0.34, ease: 'power2.inOut' }, 4.2);

    // Dolly into the index and hold; the graph is the hero at the cut.
    tl.to(scene.querySelector('.g-core__halo'), { attr: { r: 96 }, opacity: 0.9, duration: 0.7, ease: 'power2.out' }, 4.3);
    tl.to(cam, { scale: 1.55, x: -1036, y: -545, duration: 0.85, ease: 'power2.inOut' }, 4.5);

    return tl;
  },
};
