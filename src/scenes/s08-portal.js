import { PORTAL_DATA } from '../timeline/cues.js';
import { createPortal, portalRowSelector } from '../ui/portal/index.js';
import {
  createChatWidget,
  chatGreeting,
  chatNudges,
  chatThinking,
  chatThread,
} from '../ui/portal/chat.js';
import {
  sceneHeadline,
  revealHeadline,
  retractHeadline,
  countAmount,
  ripple,
} from '../ui/portal/parts.js';

const CAL_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5" width="17" height="15.5" rx="3" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 9.6h17M8 3.4v3.2M16 3.4v3.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
const SHIELD_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 3.2 19 6v6c0 4.3-3 7.3-7 8.8-4-1.5-7-4.5-7-8.8V6l7-2.8Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`;

export default {
  id: 's08',
  start: 864,
  end: 1104,
  build(ctx) {
    const { gsap, cam, content, ia } = ctx;
    const tl = gsap.timeline();

    const portal = createPortal({ countUp: true });
    content.append(portal);

    const chat = createChatWidget({ launcherHidden: true });
    content.append(chat);

    const thread = chatThread(chat);
    const greeting = chatGreeting();
    const nudges = chatNudges([
      { title: 'What do I still owe?', meta: 'Balance · due Nov 15', icon: CAL_ICON },
      { title: "What's my schedule?", meta: 'CC1003 · Wed 12:00 PM', icon: SHIELD_ICON },
    ]);
    const thinking = chatThinking();
    thread.append(thinking, greeting, nudges);

    const head = sceneHeadline(ctx, ['Your portal.', 'Now it talks.'], {
      top: 76,
      left: 106,
      width: 820,
      size: 120,
      scrim: true,
    });

    const launcher = chat.querySelector('#chat-launcher');
    const win = chat.querySelector('#chat-composer');

    // ── Opening: portal already visible, snapped to the seal/nav.
    tl.set(cam, { x: 0, y: 0, scale: 1.34 }, 0);
    revealHeadline(tl, head, { at: 0.04, stagger: 0.08, duration: 0.66 });

    // ── Camera glide: seal/nav → classes table → balance, then pull back.
    tl.to(cam, { x: 0, y: 0, scale: 1.34, duration: 0.28, ease: 'none' }, 0);
    tl.to(cam, { x: -70, y: -60, scale: 1.3, duration: 0.9, ease: 'power2.inOut' }, 0.3);
    tl.to(cam, { x: -250, y: -175, scale: 1.38, duration: 0.9, ease: 'power2.inOut' }, 1.2);
    tl.to(cam, { x: -330, y: -300, scale: 1.44, duration: 0.85, ease: 'power2.inOut' }, 2.1);
    tl.to(cam, { x: -40, y: -30, scale: 1.04, duration: 0.55, ease: 'power2.inOut' }, 3.0);
    tl.to(cam, { x: 0, y: 0, scale: 1.0, duration: 0.3, ease: 'power2.inOut' }, 3.55);

    // ── Rows spotlight as the camera passes.
    PORTAL_DATA.courses.forEach((course, i) => {
      ia.highlight(portalRowSelector(course.code), {
        at: 0.92 + i * 0.235,
        duration: 0.5,
        color: 'rgba(67, 198, 243, 0.12)',
      });
    });

    // ── Balance counts up to 4,756.94.
    countAmount(tl, portal.querySelector('#portal-balance-amount'), 4756.94, {
      at: 2.15,
      duration: 1.25,
      from: 0,
    });

    // ── Launcher drops in, hover, click.
    tl.fromTo(
      launcher,
      { y: -120, scale: 0.7, opacity: 0 },
      { y: 0, scale: 1, opacity: 1, duration: 0.62, ease: 'back.out(1.55)', immediateRender: false },
      4.0
    );
    ia.moveCursor('#chat-launcher', { at: 4.0, duration: 0.34 });
    tl.to(launcher, { scale: 1.06, duration: 0.2, ease: 'power2.out' }, 4.72);
    ripple(ctx, 1853, 1013, { at: 4.55, tl, size: 54, color: 'rgba(47,107,255,.28)', duration: 0.9 });

    ia.click('#chat-launcher', { at: 5.0, zoom: 1.25 });
    tl.to(launcher, { scale: 0.9, duration: 0.09 }, 5.0);
    tl.to(launcher, { scale: 1, duration: 0.24, ease: 'back.out(2.2)' }, 5.09);
    ia.release({ at: 5.34, duration: 0.4 });

    // ── Headline retracts as the widget opens.
    retractHeadline(tl, head, { at: 5.7, duration: 0.4, stagger: 0.04 });

    // ── Widget expands out of the orb.
    tl.call(() => chat.classList.add('is-open'), null, 6.0);
    tl.set(win, { transformOrigin: '100% 100%' }, 6.0);
    tl.fromTo(
      win,
      { scale: 0.2, y: 46, opacity: 0 },
      { scale: 1, y: 0, opacity: 1, duration: 0.64, ease: 'expo.out', immediateRender: false },
      6.0
    );
    tl.to(launcher, { scale: 0.82, opacity: 0, duration: 0.3, ease: 'power2.in' }, 6.02);

    // ── Thread comes alive: thinking, then the greeting lands at f1056.
    tl.set(thinking, { opacity: 0, y: 10, display: 'none' }, 0);
    tl.set(greeting, { opacity: 0, y: 16, scale: 0.98 }, 0);
    tl.set(nudges, { opacity: 0, y: 10 }, 0);
    tl.set(thinking, { display: 'flex' }, 6.84);
    tl.to(thinking, { opacity: 1, y: 0, duration: 0.28 }, 6.85);
    tl.to(thinking, { opacity: 0, y: -6, duration: 0.2 }, 7.78);
    tl.set(thinking, { display: 'none' }, 7.99);
    tl.to(greeting, { opacity: 1, y: 0, scale: 1, duration: 0.44, ease: 'power3.out' }, 8.0);
    tl.to(nudges, { opacity: 1, y: 0, duration: 0.36, ease: 'power2.out' }, 8.36);

    // ── Hold with a slow push so the frame stays alive.
    tl.to(cam, { x: -6, y: 4, scale: 1.005, duration: 2.0, ease: 'power1.inOut' }, 7.6);
    tl.to(head, { opacity: 0, duration: 0.2 }, 6.3);

    return tl;
  },
};
