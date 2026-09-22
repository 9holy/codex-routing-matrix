# Routing Matrix

References: [OpenAI GPT-6 guidance](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra) and [Astra skills and prompts](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra). Match capability to the task; public benchmarks do not replace acceptance checks.

Lead means the current Astra or Sol controller. If Luna is unsupported or access is denied, Lead sends the unchanged work packet and progress to a capable Sol route at its lowest reliable effort; capacity errors retry once in the original agent context first. Quality failures return to Lead for reassessment.

## Core rule

The current `gpt-6-astra` / `gpt-6-sol` is the sole controller for understanding, decomposition, delegation, integration, acceptance, and fallback. The plugin preserves the controller reasoning effort selected when the task starts and does not switch the root effort during a running task.

Reuse a capable agent with relevant context before choosing a fresh route; for a unit that needs a new route, choose routes in this order:

1. Keep short or tightly coupled work on the current Lead.
2. Use Luna Max for bounded work with a clear goal and sufficient context that it can reliably complete, including local analysis, implementation, debugging, and tests. Never use it as a trial route or rely on Lead to rescue a poor fit.
3. Keep the compatible `sol_medium_worker` name. Select High by default for routine independent work, Medium for bounded light-reasoning work, or XHigh for complex independent work, when delegation has net value.
4. Select Astra Low only when its predicted quality or total-cost benefit over the suitable Sol effort or current Lead is clear; do not presume it is stronger than Sol XHigh or make it an automatic escalation step.
5. Keep coupled, sequential, or delegation-negative work on the current Lead.
6. Add one read-only Sol Reviewer when a critical high-risk change needs independent review.
7. The current Lead inspects actual changes, reruns necessary checks, and makes the final decision.

## Controller efforts

| Root effort | Intended use |
|---|---|
| `low` | Clear, bounded work that does not need deeper reasoning |
| `medium` | Routine planning, decomposition, integration, and bounded direct work |
| `high` | Careful checking without a complex-reasoning upgrade |
| `xhigh` | Complex planning, cross-module integration, and strict acceptance |
| `max` | Difficult, high-risk, architectural, or critical decisions |
| `ultra` | Only when exposed by the Codex host; not a portable API setting or daily default |

## Worker selection

| Agent | Model | Effort | Select when |
|---|---|---|---|
| `luna_worker` | `gpt-6-luna` | `max` | Bounded work with a clear goal and sufficient context that it can reliably complete, including local analysis, implementation, debugging, and tests |
| `sol_medium_worker` | `gpt-6-sol` | `high` by default; `medium` or `xhigh` selectable | Use High for ordinary independent execution, Medium for bounded light reasoning, or XHigh for complex independent units |
| `astra_low_worker` | `gpt-6-astra` | `low` | Bounded work with a clear predicted quality or total-cost benefit over the suitable Sol effort or current Lead; not presumed stronger than Sol XHigh |
| `sol_reviewer` | `gpt-6-sol` | `xhigh` | One independent read-only review for a critical high-risk change |

Workers stay inside packet scope and make no unrelated changes. Workers do not delegate in normal mode. In Super mode, further delegation requires `burst_delegate=yes` and `burst_depth=d1`, `d2`, or `d3`; `d4` and reviewers never delegate. Every shared file has one writer.

## Quality and cost

- The quality bar first determines which routes are reliable. Price is compared only among qualified routes.
- When Luna can reliably complete bounded work with sufficient context, select it directly without reading external benchmark data. This is not a trial route.
- If capable Sol and Astra routes remain genuinely unresolved, read the local Radar summary at most once per root task; Radar is advisory evidence and never an automatic IQ-gap winner.
- Reuse a capable agent with relevant context when practical. Compare execution, cache, handoff, review, and rework costs, and never assume a cache hit.
- Freeze the selected route. Do not switch for a small price difference; reconsider only when the unit, boundary, availability, or result changes.

## Parallelism and waiting

Parallelize independent, write-safe units when the benefit exceeds coordination cost. Use only as many Workers as useful work warrants; keep related follow-ups with the same capable Worker.

Super mode supports `d1-d4` and up to 25 child threads; `d4` cannot delegate. Twenty-five is the plugin ceiling, not a guarantee that the host exposes 25 simultaneous slots. While Workers run, use one long blocking wait that wakes early on results instead of short polling.

## Dispatch contract

```text
luna_worker: agent_type + task_name(luna_max__unit) + fork_turns
sol_medium_worker: agent_type + reasoning_effort(medium|high|xhigh) + task_name(sol_medium__unit|sol_high__unit|sol_xhigh__unit) + fork_turns
astra_low_worker: agent_type + task_name(astra_low__unit) + fork_turns
sol_reviewer: agent_type + task_name(sol_reviewer_xhigh__unit) + fork_turns
```

Do not pass `model` to named agents. Default to `fork_turns:"none"`; use a positive integer string only when a small amount of inherited history is necessary. Every packet states the goal, scope and ownership, observable acceptance checks, and fallback to the current Lead while preserving completed work.

## Capacity recovery

On the exact selected-model-capacity message, continue the same subagent once in the same context. After a second Luna capacity failure, Lead sends the same frozen packet to `sol_medium_worker` at the lowest reliable Sol effort; otherwise the current Lead takes over. Other second capacity failures return to Lead. Never restart the whole task, redo completed work, or treat capability and quality failures as capacity errors. The current Hook covers `SubagentStop` only and cannot resume a root-controller capacity notification.
