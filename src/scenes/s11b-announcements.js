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

const SCENE = SCENE_BY_ID.s11b;

const BOARD = {
  eyebrow: 'Registrar · announcements',
  title: 'Announcements',
  count: '3 new',
  items: [
    {
      date: 'Nov 5–11',
      headline: 'Final examinations',
      sub: 'Coverage sheets are up on the portal.',
      pill: 'Exam week',
      hot: true,
    },
    {
      date: 'Nov 3',
      headline: 'Room assignments posted',
      sub: 'Check your exam room before Monday.',
      pill: 'Rooms',
    },
    {
      date: 'Nov 16',
      headline: '2nd Term enrollment opens',
      sub: 'Advising starts the same day.',
      pill: 'Enrollment',
    },
  ],
};

export default {
  id: 's11b',
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
    const user = chatMessage({ role: 'user', html: 'Any new announcements?' });
    const thinking = chatThinking();
    const answer = chatMessage({
      role: 'ai',
      id: 'chat-announce-answer',
      html: `Three are live on your portal right now:
        <span class="chat-bulletin">
          <span class="chat-bulletin__row is-hot">
            <span class="chat-bulletin__tag">Exams</span>
            <div><b>Final examinations · Nov 5–11</b><span>Coverage sheets are up on the portal.</span></div>
          </span>
          <span class="chat-bulletin__row">
            <span class="chat-bulletin__tag">Rooms</span>
            <div><b>Room assignments posted</b><span>Check your exam room before Monday.</span></div>
          </span>
          <span class="chat-bulletin__row">
            <span class="chat-bulletin__tag">Enrol</span>
            <div><b>2nd Term opens Nov 16</b><span>Advising starts the same day.</span></div>
          </span>
        </span>`,
      sources: ['Announcements · Registrar', 'Academic calendar'],
    });
    thread.append(greeting, user, thinking, answer);

    // Screen-fixed board: it stays put while the interaction camera settles.
    const wash = document.createElement('div');
    wash.className = 'bulletin-wash';
    layer.el.append(wash);

    const board = bulletinBoard(BOARD);
    board.style.top = '452px';
    layer.el.append(board);
    const boardRows = [...board.querySelectorAll('.bulletin__row')];

    const head = sceneHeadline(ctx, ['Ask about', 'announcements.'], {
      top: 92,
      left: 104,
      width: 1020,
      size: 104,
      scrim: true,
    });

    tl.set(user, { opacity: 0, y: 12 }, 0);
    tl.set(thinking, { opacity: 0, display: 'none' }, 0);
    tl.set(answer, { opacity: 0, y: 12 }, 0);
    tl.set(boardRows, { opacity: 0, x: -18 }, 0);
    tl.fromTo(wash, { opacity: 0 }, { opacity: 1, duration: 0.42, ease: 'power2.out' }, 0);
    tl.fromTo(board, { opacity: 0, x: -22 }, { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' }, 0.05);

    // ── The portal has already published them; the board ticks in one at a time.
    boardRows.forEach((row, i) => {
      tl.to(
        row,
        { opacity: 1, x: 0, duration: 0.4, ease: 'power3.out', immediateRender: false },
        0.2 + i * 0.11
      );
    });

    ia.focus('#chat-composer', {
      at: 0,
      scale: 1.34,
      clamp: '.scene-content',
      dof: false,
      duration: 0.45,
    });

    // ── Ask it in the chat (f1786 → f1794).
    ia.click('#chat-input', { at: 0.75, zoom: 1 });
    ia.type('#chat-input', 'Any new announcements?', { at: 0.75, cps: 14, zoom: 1, blur: 0 });
    ia.click('#chat-send', { at: 2.458, zoom: 1 });
    ia.callback(() => {
      chat.querySelector('#chat-input .field-text').textContent = '';
    }, 2.5);

    tl.fromTo(
      user,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out', immediateRender: false },
      2.48
    );
    tl.set(thinking, { display: 'flex' }, 2.56);
    tl.fromTo(
      thinking,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.24, ease: 'power2.out', immediateRender: false },
      2.56
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
      2.84
    );

    // ── The answer lands on the chime (f1852) and the board lights up with it.
    tl.fromTo(
      answer,
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.32, ease: 'power3.out', immediateRender: false },
      3.05
    );
    boardRows.forEach((row, i) => {
      tl.call(() => row.classList.add('is-live'), null, 3.12 + i * 0.34);
      tl.fromTo(
        row,
        { scale: 1 },
        { scale: 1.015, duration: 0.12, yoyo: true, repeat: 1, ease: 'sine.inOut', transformOrigin: '50% 50%' },
        3.12 + i * 0.34
      );
    });

    revealHeadline(tl, head, { at: 0.12, stagger: 0.05, duration: 0.58 });
    retractHeadline(tl, head, { at: 5.15, duration: 0.34 });

    // ── Ease off the tight framing for the cut into the news scene.
    ia.release({ at: 5.5, duration: 0.36 });
    tl.to(cam, { x: -4, y: 2, scale: 1, duration: 2.2, ease: 'power2.inOut' }, 3.5);

    return tl;
  },
};
