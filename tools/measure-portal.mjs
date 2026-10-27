#!/usr/bin/env node
/**
 * Measure the portal replica against tmp/portal.png.
 *
 * Uses the identity calibration view (`?portal=1`) so no scene camera is in the
 * way, then reports reference geometry (detected from the PNG) next to live DOM
 * geometry. Run this before touching portal CSS.
 *
 *   node tools/measure-portal.mjs
 *
 * Writes out/cal/portal-measure.json and prints the deltas.
 */

import fs from 'node:fs';
import path from 'node:path';

import {
  ROOT,
  parseArgs,
  clampInt,
  startServer,
  stopServer,
  launchBrowser,
  openRenderPage,
} from './lib/pipeline.mjs';

const cli = parseArgs();
const port = clampInt(cli.num('port', 5196), 1024, 65535);
const reference = path.join(ROOT, 'tmp', 'portal.png');
const outDir = path.join(ROOT, 'out', 'cal');

if (!fs.existsSync(reference)) {
  console.error('missing tmp/portal.png');
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
const refBase64 = fs.readFileSync(reference).toString('base64');

let server = null;
let browser = null;
let context = null;

async function main() {
  server = await startServer({ mode: 'dev', port, label: 'vite' });
  browser = await launchBrowser();
  const handle = await openRenderPage(browser, `${server.url}?render=1&portal=1`);
  context = handle.context;
  const { page } = handle;

  const result = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    const { data, width, height } = g.getImageData(0, 0, c.width, c.height);
    const lum = (x, y) => {
      const i = (y * width + x) * 4;
      return 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    };
    const rgb = (x, y) => {
      const i = (y * width + x) * 4;
      return [data[i], data[i + 1], data[i + 2]];
    };

    // Long horizontal rules = card edges / table separators.
    const hRows = [];
    for (let y = 0; y < height; y += 1) {
      let n = 0;
      for (let x = 0; x < width; x += 1) {
        const v = lum(x, y);
        if (v > 200 && v < 246) n += 1;
      }
      if (n > width * 0.28) hRows.push({ y, n });
    }
    const groups = [];
    for (const row of hRows) {
      const last = groups[groups.length - 1];
      if (last && row.y - last.end <= 2) {
        last.end = row.y;
        last.peak = Math.max(last.peak, row.n);
      } else {
        groups.push({ start: row.y, end: row.y, peak: row.n });
      }
    }
    const hLines = groups.map((g2) => ({ y: Math.round((g2.start + g2.end) / 2), span: g2.peak }));

    // Long vertical rules = card side borders.
    const vCols = [];
    for (let x = 0; x < width; x += 1) {
      let n = 0;
      for (let y = 60; y < height; y += 1) {
        const v = lum(x, y);
        if (v > 200 && v < 246) n += 1;
      }
      if (n > height * 0.25) vCols.push({ x, n });
    }
    const vGroups = [];
    for (const col of vCols) {
      const last = vGroups[vGroups.length - 1];
      if (last && col.x - last.end <= 2) {
        last.end = col.x;
        last.peak = Math.max(last.peak, col.n);
      } else {
        vGroups.push({ start: col.x, end: col.x, peak: col.n });
      }
    }
    const vLines = vGroups.map((g2) => ({ x: Math.round((g2.start + g2.end) / 2), span: g2.peak }));

    // Sample the canvas colours that matter.
    const samples = {
      pageBg: rgb(200, 400),
      navBg: rgb(960, 20),
      cardBg: rgb(960, 300),
      navBottomLum: lum(960, 61),
    };

    const boxIn = (x0, y0, x1, y1, pred) => {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (let y = y0; y < y1; y += 1) {
        for (let x = x0; x < x1; x += 1) {
          if (!pred(x, y)) continue;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
      if (minX === Infinity) return null;
      return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
    };

    const navBoxes = {
      seal: boxIn(0, 0, 60, 59, (x, y) => lum(x, y) < 238),
      wordmark: boxIn(55, 0, 240, 59, (x, y) => lum(x, y) < 150),
      homeLink: boxIn(230, 0, 300, 59, (x, y) => {
        const i = (y * width + x) * 4;
        return data[i + 2] - data[i] > 40;
      }),
      userPill: boxIn(1620, 0, width, 59, (x, y) => lum(x, y) < 250),
    };

    const cardBoxes = {
      balanceTitle: boxIn(520, 620, 760, 668, (x, y) => lum(x, y) < 170),
      balanceHero: boxIn(520, 668, 1400, 760, (x, y) => lum(x, y) < 190),
      balanceRed: boxIn(520, 660, 1400, 800, (x, y) => {
        const i = (y * width + x) * 4;
        return data[i] > 130 && data[i + 1] < 90 && data[i + 2] < 90;
      }),
      balanceNote: boxIn(700, 750, 1250, 806, (x, y) => lum(x, y) < 205),
      termsTitle: boxIn(520, 816, 900, 872, (x, y) => lum(x, y) < 190),
      termsTotal: boxIn(520, 872, 900, 892, (x, y) => lum(x, y) < 205),
    };

    // Vertical runs of card-vs-page along a column: the card is #fff on a
    // #f9f9f9 page, so a 6-level step finds every card edge even when the
    // 1px border is too light for the rule detector.
    const column = (x) => {
      const runs = [];
      let cur = null;
      for (let y = 0; y < height; y += 1) {
        const v = lum(x, y);
        const kind = v > 252 ? 'card' : v > 244 ? 'page' : 'ink';
        if (!cur || cur.kind !== kind) {
          cur = { kind, start: y, end: y };
          runs.push(cur);
        } else cur.end = y;
      }
      return runs.filter((r) => r.end - r.start >= 2).map((r) => ({ ...r }));
    };

    const rect = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        x: Math.round(r.left),
        y: Math.round(r.top),
        w: Math.round(r.width),
        h: Math.round(r.height),
      };
    };

    const css = (sel, props) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const s = getComputedStyle(el);
      return Object.fromEntries(props.map((p) => [p, s[p]]));
    };

    return {
      reference: {
        size: { width, height },
        hLines,
        vLines,
        samples,
        navBoxes,
        cardBoxes,
        columns: { x200: column(200), x700: column(700), x960: column(960), x1350: column(1350) },
      },
      dom: {
        size: { width: window.innerWidth, height: window.innerHeight },
        portalBody: rect('.portal-body'),
        classes: rect('.portal-classes'),
        balance: rect('.portal-balance'),
        terms: rect('.portal-terms'),
        termCard: rect('.portal-term-card'),
        nav: rect('.portal-nav'),
        table: rect('.portal-table'),
        head: rect('.portal-card__head h1'),
        seal: rect('.portal-nav__brand svg'),
        wordmark: rect('.scas-wordmark'),
        homeLink: rect('.portal-nav__link'),
        userPill: rect('.portal-nav__user'),
        avatar: rect('.portal-avatar'),
        wordmarkStyle: css('.scas-wordmark__line', ['fontSize', 'lineHeight', 'fontWeight']),
        linkStyle: css('.portal-nav__link', ['fontSize', 'gap']),
        classesStyle: css('.portal-classes', ['padding', 'borderRadius', 'backgroundColor']),
        bodyStyle: css('.portal-body', ['width', 'paddingTop', 'gap']),
        pageStyle: css('.portal', ['backgroundColor', 'fontFamily']),
        navStyle: css('.portal-nav', ['height', 'padding']),
        rowStyle: css('.portal-table td', ['height', 'padding']),
      },
    };
  }, refBase64);

  const report = {
    checkedAt: new Date().toISOString(),
    reference: reference.replace(/\\/g, '/'),
    ...result,
  };
  const file = path.join(outDir, 'portal-measure.json');
  fs.writeFileSync(file, JSON.stringify(report, null, 2));

  const { hLines, vLines, samples, size } = report.reference;
  console.log(`\nreference ${size.width}x${size.height}`);
  console.log(`page bg ${samples.pageBg.join(',')}  nav bg ${samples.navBg.join(',')}  card bg ${samples.cardBg.join(',')}`);
  console.log(`horizontal rules: ${hLines.map((l) => l.y).join(', ')}`);
  console.log(`vertical rules:   ${vLines.map((l) => l.x).join(', ')}`);
  console.log(`nav boxes (ref px): ${Object.entries(report.reference.navBoxes)
    .map(([k, v]) => `${k}=${v ? `${v.x},${v.y} ${v.w}x${v.h}` : 'n/a'}`)
    .join('  ')}`);
  for (const [name, runs] of Object.entries(report.reference.columns)) {
    const cards = runs.filter((r) => r.kind === 'card' && r.end - r.start > 20);
    console.log(`${name}: ${cards.map((c) => `${c.start}-${c.end}`).join('  ')}`);
  }
  console.log(`card boxes (ref px): ${Object.entries(report.reference.cardBoxes)
    .map(([k, v]) => `${k}=${v ? `${v.x},${v.y} ${v.w}x${v.h}` : 'n/a'}`)
    .join('  ')}`);

  const d = report.dom;
  console.log('\nDOM');
  console.log(`body     ${fmt(d.portalBody)}`);
  console.log(`nav      ${fmt(d.nav)}`);
  console.log(`seal     ${fmt(d.seal)}   wordmark ${fmt(d.wordmark)}`);
  console.log(`home     ${fmt(d.homeLink)}   user ${fmt(d.userPill)}  avatar ${fmt(d.avatar)}`);
  console.log(`classes  ${fmt(d.classes)}`);
  console.log(`balance  ${fmt(d.balance)}`);
  console.log(`terms    ${fmt(d.terms)}`);
  console.log(`term     ${fmt(d.termCard)}`);
  console.log(`table    ${fmt(d.table)}`);
  console.log(`page bg  ${d.pageStyle.backgroundColor}  font ${d.pageStyle.fontFamily}`);
  console.log(`nav pad  ${d.navStyle.padding}`);
  console.log(`wordmark ${JSON.stringify(d.wordmarkStyle)}`);
  console.log(`link     ${JSON.stringify(d.linkStyle)}`);
  console.log(`card pad ${d.classesStyle.padding}`);
  console.log(`row      ${JSON.stringify(d.rowStyle)}`);
  console.log(`\nwrote ${path.relative(ROOT, file)}`);
}

function fmt(r) {
  return r ? `x=${r.x} y=${r.y} w=${r.w} h=${r.h} (right=${r.x + r.w}, bottom=${r.y + r.h})` : 'missing';
}

try {
  await main();
} catch (error) {
  console.error(error.stack || error.message);
  process.exitCode = 1;
} finally {
  if (context) await context.close().catch(() => {});
  if (browser) await browser.close().catch(() => {});
  await stopServer(server);
}
