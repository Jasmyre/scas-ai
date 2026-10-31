// Global cut language. Lives above every scene, so whips/flashes stay consistent.
// All times are absolute seconds. 1 frame = 1/24s.

export const CUTS = [
  { frame: 0, type: 'impact', strength: 1.0 },
  { frame: 96, type: 'whip', blur: 10, dir: 'up' },
  { frame: 192, type: 'flash', strength: 0.95, blur: 14 },
  { frame: 288, type: 'whip', blur: 9, dir: 'right' },
  { frame: 432, type: 'flash', strength: 0.32, blur: 6 },
  { frame: 576, type: 'ripple', strength: 0.45, blur: 8 },
  { frame: 720, type: 'whip', blur: 8, dir: 'left' },
  { frame: 912, type: 'flash', strength: 0.62, blur: 10 },
  { frame: 1152, type: 'whip', blur: 7, dir: 'right' },
  { frame: 1344, type: 'flash', strength: 0.3, blur: 6 },
  { frame: 1632, type: 'whip', blur: 9, dir: 'up' },
  { frame: 1776, type: 'flash', strength: 0.42, blur: 9 },
  { frame: 1920, type: 'whip', blur: 7, dir: 'left' },
  { frame: 2064, type: 'flash', strength: 0.5, blur: 11 },
  { frame: 2208, type: 'impact', strength: 1.0, blur: 14 },
  { frame: 2352, type: 'whip', blur: 8, dir: 'right' },
  { frame: 2544, type: 'ripple', strength: 0.55, blur: 9 },
];

const F = 1 / 24;

export function buildTransitions(gsap, { rigEl, flashEl, stage, fps = 24 }) {
  const tl = gsap.timeline({ paused: true });
  const frame = 1 / fps;

  for (const cut of CUTS) {
    const t = cut.frame / fps;
    const blur = cut.blur ?? 8;

    if (stage) {
      const amp = cut.type === 'impact' ? 14 : cut.type === 'flash' ? 8 : 5;
      stage.shake(t, amp);
    }

    if (flashEl) {
      if (cut.type === 'impact') {
        tl.set(flashEl, { opacity: 0.9 }, t);
        tl.to(flashEl, { opacity: 0, duration: 5 * frame, ease: 'power2.out' }, t + frame);
      } else if (cut.type === 'flash') {
        tl.set(flashEl, { opacity: cut.strength ?? 0.5 }, t);
        tl.to(flashEl, { opacity: 0, duration: 7 * frame, ease: 'power2.out' }, t + frame);
      } else if (cut.type === 'ripple') {
        tl.set(flashEl, { opacity: cut.strength ?? 0.4 }, t);
        tl.to(flashEl, { opacity: 0, duration: 9 * frame, ease: 'power3.out' }, t + frame);
      } else {
        tl.set(flashEl, { opacity: 0.16 }, t);
        tl.to(flashEl, { opacity: 0, duration: 4 * frame, ease: 'power2.out' }, t + frame);
      }
    }

    if (rigEl) {
      if (cut.type !== 'impact') {
        tl.fromTo(
          rigEl,
          { filter: 'blur(0px)' },
          { filter: `blur(${blur}px)`, duration: 2 * frame, ease: 'power2.in' },
          t - 2 * frame
        );
        tl.to(rigEl, { filter: 'blur(0px)', duration: 7 * frame, ease: 'power2.out' }, t);
      } else {
        tl.fromTo(
          rigEl,
          { filter: 'blur(0px)' },
          { filter: `blur(${blur}px)`, duration: 1 * frame, ease: 'none' },
          t
        );
        tl.to(rigEl, { filter: 'blur(0px)', duration: 10 * frame, ease: 'power3.out' }, t + frame);
      }
    }
  }

  return tl;
}
