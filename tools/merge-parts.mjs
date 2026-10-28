// Merge translated parts from i18n/work/part-NN.json into per-namespace files.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const workDir = path.join(root, 'i18n/work');
const ruDir = path.join(root, 'i18n/ru');
fs.mkdirSync(ruDir, { recursive: true });

const normalize = (value) => {
  const stripped = value.replace(/[\u200B-\u200D\uFEFF]/g, '');
  return stripped === '' && value !== '' ? ' ' : stripped;
};

const parts = fs.readdirSync(workDir).filter((f) => /^part-\d+\.json$/.test(f)).sort();
const merged = new Map();
for (const f of parts) {
  const data = JSON.parse(fs.readFileSync(path.join(workDir, f), 'utf8'));
  for (const [ns, dict] of Object.entries(data)) {
    if (!merged.has(ns)) merged.set(ns, {});
    for (const [key, value] of Object.entries(dict)) {
      merged.get(ns)[key] = typeof value === 'string' ? normalize(value) : value;
    }
  }
}

const dicts = JSON.parse(fs.readFileSync(path.join(root, 'i18n/dicts.json'), 'utf8'));
let covered = 0;
const missingNs = [];
for (const { ns, en } of dicts) {
  const dict = merged.get(ns);
  if (!dict) { missingNs.push(ns); continue; }
  const out = {};
  for (const key of Object.keys(en)) if (typeof dict[key] === 'string' && dict[key] !== '') out[key] = dict[key];
  fs.writeFileSync(path.join(ruDir, ns + '.json'), JSON.stringify(out, null, 1));
  covered += Object.keys(out).length;
}
console.log(`parts=${parts.length} namespaces=${dicts.length - missingNs.length}/${dicts.length} strings=${covered}`);
if (missingNs.length) console.log('missing namespaces: ' + missingNs.join(', '));
