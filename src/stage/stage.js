import { gsap } from 'gsap';
import { createCameraRig } from './camera.js';
import { FPS } from '../timeline/cues.js';

export function createStage({ root }) {
  const rigEl = root.querySelector('#rig');
  const mountEl = root.querySelector('#scene-mount');
  const rig = createCameraRig(gsap, rigEl);
  const layers = [];
  let atmosphere = null;

  function addScene(scene) {
    const el = document.createElement('div');
    el.className = 'scene';
    el.dataset.scene = scene.id;

    // Two camera nodes: `cam` is owned by the interaction director (focus zooms),
    // `camBase` is owned by the scene (dollies, orbits). Composing them keeps an
    // interaction zoom from stomping a scene move that is already in flight.
    const cam = document.createElement('div');
    cam.className = 'scene-cam';

    const camBase = document.createElement('div');
    camBase.className = 'scene-cam-base';

    const content = document.createElement('div');
    content.className = 'scene-content';

    const dof = document.createElement('div');
    dof.className = 'ia-dof';

    const cursor = document.createElement('div');
    cursor.className = 'ia-cursor-layer';

    camBase.append(content);
    cam.append(camBase);
    el.append(cam, dof, cursor);
    mountEl.append(el);

    // Visible during build so interaction targets can be measured.
    el.style.display = 'block';

    const layer = { scene, el, cam, camBase, content, dof, cursorLayer: cursor };
    layers.push(layer);
    return layer;
  }

  function sync(t) {
    const frame = t * FPS;

    for (const layer of layers) {
      // No pre-roll: a scene must not appear before its first frame. A short
      // post-roll keeps the outgoing frame alive under the cut flash so a whip
      // never reveals the bare canvas. Later scenes are later siblings, so the
      // incoming scene always paints on top during the overlap.
      const active = frame >= layer.scene.start && frame < layer.scene.end + 6;
      layer.el.classList.toggle('is-active', active);
      layer.el.style.display = active ? 'block' : 'none';
    }

    rig.update(t);
    if (atmosphere) atmosphere.render(t);
  }

  function setTime(t, master) {
    master.totalTime(t, false);
    sync(t);
  }

  function setAtmosphere(a) {
    atmosphere = a;
  }

  function shake(seconds, amp = 8) {
    rig.addImpulse(seconds, amp);
  }

  function getLayer(id) {
    return layers.find((l) => l.scene.id === id);
  }

  return { addScene, setTime, sync, setAtmosphere, shake, getLayer, layers, rigEl, mountEl };
}
