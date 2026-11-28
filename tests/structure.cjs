// Run: node tests/structure.cjs [index.html]
// Checks the multi-file layout: every script loads as a separate classic script in document
// order (as a browser does), the boot renders the draft, and asset query strings match BUILD_ID.
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const htmlPath = process.argv[2] || 'index.html';
const { scriptFiles } = require('./lib/source.cjs');
const html = fs.readFileSync(htmlPath, 'utf8');
let assertions = 0;
const ck = (v, m) => { if (!v) throw Error(m); assertions++; };

const parts = scriptFiles(htmlPath);
ck(parts[0].name === 'inline' && /const BUILD_ID = 'Alpha 0\.1 build \d+';/.test(parts[0].code), 'BUILD_ID inline first');
ck(parts.at(-1).name === 'js/ui.js', 'ui.js loads last');
const build = parts[0].code.match(/build (\d+)/)[1];
const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1]).filter(u => !/^https?:/.test(u));
ck(refs.length === parts.length, 'stylesheet and scripts referenced');
for (const u of refs) {
  ck(u.endsWith('?b=' + build), u + ' query matches build ' + build);
  ck(fs.existsSync(path.join(path.dirname(path.resolve(htmlPath)), u.split('?')[0])), u + ' exists');
}

// Sequential load in one realm. Top-level code must not depend on a later file.
const app = { innerHTML: '', addEventListener() {} }, storage = {};
let seq = 0;
const ctx = vm.createContext({
  document: { getElementById: () => app, querySelector: () => null },
  localStorage: { getItem: k => storage[k] ?? null, setItem: (k, v) => { storage[k] = v; } },
  crypto: { getRandomValues: a => { a[0] = ++seq; return a; } },
  console, Uint32Array, Math, JSON,
});
for (const p of parts) {
  try { new vm.Script(p.code, { filename: p.name }).runInContext(ctx); }
  catch (e) { throw Error(p.name + ' failed to load in order: ' + e.message); }
  assertions++;
}
ck(app.innerHTML.includes('Expedition draft') && app.innerHTML.includes('build ' + build), 'boot renders draft with build label');
console.log({ assertions, files: parts.length });
