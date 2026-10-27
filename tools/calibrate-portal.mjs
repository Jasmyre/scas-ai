#!/usr/bin/env node
/**
 * Portal calibration against tmp/portal.png.
 *
 * Two things make a naive diff lie:
 *   1. The reference is 1902x893 — a shorter viewport than the 1080p film, so it
 *      must be scaled by width and TOP-aligned, never centre-padded.
 *   2. Every s08 frame has a moving scene camera. Only `?portal=1` (identity)
 *      is a valid target.
 *
 * So: capture the identity view, crop both images to the reference's scaled
 * height, blend, and score that region.
 *
 *   node tools/calibrate-portal.mjs
 *   node tools/calibrate-portal.mjs --still=out/cal/portal_0000.png
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
  screenshot,
  runFfmpeg,
  ffprobeJson,
} from './lib/pipeline.mjs';

const cli = parseArgs();
const reference = path.resolve(ROOT, String(cli.get('ref', path.join('tmp', 'portal.png'))));
const scaled = path.join(OUT, 'portal-reference-1920.png');
const overlay = path.join(OUT, 'portal-overlay-diff.png');
const reportPath = path.join(OUT, 'portal-calibration.json');
const identityPath = path.join(OUT, 'cal', 'portal-identity.png');
const port = clampInt(cli.num('port', 5197), 1024, 65535);

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.dirname(identityPath), { recursive: true });

const report = {
  checkedAt: new Date().toISOString(),
  ok: false,
  reference: path.relative(ROOT, reference),
  scaled: path.relative(ROOT, scaled),
  overlay: path.relative(ROOT, overlay),
  target: null,
  mode: null,
  region: null,
  psnrDb: null,
  ssim: null,
  note:
    'Identity view (no scene camera, no grain/vignette), scaled by width and top-aligned. ' +
    'Scored on the reference viewport height only.',
};

if (!fs.existsSync(reference)) {
  console.error(`error: missing portal reference at ${reference}`);
  process.exit(1);
}

const refProbe = ffprobeJson(reference);
const refStream = refProbe.streams.find((s) => s.codec_type === 'video');
if (!refStream) {
  console.error('error: could not read reference dimensions');
  process.exit(1);
}
const regionH = Math.round((refStream.height * 1920) / refStream.width);

let server = null;
let browser = null;
let context = null;

async function captureIdentity() {
  const explicit = cli.get('still', null);
  if (explicit) {
    const file = path.resolve(ROOT, String(explicit));
    if (!fs.existsSync(file)) throw new Error(`--still not found: ${file}`);
    report.mode = 'explicit still';
    return file;
  }
  server = await startServer({ mode: 'dev', port, label: 'vite' });
  browser = await launchBrowser();
  const handle = await openRenderPage(browser, `${server.url}?render=1&portal=1`);
  context = handle.context;
  await screenshot(handle.page, identityPath);
  report.mode = 'captured ?portal=1';
  return identityPath;
}

try {
  const target = await captureIdentity();
  report.target = path.relative(ROOT, target);
  report.region = `1920x${regionH} (top-aligned)`;

  // Reference at film width, top-aligned into the 1080 frame for humans.
  runFfmpeg([
    '-y',
    '-v',
    'error',
    '-i',
    reference,
    '-vf',
    'scale=1920:-1:flags=lanczos,pad=1920:1080:0:0:color=white,setsar=1,format=rgb24',
    '-frames:v',
    '1',
    scaled,
  ]);

  // Blend + score only the rows the reference actually covers.
  runFfmpeg([
    '-y',
    '-v',
    'error',
    '-i',
    reference,
    '-i',
    target,
    '-filter_complex',
    `[0:v]scale=1920:${regionH}:flags=lanczos,setsar=1,format=rgb24[a];` +
      `[1:v]crop=1920:${regionH}:0:0,format=rgb24[b];` +
      '[a][b]blend=all_mode=average[out]',
    '-map',
    '[out]',
    '-frames:v',
    '1',
    overlay,
  ]);

  const metrics = (filter) =>
    runFfmpeg(
      [
        '-v',
        'info',
        '-i',
        reference,
        '-i',
        target,
        '-lavfi',
        `[0:v]scale=1920:${regionH}:flags=lanczos,setsar=1,format=rgb24[a];` +
          `[1:v]crop=1920:${regionH}:0:0,format=rgb24[b];[a][b]${filter}`,
        '-f',
        'null',
        '-',
      ],
      { allowFail: true },
    );

  const psnr = metrics('psnr');
  const psnrMatch = /average:([\w.]+)/.exec(String(psnr.stderr || ''));
  if (psnrMatch) report.psnrDb = psnrMatch[1] === 'inf' ? 'inf' : Number(psnrMatch[1]);

  const ssim = metrics('ssim');
  const ssimMatch = /All:([\d.]+)/.exec(String(ssim.stderr || ''));
  if (ssimMatch) report.ssim = Number(ssimMatch[1]);

  const probe = ffprobeJson(overlay);
  const stream = probe.streams.find((s) => s.codec_type === 'video');
  report.overlaySize = stream ? `${stream.width}x${stream.height}` : null;
  report.ok = fs.existsSync(overlay) && fs.statSync(overlay).size > 2048;

  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log('');
  console.log(`mode:    ${report.mode} → ${report.target}`);
  console.log(`region:  ${report.region}`);
  console.log(`PSNR:    ${report.psnrDb ?? 'n/a'} dB`);
  console.log(`SSIM:    ${report.ssim ?? 'n/a'}`);
  console.log(`overlay: ${path.relative(ROOT, overlay)}${report.overlaySize ? ` · ${report.overlaySize}` : ''}`);
} catch (error) {
  console.error(error.stack || error.message);
  if (!fs.existsSync(reportPath)) fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  process.exitCode = 1;
} finally {
  if (context) await context.close().catch(() => {});
  if (browser) await browser.close().catch(() => {});
  if (server) await stopServer(server);
}
