import { SCENE_BY_ID } from '../timeline/cues.js';

export function stubScene(id) {
  const s = SCENE_BY_ID[id];
  return {
    id,
    start: s.start,
    end: s.end,
    build(ctx) {
      const el = document.createElement('div');
      el.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;padding:0 120px;gap:26px;';
      el.innerHTML = `
        <div style="font:600 14px var(--font-ui);letter-spacing:.24em;text-transform:uppercase;color:#6b7280">
          ${s.act} · ${s.name} · ${s.id.toUpperCase()}
        </div>
        <h1 style="margin:0;font-family:var(--font-display);font-weight:850;font-size:148px;line-height:.94;letter-spacing:-.045em;color:#0b0c0e;max-width:1500px">
          ${s.headline}
        </h1>
        <div style="width:180px;height:2px;background:#2f6bff"></div>
      `;
      ctx.content.append(el);
      const duration = (s.end - s.start) / 24;
      const tl = ctx.gsap.timeline();
      tl.fromTo(el, { opacity: 0, y: 42 }, { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out' }, 0);
      tl.to(el, { opacity: 0.001, duration: 0.35 }, Math.max(0, duration - 0.35));
      return tl;
    },
  };
}
