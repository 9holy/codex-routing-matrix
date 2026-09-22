'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const repoRoot = path.resolve(root, '..', '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const rule = read('references/ROUTING_MATRIX.md');
const skill = read('skills/codex-quality-routing-team/SKILL.md');
assert.match(rule, /`gpt-6-astra` or `gpt-6-sol` root/);
assert.match(skill, /`gpt-6-astra` or `gpt-6-sol` root/);
for (const text of [rule, skill]) assert.doesNotMatch(text, /gpt-5(?:\.\d+|-[a-z])[\w.-]*/i);
assert.match(rule, /unsupported, access denied, or capacity fails twice/);
assert.match(rule, /unchanged packet and progress to capable `sol_medium_worker`/);

for (const required of [
  'MUST choose `luna_worker`',
  'Never trial uncertain work on Luna',
  'use `sol_medium_worker`',
  'default to `high`; choose `medium` for clear, light-reasoning work or `xhigh` for complex independent work',
  'Select `astra_low_worker` only for a clear quality or total-cost benefit',
  'Choose upfront, not through an escalation ladder',
  'Use Radar once at most per root task',
  'Freeze each route',
  'Selected model is at capacity. Please try a different model.',
  'never switch silently',
  'Preserve the root model and reasoning effort',
]) assert.match(rule, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

for (const forbidden of [
  /high-risk work is never short/i,
  /if Luna is unsuitable, dispatch/i,
  /trial-dispatch uncertainty is allowed/i,
]) assert.doesNotMatch(rule, forbidden);

assert.ok(rule.indexOf('MUST choose `luna_worker`') < rule.indexOf('When Luna is unsuitable'));
assert.match(rule, /All named profiles may run as subagents/);
assert.match(rule, /In normal mode, Workers do not delegate/);
assert.match(rule, /Super mode, a Worker may delegate only when the packet explicitly authorizes it at `d1-d3`/);
assert.doesNotMatch(rule, /The only Lead subagents are/);
for (const field of ['allowed paths and single-writer owner', 'dependencies', 'acceptance', 'integration order']) {
  assert.match(skill, new RegExp(field));
}
assert.match(skill, /run `node \.\.\/\.\.\/scripts\/radar-routing-evidence\.cjs` once/);
assert.match(skill, /do not run it again/);
assert.match(skill, /Freeze the selected route/);
assert.match(skill, /fallback: current Lead; preserve completed work/);

const docsRoot = path.join(repoRoot, 'docs');
const docPaths = [
  path.join(repoRoot, 'README.md'),
  path.join(docsRoot, 'ROUTING_MATRIX.md'),
  path.join(docsRoot, 'OPERATING_GUIDE.md'),
  path.join(docsRoot, 'REQUIREMENTS.md'),
];
if (docPaths.every((file) => fs.existsSync(file))) {
  const [readme, matrix, guide, requirements] = docPaths.map((file) => fs.readFileSync(file, 'utf8'));
  for (const document of [readme, matrix, guide]) {
    assert.match(document, /Luna/);
    assert.match(document, /Astra Low/);
    assert.doesNotMatch(document, /gpt-5(?:\.\d+|-[a-z])[\w.-]*|terra_worker/i);
    assert.match(document, /Lead/);
  }
  for (const document of [readme, matrix, guide]) {
    assert.match(document, /Sol/);
    assert.match(document, /[Xx][Hh]igh/);
  }
  assert.match(matrix, /路由确定后冻结/);
  assert.match(guide, /路由选择在当前根任务内冻结/);
  for (const id of [
    'Q01', 'Q02', 'Q03', 'Q04', 'Q05', 'Q06', 'Q07', 'Q08', 'Q09', 'Q10', 'Q11',
    'T01', 'T02', 'T03', 'T04', 'T05', 'T06', 'T07',
    'M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08',
  ]) assert.match(requirements, new RegExp(`\\| ${id} \\|`));
}

assert.ok(Buffer.from(skill).every((byte) => byte < 128));
assert.ok(Buffer.byteLength(rule, 'utf8') < 3200);
assert.ok(Buffer.byteLength(skill, 'utf8') < 3400);

process.stdout.write('PASS routing semantics and reference-derived plan contract\n');
