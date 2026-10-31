import { SCENE_BY_ID } from '../timeline/cues.js';
import { createPortal } from '../ui/portal/index.js';
import {
  createChatWidget,
  chatGreeting,
  chatMessage,
  chatThinking,
  chatThread,
} from '../ui/portal/chat.js';
import { sceneHeadline, revealHeadline, retractHeadline } from '../ui/portal/parts.js';
import { bulletinBoard } from '../ui/portal/bulletin.js';

const SCENE = SCENE_BY_ID.s11c;

const BOARD = {
  eyebrow: 'Student life · news & events',
  title: 'News & Events',
  count: '2 upcoming',
  variant: 'cards',
  items: [
    {
      date: 'Oct 9–11',
      headline: 'Foundation Day 2026',
      sub: 'The recap, photos, and full results are posted on the portal.',
      pill: 'Recap',
    },
    {
      date: 'Nov 13–15',
      headline: 'Intramurals 2026',
      sub: 'Main gym. Team rosters close on Nov 6 — sign up at the office.',
      pill: 'Sports',
      hot: true,
    },
  ],
};

export default {
  id: 's11c',
  start: SCENE.start,
  end: SCENE.end,
  build(ctx) {
    const { gsap, cam, content, layer, ia } = ctx;
    const tl = gsap.timeline();

    const portal = createPortal();
    content.append(portal);

    const chat = createChatWidget({ open: true });
    content.append(chat);

    const thread = chatThread(chat);
    const greeting = chatGreeting();
    const user = chatMessage({ role: 'user', html: 'Any news or events?' });
    const thinking = chatThinking();
    const answer = chatMessage({
      role: 'ai',
      id: 'chat-news-answer',
      html: `Two things are on the board this week:
        <span class="chat-bulletin">
          <span class="chat-bulletin__row">
            <span class="chat-bulletin__tag">Recap</span>
            <div><b>Foundation Day 2026 · Oct 9–11</b><span>Recap and results are posted.</span></div>
          </span>
          <span class="chat-bulletin__row is-hot">
            <span class="chat-bulletin__tag">Sports</span>
            <div><b>Intramurals 2026 · Nov 13–15</b><span>Main gym. Rosters close Nov 6.</span></div>
          </span>
        </span>`,
      sources: ['News · Student affairs', 'Events calendar'],
    });
    thread.append(greeting, user, thinking, answer);

    const wash = document.createElement('div');
    wash.className = 'bulletin-wash';
    layer.el.append(wash);

    const board = bulletinBoard(BOARD);
    board.style.top = '420px';
    layer.el.append(board);
    const boardRows = [...board.querySelectorAll('.bulletin__row')];

    const head = sceneHeadline(ctx, ['Ask about', 'news and events.'], {
      top: 92,
      left: 104,
      width: 1120,
      size: 104,
      scrim: true,
    });

    tl.set(user, { opacity: 0, y: 12 }, 0);
    tl.set(thinking, { opacity: 0, display: 'none' }, 0);
    tl.set(answer, { opacity: 0, y: 12 }, 0);
    tl.set(boardRows, { opacity: 0, x: -18 }, 0);
    tl.fromTo(wash, { opacity: 0 }, { opacity: 1, duration: 0.42, ease: 'power2.out' }, 0);
    tl.fromTo(board, { opacity: 0, x: -22 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' }, 0.05);

    boardRows.forEach((row, i) => {
      tl.to(
        row,
        { opacity: 1, x: 0, duration: 0.42, ease: 'power3.out', immediateRender: false },
        0.2 + i * 0.12
      );
    });

    ia.focus('#chat-composer', {
      at: 0,
      scale: 1.34,
      clamp: '.scene-content',
      dof: false,
      duration: 0.45,
    });

    ia.click('#chat-input', { at: 0.75, zoom: 1 });
    ia.type('#chat-input', 'Any news or events?', { at: 0.75, cps: 14, zoom: 1, blur: 0 });
    ia.click('#chat-send', { at: 2.292, zoom: 1 });
    ia.callback(() => {
      chat.querySelector('#chat-input .field-text').textContent = '';
    }, 2.33);

    tl.fromTo(
      user,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out', immediateRender: false },
      2.32
    );
    tl.set(thinking, { display: 'flex' }, 2.4);
    tl.fromTo(
      thinking,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.24, ease: 'power2.out', immediateRender: false },
      2.4
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
      2.68
    );

    // ── The answer lands (f1992) and both cards light up.
    tl.fromTo(
      answer,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.32, ease: 'power3.out', immediateRender: false },
      3.0
    );
    boardRows.forEach((row, i) => {
      tl.call(() => row.classList.add('is-live'), null, 3.06 + i * 0.4);
      tl.fromTo(
        row,
        { scale: 1 },
        { scale: 1.012, duration: 0.14, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%' },
        3.06 + i * 0.4
      );
    });

    revealHeadline(tl, head, { at: 0.12, stagger: 0.05, duration: 0.58 });
    retractHeadline(tl, head, { at: 5.15, duration: 0.34 });

    ia.release({ at: 5.5, duration: 0.36 });
    tl.to(cam, { x: -4, y: 2, scale: 1, duration: 2.2, ease: 'power2.inOut' }, 3.5);

    return tl;
  },
};
