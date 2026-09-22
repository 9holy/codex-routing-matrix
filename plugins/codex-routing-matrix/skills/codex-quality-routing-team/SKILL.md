---
name: codex-quality-routing-team
description: Delegate bounded implementation, research, scans or independent verification through the routing matrix. Skip simple questions and clear tiny edits.
---

# Codex Routing Matrix Team

1. Follow `Codex Routing Matrix` in context; if absent, read `../../references/ROUTING_MATRIX.md`. Lead is the current `gpt-6-astra` or `gpt-6-sol` root.
2. Before dispatch, identify allowed paths and single-writer owner, dependencies, acceptance, and integration order. Include decisions and existing progress; do not make Workers redesign the task.
3. Read `../../routing-policy.json` once before the first dispatch. Only for an unresolved Sol/Astra choice, run `node ../../scripts/radar-routing-evidence.cjs` once; retain the summary and do not run it again. Freeze the selected route until material facts change.
4. For `spawn_agent`, always pass `agent_type`, `task_name`, and `fork_turns`. Default to `fork_turns:"none"`; inherit only necessary context. For `sol_medium_worker`, explicitly pass `reasoning_effort:"high"` by default, `"medium"` for clear light-reasoning work, `"xhigh"` for complex independent work, or `"max"` only when XHigh is expected insufficient and delegation is worthwhile. Never pass `model` or override fixed efforts. If the host exposes an outdated profile, use a capable current agent or Lead and report that a new session is needed.
5. Name tasks `<route>__<unit>`: `luna_max`, `sol_medium`, `sol_high`, `sol_xhigh`, `sol_max`, `astra_low`, or `sol_reviewer_xhigh`. Sol's prefix must match the chosen effort. Send this packet:

```text
[CQO_WORK_PACKET_V1]
route: <model> / <effort>
goal: <result>
scope: <paths, ownership, decisions, dependencies and progress>
acceptance: <checks and expected result>
fallback: current Lead; preserve completed work
```

6. Reuse the same agent for related follow-ups. When no useful independent work remains, use the host's blocking completion wait; obey runtime timeout limits. Never poll `list_agents` or repeat short waits.
7. Inspect returned changes and evidence. Run only missing or invalidated checks and necessary integration checks. Do not replay completed work on another model.
