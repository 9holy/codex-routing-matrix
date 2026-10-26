# Astra XHigh Reviewer

## Outcome

The user confirmed replacing the Sol reviewer with `gpt-6-astra` at fixed `xhigh`. Lead model selection and all worker routes remain unchanged. The compatibility identifiers `sol_reviewer`, `sol-reviewer.toml`, and `sol_reviewer_xhigh` are intentionally retained. Reviewer duties still prohibit writing, production work, final decisions, and delegation.

The user explicitly declined changing burst-mode activation enforcement or implementing the 25-child counter. Neither mechanism was changed. Capacity/fallback rules and host permissions were also retained.

## Applied State

- Source repository: `C:/Users/Administrator/.codex/.tmp/marketplaces/codex-routing-matrix`, based on HEAD `24fe5bcb735b6e0a47c91a995e9c0420acde2b27` with all pre-existing local changes retained.
- Installed version: `0.9.1+codex.20261025234959`.
- Installed profile: `C:/Users/Administrator/.codex/agents/sol-reviewer.toml`.
- Policy, source template, installed template, cache template, and global routing rule agree on Astra XHigh.
- Three worker profiles, main `config.toml`, and installation ownership state were verified unchanged. The current Lead configuration remains `gpt-6-astra` / `ultra`.
- No source staging, commit, or GitHub push was performed.

## Validation

Source and extracted-package verification passed, including profile/model/effort checks, routing contracts, both installer entry points, migration backups, compatible external-profile preservation, incompatible external-profile rejection, uninstall recovery, and config-guard tests. Previous managed Sol templates are recognized by verified LF/CRLF hashes. Unknown custom profiles retain the existing conflict behavior.

The first package attempt exposed missing prior-template migration hashes. They were verified against Git history and actual installation backups before inclusion. The next attempt exposed a pre-existing Windows test-runner dependency on unavailable `pwsh`; its Windows-only branch now uses the documented built-in `powershell.exe` entry point. The existing external `workspace-write` compatibility test was retained. Final package verification passed without weakening these assertions.

The host refreshed the `sol_reviewer` tool definition to `gpt-6-astra` / `xhigh`. A fresh named reviewer dispatch completed a read-only acceptance check with no actionable findings. This establishes the loaded role configuration and successful task execution; model self-description is not treated as independent server-model evidence.

The supported runtime smoke reported installed/enabled and `SessionStartHookTrust=PASS`, `SessionStart=PASS`. Its separate CLI model probe exited 1 and reported `ModelProbe=UNAVAILABLE`; its internal captured model error was not retained by the existing script, so no cause is asserted. `PreToolUseHookTrust` and reviewer host-level write isolation remain `NOT_VERIFIED`. The pre-existing config guard was installed but not watching/healthy; it was not started or otherwise changed during this task.

## Source And Recovery

- Maintained Git source: `C:/Users/Administrator/.codex/.tmp/marketplaces/codex-routing-matrix`.
- Installer-managed previous reviewer: `C:/Users/Administrator/.codex/agents/sol-reviewer.toml-20261026-002854140/sol-reviewer.toml.bak`.
- Global routing-rule backup: `C:/Users/Administrator/.codex/AGENTS.md-20261026-002854158/AGENTS.md`.

The user requested source-only cleanup on 2026-10-26. All 51 tracked files and the handoff in the isolated checkout were verified byte-identical to the maintained source before the duplicate checkout was removed. Generated ZIPs, test logs, temporary source snapshots, and duplicate pre-install backups were removed after verification. The validation outcomes and limitations are retained above. Tests, maintenance/evaluation documentation, Git metadata, installed runtime files, and installer-required recovery files remain.

The original untracked maintenance/evaluation files were not overwritten. Future marketplace updates must preserve the local source changes until they are intentionally published.
