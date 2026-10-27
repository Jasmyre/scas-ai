// Continuous camera rig. Every frame carries organic sway; no static holds.
export function createCameraRig(gsap, el) {
  const impulses = [];

  function addImpulse(t, amp = 1, dur = 0.55) {
    impulses.push({ t, amp, dur });
  }

  function update(t) {
    const x =
      7 * Math.sin(t * 0.61) +
      3 * Math.sin(t * 1.27 + 1.1) +
      1.5 * Math.sin(t * 2.11 + 0.4);
    const y =
      4.5 * Math.cos(t * 0.47) +
      2.2 * Math.sin(t * 0.93 + 2.0) +
      1.2 * Math.cos(t * 1.71);
    const rot =
      0.22 * Math.sin(t * 0.37) +
      0.1 * Math.sin(t * 0.83 + 1.7);
    const scale = 1 + 0.0035 * Math.sin(t * 0.23 + 0.8);

    let sx = 0;
    let sy = 0;
    let sr = 0;
    for (let i = 0; i < impulses.length; i += 1) {
      const imp = impulses[i];
      const age = t - imp.t;
      if (age < 0 || age > imp.dur) continue;
      const env = Math.exp(-age * 7.5);
      const a = imp.amp * env;
      sx += a * Math.sin(age * 92);
      sy += a * 0.8 * Math.cos(age * 77);
      sr += a * 0.08 * Math.sin(age * 63);
    }

    gsap.set(el, {
      x: x + sx,
      y: y + sy,
      rotation: rot + sr,
      scale,
      force3D: true,
      transformOrigin: '50% 50%',
    });
  }

  return { update, addImpulse, impulses };
}
