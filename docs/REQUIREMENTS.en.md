# Requirements Baseline

Lead means the current Astra or Sol controller. If Luna is unsupported or access is denied, Lead sends the unchanged work packet and progress to a capable Sol route at its lowest reliable effort; capacity errors retry once in the original agent context first. Quality failures return to Lead for reassessment.

This file supports maintenance and regression tracking; it is not injected into model context. The unnumbered `Codex Routing Matrix` section in `references/ROUTING_MATRIX.md` is the only semantic routing rule. The routing skill applies it, while Hooks validate only observable mechanical fields.

## Quality And Routing

- Quality comes first. Among routes that can reliably complete the unit, optimize total cost and end-to-end time, including execution, context, cache, handoff, review, and rework; never assume a cache hit.
- The current Lead keeps its root model and effort and owns planning, decomposition, ownership, integration, verification, decisions, and fallback.
- Clear, low-risk short work stays with the root agent.
- Luna uses fixed Max only for settled, low-risk read-only extraction, formatting, prescribed checks, or code edits following Lead-approved steps. Independent diagnosis, design, and shared-state changes stay with Sol/Lead.
- Reuse a capable agent with relevant context before choosing a fresh route, and never assume a cache hit.
- Keep ambiguity, unresolved causes, architecture, security, public interfaces, production data, irreversible operations, and final judgment with Lead.
- When Luna is unsuitable, keep the compatible `sol_medium_worker` name; High is the default for routine independent work, Medium is for clear scoped work (not only trivial or no-reasoning tasks), and XHigh is for complex independent work. Use Max only for difficult bounded work when XHigh is expected to be insufficient and delegation has net value. Select effort per unit; do not switch or redo work for a small price difference or benchmark.
- Use `terra_worker` with `gpt-6.1-terra` directly at XHigh or Max only for supplied screen-content understanding, concise writing, or screen-driven scoped fixes with clear inputs and acceptance. It is not a general-reasoning fallback or replacement for complex Sol/Astra work.
- Select Astra Low only when its predicted quality or total-cost benefit over the suitable Sol effort or current Lead is clear. Do not presume it is stronger than Sol XHigh or use it as an automatic escalation step.
- Any optional public-benchmark/Radar lookup is advisory and limited to one total per root task; IQ or benchmark rankings never automatically select a winner. Read Radar only when capable Sol and Astra routes remain unresolved.

## Team Execution

- Define each non-short unit, goal, path ownership, dependencies, acceptance criteria, and integration order before delegation.
- Default to one Worker. Parallelize only independent, write-safe units with positive net benefit.
- For homogeneous batches, verify one representative unit, then add only Workers with positive net benefit and replace completed Workers; do not fill slots for its own sake. There is no task-wide cumulative call cap.
- Keep one writer per shared file. Workers do not delegate in normal mode. In Super mode they may delegate only with `burst_delegate=yes` and `burst_depth=d1`, `d2`, or `d3`; `d4` and reviewers never delegate.
- Use one blocking wait instead of polling.
- Lead inspects every result or diff and reruns necessary checks. One clear local defect may return once; capability, scope, or quality failure returns to Lead.

## Mechanical Contract

- `luna_worker` uses fixed Max with task label `luna_max__unit`; its scope is settled, low-risk read-only work or code edits following Lead-approved steps. `sol_medium_worker` explicitly uses `high` by default, `medium` for clear scoped work, `xhigh` for complex independent work, or `max` only for difficult bounded work when XHigh is expected to be insufficient and delegation has net value; its task labels are `sol_medium__unit`, `sol_high__unit`, `sol_xhigh__unit`, and `sol_max__unit`. `terra_worker` uses `gpt-6.1-terra` directly at XHigh or Max with task labels `terra_xhigh__unit` and `terra_max__unit` for screen and writing work. Astra Low uses Low; the read-only Astra Reviewer uses `gpt-6-astra` at fixed XHigh.
- Named agents never receive a `model` override. `task_name` exposes the expected route and effort. `fork_turns` is `none` or a positive numeric string.
- The plugin has exactly four Hooks: `SessionStart`, `UserPromptSubmit`, `PreToolUse`, and `SubagentStop`. Ordinary prompts are silent.
- On the exact selected-model-capacity message, the same subagent continues once in the same context without restarting work. After a second Luna capacity failure, Lead sends the same frozen packet to `sol_medium_worker` at the lowest reliable Sol effort; otherwise Lead takes over. Other second capacity failures return to Lead. Current Hooks cannot resume the root controller request, and the plugin must not claim otherwise.
- Super mode is session-scoped and off by default. Exact Chinese or English commands toggle it. Lead is `d0`; children may use `d1-d4`; `d4` cannot delegate; the plugin ceiling is 25 child threads, subject to host capacity; all normal quality gates remain.
- The configuration guard restores only plugin registration and trusted current Hook hashes while preserving authentication, provider, endpoint, model, and unrelated tool settings.
- First install initializes unnumbered English `Meta Rule - Conflict Resolution` and `Implementation` defaults once. Upgrades and the configuration guard never restore or overwrite them.
- The independent Git Marketplace must be added before installation. Do not claim public search availability unless OpenAI's curated Marketplace lists the plugin.
- 1M context is off by default. Exact Chinese or English commands modify only global config with numeric values, restore the previous values when disabled, and require restarting Codex before reopening the same task.

## Explicit Exclusions

- Do not change the root model or effort of a running task.
- Do not replace Lead's capability and risk judgment with keywords, file counts, or code heuristics.
- Do not treat Astra Low as an automatic escalation ladder or presume it is stronger than Sol XHigh; choose it only for a predicted benefit over the suitable Sol effort or current Lead.
- Do not route to any GPT-5 model, `codex-auto-review`, or undeclared agents.
- Do not add fixed normal-mode concurrency, task-wide attempt caps, polling, a wave ledger, or an automatic fallback chain.
- A task name, packet, test, or agent claim is not proof of the backend model that actually ran.
