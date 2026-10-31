import { PORTAL_DATA, SCENE_BY_ID } from '../timeline/cues.js';
import { createPortal } from '../ui/portal/index.js';
import {
  createChatWidget,
  chatGreeting,
  chatMessage,
  chatThread,
  chatStatement,
  chatExtract,
  chatDragStack,
  attachChip,
} from '../ui/portal/chat.js';
import { sceneHeadline, revealHeadline, retractHeadline } from '../ui/portal/parts.js';

const SCENE = SCENE_BY_ID.s10;

export default {
  id: 's10',
  start: SCENE.start,
  end: SCENE.end,
  build(ctx) {
    const { gsap, cam, content, ia } = ctx;
    const tl = gsap.timeline();

    const portal = createPortal();
    content.append(portal);

    const chat = createChatWidget({ open: true, dropzone: true });
    content.append(chat);

    const thread = chatThread(chat);
    const greeting = chatGreeting();
    const upload = chatStatement();
    const extract = chatExtract();
    const answer = chatMessage({
      role: 'ai',
      id: 'chat-soa-answer',
      html: `Your statement checks out: <b>3,200.00</b> tuition + <b>1,556.94</b> misc = <b>${PORTAL_DATA.balance.amount}</b>, due <b>Nov 15</b>. It matches your portal balance.`,
      sources: ['SOA_Oct.png', 'Balance · 1st Term'],
    });
    thread.append(greeting, upload, extract, answer);

    const drag = chatDragStack();
    chat.append(drag);

    const read = document.createElement('div');
    read.className = 'chat-read';
    read.id = 'chat-read';
    read.innerHTML = `
      <span class="chat-read__label"><i></i>Reading tuition, misc, and due dates</span>
      <span class="chat-read__track"><i></i></span>`;
    upload.append(read);

    const dropzone = chat.querySelector('#chat-dropzone');
    const attachments = chat.querySelector('#chat-attachments');
    const scan = upload.querySelector('#chat-scan');
    const soa = upload.querySelector('#chat-soa');
    const chips = [...extract.querySelectorAll('.x-chip')];
    const sync = portal.querySelector('.portal-balance__sync');

    const head = sceneHeadline(ctx, ['It reads what', 'you give it.'], {
      left: 104,
      bottom: 138,
      width: 1060,
      size: 104,
    });

    // ── State at scene open: empty dropzone, the SOA waiting on the desktop.
    tl.set(upload, { opacity: 0, y: 14 }, 0);
    tl.set(extract, { opacity: 1 }, 0);
    chips.forEach((chip) => tl.set(chip, { opacity: 0, scale: 0.6, y: 6 }, 0));
    tl.set(answer, { opacity: 0, y: 12 }, 0);
    tl.set(sync, { opacity: 0 }, 0);
    tl.set(scan, { opacity: 0, top: '0%' }, 0);
    tl.set(read, { opacity: 0 }, 0);
    tl.set(read.querySelector('.chat-read__track i'), { scaleX: 0, transformOrigin: '0% 50%' }, 0);

    // ── Frame the whole chatbox once and keep it there for the 12s beat sheet.
    ia.click('#chat-composer', {
      at: 0.333,
      zoom: 1.34,
      clamp: '.scene-content',
      focusDuration: 0.42,
      move: 0.24,
    });

    // ── Beat 1 · reach for the statement on the desktop.
    ia.moveCursor('#chat-drag-source', { at: 1.15, duration: 0.34 });

    // ── Beat 2 · the file leaves the device and flies into the dropzone.
    const dragRect = drag.getBoundingClientRect();
    const dropRect = dropzone.getBoundingClientRect();
    const dx = dropRect.left + dropRect.width / 2 - (dragRect.left + dragRect.width / 2);
    const dy = dropRect.top + dropRect.height / 2 - (dragRect.top + dragRect.height / 2);
    tl.to(
      drag,
      { x: dx, y: dy, scale: 0.4, opacity: 0, duration: 0.52, ease: 'power2.in' },
      1.88
    );
    tl.set(drag, { display: 'none' }, 2.42);
    ia.click('#chat-dropzone', { at: 2.5, zoom: 1, move: 0.62 });

    const chip = attachChip('img', 'SOA_Oct.png');
    chip.style.opacity = '0';
    attachments.append(chip);
    tl.to(chip, { opacity: 1, duration: 0.24 }, 2.54);
    tl.call(() => dropzone.classList.add('has-files'), null, 2.54);

    // ── Beat 3 · the image lands in the thread and gets scanned.
    tl.to(greeting, { opacity: 0, y: -6, duration: 0.22 }, 2.36);
    tl.set(greeting, { display: 'none' }, 2.6);
    tl.fromTo(
      upload,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out', immediateRender: false },
      2.56
    );
    tl.call(() => soa.classList.add('is-scanning'), null, 2.9);
    tl.to(scan, { opacity: 1, duration: 0.1 }, 2.9);
    tl.to(scan, { top: '100%', duration: 0.86, ease: 'power1.inOut' }, 2.94);
    tl.to(scan, { top: '8%', duration: 0.7, ease: 'power1.inOut' }, 3.84);
    tl.to(scan, { opacity: 0, duration: 0.18 }, 4.56);
    tl.call(() => soa.classList.remove('is-scanning'), null, 4.7);

    // ── Beat 4 · "Reading" status carries the beat between scan and extraction.
    tl.to(read, { opacity: 1, duration: 0.24 }, 4.5);
    tl.to(read.querySelector('.chat-read__track i'), { scaleX: 1, duration: 1.25, ease: 'power1.inOut' }, 4.56);

    // ── Beat 5 · extracted fields pop on the ticks (f1488 → f1520).
    tl.to(read, { opacity: 0, duration: 0.2 }, 5.5);
    chips.forEach((el, i) => {
      tl.to(
        el,
        { opacity: 1, scale: 1, y: 0, duration: 0.26, ease: 'back.out(2)', immediateRender: false },
        6.0 + i * (1 / 3)
      );
    });

    // ── Beat 6 · the answer reconciles the scan with the portal (f1550 / chime f1560).
    tl.fromTo(
      answer,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.44, ease: 'power3.out', immediateRender: false },
      8.6
    );
    tl.fromTo(sync, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 8.6);
    tl.to(sync, { opacity: 0, duration: 1.2, ease: 'power2.inOut' }, 9.3);

    revealHeadline(tl, head, { at: 0.5, stagger: 0.055, duration: 0.62 });
    retractHeadline(tl, head, { at: 8.05, duration: 0.4 });

    // ── Beat 7 · hold the answer; the frame keeps a slow drift.
    tl.to(cam, { x: -6, y: 2, scale: 1, duration: 2.4, ease: 'power2.inOut' }, 8.9);

    return tl;
  },
};
