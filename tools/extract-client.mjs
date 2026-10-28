// Extract every lib/client.js from the DSH app.asar into tools/client/<pkg>.js
// usage: node tools/extract-client.mjs [path/to/app.asar]
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const asarPath = process.argv[2] || 'E:\\DeepSeek\\resources\\app.asar';
const outDir = path.join(root, 'tools/client');
fs.mkdirSync(outDir, { recursive: true });

const fd = fs.openSync(asarPath, 'r');
const fileSize = fs.fstatSync(fd).size;
const probe = Buffer.alloc(64);
fs.readSync(fd, probe, 0, 64, 0);
let headerStart = -1;
for (let i = 8; i < 64; i++) if (probe[i] === 0x7b) { headerStart = i; break; }
if (headerStart < 0) throw new Error('asar header not found');

function readChunk(len) {
  const buf = Buffer.alloc(len);
  fs.readSync(fd, buf, 0, len, headerStart);
  return buf;
}

function findJsonEnd(buf) {
  let depth = 0, inStr = false, esc = false;
  for (let i = 0; i < buf.length; i++) {
    const c = buf[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === 0x5c) esc = true;
      else if (c === 0x22) inStr = false;
      continue;
    }
    if (c === 0x22) inStr = true;
    else if (c === 0x7b) depth++;
    else if (c === 0x7d) { depth--; if (depth === 0) return i + 1; }
  }
  return -1;
}

let chunk = 1 << 20, end = -1, jsonText = '';
for (;;) {
  const len = Math.min(chunk, fileSize - headerStart);
  const buf = readChunk(len);
  const e = findJsonEnd(buf);
  if (e >= 0) { end = headerStart + e; jsonText = buf.toString('utf8', 0, e); break; }
  chunk *= 2;
}
const header = JSON.parse(jsonText);
const dataOffset = (end + 3) & ~3;

const rows = [];
(function walk(node, prefix) {
  for (const [name, child] of Object.entries(node.files || {})) {
    const p = prefix ? prefix + '/' + name : name;
    if (child.files) walk(child, p);
    else rows.push([p, child]);
  }
})(header, '');

let n = 0, bytes = 0;
const index = [];
for (const [p, node] of rows) {
  if (!/\/lib\/client\.js$/.test(p)) continue;
  const m = p.match(/node_modules\/(@[^/]+\/[^/]+)\/lib\/client\.js$/);
  if (!m) continue;
  const safe = m[1].replace(/^@/, '').replace(/\//g, '__');
  const buf = Buffer.alloc(node.size);
  fs.readSync(fd, buf, 0, node.size, dataOffset + Number(node.offset));
  fs.writeFileSync(path.join(outDir, safe + '.client.js'), buf);
  index.push({ pkg: m[1], file: safe + '.client.js', size: node.size });
  n++; bytes += node.size;
}
fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index, null, 2));
console.log(`extracted ${n} bundles, ${bytes} bytes -> ${outDir}`);
