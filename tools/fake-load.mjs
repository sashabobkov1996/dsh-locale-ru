// Offline sanity check: load the built client bundle in a fake browser shell
// and verify that it registers the Russian language and dictionaries.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const code = fs.readFileSync(path.join(root, 'lib/client.js'), 'utf8');
let captured = null;
const sandbox = { window: { __ModuleLoader__: { load: (cfg) => { captured = cfg; } } }, console };
vm.createContext(sandbox);
vm.runInContext(code, sandbox, { filename: 'client.js' });

if (!captured) throw new Error('bundle did not call __ModuleLoader__.load');
const mod = captured.factory(() => { throw new Error('unexpected require'); });

const log = [];
const ctx = {
  effect(fn) { const dispose = fn(); if (typeof dispose === 'function') log.push('disposer'); },
  locale: {
    addLanguage(lang) { log.push('addLanguage ' + JSON.stringify(lang)); return () => {}; },
    register(ns, locale, dict) { log.push(`register ${ns}/${locale} keys=${Object.keys(dict).length}`); return () => {}; },
  },
};

mod.apply(ctx);
const namespaces = log.filter((l) => l.startsWith('register')).length;
console.log(`id=${captured.id} inject=${JSON.stringify(mod.inject)} namespaces=${namespaces}`);
if (!log.some((l) => l.includes('"ru"'))) throw new Error('language was not registered');
