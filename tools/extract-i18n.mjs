// Extract locale dictionaries (zh/en) from the client bundles in tools/client.
// Output: i18n/dicts.json — [{ pkg, ns, zh, en }]
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dir = path.join(root, 'tools/client');
const outDir = path.join(root, 'i18n');
fs.mkdirSync(outDir, { recursive: true });
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.client.js'));

function matchBlock(src, start) {
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') {
      const q = c; i++;
      while (i < src.length) { if (src[i] === '\\') { i += 2; continue; } if (src[i] === q) break; i++; }
      continue;
    }
    if (c === '/' && src[i + 1] === '/') { while (i < src.length && src[i] !== '\n') i++; continue; }
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i + 2) + 1; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return i + 1; }
  }
  return -1;
}

function splitTopLevel(src) {
  const parts = [];
  let depth = 0, last = 0;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === '`') {
      const q = c; i++;
      while (i < src.length) { if (src[i] === '\\') { i += 2; continue; } if (src[i] === q) break; i++; }
      continue;
    }
    if (c === '{' || c === '(' || c === '[') depth++;
    else if (c === '}' || c === ')' || c === ']') depth--;
    else if (c === ',' && depth === 0) { parts.push(src.slice(last, i)); last = i + 1; }
  }
  parts.push(src.slice(last));
  return parts.map((p) => p.trim()).filter(Boolean);
}

function evalLiteral(text) {
  try {
    const v = new Function('return (' + text + ')')();
    if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
    const out = {};
    for (const [k, val] of Object.entries(v)) if (typeof val === 'string') out[k] = val;
    return Object.keys(out).length ? out : null;
  } catch {
    const out = {};
    for (const entry of splitTopLevel(text.slice(1, -1))) {
      const mm = entry.match(/^("(?:[^"\\]|\\.)*"|[A-Za-z_$][\w$]*)\s*:\s*([\s\S]+)$/);
      if (!mm) continue;
      try {
        const key = mm[1].startsWith('"') ? JSON.parse(mm[1]) : mm[1];
        const val = new Function('return (' + mm[2] + ')')();
        if (typeof val === 'string') out[key] = val;
      } catch {}
    }
    return Object.keys(out).length ? out : null;
  }
}

function pickDefinition(list, before) {
  let best = null;
  for (const entry of list) if (entry.at < before) best = entry;
  return best;
}

const results = [];
const problems = [];

for (const file of files) {
  const pkg = file.replace(/\.client\.js$/, '').replace(/__/g, '/');
  const src = fs.readFileSync(path.join(dir, file), 'utf8');

  const consts = new Map();
  let m;
  const constRe = /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*\{/g;
  while ((m = constRe.exec(src))) {
    const start = m.index + m[0].length - 1;
    const end = matchBlock(src, start);
    if (end < 0) continue;
    if (!consts.has(m[1])) consts.set(m[1], []);
    consts.get(m[1]).push({ at: start, text: src.slice(start, end) });
  }
  const strConsts = new Map();
  const strRe = /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')\s*;/g;
  while ((m = strRe.exec(src))) {
    try {
      if (!strConsts.has(m[1])) strConsts.set(m[1], []);
      strConsts.get(m[1]).push({ at: m.index, value: new Function('return ' + m[2])() });
    } catch {}
  }

  const regRe = /locale\.register\s*\(/g;
  while ((m = regRe.exec(src))) {
    const open = m.index + m[0].length - 1;
    let depth = 0, end = -1;
    for (let i = open; i < src.length; i++) {
      const c = src[i];
      if (c === '"' || c === "'" || c === '`') {
        const q = c; i++;
        while (i < src.length) { if (src[i] === '\\') { i += 2; continue; } if (src[i] === q) break; i++; }
        continue;
      }
      if (c === '(') depth++;
      else if (c === ')') { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end < 0) continue;
    const args = splitTopLevel(src.slice(open + 1, end));
    if (args.length < 2) { problems.push({ pkg, why: 'args<2' }); continue; }

    let ns = null;
    if (/^["']/.test(args[0])) { try { ns = new Function('return ' + args[0])(); } catch {} }
    else { const d = pickDefinition(strConsts.get(args[0]) || [], m.index); ns = d?.value; }
    if (!ns) { problems.push({ pkg, why: 'ns unresolved: ' + args[0] }); continue; }

    let objText = args[1];
    if (!objText.startsWith('{')) {
      const d = pickDefinition(consts.get(objText) || [], m.index);
      if (!d) { problems.push({ pkg, ns, why: 'dict unresolved: ' + objText }); continue; }
      objText = d.text;
    }
    const entryParts = splitTopLevel(objText.slice(1, -1));
    const dict = {};
    for (const e of entryParts) {
      const km = e.match(/^([A-Za-z_$][\w$]*)\s*(?::\s*([\s\S]+))?$/);
      if (!km) continue;
      const lang = km[1];
      let valText = (km[2] || lang).trim();
      if (!valText.startsWith('{')) {
        const d = pickDefinition(consts.get(valText) || [], m.index);
        if (!d) continue;
        valText = d.text;
      }
      const obj = evalLiteral(valText);
      if (obj && !dict[lang]) dict[lang] = obj;
    }
    if (dict.en) results.push({ pkg, ns, en: dict.en, zh: dict.zh || {} });
    else problems.push({ pkg, ns, why: 'no en dict' });
  }
}

const seen = new Map();
for (const r of results) {
  const key = r.pkg + ' :: ' + r.ns;
  const prev = seen.get(key);
  if (!prev || Object.keys(prev.en).length < Object.keys(r.en).length) seen.set(key, r);
}
const list = [...seen.values()];
fs.writeFileSync(path.join(outDir, 'dicts.json'), JSON.stringify(list, null, 1));
fs.writeFileSync(path.join(outDir, 'problems.json'), JSON.stringify(problems, null, 1));

let total = 0; const uniq = new Set();
for (const r of list) for (const [k, v] of Object.entries(r.en)) { total++; uniq.add(v); }
console.log(`namespaces=${list.length} strings=${total} uniqueStrings=${uniq.size} problems=${problems.length}`);
