'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const pluginRoot = path.resolve(__dirname, '..');
const hookPath = path.join(pluginRoot, 'hooks', 'enforce-agent-routing.cjs');
const templateDir = path.join(pluginRoot, 'templates', 'agents');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cqo-routing-'));
const codexHome = path.join(tempRoot, '.codex');
const agentsDir = path.join(codexHome, 'agents');
let invocation = 0;

function installProfiles() {
  fs.mkdirSync(agentsDir, { recursive: true });
  for (const file of fs.readdirSync(templateDir)) {
    if (file.endsWith('.toml')) fs.copyFileSync(path.join(templateDir, file), path.join(agentsDir, file));
  }
}

function payload(input, toolName = 'collaborationspawn_agent') {
  invocation += 1;
  return JSON.stringify({
    session_id: `session-${invocation}`,
    tool_use_id: `tool-${invocation}`,
    tool_name: toolName,
    tool_input: input,
  });
}

function invoke(input, options = {}) {
  const result = spawnSync(process.execPath, [hookPath], {
    input: options.raw ?? payload(input, options.toolName),
    encoding: 'utf8',
    env: { ...process.env, CODEX_HOME: codexHome },
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function expectAllow(name, input, options) {
  assert.equal(invoke(input, options), '', `${name} should be allowed`);
}

function expectDeny(name, input, options) {
  const output = invoke(input, options);
  assert.notEqual(output, '', `${name} should be denied`);
  assert.equal(JSON.parse(output).hookSpecificOutput.permissionDecision, 'deny');
}

function label(agentType, effort) {
  if (agentType === 'luna_worker') return 'luna_max';
  if (agentType === 'sol_medium_worker') return `sol_${effort}`;
  if (agentType === 'astra_low_worker') return 'astra_low';
  return 'sol_reviewer_xhigh';
}

function workerInput(agentType, overrides = {}) {
  const effort = overrides.reasoning_effort ?? (
    agentType === 'luna_worker' ? 'max' :
      agentType === 'sol_medium_worker' ? 'medium' : 'xhigh'
  );
  const input = {
    agent_type: agentType,
    fork_turns: 'none',
    task_name: `${label(agentType, effort)}__unit_${invocation + 1}`,
    message: 'gAAAA-host-encrypted-subagent-message',
    ...(agentType === 'sol_medium_worker' ? { reasoning_effort: effort } : {}),
    ...overrides,
  };
  return input;
}

try {
  installProfiles();

  expectAllow('luna-max', workerInput('luna_worker'));
  expectAllow('sol-medium', workerInput('sol_medium_worker'));
  expectAllow('sol-high', workerInput('sol_medium_worker', { reasoning_effort: 'high' }));
  expectDeny('sol-high-wrong-label', workerInput('sol_medium_worker', { reasoning_effort: 'high', task_name: 'sol_medium__wrong_effort' }));
  expectAllow('sol-xhigh', workerInput('sol_medium_worker', { reasoning_effort: 'xhigh' }));
  expectAllow('sol-max', workerInput('sol_medium_worker', { reasoning_effort: 'max' }));
  expectDeny('sol-max-wrong-label', workerInput('sol_medium_worker', { reasoning_effort: 'max', task_name: 'sol_xhigh__wrong_effort' }));
  expectDeny('sol-missing-effort', workerInput('sol_medium_worker', { reasoning_effort: undefined }));
  expectDeny('sol-medium-wrong-label', workerInput('sol_medium_worker', { task_name: 'sol_xhigh__wrong_effort' }));
  expectDeny('sol-xhigh-wrong-label', workerInput('sol_medium_worker', { reasoning_effort: 'xhigh', task_name: 'sol_medium__wrong_effort' }));
  expectAllow('astra-low', workerInput('astra_low_worker'));
  expectDeny('astra-effort-override', workerInput('astra_low_worker', { reasoning_effort: 'medium' }));
  expectDeny('astra-wrong-label', workerInput('astra_low_worker', { task_name: 'sol_medium__wrong_label' }));
  expectAllow('reviewer-xhigh', workerInput('sol_reviewer'));
  expectAllow('positive-fork', workerInput('luna_worker', { fork_turns: '2' }));
  for (const depth of [1, 2, 3, 4]) {
    expectAllow(`burst-d${depth}`, workerInput('luna_worker', {
      task_name: `luna_max__d${depth}_unit`,
      message: `[CQO_WORK_PACKET_V1]\nburst_depth=d${depth}\nburst_delegate=yes`,
    }));
  }
  expectAllow('dotted-tool-name', workerInput('luna_worker'), { toolName: 'collaboration.spawn_agent' });
  expectAllow('double-bom', null, { raw: `\uFEFF\uFEFF${payload(workerInput('luna_worker'))}` });

  expectAllow('unrelated-named-agent', {
    agent_type: 'default', fork_turns: 'all', task_name: 'other_task', message: 'other skill',
  });
  expectAllow('unrelated-bare-model', {
    model: 'gpt-6-astra', reasoning_effort: 'high', fork_turns: '1', message: 'other skill',
  });
  expectAllow('unrelated-tool', workerInput('luna_worker'), { toolName: 'read_file' });

  expectDeny('missing-message', workerInput('luna_worker', { message: '' }));
  expectDeny('missing-fork', workerInput('luna_worker', { fork_turns: undefined }));
  expectDeny('fork-all', workerInput('luna_worker', { fork_turns: 'all' }));
  expectDeny('model-override', workerInput('luna_worker', { model: 'gpt-6-luna' }));
  expectDeny('luna-effort-override', workerInput('luna_worker', { reasoning_effort: 'xhigh' }));
  for (const effort of ['low', 'ultra', '', null]) {
    expectDeny(`sol-invalid-effort-${effort}`, workerInput('sol_medium_worker', { reasoning_effort: effort }));
  }
  expectDeny('reviewer-effort-override', workerInput('sol_reviewer', { reasoning_effort: 'max' }));
  expectDeny('bad-task-name', workerInput('luna_worker', { task_name: 'plain_name' }));
  expectDeny('burst-missing-depth', workerInput('luna_worker', {
    task_name: 'luna_max__d2_unit', message: 'burst_delegate=yes',
  }));
  expectDeny('burst-wrong-depth', workerInput('luna_worker', {
    task_name: 'luna_max__d3_unit', message: 'burst_depth=d2\nburst_delegate=yes',
  }));
  expectDeny('normal-with-burst-fields', workerInput('luna_worker', {
    task_name: 'luna_max__normal_unit', message: 'burst_depth=d1\nburst_delegate=yes',
  }));
  expectDeny('d4-delegates', workerInput('luna_worker', {
    task_name: 'luna_max__d4_unit', message: 'burst_depth=d4\nburst_delegate=yes\n调用 spawn_agent',
  }));
  expectDeny('wrong-task-route', workerInput('sol_medium_worker', {
    task_name: 'luna_max__wrong_route',
  }));

  const duplicate = workerInput('luna_worker', { task_name: 'luna_max__repeatable_unit' });
  expectAllow('first-same-name', duplicate);
  expectAllow('second-same-name', duplicate);

  fs.rmSync(path.join(agentsDir, 'luna-worker.toml'));
  expectDeny('missing-profile', workerInput('luna_worker'));
  installProfiles();
  const lunaPath = path.join(agentsDir, 'luna-worker.toml');
  fs.writeFileSync(lunaPath, fs.readFileSync(lunaPath, 'utf8').replace('gpt-6-luna', 'gpt-5.6-luna'));
  expectDeny('old-generation-profile', workerInput('luna_worker'));
  installProfiles();

  const solPath = path.join(agentsDir, 'sol-medium-worker.toml');
  fs.appendFileSync(solPath, '\nmodel_reasoning_effort = "medium"\n');
  expectDeny('sol-pinned-profile', workerInput('sol_medium_worker'));
  installProfiles();

  fs.writeFileSync(path.join(codexHome, 'AGENTS.md'), '## User Project Rule\n');
  expectAllow('rule-text-does-not-block', workerInput('luna_worker'));
  expectDeny('invalid-json', null, { raw: '{not-json' });

  process.stdout.write('PASS CQO-only visible routing contract and unrelated-agent pass-through\n');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
