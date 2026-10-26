---
name: codex-quality-routing-team
description: Delegate bounded implementation, research, scans or independent verification through the routing matrix. Skip simple questions and clear tiny edits.
---

# Codex Routing Matrix Team

1. Follow `Codex Routing Matrix` in context; if absent, read `../../references/ROUTING_MATRIX.md`. Lead is the current `gpt-6-astra`, `gpt-6.1-sol`, or `gpt-6-sol` root.
2. Before dispatch, identify allowed paths and single-writer owner, dependencies, acceptance, and integration order. Include settled decisions, current progress, relevant requirements, approved references and later changes; do not make Workers redesign the task.
3. Read `../../routing-policy.json` once before the first dispatch. Only for an unresolved Sol/Astra choice, run `node ../../scripts/radar-routing-evidence.cjs` once; retain the summary and do not run it again. Freeze the selected route until material facts change.
4. For `spawn_agent`, always pass `agent_type`, `task_name`, and `fork_turns`. Default to `fork_turns:"none"`; inherit only necessary context. For `sol_medium_worker`, explicitly pass `reasoning_effort:"high"` by default, `"medium"` for clear scoped work, `"xhigh"` for complex independent work, or `"max"` only when XHigh is expected insufficient and delegation is worthwhile. For `terra_worker`, pass `reasoning_effort:"xhigh"` or `"max"` only; use Terra for screen-content understanding and supplied-material writing, not as a substitute for Sol's general reasoning. Never pass `model` or override fixed efforts, including Luna Max. If the host exposes an outdated profile, use a capable current agent or Lead and report that a new session is needed.
5. Name tasks `<route>__<unit>`: `luna_max`, `terra_xhigh`, `terra_max`, `sol_medium`, `sol_high`, `sol_xhigh`, `sol_max`, `astra_low`, or `sol_reviewer_xhigh`. Sol and Terra prefixes must match the chosen effort. Use Sol for complex coding, diagnosis, accounting, architecture or general reasoning; do not use Terra effort as a substitute for Sol intelligence. The compatibility role `sol_reviewer` and prefix `sol_reviewer_xhigh` select `gpt-6-astra` at fixed `xhigh`. Send this packet:

```text
[CQO_WORK_PACKET_V1]
route: <model> / <effort>
goal: <result>
scope: <paths, ownership, decisions, dependencies and progress>
acceptance: <observable outcomes against agreed requirements, references and later changes>
fallback: current Lead; preserve completed work
```

6. Reuse the same agent for related follow-ups. Resume a completed agent with `followup_task`; `send_message` alone does not resume it. When no useful independent work remains, use the host's blocking completion wait; obey runtime timeout limits. Never poll `list_agents` or repeat short waits.
7. Inspect returned changes and evidence. Run only missing or invalidated checks and necessary integration checks. Do not replay completed work on another model. Record time, token/cache usage and rework when already available; never invent measurements or run extra work just to obtain them.
