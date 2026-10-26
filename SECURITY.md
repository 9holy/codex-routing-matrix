# Security Policy

This plugin runs local lifecycle hooks and includes installers for Codex custom-agent profiles.

- Lifecycle hooks do not access the network. They may maintain plugin mode/context state and synchronize the canonical routing section in session context. Optional Radar evidence is provided by a separate user/tool-invoked helper.
- The installer manages five TOML agent profiles, including the optional `gpt-6.1-terra` profile, the canonical `Codex Routing Matrix` section, and install ownership/backup metadata under the selected Codex home. Recognized plugin-owned Terra templates migrate to the current 6.1 model only when their recorded hashes match; custom or external conflicts remain preserved. First-install setup may also add the documented one-time defaults to `AGENTS.md`.
- Installer and profile-check `installed`, `verified`, and `PASS` results describe configuration only; they do not prove host-level write isolation.
- Conflicting profiles are not overwritten unless the user passes `-Force`; replacements are backed up first.
- Uninstall removes only plugin-owned profiles that still match the installed templates, preserves external or user-modified profiles, and restores the original backup for a replaced profile.

A reviewer's read-only duty is expressed by instructions; TOML does not guarantee a separate per-role write sandbox. Custom agents inherit host/parent-session permissions, and `sandbox_mode` in a custom-agent file does not override them. `reviewerWriteIsolation` (PowerShell `ReviewerWriteIsolation`) remains `NOT_VERIFIED` until actual host-level isolation evidence exists. Enforce hard read-only at the host/session permission boundary. This documentation change does not alter user approval settings or add a runner. See the [Codex subagents documentation](https://developers.openai.com/codex/subagents).

Report vulnerabilities through GitHub private vulnerability reporting for the repository. Do not include API keys, access tokens, or private project data in a report.
