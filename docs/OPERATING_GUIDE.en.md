# Operating Guide

Lead means the current Astra or Sol controller. If Luna is unsupported or access is denied, Lead sends the unchanged work packet and progress to a capable Sol route at its lowest reliable effort; capacity errors retry once in the original agent context first. Quality failures return to Lead for reassessment.

## How one task runs

The current `gpt-6-astra` / `gpt-6.1-sol` is the preferred controller; an already-started `gpt-6-sol` remains the controller. The plugin does not replace the root model or reasoning effort of a running task. It gives Lead a concise routing rule and five named agent profiles; the Sol worker uses High by default, Medium for clear scoped work (not only trivial or no-reasoning tasks), or XHigh for complex independent work. Favor XHigh or Lead for cross-source identity, accounting-convention, or persistence decisions. Use Max only for difficult bounded work when XHigh is expected to be insufficient and delegation has net value. `terra_worker` uses `gpt-6.1-terra` directly at XHigh or Max for supplied screen-content understanding, concise writing from provided material, and screen-driven scoped fixes; it is not a general-reasoning route or automatic fallback. Complex coding, diagnosis, accounting, architecture, and persistence stay with Sol/Lead. Select effort per unit before dispatch; do not automatically escalate or move a running unit into a warm context at another effort.

Reuse a capable agent with relevant context before choosing a fresh route; activate a completed agent that needs more work with `followup_task`, while `send_message` only sends a message and does not trigger execution. Only units that need a new route enter the following checks.
1. Lead first decides whether decomposition has net value. It handles short, tightly coupled, or naturally sequential work directly.
2. Before delegation, Lead defines the goal, scope, single-writer ownership, dependencies, acceptance and integration order, with relevant requirements, approved references and later changes. Passing tests does not prove the whole requested outcome is implemented.
3. Luna uses fixed Max only for settled, low-risk work with net delegation value: read-only extraction, formatting, prescribed checks, or code edits following Lead-approved steps. Independent diagnosis, design, and shared-state changes stay with Sol/Lead; do not use Luna as a trial route or rely on Lead to rescue a poor fit.
4. Keep the compatible `sol_medium_worker` name; select High by default for routine independent work, Medium for clear scoped work (not only trivial or no-reasoning tasks), or XHigh for complex independent work. Use Max only for difficult bounded work when XHigh is expected to be insufficient and delegation has net value.
5. Use `terra_worker` with `gpt-6.1-terra` directly at XHigh or Max for supplied screen-content understanding, concise writing from provided material, and screen-driven scoped fixes with clear inputs and acceptance. Its task-name prefix is `terra_<effort>`; it is not a general-reasoning route or automatic fallback, and complex Sol/Astra work stays on those routes.
6. Select Astra Low only for a clear predicted quality or total-cost benefit over the suitable Sol effort or current Lead; do not presume it is stronger than Sol XHigh, and never make it an automatic escalation step.
7. Lead decides architecture, security, public interfaces, production data, irreversible operations and unclear requirements. Verify unclear execution targets or environments first; repeated tool failures without new evidence return to Lead, not another model trial.
8. Lead accepts against agreed references and later changes: reconcile data identity, distinguish quota cycles from calendar windows, and keep extrapolation ratio and amount paired from one snapshot; compare actual rendered UI against references for layout and interaction. Critical review covers affected callers and state transitions before final integration checks, not an unrelated whole-repo audit or a gate on every small edit. Reuse valid checks and add only missing or invalidated ones; return a local defect once, while capability, scope or quality failures return to Lead.

This keeps final quality judgment with Lead. Among capable routes, optimize total cost and end-to-end time, including execution, context, cache, handoff, review, and rework; never assume a cache hit. Reuse relevant context and parallelize only independent, write-safe units; do not switch or redo work for a small price difference or benchmark. Keep routing frozen within the root task unless the unit, boundary, availability, or result changes.

Record time, token/cache usage and rework only when already observed. Mark missing measurements as unmeasured; do not call models or repeat work merely to produce metrics.

Astra Reviewer’s “read-only” behavior is an instruction duty, not a separate per-agent write sandbox. Custom agents inherit host/parent-session permissions; a profile’s `sandbox_mode` does not override them. Installer or profile-check `installed`, `verified`, and `PASS` results describe configuration only. `reviewerWriteIsolation` (PowerShell `ReviewerWriteIsolation`) remains `NOT_VERIFIED` until actual host-level write-isolation evidence exists; enforce hard read-only at the host/session permission boundary. The compatibility agent ID `sol_reviewer`, profile filename `sol-reviewer.toml`, and task-name prefix `sol_reviewer_xhigh` now bind to `gpt-6-astra` at fixed XHigh. See [SECURITY.md](../SECURITY.md).

## Normal mode

Normal mode is for everyday work:

- Simple work creates no subagent.
- Non-short work starts with one Worker only when delegation or parallelism has net value.
- Only independent, write-safe units run in parallel.
- Homogeneous batches verify one representative unit before adding only Workers with positive net benefit; do not fill slots for its own sake.
- While Workers run, Lead uses one long event-driven wait rather than short polling.

## Super mode

