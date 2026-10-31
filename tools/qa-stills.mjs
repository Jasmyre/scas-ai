#!/usr/bin/env node
/**
 * Fast sanity pass over out/stills before eyeballing the contact sheet:
 * dimensions, duplicate frames, scene coverage, and frame-number sanity.
 *
 *   node tools/qa-stills.mjs
 *   node tools/qa-stills.mjs --expect=28 --dir=out/stills
 *   node tools/qa-stills.mjs --strict
 */

import fs from 'node:fs';
import path from 'node:path';

import { SCENES, TOTAL_FRAMES } from '../src/timeline/cues.js';
import { OUT, STILLS_DIR, parseArgs, pngInfo, sha256File } from './lib/pipeline.mjs';

const cli = parseArgs();
const dir = path.resolve(String(cli.get('dir', STILLS_DIR)));
const expected = cli.num('expect', 34);
const strict = cli.has('strict');
const reportPath = path.join(OUT, 'stills-report.json');

const report = {
  checkedAt: new Date().toISOString(),
  dir: path.relative(process.cwd(), dir),
  ok: false,
  count: 0,
  expected,
  frames: [],
  invalid: [],
  duplicates: [],
  outOfRange: [],
  perScene: [],
  scenesMissing: [],
  issues: [],
};

if (!fs.existsSync(dir)) {
  console.error(`error: stills directory not found: ${report.dir}`);
  console.error('run: npm run render:stills');
  process.exit(1);
}

const stills = fs
  .readdirSync(dir)
  .map((name) => {
    const m = /^still_(\d+)\.png$/.exec(name);
    return m ? { frame: Number(m[1]), name, file: path.join(dir, name) } : null;
  })
  .filter(Boolean)
  .sort((a, b) => a.frame - b.frame);

report.count = stills.length;

const byHash = new Map();
for (const still of stills) {
  const info = pngInfo(still.file);
  if (!info || info.width !== 1920 || info.height !== 1080) {
    report.invalid.push({
      name: still.name,
      width: info?.width ?? null,
      height: info?.height ?? null,
    });
    continue;
  }

  if (still.frame >= TOTAL_FRAMES) report.outOfRange.push(still.name);

  const hash = sha256File(still.file);
  if (byHash.has(hash)) {
    report.duplicates.push({ frames: [byHash.get(hash), still.frame], hash: hash.slice(0, 12) });
  } else {
    byHash.set(hash, still.frame);
  }
}

report.frames = stills.map((s) => s.frame);
report.perScene = SCENES.map((scene) => ({
  id: scene.id,
  start: scene.start,
  end: scene.end,
  frames: stills.filter((s) => s.frame >= scene.start && s.frame < scene.end).map((s) => s.frame),
}));
report.scenesMissing = report.perScene.filter((s) => s.frames.length === 0).map((s) => s.id);

if (!stills.length) report.issues.push('no stills found');
if (report.invalid.length) report.issues.push(`${report.invalid.length} still(s) are not 1920x1080 PNG`);
if (report.duplicates.length) report.issues.push(`${report.duplicates.length} exact duplicate frame(s)`);
if (report.outOfRange.length) report.issues.push(`${report.outOfRange.length} still(s) beyond frame ${TOTAL_FRAMES - 1}`);
if (report.scenesMissing.length) report.issues.push(`scenes without a still: ${report.scenesMissing.join(', ')}`);
if (stills.length !== expected) report.issues.push(`expected ${expected} stills, found ${stills.length}`);

const countMismatch = stills.length !== expected;
report.ok =
  report.invalid.length === 0 &&
  report.duplicates.length === 0 &&
  report.outOfRange.length === 0 &&
  report.scenesMissing.length === 0 &&
  (!strict || !countMismatch);

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(`stills: ${report.dir} · ${stills.length}/${expected}`);
for (const scene of report.perScene) {
  const status = scene.frames.length ? 'ok  ' : 'MISS';
  console.log(`  ${status} ${scene.id}  ${scene.frames.map((f) => String(f).padStart(4, '0')).join(', ') || '—'}`);
}

if (report.invalid.length) {
  for (const item of report.invalid) console.log(`  invalid ${item.name}: ${item.width}x${item.height}`);
}
for (const dup of report.duplicates) {
  console.log(`  duplicate: frames ${dup.frames.join(' = ')} (${dup.hash})`);
}
if (countMismatch) {
  console.log(`  ${strict ? 'FAIL' : 'WARN'}: ${stills.length} stills on disk, expected ${expected}`);
}

console.log('');
if (report.ok) {
  console.log(`PASS  ${stills.length} unique 1920x1080 stills across ${SCENES.length} scenes`);
} else {
  console.log('FAIL');
  for (const issue of report.issues) console.log(`  · ${issue}`);
}
console.log(`report: ${path.relative(process.cwd(), reportPath)}`);
process.exitCode = report.ok ? 0 : 1;
