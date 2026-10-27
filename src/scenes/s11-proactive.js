import { createPortal, portalRowSelector } from '../ui/portal/index.js';
import {
  createChatWidget,
  chatGreeting,
  chatMessage,
  chatThinking,
  chatThread,
} from '../ui/portal/chat.js';
import { sceneHeadline, revealHeadline, retractHeadline } from '../ui/portal/parts.js';

export default {
  id: 's11',
  start: 1488,
  end: 1632,
  build(ctx) {
    const { gsap, cam, content, ia } = ctx;
    const tl = gsap.timeline();

    const portal = createPortal();
    content.append(portal);

    const chat = createChatWidget({ open: false, badge: 2 });
    content.append(chat);

    const thread = chatThread(chat);
    const greeting = chatGreeting();
    const noteSchedule = chatMessage({
      role: 'ai',
      id: 'chat-proactive-schedule',
      html: `Heads up — <b>CC1003</b> is at <b>12:00 PM</b> today, not 3:00 PM. Your room is still <b>LABORATORY - COMLAB2</b>.`,
      sources: ['Schedule · updated 9:20 AM'],
    });
    const noteBalance = chatMessage({
      role: 'ai',
      id: 'chat-proactive-balance',
      html: `Your <b>4,756.94</b> balance is due <b>Nov 15</b>. No penalties yet.`,
      sources: ['Balance · 1st Term'],
    });
    const thinking = chatThinking();
    const user = chatMessage({ role: 'user', html: "What's my schedule?" });
    const answer = chatMessage({
      role: 'ai',
      id: 'chat-schedule-answer',
      html: `Next up: <b>CC1003 — Data Structures and Algorithms</b>, today at <b>12:00 PM</b> in <b>LABORATORY - COMLAB2</b>. Your other classes are unchanged.`,
      sources: ['Schedule · Wednesday', 'Room assignment'],
    });
    thread.append(greeting, noteSchedule, noteBalance, user, thinking, answer);

    const head = sceneHeadline(ctx, 'It already knew.', {
      left: 104,
      bottom: 150,
      width: 1400,
      size: 120,
    });

    const badge = chat.querySelector('#chat-badge');
    const launcher = chat.querySelector('#chat-launcher');
    const win = chat.querySelector('#chat-composer');

    tl.set(noteSchedule, { opacity: 0, y: 14 }, 0);
    tl.set(noteBalance, { opacity: 0, y: 14 }, 0);
    tl.set(user, { opacity: 0, y: 12 }, 0);
    tl.set(thinking, { opacity: 0, display: 'none' }, 0);
    tl.set(answer, { opacity: 0, y: 12 }, 0);
    tl.set(badge, { scale: 1 }, 0);

    // ── The badge pings (f1500), the window opens out of the orb.
    ia.click('#chat-badge', { at: 0.5, zoom: 1.5, focusDuration: 0.26 });
    tl.call(() => chat.classList.add('is-open'), null, 0.5);
    tl.fromTo(
      win,
      { scale: 0.2, y: 46, opacity: 0 },
      { scale: 1, y: 0, opacity: 1, duration: 0.6, ease: 'expo.out', immediateRender: false },
      0.5
    );
    tl.to(launcher, { scale: 0.82, opacity: 0, duration: 0.26, ease: 'power2.in' }, 0.52);

    // Frame the whole widget once it is open.
    ia.focus('#chat-composer', { at: 0.55, scale: 1.5, duration: 0.36 });

    // ── Two proactive notes land before the student asks anything (f1512 / f1536).
    tl.fromTo(
      noteSchedule,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.38, ease: 'power3.out', immediateRender: false },
      1.0
    );
    tl.fromTo(
      noteBalance,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.38, ease: 'power3.out', immediateRender: false },
      2.0
    );

    // ── Type the question (f1548) and send (f1588).
    ia.click('#chat-input', { at: 2.5, zoom: 1.3, blur: 3 });
    ia.type('#chat-input', "What's my schedule?", { at: 2.5, cps: 12, zoom: 1.3, blur: 3 });
    ia.click('#chat-send', { at: 4.167, zoom: 1.5 });
    ia.release({ at: 4.417, duration: 0.34 });
    ia.callback(() => {
      chat.querySelector('#chat-input .field-text').textContent = '';
    }, 4.2);

    tl.fromTo(
      user,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.32, ease: 'power3.out', immediateRender: false },
      4.18
    );
    tl.set(thinking, { display: 'flex' }, 4.26);
    tl.fromTo(
      thinking,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.24, ease: 'power2.out', immediateRender: false },
      4.26
    );
    tl.to(
      thinking,
      {
        opacity: 0,
        height: 0,
        paddingTop: 0,
        paddingBottom: 0,
        marginTop: -10,
        overflow: 'hidden',
        duration: 0.2,
        ease: 'power2.in',
      },
      4.52
    );

    // ── The answer lands with the row already lit (f1608 / f1620).
    tl.fromTo(
      answer,
      { opacity: 1, y: 8 },
      { opacity: 1, y: 0, duration: 0.22, ease: 'power3.out', immediateRender: false },
      5.0
    );
    ia.highlight(portalRowSelector('CC1003'), {
      at: 5.0,
      duration: 1.0,
      color: 'rgba(67, 198, 243, 0.24)',
    });

    revealHeadline(tl, head, { at: 0.7, stagger: 0.06, duration: 0.55 });
    retractHeadline(tl, head, { at: 4.5, duration: 0.4 });

    // ── Pull wide enough to show the answer and the row it refers to.
    tl.to(cam, { x: -540, y: -304, scale: 1.25, duration: 0.5, ease: 'power3.inOut' }, 5.0);
    ia.release({ at: 5.5, duration: 0.35 });

    return tl;
  },
};
