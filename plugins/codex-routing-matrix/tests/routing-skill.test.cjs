'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const skillRoot = path.join(root, 'skills', 'codex-quality-routing-team');
const skill = fs.readFileSync(path.join(skillRoot, 'SKILL.md'), 'utf8');
const rule = fs.readFileSync(path.join(root, 'references', 'ROUTING_MATRIX.md'), 'utf8');
const metadata = fs.readFileSync(path.join(skillRoot, 'agents', 'openai.yaml'), 'utf8');
const policy = JSON.parse(fs.readFileSync(path.join(root, 'routing-policy.json'), 'utf8'));

for (const relative of ['references/ROUTING_MATRIX.md', 'routing-policy.json', 'scripts/radar-routing-evidence.cjs']) {
  assert.ok(fs.existsSync(path.join(root, relative)), relative);
}
for (const route of ['luna_max', 'sol_medium', 'sol_high', 'sol_xhigh', 'sol_max', 'astra_low', 'sol_reviewer_xhigh']) {
  assert.match(route + '__unit', new RegExp(policy.workPacket.hostVisibleTaskNamePattern));
}
for (const route of ['terra_xhigh', 'terra_max', 'terra_ultra']) {
  assert.doesNotMatch(route + '__unit', new RegExp(policy.workPacket.hostVisibleTaskNamePattern));
}
for (const text of [skill, rule, metadata]) assert.doesNotMatch(text, /gpt-5(?:\.\d+|-[a-z])[\w.-]*|terra_worker/i);
assert.match(skill, /\[CQO_WORK_PACKET_V1\]/);
for (const field of ['route:', 'goal:', 'scope:', 'acceptance:', 'fallback:']) assert.ok(skill.includes(field));
assert.match(rule, /Reuse a capable agent with relevant context/);
assert.match(rule, /Never assume cache hits/);
assert.match(rule, /not through an escalation ladder/);
assert.match(rule, /Size concurrency to useful work, not host capacity/);
assert.match(rule, /MUST choose `luna_worker`/);
assert.match(rule, /use `sol_medium_worker`/);
assert.match(rule, /Select `astra_low_worker` only/);
assert.match(rule, /depths `d1-d4`/);
assert.match(rule, /up to 25 child threads/);
assert.match(skill, /Never pass `model`/);
assert.match(skill, /reasoning_effort:"high"/);
assert.match(rule, /local analysis, implementation, debugging and tests/);
assert.doesNotMatch(rule, /low-judgment, mechanically verifiable/);
assert.match(metadata, /allow_implicit_invocation: true/);
assert.ok(Buffer.from(skill).every((byte) => byte < 128));
assert.ok(Buffer.byteLength(skill, 'utf8') < 3400);
assert.ok(Buffer.byteLength(rule, 'utf8') < 3200);
process.stdout.write('PASS routing references, named routes and cost constraints\n');
