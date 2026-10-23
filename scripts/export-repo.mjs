// One-way export of publishable source. Never commits, pushes, or changes Git settings.
// README.md is publication-repo owned; local operating instructions stay here.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = realpathSync(fileURLToPath(new URL('../', import.meta.url)));
const args = process.argv.slice(2);
let targetArg;
let mode = 'check';
let selectedMode;
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--target' && args[i + 1] && !args[i + 1].startsWith('--') && !targetArg) targetArg = args[++i];
  else if (arg === '--check' || arg === '--write') {
    if (selectedMode) throw new Error('Choose exactly one --check or --write.');
    selectedMode = arg;
    mode = arg.slice(2);
  } else throw new Error(`Unknown or incomplete argument: ${arg}`);
}
if (!targetArg) throw new Error('Usage: node scripts/export-repo.mjs --target /path/to/repo [--check|--write]');
if (lstatSync(path.resolve(targetArg)).isSymbolicLink()) throw new Error('Target root must not be a symlink.');
const target = realpathSync(targetArg);
const within = (parent, child) => child === parent || child.startsWith(parent + path.sep);
if (within(root, target) || within(target, root)) throw new Error('Source and target must be separate directory trees.');
if (!existsSync(path.join(target, '.git')) || !lstatSync(path.join(target, '.git')).isDirectory()) throw new Error('Target must have its own .git directory.');

const manifestName = 'export-manifest.json';
const blocked = /^(?:\.git|\.claude|\.codex|\.cursor|\.gemini|docs|qc|dist|node_modules|\.astro|\.env(?:\..*)?|AGENTS\.md|CLAUDE(?:\.local)?\.md|\.mcp\.json|export-manifest\.json)(?:\/|$)/;
const validFile = (file) => {
  if (typeof file !== 'string' || !file || file.includes('\\') || file.includes('\0') || path.posix.isAbsolute(file) || file.split('/').some((part) => !part || part === '.' || part === '..') || (file !== '.env.example' && blocked.test(file))) {
    throw new Error(`Unsafe or internal export path: ${file}`);
  }
  return file;
};
const noSymlinks = (base, file) => {
  let cursor = base;
  for (const part of file.split('/')) {
    cursor = path.join(cursor, part);
    if (existsSync(cursor) || (() => { try { lstatSync(cursor); return true; } catch { return false; } })()) {
      if (lstatSync(cursor).isSymbolicLink()) throw new Error(`Symlinks are not exportable: ${cursor}`);
    }
  }
};
const sha = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
const candidates = execFileSync('git', ['-C', root, 'ls-files', '--cached', '--others', '--exclude-standard', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const files = [...new Set(candidates)].filter((file) => !['README.md', 'DESIGN.md'].includes(file) && (() => {
  try { lstatSync(path.join(root, file)); return true; }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
})()).sort();
for (const file of files) {
  validFile(file);
  noSymlinks(root, file);
  noSymlinks(target, file);
  if (!lstatSync(path.join(root, file)).isFile()) throw new Error(`Not a regular source file: ${file}`);
}
for (const required of ['package.json', 'package-lock.json', '.nvmrc', 'src/data/design-tokens.json', 'src/pages/index.astro', 'src/data/cv.generated.json']) {
  if (!files.includes(required)) throw new Error(`Incomplete source selection: ${required}`);
}
noSymlinks(target, manifestName);
const manifestPath = path.join(target, manifestName);
const previous = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : { schemaVersion: 1, source: 'Achivement/webpage', files: {} };
if (previous.schemaVersion !== 1 || previous.source !== 'Achivement/webpage' || !previous.files || Array.isArray(previous.files) || typeof previous.files !== 'object') throw new Error('Invalid export manifest.');
for (const [file, hash] of Object.entries(previous.files)) {
  validFile(file);
  noSymlinks(target, file);
  if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error(`Invalid manifest hash: ${file}`);
}
if (!existsSync(manifestPath) && readdirSync(target).some((entry) => entry !== '.git')) throw new Error('First export requires an empty target except .git.');

const next = Object.create(null);
const report = { added: [], modified: [], removed: [], unchanged: [] };
for (const file of files) {
  const dest = path.join(target, file);
  const hash = sha(path.join(root, file));
  next[file] = hash;
  if (!existsSync(dest)) report.added.push(file);
  else {
    if (!Object.hasOwn(previous.files, file)) throw new Error(`Unmanaged target collision: ${file}`);
    if (!lstatSync(dest).isFile()) throw new Error(`Target collision: ${file}`);
    const actual = sha(dest);
    if (actual === hash) report.unchanged.push(file);
    else {
      if (!previous.files[file] || actual !== previous.files[file]) throw new Error(`Unmanaged or changed target collision; review before overwriting: ${file}`);
      report.modified.push(file);
    }
  }
}
for (const file of Object.keys(previous.files)) {
  const dest = path.join(target, file);
  if (!(file in next) && existsSync(dest)) {
    if (!lstatSync(dest).isFile() || sha(dest) !== previous.files[file]) throw new Error(`Target changed outside export; refusing removal: ${file}`);
    report.removed.push(file);
  }
}

if (mode === 'write') {
  for (const file of [...report.added, ...report.modified]) {
    const dest = path.join(target, file);
    mkdirSync(path.dirname(dest), { recursive: true });
    copyFileSync(path.join(root, file), dest);
  }
  for (const file of report.removed) rmSync(path.join(target, file));
  const unchanged = existsSync(manifestPath) && JSON.stringify(previous.files) === JSON.stringify(next);
  if (!unchanged) writeFileSync(manifestPath, JSON.stringify({ schemaVersion: 1, source: 'Achivement/webpage', files: next }, null, 2) + '\n');
}
console.log(JSON.stringify({ mode, target, sourceFiles: files.length, ...report }, null, 2));
console.log(mode === 'check' ? 'No files changed.' : 'Exported source only; Git and unmanaged target files were not changed.');