Super mode is high parallelism, not a lower quality bar. It is intended for many independent, write-safe units and supports `d1-d4` with up to 25 child threads; `d4` cannot delegate again. Actual concurrency is still limited by the active Codex host's available slots.

Toggle it for the current session:

```text
enable super mode
disable super mode
开启爆种模式
关闭爆种模式
```

At any concurrency, Lead still owns file boundaries, dependency order, actual-diff inspection, required checks, and final acceptance.

## 1M context

1M context is a global, reversible setting and is off by default:

```text
enable 1M context
disable 1M context
开启1M上下文
关闭1M上下文
```

Enabling writes these numeric values to the global `~/.codex/config.toml`; disabling restores the values that existed before enabling:

```toml
model_context_window = 1000000
model_auto_compact_token_limit = 900000
```

The settings do not hot-switch a loaded thread. Restart Codex and reopen the same task to keep its history and apply the new context settings. Leave this mode off for ordinary work.

## Failure handling

When a subagent returns this exact capacity message, the plugin continues once in the same context. It does not restart the task or redo completed work:

```text
Selected model is at capacity. Please try a different model.
```

After a second Luna capacity failure, Lead sends the same frozen packet to `sol_medium_worker` at the lowest reliable Sol effort, without redoing completed work; otherwise the current Lead takes over. Other second capacity failures also return to Lead. Capability, scope, and quality failures are never treated as capacity failures or passed through a mechanical model ladder. Current Codex Hooks cannot resume a root-controller capacity notification, so the plugin promises subagent continuation only.

## Install and upgrade

The plugin is distributed through an independent Git Marketplace and is not yet listed in OpenAI's public plugin marketplace:

```powershell
codex plugin marketplace add 9holy/codex-routing-matrix --ref main
codex plugin add codex-routing-matrix@codex-routing-matrix
```

Run setup after first install or upgrade:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$HOME\.codex\.tmp\marketplaces\codex-routing-matrix\plugins\codex-routing-matrix\scripts\install.ps1"
```

On macOS, Linux desktops, or Linux servers running Codex CLI, use:

```bash
node "$HOME/.codex/.tmp/marketplaces/codex-routing-matrix/plugins/codex-routing-matrix/scripts/portable-setup.cjs" install
```

Setup installs the Luna, Sol (Medium/High/XHigh/Max), Astra Low, Terra (XHigh/Max), and Astra Reviewer profiles, maintains the unnumbered `Codex Routing Matrix` section, and places one-time English `Meta Rule - Conflict Resolution` and `Implementation` defaults at the top of `AGENTS.md`. Those two defaults are not guarded and are never restored or overwritten by later installs.

Upgrade commands:

```powershell
codex plugin marketplace upgrade codex-routing-matrix
codex plugin add codex-routing-matrix@codex-routing-matrix
powershell -NoProfile -ExecutionPolicy Bypass -File "$HOME\.codex\.tmp\marketplaces\codex-routing-matrix\plugins\codex-routing-matrix\scripts\install.ps1"
```

For macOS or Linux upgrades, keep the first two `codex` commands and then run the Node setup command above.

When migrating from `codex-quality-orchestrator`, install the new Marketplace and run setup first. After the new plugin and its four Hooks are verified, remove the old registration:

```powershell
codex plugin remove codex-quality-orchestrator@codex-quality-orchestrator
```

The new installer reads `.codex-quality-orchestrator.install-state.json` and migrates the agent-install state without creating duplicate profiles.

## Hooks and configuration guard

Review and trust these four Hooks in `/hooks`:

| Hook | Purpose |
|---|---|
| `SessionStart` | Supplies the routing rule when it is missing from context |
| `UserPromptSubmit` | Recognizes exact Chinese and English Super mode and 1M context commands |
| `PreToolUse` | Checks that CQO named-agent calls match mechanical configuration |
| `SubagentStop` | Handles one subagent capacity continuation |

Review and trust Hooks again when an upgrade changes their content. The plugin never bypasses trust.

If Cockpit Tools, CC Switch, or another tool may replace `config.toml`, enable the configuration guard:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$HOME\.codex\.tmp\marketplaces\codex-routing-matrix\plugins\codex-routing-matrix\scripts\config-guard.ps1" -Mode Install
```

The guard restores only plugin registration and already approved current Hooks. It preserves authentication, providers, endpoints, models, and unrelated settings.

The configuration guard is currently Windows-only. Do not run `config-guard.ps1 -Mode Install` on macOS or Linux; core routing and all five agent profiles remain supported.

## Verify

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$HOME\.codex\.tmp\marketplaces\codex-routing-matrix\plugins\codex-routing-matrix\scripts\verify.ps1"
codex plugin list --json
```

On macOS or Linux, use the portable status check:

```bash
node "$HOME/.codex/.tmp/marketplaces/codex-routing-matrix/plugins/codex-routing-matrix/scripts/portable-setup.cjs" status
codex plugin list --json
```

On macOS or Linux, remove the plugin-managed agent profiles with:

```bash
node "$HOME/.codex/.tmp/marketplaces/codex-routing-matrix/plugins/codex-routing-matrix/scripts/portable-setup.cjs" uninstall
```

Installation is complete only when the plugin is installed and enabled, each of the five profiles is unique, and all four Hooks are trusted. Start a new task after an upgrade so the new rules and profiles load.
