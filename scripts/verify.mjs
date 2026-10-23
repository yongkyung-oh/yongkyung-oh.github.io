// One-command verification chain. Mirrors AGENTS.md §Verification so the order and
// the preview lifecycle are no longer hand-run:
//   sync:cv --check  →  npm test  →  npm run build  →  preview  →  browser QC  →  preview:stop
// The preview is always stopped, even when a stage fails. Pass --no-browser to stop
// after the build (documentation-only or data-only changes). Pass --ci in a
// standalone public clone to skip only the unavailable upstream CV freshness check.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const url = 'http://127.0.0.1:4400';
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const options = process.argv.slice(2);
if (options.includes('--help')) {
  console.log('Usage: npm run verify -- [--ci] [--no-browser]');
  console.log('  --ci          Skip only sync:cv --check when CV_publish is unavailable.');
  console.log('  --no-browser  Stop after tests and static build.');
  process.exit(0);
}
const unknown = options.filter((option) => !['--ci', '--no-browser'].includes(option));
if (unknown.length) throw new Error(`Unknown verify option: ${unknown.join(', ')}`);
const ciMode = options.includes('--ci');
const withBrowser = !options.includes('--no-browser');

const run = (label, cmd, args) => {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(cmd, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${label} failed (exit ${result.status})`);
};

// Browser QC needs a Python that has Playwright. `python3` on this machine does not;
// the Anaconda interpreter does. QA_PYTHON overrides both.
const resolvePython = () => {
  const candidates = [process.env.QA_PYTHON, '/opt/anaconda3/bin/python3', 'python3'].filter(Boolean);
  for (const candidate of candidates) {
    const probe = spawnSync(candidate, ['-c', 'import playwright'], { stdio: 'ignore' });
    if (probe.status === 0) return candidate;
  }
  throw new Error(
    'No Python with Playwright found. Set QA_PYTHON=/path/to/python3 or install it: ' +
    'pip install -r requirements-qa.txt && python3 -m playwright install chromium',
  );
};

const waitForServer = async (target, timeoutMs = 20000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(target);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Preview did not answer at ${target} within ${timeoutMs / 1000}s`);
};

let previewStarted = false;
try {
  if (ciMode) console.log('↷ sync:cv --check skipped (--ci; standalone public clone)');
  else run('sync:cv --check — project snapshot matches the reviewed CV_publish sources', npm, ['run', '--silent', 'sync:cv', '--', '--check']);
  run('npm test — data and display contracts', npm, ['test', '--silent']);
  run('npm run build — astro check, static build, check-build gates', npm, ['run', '--silent', 'build']);
  if (!withBrowser) {
    console.log('\n✓ verify: build stages passed (--no-browser; browser QC skipped)');
  } else {
    const python = resolvePython();
    // `astro preview` silently moves to the next free port when 4400 is taken (e.g. by `npm run dev`), and the QC would
    // then test the dev server — whose toolbar injects extra <h1>s — instead of the build. Refuse instead of guessing.
    const busy = await fetch(url).then(() => true, () => false);
    if (busy) throw new Error(`${url} is already serving (often \`npm run dev\`). Stop it, or run browser QC against your own preview with --url.`);
    run('preview — background server on 127.0.0.1:4400', npm, ['run', '--silent', 'preview']);
    previewStarted = true;
    await waitForServer(url);
    run(`browser QC — ${python} scripts/browser-qc.py`, python, [path.join(root, 'scripts/browser-qc.py'), '--url', url]);
    console.log('\n✓ verify: all stages passed');
  }
} catch (error) {
  console.error(`\n✗ verify: ${error.message}`);
  process.exitCode = 1;
} finally {
  // `astro preview stop` is idempotent; it also stops a preview the user had left running.
  if (previewStarted) spawnSync(npm, ['run', '--silent', 'preview:stop'], { cwd: root, stdio: 'inherit' });
}
