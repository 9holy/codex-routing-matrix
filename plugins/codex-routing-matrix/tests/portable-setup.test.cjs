'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const cli = path.join(root, 'scripts', 'portable-setup.cjs');
const templateDir = path.join(root, 'templates', 'agents');
const canonical = fs.readFileSync(path.join(root, 'references', 'ROUTING_MATRIX.md'), 'utf8').trim();
const policy = JSON.parse(fs.readFileSync(path.join(root, 'routing-policy.json'), 'utf8'));
const profileFiles = Object.values(policy.namedAgents).map((config) => config.profileFile).sort();
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cqo-portable-'));

function invoke(command, home, options = {}) {
  const args = [cli, command];
  const env = { ...process.env };
  if (options.useEnv) env.CODEX_HOME = home;
  else args.push('--codex-home', home);
  if (options.force) args.push('--force');
  const result = spawnSync(process.execPath, args, { encoding: 'utf8', env });
  let output;
  try {
    output = JSON.parse(result.stdout);
  } catch (error) {
    assert.fail(`CLI did not emit JSON (${error.message}): ${result.stdout}\n${result.stderr}`);
  }
  if (options.fail) assert.notEqual(result.status, 0, result.stdout);
  else assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.equal(fs.existsSync(path.join(home, '.codex-routing-matrix.install.lock')), false);
  return output;
}

function state(home) {
  return JSON.parse(fs.readFileSync(path.join(home, '.codex-routing-matrix.install-state.json'), 'utf8'));
}

function copyTemplate(home, file, suffix = '') {
  const agents = path.join(home, 'agents');
  fs.mkdirSync(agents, { recursive: true });
  const text = fs.readFileSync(path.join(templateDir, file), 'utf8');
  fs.writeFileSync(path.join(agents, file), `${text}${suffix}`, 'utf8');
}

function count(text, value) {
  return text.split(value).length - 1;
}

