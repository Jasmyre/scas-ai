#!/usr/bin/env node
/**
 * Capture review frames for one scene from the Vite dev server.
 *
 *   node tools/shoot-scene.mjs --scene=s09 --frames=900,1000,1100 --port=5191
 *   node tools/shoot-scene.mjs --scene=s09 --frames=1128 --out=out/agent/s09
 *
 * Writes <out>/<scene>_<frame>.png (default out/agent) and always kills the
 * whole dev-server process tree, including on failure or Ctrl-C.
 */

import fs from 'node:fs';
import path from 'node:path';

import {
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
const scene = String(cli.get('scene', 's09'));
const port = clampInt(cli.num('port', 5191), 1024, 65535);
const outDir = path.resolve(String(cli.get('out', path.join(OUT, 'agent'))));
const portalOnly = cli.has('portal');

const frames = String(cli.get('frames', ''))
  .split(',')
  .map((s) => Number(s.trim()))
  .filter((n) => Number.isInteger(n) && n >= 0);

if (!frames.length && !portalOnly) {
  console.error('usage: node tools/shoot-scene.mjs --scene=s09 --frames=900,1000,1100 --port=5191 [--out=dir]');
  process.exit(1);
}
if (portalOnly && !frames.length) frames.push(0);

fs.mkdirSync(outDir, { recursive: true });

let server = null;
let browser = null;
let context = null;
let interrupted = false;

process.on('SIGINT', () => {
  if (interrupted) process.exit(130);
  interrupted = true;
  console.error('\ninterrupted: shutting down the dev server...');
});

async function main() {
  try {
    console.log(`dev server on ${port}...`);
    server = await startServer({ mode: 'dev', port, label: 'vite' });

    browser = await launchBrowser();
    const url = portalOnly ? `${server.url}?render=1&portal=1` : `${server.url}?render=1&scene=${scene}`;
    const handle = await openRenderPage(browser, url, {
      freezeCss: !cli.has('keep-css-anim'),
    });
    context = handle.context;

    if (portalOnly) {
      console.log(`portal-only calibration view · viewport ${handle.meta.viewport.width}x${handle.meta.viewport.height}`);
    } else {
      console.log(
        `scene ${scene} · ${handle.meta.scenes.length} built · ${handle.meta.total} frames · viewport ${handle.meta.viewport.width}x${handle.meta.viewport.height}`,
      );
    }

    for (const frame of frames) {
      if (interrupted) break;
      await seekFrame(handle.page, frame);
      const label = portalOnly ? 'portal' : scene;
      const file = path.join(outDir, `${label}_${String(frame).padStart(4, '0')}.png`);
      const bytes = await screenshot(handle.page, file);
      console.log(`wrote ${path.relative(process.cwd(), file)} (${(bytes / 1024).toFixed(0)} KB)`);
    }

    if (handle.errors.length) {
      console.warn(`${handle.errors.length} console error(s) during capture`);
      process.exitCode = 1;
    }
  } catch (error) {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  } finally {
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    const free = await stopServer(server);
    if (!free) {
      console.error(`port ${port} was still held after shutdown`);
      process.exitCode = 1;
    }
  }
}

await main();
