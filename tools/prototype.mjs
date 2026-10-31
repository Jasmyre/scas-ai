#!/usr/bin/env node
/**
 * Render the product UI prototype stills from the real code.
 *
 *   node tools/prototype.mjs                 # 5 stills -> out/prototype
 *   node tools/prototype.mjs --no-build      # reuse the current dist/
 *   node tools/prototype.mjs --only=portal-chat
 *
 * Each shot mounts the same components the film uses, at identity transform,
 * with camera moves, cursor, DOF, grain and headlines removed. Output is
 * 3840x2160 (1920x1080 CSS px at DPR 2) so the UI stays sharp when zoomed.
 */

import fs from 'node:fs';
import path from 'node:path';

import {
  OUT,
  clampInt,
  launchBrowser,
  parseArgs,
  pngInfo,
  runViteBuild,
  startServer,
  stopServer,
} from './lib/pipeline.mjs';

const cli = parseArgs();
const build = cli.bool('build', true);
const only = String(cli.get('only', '') || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const port = clampInt(cli.num('port', 4176), 1024, 65535);
const dir = path.resolve(String(cli.get('out', path.join(OUT, 'prototype'))));
const reportPath = path.join(dir, 'report.json');
const width = 1920;
const height = 1080;
const dpr = 2;

const SHOTS = [
  {
    name: '01-dashboard',
    query: 'dashboard',
    title: 'Administration dashboard — Overview',
    source: 'src/ui/dashboard/index.js · createDashboard()',
  },
  {
    name: '02-new-assistant-dialog',
    query: 'new-assistant',
    title: 'New assistant — deploy dialog',
    source: 'src/scenes/s05-tenant.js · local 4.33s',
  },
  {
    name: '03-message-audit',
    query: 'message-audit',
    title: 'Message audit — trace open',
    source: 'src/scenes/s13-audit.js · local 4.00s',
  },
  {
    name: '04-portal-chat-launcher',
    query: 'portal-launcher',
    title: 'Student portal — chat launcher',
    source: 'src/ui/portal/index.js + chat.js',
  },
  {
    name: '05-portal-chat-open',
    query: 'portal-chat',
    title: 'Student portal — chat open',
    source: 'src/ui/portal/index.js + chat.js',
  },
];

const selected = only.length ? SHOTS.filter((s) => only.includes(s.query) || only.includes(s.name)) : SHOTS;
if (!selected.length) {
  console.error(`error: no prototype shot matches "${only.join(', ')}"`);
  process.exit(1);
}

const report = {
  generatedAt: new Date().toISOString(),
  ok: false,
  dir: path.relative(process.cwd(), dir),
  viewport: `${width}x${height}`,
  dpr,
  pixelSize: `${width * dpr}x${height * dpr}`,
  shots: [],
  issues: [],
};

let server = null;
let browser = null;
let context = null;

async function main() {
  const started = Date.now();
  fs.mkdirSync(dir, { recursive: true });

  if (build) runViteBuild();
  server = await startServer({ port, mode: 'preview', label: 'preview' });
  browser = await launchBrowser();

  context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: dpr,
    colorScheme: 'light',
    reducedMotion: 'reduce',
    locale: 'en-US',
    timezoneId: 'Asia/Manila',
  });

  const pageErrors = [];
  context.on('page', (page) => {
    page.on('pageerror', (error) => pageErrors.push(error.message));
  });

  for (const shot of selected) {
    const page = await context.newPage();
    page.setDefaultTimeout(120000);
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const source = msg.location()?.url || '';
      if (/\/favicon\.ico(\?|$)/i.test(source)) return;
      pageErrors.push(msg.text());
      console.error(`[page] ${msg.text()}`);
    });

    const url = `${server.url}?proto=${encodeURIComponent(shot.query)}`;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
    await page.waitForFunction(() => window.__READY === true, null, { timeout: 120000 });
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    );

    const active = await page.evaluate(() => window.__PROTO);
    if (active !== shot.query) throw new Error(`shot "${shot.query}" mounted "${active}"`);

    const file = path.join(dir, `${shot.name}.png`);
    await page.screenshot({ path: file, type: 'png', animations: 'disabled', caret: 'hide' });

    const info = pngInfo(file);
    const ok = Boolean(info && info.width === width * dpr && info.height === height * dpr);
    const entry = {
      name: shot.name,
      query: shot.query,
      title: shot.title,
      source: shot.source,
      file: path.relative(process.cwd(), file),
      width: info?.width ?? null,
      height: info?.height ?? null,
      bytes: fs.statSync(file).size,
      ok,
    };
    report.shots.push(entry);
    if (!ok) report.issues.push(`${shot.name}: expected ${width * dpr}x${height * dpr}, got ${entry.width}x${entry.height}`);
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${shot.name}  ${entry.width}x${entry.height}  ${(entry.bytes / 1024).toFixed(0)} KB`);

    await page.close();
  }

  if (pageErrors.length) report.issues.push(`${pageErrors.length} page error(s)`);
  report.ok = report.issues.length === 0 && report.shots.every((s) => s.ok);
  report.elapsedMs = Date.now() - started;

  console.log('');
  console.log(report.ok ? `PASS  ${report.shots.length} prototype stills · ${report.pixelSize}` : 'FAIL');
  for (const issue of report.issues) console.log(`  · ${issue}`);
}

try {
  await main();
} catch (error) {
  console.error(error.stack || error.message);
  report.issues.push(String(error.message || error));
} finally {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  if (context) await context.close().catch(() => {});
  if (browser) await browser.close().catch(() => {});
  if (server) await stopServer(server);
  console.log(`report: ${path.relative(process.cwd(), reportPath)}`);
  if (!report.ok) process.exitCode = 1;
}
