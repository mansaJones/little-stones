#!/usr/bin/env node
'use strict';
//
// Does this commit actually boot?
//
// Written after the same failure shipped three times. gameConfig.js is an append-only registry
// where every entry closes with an identical "  }," followed by a blank line. When two branches
// each add an entry at the same place, git sees identical closing lines, treats them as the same
// line, and keeps one where it needed two. The file still looks plausible -- the loss is a brace
// in the middle of a 500-line object -- and the first sign of trouble is a blank navy screen in
// production, because one SyntaxError leaves GAME_CONFIG, GAME_STORIES and getAdjustedConfig
// undefined and every scene that needs them dies.
//
// Nothing here is clever. It parses what the browser will parse, then asks whether the game
// registry is actually complete, which is the thing a merge quietly breaks.
//
// No dependencies, Node built-ins only. Exit 0 = safe to deploy. Exit 1 = do not publish.
//
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const rel = f => path.relative(ROOT, f).split(path.sep).join('/');
const problems = [];
const notes = [];
const fail = m => problems.push(m);
const ok = m => notes.push(m);

function read(f) { return fs.readFileSync(path.join(ROOT, f), 'utf8'); }
function exists(f) { return fs.existsSync(path.join(ROOT, f)); }

function walk(dir, out) {
  out = out || [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.isFile() && p.endsWith('.js')) out.push(p);
  }
  return out;
}

// ---------------------------------------------------------------- 1. does it parse
const srcFiles = walk(path.join(ROOT, 'src')).sort();
if (!srcFiles.length) fail('no .js files found under src/ -- is this the repo root?');
let parsed = 0;
for (const f of srcFiles) {
  try {
    new vm.Script(fs.readFileSync(f, 'utf8'), { filename: rel(f) });
    parsed++;
  } catch (e) {
    fail(rel(f) + ' does not parse: ' + e.message);
  }
}
ok(parsed + '/' + srcFiles.length + ' files under src/ parse');

