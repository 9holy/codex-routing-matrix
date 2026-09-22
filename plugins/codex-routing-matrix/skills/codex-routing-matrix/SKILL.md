---
name: codex-routing-matrix
description: Install, update, or diagnose the GPT-6 routing plugin and its agent profiles.
---

# Codex Routing Matrix

1. Treat `../../references/ROUTING_MATRIX.md` as the sole semantic routing rule and `../../routing-policy.json` as the mechanical contract.
2. Check installed/enabled state with `codex plugin list --json`, current Hook trust, and unique profiles in `~/.codex/agents`. These are prerequisites, not proof of runtime dispatch.
3. Back up files as required before changes. Run checks relevant to changed behavior. For release run `../../scripts/package.ps1` once; it includes source and archive verification. After installation run `../../scripts/runtime-smoke.ps1`; report unverified Hooks separately.
4. Use `../../scripts/install.ps1` to install agent profiles and the unnumbered `Codex Routing Matrix` section. The two first-install default rules are not guarded. When another program may replace `config.toml`, use `../../scripts/config-guard.ps1`; it may merge only this plugin's registration and current Hook trust.
5. A task name, work-packet text, unit test, or subagent claim alone is not evidence that the requested model actually ran.
