const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

// Render the real server page and its React components, with a deterministic
// content-loader response in place of the network. CSS has no role in this test.
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => {
    const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    });
    module._compile(result.outputText, filename);
  };
}
require.extensions['.css'] = (module) => { module.exports = new Proxy({}, { get: (_, name) => name === '__esModule' ? false : String(name) }); };
const root = path.join(__dirname, '..');
const { normalizeHomepageContent } = require(path.join(root, 'app/home-data.ts'));
const { createHelixParticles, createHelixFallback, TURN_MS } = require(path.join(root, 'app/lib/gold-helix.ts'));
const fixture = normalizeHomepageContent({
  tools: [{ id: 'admin-tool', badge: 'CUSTOM', title: 'Admin-selected tool', description: 'Admin tool description', image_url: 'https://media.fluxora.wiki/admin-tool.jpg', button_label: 'Launch selected tool', button_url: '/tools/custom-tool', sort_order: 1, is_active: true }],
  faqs: [{ id: 'admin-faq', question: 'Admin-managed question?', answer: 'Admin-managed answer.', sort_order: 1, is_active: true }],
});
const loader = require.resolve(path.join(root, 'app/lib/homepage-content.ts'));
require.cache[loader] = { id: loader, filename: loader, loaded: true, exports: { loadHomepageContent: async () => fixture } };
const { default: HomePage } = require(path.join(root, 'app/page.tsx'));
const renderHome = async () => renderToStaticMarkup(await HomePage());

test('outputs have their own section after featured tools and before FAQs', async () => {
  const markup = await renderHome();
  const tools = markup.indexOf('Start with what you want to make.');
  const outputs = markup.indexOf('Actual Outputs, Actual Results');
  const faq = markup.indexOf('What new users usually ask first.');
  assert.ok(outputs > tools && outputs < faq, 'outputs must sit between Featured Tools and FAQs');
  const hero = markup.slice(markup.indexOf('<section'), markup.indexOf('</section>'));
  assert.ok(!hero.includes('Preview Skincare'), 'output previews should be outside the hero');
});

test('admin-selected tools, gallery links, and FAQ answers survive the design update', async () => {
  const markup = await renderHome();
  for (const value of ['Admin-selected tool', '/tools/custom-tool', 'Launch selected tool', 'Admin-managed question?', 'Admin-managed answer.', fixture.gallery.top[0].image_url]) {
    assert.ok(markup.includes(value), `missing live content: ${value}`);
  }
});

test('the supplied heading copy keeps destination descriptions and removes section subtitles', async () => {
  const markup = await renderHome();
  assert.ok(markup.includes('Access creator-focused tools and systems built to make ideas faster to execute.'));
  assert.ok(markup.includes('Fluxora gives creators practical AI tools'));
  for (const removed of ['Jump straight to the part of Fluxora you need.', 'Three useful starting points from the Fluxora tool library.', 'Quick answers before you jump into the tools.', 'Admin tool description']) {
    assert.ok(!markup.includes(removed), `unexpected subtitle: ${removed}`);
  }
});

test('gold helix geometry stays sparse, warm, and fixed for the 14 second turn', () => {
  const cloud = createHelixParticles();
  assert.equal(TURN_MS, 14000);
  assert.equal(cloud.count, 7728);
  assert.equal(cloud.vertices.length, cloud.count * 9);
  assert.ok([...cloud.vertices].every(Number.isFinite));
  for (let i = 3; i < cloud.vertices.length; i += 9) {
    assert.ok(cloud.vertices[i] >= 2.6 && cloud.vertices[i] <= 6.5, 'grain sizes should remain large but bounded');
  }
  const fallback = createHelixFallback(cloud);
  assert.equal(fallback.reduce((total, batch) => total + batch.d.split(' M').length, 0), cloud.count);
  assert.ok(fallback.length > 20 && fallback.length < 120, 'fallback should batch separate grains without creating a solid tube');
});
