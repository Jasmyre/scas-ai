#!/usr/bin/env node
/**
 * Pre-render audit: timeline budgets, console errors, and blank-frame suspects.
 *
 *   node tools/audit-film.mjs                 # one probe per second (88 frames)
 *   node tools/audit-film.mjs --every=12      # one probe every half second
 *   node tools/audit-film.mjs --scene=s09     # single scene
 *
 * A pure-white 1920x1080 PNG compresses to ~15 KB, so an unusually small
 * screenshot is a reliable "nothing rendered here" signal.
 */

import fs from 'node:fs';
import path from 'node:path';

import {
  ROOT,
  OUT,
  parseArgs,
  clampInt,
  startServer,
  stopServer,
  launchBrowser,
  openRenderPage,
  seekFrame,
  screenshot,
} from './lib/pipeline.mjs';

const cli = parseArgs();
const port = clampInt(cli.num('port', 5205), 1024, 65535);
const every = clampInt(cli.num('every', 24), 1, 240);
const scene = cli.get('scene', null);
const probeDir = path.join(OUT, 'audit');
const blankBytes = clampInt(cli.num('blank-bytes', 60000), 1024, 10 * 1024 * 1024);

fs.mkdirSync(probeDir, { recursive: true });

let server = null;
let browser = null;
let context = null;

try {
  server = await startServer({ mode: 'dev', port, label: 'vite' });
  browser = await launchBrowser();
  const url = `${server.url}?render=1${scene ? `&scene=${scene}` : ''}`;
  const handle = await openRenderPage(browser, url);
  context = handle.context;

  const timelines = await handle.page.evaluate(() => window.__TIMELINES || []);
  const total = await handle.page.evaluate(() => window.__TOTAL_FRAMES);
  const scenes = await handle.page.evaluate(() => window.__SCENES || []);

  console.log(`scenes: ${scenes.length} · frames: ${total}`);

  const overBudget = timelines.filter((t) => t.duration > t.budget + 0.05);
  const overInteractions = timelines.filter((t) => t.interactions > t.budget + 0.05);
  for (const t of timelines) {
    const flag = t.duration > t.budget + 0.05 ? '  OVER' : '';
    console.log(
      `  ${t.id}  content ${t.duration.toFixed(2)}s / ${t.budget.toFixed(2)}s` +
        `  interactions ${t.interactions.toFixed(2)}s${flag}`,
    );
  }
  if (overBudget.length) console.warn(`\n${overBudget.length} scene timeline(s) over budget`);
  if (overInteractions.length) console.warn(`${overInteractions.length} interaction timeline(s) over budget`);

  const probes = [];
  for (let f = 0; f < total; f += every) probes.push(f);
  if (probes[probes.length - 1] !== total - 1) probes.push(total - 1);

  const sizes = [];
  for (const frame of probes) {
    await seekFrame(handle.page, frame);
    const file = path.join(probeDir, `probe_${String(frame).padStart(5, '0')}.png`);
    const bytes = await screenshot(handle.page, file);
    sizes.push({ frame, bytes });
  }

  const smallest = [...sizes].sort((a, b) => a.bytes - b.bytes).slice(0, 8);
  const blanks = sizes.filter((s) => s.bytes < blankBytes);

  console.log(`\nprobes: ${sizes.length} · smallest PNG ${(smallest[0].bytes / 1024).toFixed(0)} KB at f${smallest[0].frame}`);
  for (const s of smallest.slice(0, 5)) {
    console.log(`  f${String(s.frame).padStart(4, '0')}  ${(s.bytes / 1024).toFixed(0)} KB`);
  }
  if (blanks.length) {
    console.warn(`\n${blanks.length} blank-suspect frame(s) under ${(blankBytes / 1024).toFixed(0)} KB:`);
    for (const b of blanks) console.warn(`  f${b.frame}  ${(b.bytes / 1024).toFixed(0)} KB`);
  } else {
    console.log('no blank-suspect frames');
  }

  if (handle.errors.length) {
    console.warn(`\n${handle.errors.length} console error(s):`);
    for (const e of handle.errors.slice(0, 15)) console.warn(`  ${e}`);
  } else {
    console.log('no console errors');
  }

  const report = {
    checkedAt: new Date().toISOString(),
    every,
    scene,
    timelines,
    overBudget: overBudget.map((t) => t.id),
    overInteractions: overInteractions.map((t) => t.id),
    probes: sizes.length,
    blankSuspects: blanks,
    smallest,
    errors: handle.errors,
  };
  const file = path.join(OUT, 'audit-report.json');
  fs.writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`\nwrote ${path.relative(ROOT, file)}`);

  if (handle.errors.length || overBudget.length || blanks.length) process.exitCode = 1;
} catch (error) {
  console.error(error.stack || error.message);
  process.exitCode = 1;
} finally {
  if (context) await context.close().catch(() => {});
  if (browser) await browser.close().catch(() => {});
  if (server) await stopServer(server);
}
