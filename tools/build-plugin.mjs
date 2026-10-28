// Build lib/client.js from the extracted dictionaries and the Russian translations.
// usage: node tools/build-plugin.mjs
import fs from 'node:fs';
import path from 'node:path';

export const PACKAGE_NAME = 'dsh-locale-ru';

const root = path.resolve(import.meta.dirname, '..');
const dicts = JSON.parse(fs.readFileSync(path.join(root, 'i18n/dicts.json'), 'utf8'));
const ruDir = path.join(root, 'i18n/ru');
const ruFiles = fs.existsSync(ruDir) ? fs.readdirSync(ruDir).filter((f) => f.endsWith('.json')) : [];

const translations = new Map();
for (const f of ruFiles) {
  translations.set(f.replace(/\.json$/, ''), JSON.parse(fs.readFileSync(path.join(ruDir, f), 'utf8')));
}

const table = {};
const missing = [];
let count = 0;
for (const { ns, en } of dicts) {
  const tr = translations.get(ns);
  if (!tr) { missing.push(ns); continue; }
  const out = {};
  for (const key of Object.keys(en)) {
    if (typeof tr[key] === 'string' && tr[key] !== '') { out[key] = tr[key]; count++; }
  }
  if (Object.keys(out).length) table[ns] = out;
}

const body = `window.__ModuleLoader__.load({
	id: "${PACKAGE_NAME}",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		/** Russian dictionaries, keyed by locale namespace. */
		const DICTIONARIES = ${JSON.stringify(table, null, 1).replace(/\n/g, '\n\t\t')};
		/** Required service: the shared locale registry. */
		const inject = ["locale"];
		/**
		* Register the Russian language and every translated namespace.
		* Failures stay local so a single bad namespace cannot break the shell.
		* @param ctx - client cordis context.
		*/
		function apply(ctx) {
			ctx.effect(() => {
				try {
					return ctx.locale.addLanguage({
						id: "ru",
						label: "Русский",
						fallback: "en"
					});
				} catch (error) {
					console.error("locale-ru: cannot register the language", error);
				}
			}, "locale-ru: language");
			for (const [ns, dict] of Object.entries(DICTIONARIES)) {
				ctx.effect(() => {
					try {
						return ctx.locale.register(ns, "ru", dict);
					} catch (error) {
						console.error("locale-ru: cannot register " + ns, error);
					}
				}, "locale-ru: " + ns);
			}
		}
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
`;

fs.writeFileSync(path.join(root, 'lib/client.js'), body);
console.log(`namespaces=${Object.keys(table).length} strings=${count}`);
if (missing.length) console.log('missing namespaces: ' + missing.join(', '));
