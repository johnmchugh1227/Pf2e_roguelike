// Shared loader for Node harnesses: returns the game's JavaScript in document order.
// Reads index.html, then concatenates its inline <script> blocks and local <script src> files.
// Usage: const js = require('./lib/source.cjs')(process.argv[2] || 'index.html');
const fs = require('node:fs'), path = require('node:path');

function scriptFiles(htmlPath) {
  const html = fs.readFileSync(htmlPath, 'utf8'), dir = path.dirname(path.resolve(htmlPath));
  const parts = [];
  for (const m of html.matchAll(/<script(?:\s+src="([^"]+)")?\s*>([\s\S]*?)<\/script>/g)) {
    if (m[1]) {
      const rel = m[1].split('?')[0];
      parts.push({ name: rel, code: fs.readFileSync(path.join(dir, rel), 'utf8'), src: m[1] });
    } else parts.push({ name: 'inline', code: m[2] });
  }
  return parts;
}

module.exports = htmlPath => scriptFiles(htmlPath).map(p => p.code).join('\n');
module.exports.scriptFiles = scriptFiles;
