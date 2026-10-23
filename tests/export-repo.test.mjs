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
  for (const file of ['package.json', 'package-lock.json', '.nvmrc', 'DESIGN.md', 'src/pages/index.astro', 'src/data/cv.generated.json', 'src/data/design-tokens.json', 'src/data/build-integrity.json', '.env.example', 'README.md']) {
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


test('export excludes tracked private reviews and preserves local copies during migration', (t) => {
  const { source, target, run } = fixture(t);
  const privateFiles = ['data/curation.json', 'data/source-manifest.json'];
  for (const file of privateFiles) {
    mkdirSync(path.dirname(path.join(source, file)), { recursive: true });
    writeFileSync(path.join(source, file), '{"reviewReason":"private reviewer notes"}\n');
    execFileSync('git', ['-C', source, 'add', '--', file]);
  }
  writeFileSync(path.join(source, '.gitignore'), privateFiles.join('\n') + '\n');
  const result = run('--write');
  assert.equal(result.status, 0, result.stderr);
  const manifestPath = path.join(target, 'export-manifest.json');
  const legacy = JSON.parse(readFileSync(manifestPath, 'utf8'));
  for (const file of privateFiles) {
    assert.equal(existsSync(path.join(target, file)), false);
    mkdirSync(path.dirname(path.join(target, file)), { recursive: true });
    writeFileSync(path.join(target, file), 'private local copy');
    legacy.files[file] = '0'.repeat(64);
  }
  writeFileSync(manifestPath, JSON.stringify(legacy));
  const migrated = run('--write');
  assert.equal(migrated.status, 0, migrated.stderr);
  const current = JSON.parse(readFileSync(manifestPath, 'utf8'));
  for (const file of privateFiles) {
    assert.equal(readFileSync(path.join(target, file), 'utf8'), 'private local copy');
    assert.equal(Object.hasOwn(current.files, file), false);
  }
});


test('export rejects internal notes and paths before mutating the target', (t) => {
  const { source, target, run } = fixture(t);
  const file = path.join(source, 'src/pages/index.astro');
  const rejected = [
    'Owner' + ' decision 2026-10-02',
    'spec' + ' 021',
    ['records', 'publications/item.yaml'].join('/'),
    ['achievement_records', 'grants/item.yaml'].join('/'),
    ['records', 'career/item.yaml'].join('/'),
    ['records', 'education/item.yaml'].join('/'),
    ['records', 'awards/item.yaml'].join('/'),
    ['records', 'service/item.yaml'].join('/'),
    'update/' + 'REQUESTS.md',
    'audit' + ' 14',
    '/Users' + '/example/private-input',
  ];
  for (const text of rejected) {
    writeFileSync(file, `<!-- ${text} -->`);
    for (const mode of ['--check', '--write']) {
      const result = run(mode);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /Internal review content/);
      assert.equal(existsSync(path.join(target, 'package.json')), false);
      assert.equal(existsSync(path.join(target, 'export-manifest.json')), false);
    }
  }
  writeFileSync(file, 'Public academic CV');
  assert.equal(run('--write').status, 0);
  const manifest = readFileSync(path.join(target, 'export-manifest.json'), 'utf8');
  writeFileSync(path.join(target, 'README.md'), rejected[0]);
  assert.notEqual(run('--write').status, 0);
  assert.equal(readFileSync(path.join(target, 'export-manifest.json'), 'utf8'), manifest);
});