// ---------------------------------------------------------------- 2. every script tag resolves
const html = read('index.html');
const tags = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m => m[1]);
const localTags = tags.filter(s => !/^https?:\/\//.test(s));
const missingTags = localTags.filter(s => !exists(s));
if (missingTags.length) fail('index.html loads files that do not exist: ' + missingTags.join(', '));
else ok(localTags.length + ' script tags in index.html all resolve');

// ---------------------------------------------------------------- 3. the registry, as the app sees it
// Both files are concatenated into ONE script. A top-level `const` in a classic script is
// script-scoped and never becomes a property of the global object, so running them separately --
// or reading them back off the context afterwards -- finds nothing. The epilogue runs in the same
// scope and hands the bindings out explicitly.
const EPILOGUE = `
;globalThis.__registry = {
  GAME_KEYS: typeof GAME_KEYS !== 'undefined' ? GAME_KEYS : null,
  GAME_NAMES: typeof GAME_NAMES !== 'undefined' ? GAME_NAMES : null,
  ALL_GAME_KEYS: typeof ALL_GAME_KEYS !== 'undefined' ? ALL_GAME_KEYS : null,
  RETIRED_GAME_KEYS: typeof RETIRED_GAME_KEYS !== 'undefined' ? RETIRED_GAME_KEYS : [],
  PLAYABLE_GAME_KEYS: typeof PLAYABLE_GAME_KEYS !== 'undefined' ? PLAYABLE_GAME_KEYS : null,
  GAME_CONFIG: typeof GAME_CONFIG !== 'undefined' ? GAME_CONFIG : null,
  GAME_STORIES: typeof GAME_STORIES !== 'undefined' ? GAME_STORIES : null,
  SCORE_CONFIG: typeof SCORE_CONFIG !== 'undefined' ? SCORE_CONFIG : null,
  CONFIG_KEY_MAP: typeof CONFIG_KEY_MAP !== 'undefined' ? CONFIG_KEY_MAP : null,
  getAdjustedConfig: typeof getAdjustedConfig !== 'undefined' ? getAdjustedConfig : null,
};
`;

let R = null;
try {
  const ctx = vm.createContext({ window: {}, console: { log() {}, warn() {}, error() {} } });
  vm.runInContext(read('src/utils/constants.js') + '\n' + read('src/systems/gameConfig.js') + EPILOGUE,
                  ctx, { filename: 'constants.js + gameConfig.js' });
  R = ctx.__registry;
} catch (e) {
  fail('constants.js + gameConfig.js will not run: ' + e.message);
}

if (R) {
  for (const n of ['GAME_KEYS', 'GAME_NAMES', 'ALL_GAME_KEYS', 'GAME_CONFIG', 'GAME_STORIES',
                   'CONFIG_KEY_MAP', 'getAdjustedConfig']) {
    if (!R[n]) fail(n + ' is undefined after loading constants.js and gameConfig.js');
  }
}

if (R && R.ALL_GAME_KEYS && R.GAME_CONFIG && R.GAME_STORIES && R.CONFIG_KEY_MAP) {
  const keys = R.ALL_GAME_KEYS;
  const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
  if (dupes.length) fail('ALL_GAME_KEYS lists the same game twice: ' + [...new Set(dupes)].join(', '));

  const STORY_FIELDS = ['title', 'reference', 'story', 'successMessage', 'failMessage', 'instruction'];
  const TIERS = ['easy', 'medium', 'hard'];
  let clean = 0;

  for (const k of keys) {
    const bad = [];
    if (!R.GAME_NAMES[k]) bad.push('no GAME_NAMES entry');
    const story = R.GAME_STORIES[k];
    if (!story) bad.push('no GAME_STORIES entry');
    else STORY_FIELDS.filter(f => !story[f]).forEach(f => bad.push('story is missing ' + f));

    const ck = R.CONFIG_KEY_MAP[k];
    if (!ck) bad.push('no CONFIG_KEY_MAP entry');
    else {
      const cfg = R.GAME_CONFIG[ck];
      // A nested block is the merge failure's signature: redSea ends up INSIDE
      // feedingFiveThousand, so it is no longer a top-level key and this misses it.
      if (!cfg) bad.push('CONFIG_KEY_MAP points at "' + ck + '", which is not a top-level key of GAME_CONFIG');
      else {
        TIERS.filter(t => !cfg[t]).forEach(t => bad.push('no ' + t + ' tier'));
        TIERS.filter(t => cfg[t] && !Object.keys(cfg[t]).length).forEach(t => bad.push(t + ' tier is empty'));
      }
    }
    if (!exists('src/games/' + k + '.js')) bad.push('src/games/' + k + '.js does not exist');

    // The function the scenes actually call. An empty return is how a mis-anchored insertion
    // hides: it parses, it maps, and every round silently runs on no config at all.
    if (R.getAdjustedConfig && R.CONFIG_KEY_MAP[k]) {
      for (const t of TIERS) {
        let out;
        // It takes the GAME KEY, not the config key -- it does the CONFIG_KEY_MAP lookup itself.
        try { out = R.getAdjustedConfig(k, t, {}); }
        catch (e) { bad.push('getAdjustedConfig threw on ' + t + ': ' + e.message); continue; }
        if (!out || !Object.keys(out).length) bad.push('getAdjustedConfig returns nothing for ' + t);
      }
    }

    if (bad.length) fail(k + ' -- ' + bad.join('; '));
    else clean++;
  }
  ok(clean + '/' + keys.length + ' games fully wired (name, story, config key, three live tiers)');

  const mapped = new Set(Object.values(R.CONFIG_KEY_MAP));
  const orphans = Object.keys(R.GAME_CONFIG).filter(k => !mapped.has(k));
  if (orphans.length) fail('GAME_CONFIG blocks nothing maps to: ' + orphans.join(', '));

  const unknownRetired = (R.RETIRED_GAME_KEYS || []).filter(k => !keys.includes(k));
  if (unknownRetired.length) fail('RETIRED_GAME_KEYS names games that are not in ALL_GAME_KEYS: ' + unknownRetired.join(', '));
  if (R.PLAYABLE_GAME_KEYS && !R.PLAYABLE_GAME_KEYS.length) fail('PLAYABLE_GAME_KEYS is empty -- nothing is reachable');
}

// ---------------------------------------------------------------- 4. the four lists agree
if (R && R.GAME_KEYS) {
  const fromKeys = Object.values(R.GAME_KEYS).sort();
  const onDisk = fs.readdirSync(path.join(ROOT, 'src/games')).filter(f => f.endsWith('.js'))
                   .map(f => f.replace(/\.js$/, '')).sort();
  const inHtml = localTags.filter(s => s.startsWith('src/games/'))
                   .map(s => s.replace('src/games/', '').replace(/\.js$/, '')).sort();
  const mainJs = read('src/main.js');
  const sceneBlock = (mainJs.match(/scene:\s*\[([\s\S]*?)\]/) || [, ''])[1];
  const inMain = [...sceneBlock.matchAll(/([A-Za-z0-9_]+Game)\s*,/g)].map(m => m[1]).sort();

  const cmp = (a, b, an, bn) => {
    const onlyA = a.filter(x => !b.includes(x));
    const onlyB = b.filter(x => !a.includes(x));
    if (onlyA.length) fail('in ' + an + ' but not ' + bn + ': ' + onlyA.join(', '));
    if (onlyB.length) fail('in ' + bn + ' but not ' + an + ': ' + onlyB.join(', '));
  };
  cmp(fromKeys, onDisk, 'GAME_KEYS', 'src/games/');
  cmp(fromKeys, inHtml, 'GAME_KEYS', 'index.html script tags');
  cmp(fromKeys, inMain, 'GAME_KEYS', "main.js's scene list");
  if (!problems.length || fromKeys.length === onDisk.length) {
    ok(fromKeys.length + ' games agree across GAME_KEYS, src/games/, index.html and main.js');
  }
}

// ---------------------------------------------------------------- 5. the backdrops are really there
try {
  const bd = read('src/utils/backdrop.js');
  const files = [...bd.matchAll(/file:\s*'([^']+)'/g)].map(m => m[1]);
  const gone = files.filter(f => !exists(f));
  if (gone.length) fail('backdrop.js points at missing art: ' + gone.join(', '));
  else if (files.length) ok(files.length + ' backdrop images present');
} catch (e) { /* backdrop.js is optional to this check */ }

// ---------------------------------------------------------------- verdict
console.log('');
notes.forEach(n => console.log('  ok    ' + n));
if (problems.length) {
  console.log('');
  problems.forEach(p => console.log('  FAIL  ' + p));
  console.log('\n' + problems.length + ' problem(s). Not safe to publish -- this commit would serve a blank screen.\n');
  process.exit(1);
}
console.log('\nAll checks passed.\n');
