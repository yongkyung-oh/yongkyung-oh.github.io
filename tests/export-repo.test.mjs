import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/export-repo.mjs', import.meta.url));
function fixture(t) {
  const dir = mkdtempSync(path.join(tmpdir(), 'cv-export-test-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const source = path.join(dir, 'source');
  const target = path.join(dir, 'target');
  mkdirSync(source); mkdirSync(target);
  for (const root of [source, target]) execFileSync('git', ['init', '-q', root]);
  for (const file of ['package.json', 'package-lock.json', '.nvmrc', 'DESIGN.md', 'src/pages/index.astro', 'src/data/cv.generated.json', 'src/data/design-tokens.json', '.env.example', 'README.md']) {
    const dest = path.join(source, file);
    mkdirSync(path.dirname(dest), { recursive: true });
    writeFileSync(dest, 'fixture\n');
  }
  mkdirSync(path.join(source, 'scripts'));
  copyFileSync(script, path.join(source, 'scripts/export-repo.mjs'));
  const run = (...args) => spawnSync(process.execPath, [path.join(source, 'scripts/export-repo.mjs'), '--target', target, ...args], { encoding: 'utf8' });
  return { dir, source, target, run };
}

test('export is explicit, idempotent, preserves unmanaged files, and only removes prior owned files', (t) => {
  const { source, target, run } = fixture(t);
  assert.equal(run('--check').status, 0);
  assert.equal(existsSync(path.join(target, 'package.json')), false);
  assert.equal(run('--write').status, 0);
  assert.equal(existsSync(path.join(target, '.env.example')), true);
  assert.equal(existsSync(path.join(target, 'README.md')), false);
  assert.equal(existsSync(path.join(target, 'DESIGN.md')), false);
  writeFileSync(path.join(target, 'README.md'), 'publication-owned');
  const manifest = readFileSync(path.join(target, 'export-manifest.json'), 'utf8');
  assert.equal(run('--write').status, 0);
  assert.equal(readFileSync(path.join(target, 'export-manifest.json'), 'utf8'), manifest);
  assert.equal(readFileSync(path.join(target, 'README.md'), 'utf8'), 'publication-owned');
  rmSync(path.join(source, '.env.example'));
  assert.equal(run('--write').status, 0);
  assert.equal(existsSync(path.join(target, '.env.example')), false);
  assert.equal(readFileSync(path.join(target, 'README.md'), 'utf8'), 'publication-owned');
});

test('export refuses unmanaged collisions, target edits, traversal, symlinks, and conflicting arguments', (t) => {
  const { dir, source, target, run } = fixture(t);
  assert.equal(run('--write').status, 0);
  writeFileSync(path.join(source, 'new-file.txt'), 'same');
  writeFileSync(path.join(target, 'new-file.txt'), 'same');
  assert.notEqual(run('--write').status, 0);
  assert.equal(readFileSync(path.join(target, 'new-file.txt'), 'utf8'), 'same');
  rmSync(path.join(source, 'new-file.txt')); rmSync(path.join(target, 'new-file.txt'));
  writeFileSync(path.join(target, 'package.json'), 'target edit');
  assert.notEqual(run('--write').status, 0);
  assert.equal(readFileSync(path.join(target, 'package.json'), 'utf8'), 'target edit');
  writeFileSync(path.join(target, 'package.json'), 'fixture\n');
  const manifestPath = path.join(target, 'export-manifest.json');
  const manifest = readFileSync(manifestPath, 'utf8');
  const bad = JSON.parse(manifest); bad.files['../sentinel'] = '0'.repeat(64);
  writeFileSync(path.join(dir, 'sentinel'), 'keep');
  writeFileSync(manifestPath, JSON.stringify(bad));
  assert.notEqual(run('--write').status, 0);
  assert.equal(readFileSync(path.join(dir, 'sentinel'), 'utf8'), 'keep');
  writeFileSync(manifestPath, manifest);
  symlinkSync(path.join(dir, 'sentinel'), path.join(source, 'linked'));
  assert.notEqual(run('--write').status, 0); rmSync(path.join(source, 'linked'));
  symlinkSync(path.join(dir, 'missing'), path.join(source, 'dangling'));
  assert.notEqual(run('--write').status, 0); rmSync(path.join(source, 'dangling'));
  assert.notEqual(run('--check', '--write').status, 0);
  assert.notEqual(run('--unknown').status, 0);
});
