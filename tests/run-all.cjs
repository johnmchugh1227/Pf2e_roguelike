// Run: node tests/run-all.cjs [index.html]
// Runs every focused regression in tests/ (not the slower balance harnesses or the browser audit)
// and reports pass/fail per script. Exits non-zero if any fail.
const { spawnSync } = require('node:child_process');
const fs = require('node:fs'), path = require('node:path');
const html = process.argv[2] || 'index.html';
const skip = new Set(['run-all.cjs', 'balance.cjs', 'boss-balance.cjs', 'fundamental-balance.cjs', 'knowledge-balance.cjs']);
const scripts = fs.readdirSync(__dirname).filter(f => f.endsWith('.cjs') && !skip.has(f)).sort();
let failed = 0;
for (const f of scripts) {
  const r = spawnSync(process.execPath, [path.join(__dirname, f), html], { encoding: 'utf8' });
  const ok = r.status === 0;
  if (!ok) failed++;
  const tail = (ok ? r.stdout : r.stderr || r.stdout).trim().split('\n').at(-1) || '';
  console.log((ok ? 'pass ' : 'FAIL ') + f.padEnd(24) + tail.slice(0, 120));
}
console.log(`${scripts.length - failed}/${scripts.length} passed`);
process.exit(failed ? 1 : 0);
