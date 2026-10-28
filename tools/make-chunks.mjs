// Split i18n/dicts.json into translation chunks under i18n/work/.
// usage: node tools/make-chunks.mjs [targetSize]
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dicts = JSON.parse(fs.readFileSync(path.join(root, 'i18n/dicts.json'), 'utf8'));
const outDir = path.join(root, 'i18n/work');
fs.mkdirSync(outDir, { recursive: true });

const CHUNK_TARGET = Number(process.argv[2] || 300);
const nsList = dicts.map(({ ns, en, zh }) => ({ ns, en, zh }))
  .sort((a, b) => Object.keys(b.en).length - Object.keys(a.en).length);

const chunks = [];
let current = { items: [], size: 0 };
for (const { ns, en, zh } of nsList) {
  const keys = Object.keys(en);
  if (current.size > 0 && current.size + keys.length > CHUNK_TARGET) {
    chunks.push(current);
    current = { items: [], size: 0 };
  }
  current.items.push({ ns, strings: keys.map((k) => [k, en[k], (zh || {})[k] ?? null]) });
  current.size += keys.length;
}
if (current.items.length) chunks.push(current);

chunks.forEach((c, i) => {
  fs.writeFileSync(path.join(outDir, `chunk-${String(i + 1).padStart(2, '0')}.json`), JSON.stringify(c.items, null, 1));
});
console.log(`chunks=${chunks.length} total=${chunks.reduce((a, c) => a + c.size, 0)}`);
