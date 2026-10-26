'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const repoRoot = path.resolve(root, '..', '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const rule = read('references/ROUTING_MATRIX.md');
const skill = read('skills/codex-quality-routing-team/SKILL.md');
assert.match(rule, /`gpt-6-astra`, `gpt-6\.1-sol`, or `gpt-6-sol` root/);
assert.match(skill, /`gpt-6-astra`, `gpt-6\.1-sol`, or `gpt-6-sol` root/);
for (const text of [rule, skill]) assert.doesNotMatch(text, /gpt-5(?:\.\d+|-[a-z])[\w.-]*/i);
assert.match(rule, /unsupported, access denied, or capacity fails twice/);
assert.match(rule, /unchanged packet and progress to capable `sol_medium_worker`/);

for (const required of [
  'MUST choose `luna_worker`',
  'Never trial uncertain work on Luna',
  'use `sol_medium_worker`',
  'default `high`; `medium` for clear scope or `xhigh` for complex work',
  'Luna stays at `max`',
  'Select `astra_low_worker` only for a clear quality/cost benefit',
  'Choose upfront, not through an escalation ladder',
  'Cross-source identity, accounting and persistence favor XHigh or Lead',
  'verify user outcomes, not test counts or nonempty screens',
  'Workers own their checks',
  'Verify unclear targets and environments before delegation',
  'Check references and later changes',
  'repeated tool failures without new evidence',
  'critical workflows and state transitions before final integration checks',
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
assert.match(rule, /Normal Workers do not delegate/);
assert.match(rule, /Super Workers need explicit `d1-d3` authorization/);
assert.doesNotMatch(rule, /The only Lead subagents are/);
for (const field of ['allowed paths and single-writer owner', 'dependencies', 'acceptance', 'integration order']) {
  assert.match(skill, new RegExp(field));
}
assert.match(skill, /run `node \.\.\/\.\.\/scripts\/radar-routing-evidence\.cjs` once/);
assert.match(skill, /do not run it again/);
assert.match(skill, /Freeze the selected route/);
assert.match(skill, /fallback: current Lead; preserve completed work/);
assert.match(skill, /Resume a completed agent with `followup_task`/);
assert.match(skill, /`send_message` alone does not resume it/);
assert.match(skill, /approved references and later changes/);
assert.match(skill, /when already available/);
assert.match(skill, /never invent measurements or run extra work just to obtain them/);
const reviewer = read('templates/agents/sol-reviewer.toml');
assert.match(reviewer, /^model = "gpt-6-astra"$/m);
assert.match(reviewer, /^model_reasoning_effort = "xhigh"$/m);
assert.match(reviewer, /following affected callers and state transitions/);
assert.match(reviewer, /do not turn it into a whole-repo audit/);
assert.match(reviewer, /separate verified results from unverified assumptions/);
const terra = read('templates/agents/terra-worker.toml');
assert.match(terra, /^model = "gpt-6\.1-terra"$/m);
assert.doesNotMatch(terra, /^model_reasoning_effort\s*=/m);
assert.match(terra, /Return unclear identity, accounting-window, persistence or architectural decisions to Lead/);
const terraRule = rule.split('\n').find((line) => line.includes('`terra_worker`'));
assert.ok(terraRule);
for (const concept of [/bounded/i, /visual/i, /computer-use/i, /writing/i, /scoped.*fix/i, /optional/i, /`xhigh`/, /`max`/, /not a replacement/i]) {
  assert.match(terraRule, concept);
}
assert.match(skill, /For `terra_worker`, pass `reasoning_effort:"xhigh"` or `"max"` only/);

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
    assert.doesNotMatch(document, /gpt-5(?:\.\d+|-[a-z])[\w.-]*/i);
    assert.match(document, /Terra/);
    assert.match(document, /gpt-6\.1-terra/);
    assert.match(document, /Lead/);
  }
  for (const document of [readme, matrix, guide]) {
    assert.match(document, /Sol/);
    assert.match(document, /[Xx][Hh]igh/);
  }
  assert.match(matrix, /路由确定后冻结/);
  assert.match(guide, /路由(?:选择)?在当前根任务内冻结/);
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
