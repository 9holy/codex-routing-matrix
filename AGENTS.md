# Codex Routing Matrix Maintenance

- Routing decisions live in `plugins/codex-routing-matrix/references/ROUTING_MATRIX.md`; the skill specifies invocation and `routing-policy.json` specifies mechanical contracts. Keep each concern in one place.
- Use only `gpt-6-astra`, `gpt-6-sol`, and `gpt-6-luna`. Keep the current Astra/Sol Lead and its chosen effort. Luna uses Max; `sol_medium_worker` keeps its compatible name and explicitly selects High by default, Medium for bounded light work, or XHigh for complex independent work; Astra Low is selective; Sol Reviewer stays read-only XHigh.
- Write concise outcome and boundary instructions. Read relevant context and run sufficient checks without forcing unrelated reads or tests.
- Preserve quality-first, minimum-total-cost routing: reuse capable agents with relevant context; Luna Max for bounded work it can reliably complete, including analysis, implementation, debugging, and tests. Never use Luna as a trial or rely on Lead to rescue poor fit. Use Sol High by default, Medium for bounded light work, or XHigh for complex independent work; select Astra Low only for a clear quality or total-cost benefit, not by assuming it is stronger than Sol XHigh. Choose the route upfront; never build an automatic model escalation ladder.
- Keep normal delegation proportional to useful independent work. Preserve Super mode's four levels, 25-child ceiling, capacity continuation and installation recovery.
- Run focused checks after edits. For release, run `scripts/package.ps1` under the plugin once; it already verifies source and extracted archive. Do not precede it with the same full suite.
- Treat static prompt checks as contract checks, not proof of model quality or real dispatch. Report runtime checks separately.
- Do not edit plugin caches directly or stage local marketplace installation metadata. Install from the updated source using the supported plugin workflow.
