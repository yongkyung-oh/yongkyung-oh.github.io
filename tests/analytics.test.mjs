import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const analytics = JSON.parse(readFileSync(new URL('../src/data/analytics.json', import.meta.url)));
const component = readFileSync(new URL('../src/components/GoogleAnalytics.astro', import.meta.url), 'utf8');
const bootstrap = component.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1];
const environment = (hostname, initial = []) => {
  const tags = [];
  const window = { location: { hostname }, dataLayer: initial };
  const document = {
    getElementById: (id) => tags.find((tag) => tag.id === id),
    createElement: () => ({}),
    head: { appendChild: (tag) => tags.push(tag) },
  };
  const context = vm.createContext({ window, document, ...analytics });
  return { tags, window, run: () => vm.runInContext(bootstrap, context) };
};

test('production initializes the existing destination once and loads Google asynchronously', () => {
  assert.equal(analytics.measurementId, 'G-GFFVQGX42E');
  assert.equal(analytics.hostname, 'yongkyung-oh.github.io');
  const app = environment(analytics.hostname);
  app.run();
  app.run();
  assert.equal(app.tags.length, 1);
  assert.equal(app.tags[0].async, true);
  assert.equal(app.tags[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-GFFVQGX42E');
  assert.deepEqual(app.window.dataLayer.map((args) => Array.from(args).slice(0, 2)).map((args) => args[0]), ['js', 'config']);
  assert.equal(app.window.dataLayer[1][1], analytics.measurementId);
  assert.equal(app.window.dataLayer[1].length, 2);
});

test('local and alternate-host previews make no analytics changes', () => {
  for (const host of ['localhost', '127.0.0.1', '::1', 'preview.example.com', 'yongkyung-oh.github.io.example.com']) {
    const app = environment(host);
    app.run();
    assert.equal(app.tags.length, 0, host);
    assert.equal(app.window.dataLayer.length, 0, host);
    assert.equal(app.window.gtag, undefined, host);
  }
});

test('initialization preserves any existing data layer events', () => {
  const queued = [{ event: 'existing-event' }];
  const app = environment(analytics.hostname, queued);
  app.run();
  assert.equal(app.window.dataLayer, queued);
  assert.equal(queued[0].event, 'existing-event');
  assert.equal(queued.length, 3);
});
