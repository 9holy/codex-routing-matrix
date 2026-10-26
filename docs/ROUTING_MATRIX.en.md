# Routing Matrix

References: [OpenAI GPT-6 guidance](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra), [Astra skills and prompts](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra), [GPT-6.1 Terra model](https://developers.openai.com/api/docs/models/gpt-6.1-terra), and [model-selection guidance](https://developers.openai.com/api/docs/guides/model-selection). Match capability to the task; public benchmarks do not replace acceptance checks. Terra's API supports none/low/medium/high/xhigh/max; this plugin routes only xhigh/max and does not use none, low, medium, high, or ultra as Terra routing efforts.

Lead means the current Astra or Sol controller. If Luna is unsupported or access is denied, Lead sends the unchanged work packet and progress to a capable Sol route at its lowest reliable effort; capacity errors retry once in the original agent context first. Quality failures return to Lead for reassessment.

## Core rule

The current `gpt-6-astra` / `gpt-6.1-sol` is the preferred controller; an already-started `gpt-6-sol` controller remains supported. The controller owns understanding, decomposition, delegation, integration, acceptance, and fallback. The plugin preserves the controller reasoning effort selected when the task starts and does not switch the root effort during a running task.

Reuse a capable agent with relevant context before choosing a fresh route; for a unit that needs a new route, choose routes in this order:

1. Keep short or tightly coupled work on the current Lead.
2. Luna uses fixed Max only for settled, low-risk units with net delegation value: read-only extraction, formatting, prescribed checks, or code edits following Lead-approved steps. Independent diagnosis, design, and shared-state changes stay with Sol/Lead; short code or existing tests alone do not qualify.
3. Keep the compatible `sol_medium_worker` name. Select High by default for routine independent work, Medium for clear scoped work (not only trivial or no-reasoning tasks), or XHigh for complex independent work. Favor XHigh or Lead for cross-source identity, accounting-convention, or persistence decisions. Use Max only for difficult bounded work when XHigh is expected to be insufficient and delegation has net value.
4. Use `terra_worker` with `gpt-6.1-terra` at `xhigh` or `max` directly for supplied screen-content understanding, concise writing from provided material, and screen-driven scoped fixes with clear inputs and acceptance. It is not a general-reasoning route: complex coding, diagnosis, accounting, architecture, and persistence decisions stay with Sol/Lead. Its task-name prefix is `terra_<effort>` and it is not an automatic fallback or replacement for Astra review.
5. Select Astra Low only when its predicted quality or total-cost benefit over the suitable Sol effort or current Lead is clear; do not presume it is stronger than Sol XHigh or make it an automatic escalation step.
6. Keep coupled, sequential, or delegation-negative work on the current Lead.
7. Add one read-only Astra Reviewer when a critical high-risk change needs independent review.
8. The current Lead inspects actual changes, reruns necessary checks, and makes the final decision.

## Controller efforts

| Root effort | Intended use |
|---|---|
| `low` | Clear, bounded work that does not need deeper reasoning |
| `medium` | Routine planning, decomposition, integration, and bounded direct work |
| `high` | Careful checking without a complex-reasoning upgrade |
| `xhigh` | Complex planning, cross-module integration, and strict acceptance |
| `max` | Difficult, high-risk, architectural, or critical decisions |

## Worker selection

| Agent | Model | Effort | Select when |
|---|---|---|---|
| `luna_worker` | `gpt-6-luna` | fixed `max` | Low-risk read-only extraction, formatting, prescribed checks, or code edits following Lead-approved steps; no independent diagnosis, design, or shared-state changes |
| `sol_medium_worker` | `gpt-6.1-sol` | `high` by default; `medium`, `xhigh`, or `max` selectable | High for routine independent work; Medium for clear scoped work, not only trivial tasks; XHigh for complex independent work; Max only for difficult bounded work when XHigh is expected to be insufficient and delegation has net value |
| `astra_low_worker` | `gpt-6-astra` | `low` | Bounded work with a clear predicted quality or total-cost benefit over the suitable Sol effort or current Lead; not presumed stronger than Sol XHigh |
| `terra_worker` | `gpt-6.1-terra` | direct `xhigh`/`max` | Supplied screen-content understanding, concise writing, and screen-driven scoped fixes; not a general-reasoning route or automatic fallback, and not a replacement for complex Sol/Astra work |
| `sol_reviewer` | `gpt-6-astra` | fixed `xhigh` | One independent read-only review for a critical high-risk change |

Workers stay inside packet scope and make no unrelated changes. Workers do not delegate in normal mode. In Super mode, further delegation requires `burst_delegate=yes` and `burst_depth=d1`, `d2`, or `d3`; `d4` and reviewers never delegate. Every shared file has one writer.

## Quality and cost

- Quality first; among capable routes, optimize total cost and end-to-end time, including context, handoff, review, and rework.
- Judge Luna fit from actual outcomes on comparable tasks; never use it as a trial route or rely on Lead to rescue a poor fit.
- Any optional public-benchmark/Radar lookup is advisory and limited to one total per root task; IQ or benchmark rankings never automatically select a winner. Read Radar only when capable Sol and Astra routes remain unresolved.
- Reuse a capable agent with relevant context; parallelize only independent, write-safe units. Do not switch or redo work for a small price difference or benchmark. One read-only sample favored XHigh; the implementation sample used less time and fewer tokens with Max, and both missed a toolchain boundary. That evidence does not establish a universal effort winner.
- Freeze the selected route. Reconsider only when the unit, boundary, availability, or result changes.
- Packets include relevant requirements, approved references and later changes. Lead accepts actual outcomes: reconcile data identity, distinguish quota cycles from calendar windows, and keep extrapolation ratio and amount paired from one snapshot; compare actual rendered UI against references for layout and interaction. Critical review covers affected callers and state transitions before final integration checks, not an unrelated whole-repo audit or a gate on small edits.
- No comparative Terra evaluation evidence exists for this plugin; do not infer that Terra is faster, cheaper, or better from existing Luna, Sol, or Astra results.
- Lead verifies unclear execution targets or environments first. Repeated tool failures without new evidence return to Lead, not another model trial. Record time, token/cache usage and rework only when already observed; do not add calls or repeat work merely to produce metrics.

## Parallelism and waiting

Parallelize independent, write-safe units when the benefit exceeds coordination cost. Use only as many Workers as useful work warrants; keep related follow-ups with the same capable Worker.

Super mode supports `d1-d4` and up to 25 child threads; `d4` cannot delegate. Twenty-five is the plugin ceiling, not a guarantee that the host exposes 25 simultaneous slots. While Workers run, use one long blocking wait that wakes early on results instead of short polling.

## Dispatch contract

```text
luna_worker: agent_type + task_name(luna_max__unit) + fork_turns
sol_medium_worker: agent_type + reasoning_effort(medium|high|xhigh|max) + task_name(sol_medium__unit|sol_high__unit|sol_xhigh__unit|sol_max__unit) + fork_turns
terra_worker: agent_type + reasoning_effort(xhigh|max) + task_name(terra_xhigh__unit|terra_max__unit) + fork_turns
astra_low_worker: agent_type + task_name(astra_low__unit) + fork_turns
sol_reviewer: agent_type + task_name(sol_reviewer_xhigh__unit) + fork_turns
```

Choose Sol effort for the packet before dispatch; do not automatically escalate or move a running unit into a warm context at another effort.

Do not pass `model` to named agents. Default to `fork_turns:"none"`; use a positive integer string only when a small amount of inherited history is necessary. Every packet states the goal, scope and ownership, observable acceptance checks, and fallback to the current Lead while preserving completed work.

## Capacity recovery

On the exact selected-model-capacity message, continue the same subagent once in the same context. After a second Luna capacity failure, Lead sends the same frozen packet to `sol_medium_worker` at the lowest reliable Sol effort; otherwise the current Lead takes over. Other second capacity failures return to Lead. Never restart the whole task, redo completed work, or treat capability and quality failures as capacity errors. The current Hook covers `SubagentStop` only and cannot resume a root-controller capacity notification.
