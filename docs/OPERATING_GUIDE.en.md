# Operating Guide

Lead means the current Astra or Sol controller. If Luna is unsupported or access is denied, Lead sends the unchanged work packet and progress to a capable Sol route at its lowest reliable effort; capacity errors retry once in the original agent context first. Quality failures return to Lead for reassessment.

## How one task runs

The current `gpt-6-astra` / `gpt-6-sol` always remains the controller. The plugin does not replace the root model or reasoning effort of a running task. It gives Lead a concise routing rule and four named agent profiles; the Sol worker uses High by default, with Medium for bounded light reasoning and XHigh for complex independent work.

Reuse a capable agent with relevant context before choosing a fresh route; only units that need a new route enter the following checks.
1. Lead first decides whether decomposition has net value. It handles short, tightly coupled, or naturally sequential work directly.
2. Before delegation, Lead freezes each unit's goal, scope, single-writer ownership, dependencies, acceptance checks, and integration order.
3. Luna Max can handle bounded work with a clear goal and sufficient context that it can reliably complete, including local analysis, implementation, debugging, and tests. Never use it as a trial route or rely on Lead to rescue a poor fit.
4. Keep the compatible `sol_medium_worker` name; select High by default for routine independent work, Medium for bounded light-reasoning work, or XHigh for complex independent work.
5. Select Astra Low only for a clear predicted quality or total-cost benefit over the suitable Sol effort or current Lead; do not presume it is stronger than Sol XHigh, and never make it an automatic escalation step.
6. Architecture, security, public interfaces, production data, irreversible operations, unclear requirements, and undiagnosed causes stay with the current Lead.
7. Every Worker result returns to Lead. Lead inspects the actual diff, reruns necessary checks in integration order, then accepts it, returns one local defect once, or takes over.

This keeps final quality judgment with Lead while assigning suitable execution to a lower-cost capable route. Reuse relevant context and compare execution, cache, handoff, review, and rework costs; never assume a cache hit. Route selection stays frozen within the current root task and is reconsidered only when the unit, boundary, availability, or result changes.

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

Setup installs the Luna, Sol (Medium/High/XHigh), Astra Low, and Sol Reviewer profiles, maintains the unnumbered `Codex Routing Matrix` section, and places one-time English `Meta Rule - Conflict Resolution` and `Implementation` defaults at the top of `AGENTS.md`. Those two defaults are not guarded and are never restored or overwritten by later installs.

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

The configuration guard is currently Windows-only. Do not run `config-guard.ps1 -Mode Install` on macOS or Linux; core routing and all four agent profiles remain supported.

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

Installation is complete only when the plugin is installed and enabled, each of the four profiles is unique, and all four Hooks are trusted. Start a new task after an upgrade so the new rules and profiles load.
