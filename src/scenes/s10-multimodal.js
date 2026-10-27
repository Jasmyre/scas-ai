import { PORTAL_DATA } from '../timeline/cues.js';
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

export default {
  id: 's10',
  start: 1296,
  end: 1488,
  build(ctx) {
    const { gsap, cam, content, layer, ia } = ctx;
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

    const head = sceneHeadline(ctx, 'It reads what you give it.', {
      left: 104,
      bottom: 126,
      width: 1700,
      size: 120,
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

    // ── Drop the statement (f1320): the file leaves the device and enters the chat.
    // A click gesture on the dropzone gives the right cursor path and zoom for a
    // drop without the director's zoom-space mismatch; the source panel flies in.
    ia.moveCursor('#chat-drag-source', { at: 0.55, duration: 0.3 });
    tl.to(drag, { x: 290, y: 118, scale: 0.35, opacity: 0, duration: 0.34, ease: 'power2.in' }, 0.94);
    ia.click('#chat-dropzone', { at: 1.0, zoom: 1.6, focusDuration: 0.32 });
    // The drop click installs a DOF hole sized for the composer. Rather than
    // fighting it (the interaction timeline renders last), give the pull-up
    // blur(0): the portal stays legible behind the statement, which is the
    // whole point of the reconciliation.
    ia.focus('#chat-thread', { at: 1.18, scale: 1.35, duration: 0.32, blur: 0 });

    tl.to(drag, { opacity: 0, scale: 0.94, duration: 0.28, ease: 'power2.in' }, 1.02);
    tl.set(drag, { display: 'none' }, 1.32);

    const chip = attachChip('img', 'SOA_Oct.png');
    chip.style.opacity = '0';
    attachments.append(chip);
    tl.to(chip, { opacity: 1, duration: 0.24 }, 1.08);
    tl.call(
      () => {
        dropzone.classList.add('has-files');
      },
      null,
      1.08
    );

    // ── The image lands in the thread and gets scanned.
    tl.to(greeting, { opacity: 0, y: -6, duration: 0.22 }, 1.14);
    tl.set(greeting, { display: 'none' }, 1.38);
    tl.fromTo(
      upload,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out', immediateRender: false },
      1.12
    );
    tl.call(() => soa.classList.add('is-scanning'), null, 1.4);
    tl.to(scan, { opacity: 1, duration: 0.1 }, 1.4);
    tl.to(scan, { top: '100%', duration: 0.9, ease: 'power1.inOut' }, 1.44);
    tl.to(scan, { top: '8%', duration: 0.72, ease: 'power1.inOut' }, 2.5);
    tl.to(scan, { opacity: 0, duration: 0.18 }, 3.22);
    tl.call(() => soa.classList.remove('is-scanning'), null, 3.4);

    // ── "Reading" status carries the beat between the scan and the extraction.
    tl.to(read, { opacity: 1, duration: 0.24 }, 2.5);
    tl.to(read.querySelector('.chat-read__track i'), { scaleX: 1, duration: 1.4, ease: 'power1.inOut' }, 2.55);

    // ── Extracted fields pop on the ticks (f1392 / f1398 / f1404).
    tl.to(read, { opacity: 0, duration: 0.18 }, 3.9);
    chips.forEach((el, i) => {
      const at = [4.0, 4.25, 4.5, 4.5, 4.5][i] ?? 4.5;
      tl.to(
        el,
        { opacity: 1, scale: 1, y: 0, duration: 0.26, ease: 'back.out(2)', immediateRender: false },
        at
      );
    });

    // ── Tap the statement to confirm the reading (f1368), then pull back (f1400).
    ia.click('#chat-composer', { at: 3.0, zoom: 1.9, focusDuration: 0.34 });
    ia.release({ at: 4.333, duration: 0.4 });

    // ── The answer reconciles the scan with the portal (f1416).
    tl.fromTo(
      answer,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.44, ease: 'power3.out', immediateRender: false },
      5.0
    );
    tl.fromTo(sync, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 5.0);
    tl.to(sync, { opacity: 0, duration: 1.2, ease: 'power2.inOut' }, 5.7);

    revealHeadline(tl, head, { at: 1.75, stagger: 0.06, duration: 0.6 });
    retractHeadline(tl, head, { at: 4.5, duration: 0.4 });

    tl.to(cam, { x: -6, y: 2, scale: 1, duration: 2.0, ease: 'power2.inOut' }, 5.2);
    ia.release({ at: 7.3, duration: 0.4 });

    return tl;
  },
};