try {
  const fresh = path.join(tempRoot, 'fresh');
  fs.mkdirSync(fresh);
  const unrelatedBefore = '## User Before\n\nkeep before';
  const unrelatedAfter = '## User After\n\nkeep after';
  const staleMatrix = canonical.replace('Handle clear, low-risk short work directly', 'Handle ALL work directly');
  fs.writeFileSync(path.join(fresh, 'AGENTS.md'), `${unrelatedBefore}\n\n${staleMatrix}\n\n${unrelatedAfter}\n`);

  const installed = invoke('install', fresh);
  assert.equal(installed.verified, true);
  assert.equal(installed.verificationScope, 'profile-contracts');
  assert.equal(installed.reviewerWriteIsolation, 'NOT_VERIFIED');
  assert.equal(installed.results.length, profileFiles.length);
  assert.ok(installed.results.every((item) => item.status === 'install'));
  assert.equal(state(fresh).schemaVersion, 1);
  assert.deepEqual(Object.keys(state(fresh).profiles).sort(), profileFiles);
  for (const file of profileFiles) {
    assert.deepEqual(
      fs.readFileSync(path.join(fresh, 'agents', file)),
      fs.readFileSync(path.join(templateDir, file)),
    );
  }
  const agentsText = fs.readFileSync(path.join(fresh, 'AGENTS.md'), 'utf8');
  assert.match(agentsText, /## Meta Rule - Conflict Resolution/);
  assert.match(agentsText, /## Implementation/);
  assert.match(agentsText, /## User Before\n\nkeep before/);
  assert.match(agentsText, /## User After\n\nkeep after/);
  assert.equal(count(agentsText, canonical.match(/^## .*$/m)[0]), 1);
  assert.doesNotMatch(agentsText, /Handle ALL work directly/);

  const agentsAfterFirstInstall = fs.readFileSync(path.join(fresh, 'AGENTS.md'), 'utf8');
  const idempotent = invoke('install', fresh);
  assert.ok(idempotent.results.every((item) => item.status === 'kept'));
  assert.equal(idempotent.defaultRules.status, 'skipped');
  assert.equal(idempotent.routingMatrix.status, 'kept');
  assert.equal(fs.readFileSync(path.join(fresh, 'AGENTS.md'), 'utf8'), agentsAfterFirstInstall);
  const inspected = invoke('status', fresh, { useEnv: true });
  assert.equal(inspected.installed, true);
  assert.equal(inspected.verificationScope, 'profile-contracts');
  assert.equal(inspected.reviewerWriteIsolation, 'NOT_VERIFIED');
  assert.ok(inspected.results.every((item) => item.valid && item.contentMatches));

  const previousReviewer = [
    'name = "sol_reviewer"',
    'description = "Read-only reviewer for critical, high-risk changes."',
    'model = "gpt-6.1-sol"',
    'model_reasoning_effort = "xhigh"',
    'sandbox_mode = "read-only"',
    'developer_instructions = """',
    'Review the declared outcome against its requirements and evidence, following affected callers and state transitions. Stay within that scope; do not turn it into a whole-repo audit. Do not modify files, perform production work, make the final decision, or delegate. Report findings first with precise paths; separate verified results from unverified assumptions.',
    '"""', '',
  ].join('\n');
  const historicalReviewer = previousReviewer.replace(/^Review .+$/m, 'Review only the declared change and evidence. Do not modify files, perform production work, make the final decision, or delegate. Report findings first with precise paths; state residual risks when no issue is found.');
  const previousManagedReviewer = previousReviewer
    .replace('Read-only reviewer for critical, high-risk changes.', 'Reviewer for critical changes; no-write duties under inherited host permissions.')
    .replace('sandbox_mode = "read-only"\n', '')
    .replace('\n"""\n', '\nRead-only duties are instructions, not sandbox enforcement. Custom agents inherit host permissions; do not claim write isolation without host-level runtime evidence.\n"""\n');
  for (const [name, fixture] of [['sandboxed', previousReviewer], ['inherited', previousManagedReviewer]]) {
    for (const [ending, previous] of [['lf', fixture], ['crlf', fixture.replace(/\n/g, '\r\n')]]) {
      const home = path.join(tempRoot, `previous-reviewer-${name}-${ending}`);
      invoke('install', home);
      const reviewer = path.join(home, 'agents', 'sol-reviewer.toml');
      fs.writeFileSync(reviewer, previous, 'utf8');
      const ownership = state(home).profiles['sol-reviewer.toml'];
      const upgraded = invoke('install', home);
      const result = upgraded.results.find((item) => item.agent === 'sol_reviewer');
      assert.equal(result.status, 'refresh');
      assert.equal(fs.readFileSync(path.join(result.backup, 'sol-reviewer.toml.bak'), 'utf8'), previous);
      assert.deepEqual(state(home).profiles['sol-reviewer.toml'], ownership);
      assert.deepEqual(fs.readFileSync(reviewer), fs.readFileSync(path.join(templateDir, 'sol-reviewer.toml')));
      assert.equal(upgraded.reviewerWriteIsolation, 'NOT_VERIFIED');
      assert.equal(invoke('install', home).results.find((item) => item.agent === 'sol_reviewer').status, 'kept');
    }
  }
  const externalReviewerHome = path.join(tempRoot, 'external-reviewer');
  copyTemplate(externalReviewerHome, 'sol-reviewer.toml', '\nsandbox_mode = "read-only"\n');
  const externalReviewerFile = path.join(externalReviewerHome, 'agents', 'sol-reviewer.toml');
  fs.writeFileSync(externalReviewerFile, fs.readFileSync(externalReviewerFile, 'utf8').replace('Review the declared outcome', 'Follow my custom review conventions. Review the declared outcome'));
  const externalReviewerBefore = fs.readFileSync(externalReviewerFile);
  const externalReviewerInstall = invoke('install', externalReviewerHome);
  assert.equal(externalReviewerInstall.results.find((item) => item.agent === 'sol_reviewer').ownership, 'external');
  assert.equal(Object.hasOwn(state(externalReviewerHome).profiles, 'sol-reviewer.toml'), false);
  assert.deepEqual(fs.readFileSync(externalReviewerFile), externalReviewerBefore);
  assert.equal(externalReviewerInstall.reviewerWriteIsolation, 'NOT_VERIFIED');
  assert.equal(invoke('status', externalReviewerHome).reviewerWriteIsolation, 'NOT_VERIFIED');

  for (const [name, text] of [['known', previousReviewer], ['custom', `${previousManagedReviewer}# external custom edit\n`]]) {
    const home = path.join(tempRoot, `conflicting-sol-reviewer-${name}`);
    const agents = path.join(home, 'agents');
    fs.mkdirSync(agents, { recursive: true });
    const reviewer = path.join(agents, 'sol-reviewer.toml');
    fs.writeFileSync(reviewer, text);
    const result = invoke('install', home, { fail: true });
    assert.deepEqual(result.conflicts.map((item) => item.file), ['sol-reviewer.toml']);
    assert.equal(fs.readFileSync(reviewer, 'utf8'), text);
    assert.equal(fs.existsSync(path.join(home, '.codex-routing-matrix.install-state.json')), false);
    assert.deepEqual(fs.readdirSync(agents), ['sol-reviewer.toml']);
  }

  const conflict = path.join(tempRoot, 'conflict');
  copyTemplate(conflict, 'luna-worker.toml');
  fs.writeFileSync(path.join(conflict, 'agents', 'sol-medium-worker.toml'), 'name = "wrong"\nmodel = "wrong"\n');
  fs.writeFileSync(path.join(conflict, 'agents', 'astra-low-worker.toml'), 'name = "wrong-astra"\nmodel = "wrong"\n');
  fs.writeFileSync(path.join(conflict, 'AGENTS.md'), '## User\n\nuntouched\n');
  const conflictOutput = invoke('install', conflict, { fail: true });
  assert.deepEqual(conflictOutput.conflicts.map((item) => item.file).sort(), [
    'astra-low-worker.toml',
    'sol-medium-worker.toml',
  ]);
  assert.equal(fs.existsSync(path.join(conflict, '.codex-routing-matrix.install-state.json')), false);
  assert.equal(fs.existsSync(path.join(conflict, 'agents', 'sol-reviewer.toml')), false);
  assert.equal(fs.readFileSync(path.join(conflict, 'agents', 'astra-low-worker.toml'), 'utf8'), 'name = "wrong-astra"\nmodel = "wrong"\n');
  assert.equal(fs.readFileSync(path.join(conflict, 'AGENTS.md'), 'utf8'), '## User\n\nuntouched\n');

  const external = path.join(tempRoot, 'external');
  copyTemplate(external, 'luna-worker.toml', '\n# local compatible customization\n');
  fs.writeFileSync(path.join(external, 'AGENTS.md'), '## User\n\nexternal-only setup\n');
  const externalInstall = invoke('install', external);
  assert.equal(externalInstall.results.find((item) => item.agent === 'luna_worker').ownership, 'external');
  assert.equal(Object.hasOwn(state(external).profiles, 'luna-worker.toml'), false);
  const externalUninstall = invoke('uninstall', external);
  assert.equal(externalUninstall.results.find((item) => item.file === 'luna-worker.toml').status, 'preserved-not-owned');
  assert.match(fs.readFileSync(path.join(external, 'agents', 'luna-worker.toml'), 'utf8'), /local compatible customization/);

  const externalOnly = path.join(tempRoot, 'external-only');
  for (const file of profileFiles) copyTemplate(externalOnly, file);
  fs.writeFileSync(path.join(externalOnly, 'AGENTS.md'), '## User\n\nall profiles are external\n');
  const externalOnlyInstall = invoke('install', externalOnly);
  assert.ok(externalOnlyInstall.results.every((item) => item.ownership === 'external'));
  assert.equal(externalOnlyInstall.defaultRules.status, 'prepended');
  assert.equal(fs.existsSync(path.join(externalOnly, '.codex-routing-matrix.install-state.json')), false);
  assert.match(fs.readFileSync(path.join(externalOnly, 'AGENTS.md'), 'utf8'), /## Meta Rule - Conflict Resolution/);

  const locked = path.join(tempRoot, 'locked');
  fs.mkdirSync(locked);
  fs.writeFileSync(path.join(locked, '.codex-routing-matrix.install-state.json'), '{broken json');
  fs.writeFileSync(path.join(locked, '.codex-routing-matrix.install.lock'), 'held\n');
  const lockedRun = spawnSync(process.execPath, [cli, 'status', '--codex-home', locked], { encoding: 'utf8' });
  assert.notEqual(lockedRun.status, 0);
  assert.match(JSON.parse(lockedRun.stdout).error, /EEXIST/);
  assert.equal(fs.readFileSync(path.join(locked, '.codex-routing-matrix.install.lock'), 'utf8'), 'held\n');

  const forced = path.join(tempRoot, 'forced');
  fs.mkdirSync(path.join(forced, 'agents'), { recursive: true });
  const original = 'name = "private_luna"\nmodel = "private-model"\n';
  fs.writeFileSync(path.join(forced, 'agents', 'luna-worker.toml'), original);
  const forcedInstall = invoke('install', forced, { force: true });
  const forcedResult = forcedInstall.results.find((item) => item.agent === 'luna_worker');
  assert.equal(forcedResult.status, 'replace');
  assert.ok(fs.existsSync(forcedResult.backup));
  let forcedState = state(forced);
  let backupRelative = forcedState.profiles['luna-worker.toml'].backupFile;
  assert.match(backupRelative, /^agents\/.+\/luna-worker\.toml\.bak$/);

  const backupFile = path.resolve(forced, ...backupRelative.split('/'));
  const legacyBackup = backupFile.slice(0, -4);
  fs.renameSync(backupFile, legacyBackup);
  forcedState.profiles['luna-worker.toml'].backupFile = path.relative(forced, legacyBackup).replace(/\//g, '\\');
  fs.writeFileSync(
    path.join(forced, '.codex-routing-matrix.install-state.json'),
    `${JSON.stringify(forcedState, null, 2)}\n`,
  );
  invoke('install', forced);
  backupRelative = state(forced).profiles['luna-worker.toml'].backupFile;
  assert.equal(backupRelative.includes('\\'), false);
  assert.match(backupRelative, /luna-worker\.toml\.bak$/);
  assert.equal(fs.existsSync(legacyBackup), false);
  assert.equal(fs.existsSync(path.resolve(forced, ...backupRelative.split('/'))), true);

  const forcedUninstall = invoke('uninstall', forced);
  assert.equal(forcedUninstall.results.find((item) => item.file === 'luna-worker.toml').status, 'restored-original');
  assert.equal(fs.readFileSync(path.join(forced, 'agents', 'luna-worker.toml'), 'utf8'), original);
  assert.equal(fs.existsSync(path.join(forced, '.codex-routing-matrix.install-state.json')), false);

  const modified = path.join(tempRoot, 'modified');
  invoke('install', modified);
  const modifiedFile = path.join(modified, 'agents', 'astra-low-worker.toml');
  fs.appendFileSync(modifiedFile, '\n# user modification\n');
  const modifiedUninstall = invoke('uninstall', modified);
  assert.equal(modifiedUninstall.results.find((item) => item.file === 'astra-low-worker.toml').status, 'preserved-modified');
  assert.match(fs.readFileSync(modifiedFile, 'utf8'), /user modification/);
  assert.equal(fs.existsSync(path.join(modified, '.codex-routing-matrix.install-state.json')), false);
  for (const file of profileFiles.filter((file) => file !== 'astra-low-worker.toml')) {
    assert.equal(fs.existsSync(path.join(modified, 'agents', file)), false);
    assert.ok(fs.readdirSync(path.join(modified, 'agents')).some((name) => name.startsWith(`${file}-`)));
  }

  const legacyCreated = path.join(tempRoot, 'legacy-created');
  for (const file of profileFiles) copyTemplate(legacyCreated, file);
  const legacyStatePath = path.join(legacyCreated, '.codex-quality-orchestrator.install-state.json');
  const legacyProfiles = Object.fromEntries(profileFiles.map((file) => [file, {
    ownership: 'created',
    backupFile: null,
  }]));
  fs.writeFileSync(legacyStatePath, `${JSON.stringify({ schemaVersion: 1, profiles: legacyProfiles }, null, 2)}\n`);
  const legacyInstall = invoke('install', legacyCreated);
  assert.ok(legacyInstall.results.every((item) => item.status === 'kept'));
  assert.equal(fs.existsSync(path.join(legacyCreated, '.codex-routing-matrix.install-state.json')), true);
  const legacyUninstall = invoke('uninstall', legacyCreated);
  assert.ok(legacyUninstall.results.every((item) => item.status === 'removed'));
  assert.equal(fs.existsSync(path.join(legacyCreated, '.codex-routing-matrix.install-state.json')), false);
  assert.equal(fs.existsSync(legacyStatePath), false);
  assert.ok(legacyUninstall.legacyStateBackup);
  assert.equal(fs.existsSync(path.join(legacyUninstall.legacyStateBackup, path.basename(legacyStatePath))), true);
  const legacyStatus = invoke('status', legacyCreated);
  assert.equal(legacyStatus.stateSchemaVersion, null);
  assert.ok(legacyStatus.results.every((item) => item.ownership === 'external'));

  const freshUninstall = invoke('uninstall', fresh);
  assert.ok(freshUninstall.results.every((item) => item.status === 'removed'));
  assert.equal(fs.existsSync(path.join(fresh, '.codex-routing-matrix.install-state.json')), false);
  for (const file of profileFiles) assert.equal(fs.existsSync(path.join(fresh, 'agents', file)), false);

  const oldTerra = [
    'name = "terra_worker"',
    'description = "Bounded work with a clear task-specific advantage over Sol Medium or the current Lead."',
    'model = "gpt-5.6-terra"',
    'developer_instructions = """',
    'Handle the assigned work packet strictly within its declared scope and selected reasoning effort. In normal mode, do not delegate. In Super mode, delegate only when the packet explicitly has burst_delegate=yes and burst_depth=d1, d2, or d3; d4 never delegates. Verify every acceptance criterion; if an acceptance criterion is impossible, report it instead of guessing. Return a concise result, paths, checks, and blockers.',
    '"""', '',
  ].join('\n');
  // Exercise the same upgrade and recovery contracts through both entry points.
  for (const backend of process.platform === 'win32' ? ['portable', 'powershell'] : ['portable']) {
    const run = (command, home, fail = false) => {
      if (backend === 'portable') return invoke(command, home, { fail });
      const result = spawnSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(root, 'scripts', `${command}.ps1`), '-CodexHome', home], { encoding: 'utf8' });
      if (fail) assert.notEqual(result.status, 0, result.stdout);
      else assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    };
    const historicalTerra = oldTerra.replace(
      'Bounded work with a clear task-specific advantage over Sol Medium or the current Lead.',
      'Worker for bounded, verifiable tasks that require deeper reasoning.',
    );
    for (const [name, fixture] of [['latest', oldTerra], ['historical', historicalTerra]]) {
      for (const [ending, previous] of [['lf', fixture], ['crlf', fixture.replace(/\n/g, '\r\n')]]) {
        const home = path.join(tempRoot, `${backend}-terra-${name}-${ending}`);
        run('install', home);
        const agents = path.join(home, 'agents');
        const terra = path.join(agents, 'terra-worker.toml');
        fs.writeFileSync(terra, previous);
        const before = state(home).profiles['terra-worker.toml'];
        run('install', home);
        assert.deepEqual(fs.readFileSync(terra), fs.readFileSync(path.join(templateDir, 'terra-worker.toml')));
        assert.deepEqual(state(home).profiles['terra-worker.toml'], before);
        const backups = fs.readdirSync(agents).filter((file) => file.startsWith('terra-worker.toml-'));
        assert.equal(backups.length, 1);
        assert.equal(fs.readFileSync(path.join(agents, backups[0], 'terra-worker.toml.bak'), 'utf8'), previous);
        run('uninstall', home);
        assert.equal(fs.existsSync(terra), false);
      }
    }
    const fixedSolHome = path.join(tempRoot, `${backend}-fixed-sol-upgrade`);
    run('install', fixedSolHome);
    const fixedSolPath = path.join(fixedSolHome, 'agents', 'sol-medium-worker.toml');
    const selectableSol = fs.readFileSync(fixedSolPath, 'utf8');
    fs.writeFileSync(fixedSolPath, selectableSol
      .replace('Worker for bounded implementation and analysis; default to high, use medium for clear scoped work, xhigh for complex independent work, or max only when xhigh is expected insufficient and delegation is worthwhile.', 'Worker for bounded, independently verifiable tasks that require moderate judgment.')
      .replace('developer_instructions =', 'model_reasoning_effort = "medium"\ndeveloper_instructions ='));
    const fixedSolState = state(fixedSolHome).profiles['sol-medium-worker.toml'];
    run('install', fixedSolHome);
    assert.equal(fs.readFileSync(fixedSolPath, 'utf8'), selectableSol);
    assert.deepEqual(state(fixedSolHome).profiles['sol-medium-worker.toml'], fixedSolState);
    for (const ownership of ['created', 'replaced']) {
      const home = path.join(tempRoot, `${backend}-upgrade-${ownership}`);
      run('install', home);
      const before = state(home);
      for (const config of Object.values(policy.namedAgents).filter((config) => config.previousTemplateSha256 && config.profileFile !== 'terra-worker.toml')) {
        const target = path.join(home, 'agents', config.profileFile);
        let oldTemplate = (config.profileFile === 'sol-reviewer.toml' ? historicalReviewer : fs.readFileSync(target, 'utf8'))
          .replace('model = "gpt-6.1-sol"', 'model = "gpt-5.6-sol"')
          .replace('model = "gpt-6-luna"', 'model = "gpt-5.6-luna"');
        if (config.profileFile === 'luna-worker.toml') {
          oldTemplate = oldTemplate
            .replace('Low-risk execution of settled steps: extraction, formatting, prescribed checks and approved-pattern edits. No independent diagnosis, design or shared-state changes.', 'Worker for clear, bounded, and verifiable tasks.')
            .replace(' If the task requires an unspecified design or root-cause decision, return it to Lead before editing.', '');
        }
        if (config.profileFile === 'sol-medium-worker.toml') {
          oldTemplate = oldTemplate.replace('Worker for bounded implementation and analysis; default to high, use medium for clear scoped work, xhigh for complex independent work, or max only when xhigh is expected insufficient and delegation is worthwhile.', 'Worker for bounded, independently verifiable tasks that require moderate judgment.');
          oldTemplate = oldTemplate.replace('developer_instructions =', 'model_reasoning_effort = "medium"\ndeveloper_instructions =');
        }
        fs.writeFileSync(target, oldTemplate);
      }
      const terra = path.join(home, 'agents', 'terra-worker.toml');
      fs.writeFileSync(terra, oldTerra);
      before.profiles['terra-worker.toml'] = { ownership, backupFile: null };
      const original = 'name = "private_original"\nmodel = "private"\n';
      if (ownership === 'replaced') {
        const restoreDir = path.join(home, 'agents', 'original');
        fs.mkdirSync(restoreDir);
        for (const file of ['terra-worker.toml', 'luna-worker.toml']) {
          fs.writeFileSync(path.join(restoreDir, `${file}.bak`), original);
          before.profiles[file] = { ownership, backupFile: `agents/original/${file}.bak` };
        }
      }
      const statePath = path.join(home, '.codex-routing-matrix.install-state.json');
      fs.writeFileSync(statePath, JSON.stringify(before));
      if (ownership === 'replaced') {
        const restore = path.join(home, 'agents', 'original', 'terra-worker.toml.bak');
        const saved = fs.readFileSync(restore);
        fs.unlinkSync(restore);
        const beforeMissingBackup = fs.readFileSync(statePath);
        run('install', home, true);
        assert.deepEqual(fs.readFileSync(statePath), beforeMissingBackup);
        assert.equal(fs.readFileSync(terra, 'utf8'), oldTerra);
        fs.writeFileSync(restore, saved);
      }
      // An unrelated conflict must prevent migration and every other mutation.
      const reviewer = path.join(home, 'agents', 'sol-reviewer.toml');
      const reviewerBefore = fs.readFileSync(reviewer);
      fs.appendFileSync(reviewer, '\n# unknown customization\n');
      const stateBefore = fs.readFileSync(statePath);
      run('install', home, true);
      assert.deepEqual(fs.readFileSync(statePath), stateBefore);
      assert.equal(fs.readFileSync(terra, 'utf8'), oldTerra);
      fs.writeFileSync(reviewer, reviewerBefore);
      run('install', home);
      assert.deepEqual(state(home).profiles['terra-worker.toml'], before.profiles['terra-worker.toml']);
      for (const file of profileFiles) assert.deepEqual(fs.readFileSync(path.join(home, 'agents', file)), fs.readFileSync(path.join(templateDir, file)));
      if (ownership === 'replaced') assert.equal(state(home).profiles['luna-worker.toml'].backupFile, before.profiles['luna-worker.toml'].backupFile);
      run('uninstall', home);
      assert.equal(fs.existsSync(terra), ownership === 'replaced');
      if (ownership === 'replaced') {
        assert.equal(fs.readFileSync(terra, 'utf8'), original);
        assert.equal(fs.readFileSync(path.join(home, 'agents', 'luna-worker.toml'), 'utf8'), original);
      }
    }
    const retiredHome = path.join(tempRoot, `${backend}-absent-replaced-terra`);
    run('install', retiredHome);
    const retiredTerra = path.join(retiredHome, 'agents', 'terra-worker.toml');
    fs.unlinkSync(retiredTerra);
    const retiredState = state(retiredHome);
    const original = 'name = "original_terra"\nmodel = "private-model"\n';
    const originalDir = path.join(retiredHome, 'agents', 'original');
    fs.mkdirSync(originalDir);
    fs.writeFileSync(path.join(originalDir, 'terra-worker.toml.bak'), original);
    const originalEntry = { ownership: 'replaced', backupFile: 'agents/original/terra-worker.toml.bak' };
    retiredState.profiles['terra-worker.toml'] = originalEntry;
    fs.writeFileSync(path.join(retiredHome, '.codex-routing-matrix.install-state.json'), JSON.stringify(retiredState));
    run('install', retiredHome);
    assert.deepEqual(fs.readFileSync(retiredTerra), fs.readFileSync(path.join(templateDir, 'terra-worker.toml')));
    assert.deepEqual(state(retiredHome).profiles['terra-worker.toml'], originalEntry);
    assert.equal(fs.readFileSync(path.join(originalDir, 'terra-worker.toml.bak'), 'utf8'), original);
    run('uninstall', retiredHome);
    assert.equal(fs.readFileSync(retiredTerra, 'utf8'), original);
    assert.equal(fs.existsSync(path.join(retiredHome, '.codex-routing-matrix.install-state.json')), false);

    for (const [name, owned, previous] of [
      ['external-known', false, oldTerra],
      ['external-custom', false, `${oldTerra}# custom\n`],
      ['owned-custom', true, `${oldTerra}# custom\n`],
    ]) {
      const home = path.join(tempRoot, `${backend}-terra-conflict-${name}`);
      run('install', home);
      const terra = path.join(home, 'agents', 'terra-worker.toml');
      fs.writeFileSync(terra, previous);
      const statePath = path.join(home, '.codex-routing-matrix.install-state.json');
      const current = state(home);
      if (!owned) delete current.profiles['terra-worker.toml'];
      fs.writeFileSync(statePath, JSON.stringify(current));
      const before = fs.readFileSync(statePath);
      const agentsBefore = fs.readFileSync(path.join(home, 'AGENTS.md'));
      run('install', home, true);
      assert.deepEqual(fs.readFileSync(statePath), before);
      assert.deepEqual(fs.readFileSync(path.join(home, 'AGENTS.md')), agentsBefore);
      assert.equal(fs.readFileSync(terra, 'utf8'), previous);
    }

    const externalTerraHome = path.join(tempRoot, `${backend}-external-current-terra`);
    copyTemplate(externalTerraHome, 'terra-worker.toml');
    const externalTerra = path.join(externalTerraHome, 'agents', 'terra-worker.toml');
    const customTerra = fs.readFileSync(externalTerra, 'utf8').replace('Handle the assigned work packet', 'Follow my local conventions. Handle the assigned work packet');
    fs.writeFileSync(externalTerra, customTerra);
    run('install', externalTerraHome);
    assert.equal(Object.hasOwn(state(externalTerraHome).profiles, 'terra-worker.toml'), false);
    assert.equal(fs.readFileSync(externalTerra, 'utf8'), customTerra);
    run('uninstall', externalTerraHome);
    assert.equal(fs.readFileSync(externalTerra, 'utf8'), customTerra);
  }

  process.stdout.write('PASS portable setup install, status, recovery, preservation, and uninstall\n');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
