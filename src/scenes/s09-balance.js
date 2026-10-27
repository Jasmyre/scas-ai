import { PORTAL_DATA } from '../timeline/cues.js';
import { createPortal } from '../ui/portal/index.js';
import {
  createChatWidget,
  chatGreeting,
  chatNudges,
  chatThinking,
  chatMessage,
  chatThread,
} from '../ui/portal/chat.js';
import { sceneHeadline, revealHeadline, retractHeadline } from '../ui/portal/parts.js';

const CAL_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5" width="17" height="15.5" rx="3" stroke="currentColor" stroke-width="1.8"/><path d="M3.5 9.6h17M8 3.4v3.2M16 3.4v3.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
const SHIELD_ICON = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 3.2 19 6v6c0 4.3-3 7.3-7 8.8-4-1.5-7-4.5-7-8.8V6l7-2.8Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`;

export default {
  id: 's09',
  start: 1104,
  end: 1296,
  build(ctx) {
    const { gsap, cam, content, ia } = ctx;
    const tl = gsap.timeline();

    const portal = createPortal();
    content.append(portal);

    const chat = createChatWidget({ open: true });
    content.append(chat);

    const thread = chatThread(chat);
    const greeting = chatGreeting();
    const nudges = chatNudges([
      { title: 'What do I still owe?', meta: 'Balance · due Nov 15', icon: CAL_ICON },
      { title: "What's my schedule?", meta: 'CC1003 · Wed 12:00 PM', icon: SHIELD_ICON },
    ]);
    const thinking = chatThinking();
    const user = chatMessage({ role: 'user', html: 'How much do I still owe?' });
    const answer = chatMessage({
      role: 'ai',
      id: 'chat-balance-answer',
      html: `You still owe <b>${PORTAL_DATA.balance.amount}</b> for 1st Term S.Y. 2026–2027. It is due <b>Nov 15</b> — nothing is past due yet.`,
      sources: ['Balance · 1st Term', 'Student account'],
    });
    thread.append(greeting, nudges, user, thinking, answer);

    const head = sceneHeadline(ctx, 'Ask about your balance.', {
      left: 104,
      bottom: 126,
      width: 1500,
      size: 120,
    });

    const sync = portal.querySelector('.portal-balance__sync');
    const amount = portal.querySelector('#portal-balance-amount');

    // Everything except the greeting starts hidden; the scene opens mid-conversation.
    tl.set(nudges, { opacity: 1, y: 0 }, 0);
    tl.set(user, { opacity: 0, y: 12 }, 0);
    tl.set(thinking, { opacity: 0, display: 'none' }, 0);
    tl.set(answer, { opacity: 0, y: 12 }, 0);
    tl.set(sync, { opacity: 0 }, 0);

    // ── Click into the composer, then type the question.
    // The zoom has to stay wide enough that the typed question is readable: a
    // 1.8x push onto the 44px input leaves nothing but white blur on screen.
    ia.click('#chat-input', { at: 0.667, zoom: 1.5 });
    ia.type('#chat-input', 'How much do I still owe?', { at: 1.0, cps: 12, zoom: 1.3, blur: 3 });

    // Suggestion cards make way for the real exchange.
    tl.to(nudges, { opacity: 0, y: -6, duration: 0.22 }, 0.86);
    tl.set(nudges, { display: 'none' }, 1.06);

    // ── Send (f1180) and release (f1186).
    ia.click('#chat-send', { at: 3.167, zoom: 1.6 });
    ia.release({ at: 3.417, duration: 0.34 });

    tl.fromTo(
      user,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.32, ease: 'power3.out', immediateRender: false },
      3.18
    );
    tl.set(thinking, { display: 'flex' }, 3.26);
    tl.fromTo(
      thinking,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.26, ease: 'power2.out', immediateRender: false },
      3.26
    );

    // ── Answer lands on the chime (f1200).
    tl.to(
      thinking,
      {
        opacity: 0,
        height: 0,
        paddingTop: 0,
        paddingBottom: 0,
        marginTop: -10,
        overflow: 'hidden',
        duration: 0.22,
        ease: 'power2.in',
      },
      3.72
    );
    tl.fromTo(
      answer,
      { opacity: 1, y: 8 },
      { opacity: 1, y: 0, duration: 0.22, ease: 'power3.out', immediateRender: false },
      4.0
    );

    // ── The composer clears once the question is sent.
    ia.callback(() => {
      chat.querySelector('#chat-input .field-text').textContent = '';
    }, 3.2);

    // ── The portal balance answers back: a soft red sync glow, f1200–f1248.
    tl.fromTo(sync, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 4.0);
    tl.fromTo(sync, { scale: 0.996 }, { scale: 1, duration: 1.6, ease: 'power1.out' }, 4.0);
    tl.to(sync, { opacity: 0, duration: 0.55, ease: 'power2.inOut' }, 6.15);
    tl.to(amount, { scale: 1.05, duration: 0.28, ease: 'power2.out', transformOrigin: '50% 50%' }, 4.0);
    tl.to(amount, { scale: 1, duration: 0.5, ease: 'power2.inOut' }, 4.4);

    // ── Headline arrives with the pull-back and stays while both answers are read.
    revealHeadline(tl, head, { at: 0.95, stagger: 0.06, duration: 0.6 });
    retractHeadline(tl, head, { at: 6.9, duration: 0.4 });

    // Keep the frame alive: a slow drift that never crops the nav or crowds the headline.
    tl.to(cam, { x: -6, y: 2, scale: 1, duration: 2.2, ease: 'power2.inOut' }, 4.35);
    ia.release({ at: 6.8, duration: 0.45 });

    return tl;
  },
};
