// Validate a translated part against its source chunk.
// usage: node tools/verify-part.mjs i18n/work/part-01.json i18n/work/chunk-01.json
import fs from 'node:fs';

const [, , partPath, chunkPath] = process.argv;
if (!partPath || !chunkPath) { console.error('usage: node tools/verify-part.mjs <part.json> <chunk.json>'); process.exit(2); }

const part = JSON.parse(fs.readFileSync(partPath, 'utf8'));
const chunk = JSON.parse(fs.readFileSync(chunkPath, 'utf8'));

const problems = [];
let total = 0;
const placeholders = (s) => (String(s).match(/\{[A-Za-z_][\w.]*\}/g) || []).sort().join(',');

for (const { ns, strings } of chunk) {
  const dict = part[ns];
  if (!dict) { problems.push(`missing namespace "${ns}"`); continue; }
  const expected = new Set(strings.map(([k]) => k));
  for (const [key, en] of strings) {
    total++;
    const ru = dict[key];
    if (typeof ru !== 'string' || ru.trim() === '') { problems.push(`${ns}: empty or missing "${key}"`); continue; }
    if (placeholders(en) !== placeholders(ru)) problems.push(`${ns}: placeholder mismatch "${key}": "${en}" -> "${ru}"`);
  }
  for (const key of Object.keys(dict)) if (!expected.has(key)) problems.push(`${ns}: unexpected key "${key}"`);
}

if (problems.length) {
  console.log(`FAIL (${problems.length} problems, ${total} strings checked)`);
  for (const p of problems.slice(0, 40)) console.log(' - ' + p);
  if (problems.length > 40) console.log(` ... and ${problems.length - 40} more`);
  process.exit(1);
} else {
  console.log(`PASS: ${total} strings, ${chunk.length} namespaces`);
}
