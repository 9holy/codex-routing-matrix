# Real-project judgment comparison

Date: 2026-10-15. This follows the user's request to test accurate judgments in a complex real project across all earlier routes, including a controlled Luna XHigh versus Max comparison. This round assesses decisions, not code production.

## Scope and method

An immutable snapshot contains 20 actual files, 2,345 lines and 154,214 bytes from the active Electron/React/TypeScript project. The selected path crosses startup, shared build locking, dependency/output caching, ContentOps UI generation, immutable package admission, version selection and renderer loading. No production files or user data were modified. This is a subsystem of a large project, not the entire project.

Thirteen decision cases and the acceptance rubric were fixed before dispatch. Cases mix safe existing behavior, unsafe proposed shortcuts, temporal state changes and insufficient evidence. All routes used fresh contexts and the same snapshot; no hints, answer feedback, retries or corrective replay were provided. Both Luna efforts used the same default-role message, differing only in requested effort. Other workers used their configured profiles; Reviewer retained its read-only profile. Actual models and efforts were checked in runtime turn records.

The Lead judged causal explanations and source evidence, not answer length or the word ACCEPT/REJECT alone. Luna XHigh's conditional J9 answer correctly rejected the release conclusions and was accepted. J13 could be answered in minimalPlan instead of a separate numbered entry. File/line references were checked for existence and bounds, and explanations checked against source. The Lead also ran the snapshot's existing isolated startup-build-cache suite once: 35 tests passed. Agents did not see that execution result and correctly did not claim to have run tests themselves.

## Decision outcomes

All nine routes reached correct material conclusions on J1-J13. No material wrong decision or false claim of live verification was found. These are 13 related decisions within one subsystem, not 13 independent project samples or a general 100% accuracy rating.

| Route | Judgment outcome | Elapsed seconds |
|---|---|---:|
| GPT-6 Luna XHigh | No material error in J1-J13 | 147.81 |
| GPT-6 Luna Max | No material error in J1-J13 | 181.29 |
| GPT-6.1 Sol Medium | No material error in J1-J13 | 101.40 |
| GPT-6.1 Sol High | No material error in J1-J13 | 152.04 |
| GPT-6.1 Sol XHigh | No material error in J1-J13 | 174.76 |
| GPT-6.1 Sol Max | No material error in J1-J13 | 332.45 |
| GPT-6 Astra Low | No material error in J1-J13 | 139.30 |
| GPT-6 Astra Medium | No material error in J1-J13 | 156.59 |
| GPT-6.1 Sol XHigh Reviewer | No material error in J1-J13 | 272.03 |

Key decisions correctly distinguished:

- Host binding preparation belongs under the lease before the input snapshot. The current normal launcher already does this; moving preparation into a later task is not behavior-preserving.
- A stable unrelated test addition does not invalidate authority caches, while a test edit during an active build can invalidate its before/after source snapshot.
- Existing unrelated runtime content and newly added resolver paths have different invalidation rules.
- The final independent output/dependency read is not redundant with source snapshot equality. Emitted assets and dependencies can change between observations.
- Check-only must remain read-only. Atomic receipt replacement is not build-output rollback. Lock age does not prove owner death.
- The six exact generated-registry exclusions do not justify a generated-file wildcard. Explicit consumers remain tracked.
- Cache hits do not establish root-renderer, installer or runtime-admission readiness. Reviewer additionally noted that individual cached log rows precede final validation.
- State and target-byte checks after confirmation have temporal responsibilities. Current version selection persists a future selection; it does not hot-swap the loaded instance.
- Existing resource requests use captured verified bytes and return copies. A later disk change does not automatically enter that instance, so the proposed per-request disk reread addresses a nonexistent failure path.
- Test source and historical incident descriptions cannot certify live GUI, production recovery, remote platforms or release artifacts.

For the stated host-binding problem, the smallest correct implementation is zero new production code: preserve the existing correct sequence. This tests whether an agent recognizes when fewer checks would change behavior, rather than rewarding deletion counts.

## Luna effort comparison

| Metric | Luna XHigh | Luna Max | XHigh reduction |
|---|---:|---:|---:|
| Elapsed seconds | 147.81 | 181.29 | 18.47% |
| Input tokens | 398061 | 542039 | 26.56% |
| Cached input tokens | 320512 | 460288 | 30.37% |
| Uncached input tokens | 77549 | 81751 | 5.14% |
| Output tokens, including reasoning | 12280 | 15301 | 19.74% |
| Reasoning output tokens | 8867 | 11920 | 25.61% |

Both used `gpt-6-luna`; runtime efforts were `xhigh` and `max`. XHigh consumed less cached input, uncached input and output in this run. Its cache-hit share was about 80.5%, versus 84.9% for Max; the benefit was not a better cache-hit percentage. The snapshot and prompts were fixed, but retrieval choices and number of tool rounds were not artificially equalized.

The measurements support XHigh's efficiency on this task with no observed material judgment loss. They do not establish that XHigh is universally more intelligent or that Max never helps. Elapsed time includes tools and host scheduling; no repeated timing study or invoice measurement was performed. No exact dollar savings are claimed.

## Other route usage

Input includes repeated context across tool calls. Cached input is part of input; reasoning output is part of output. No cache writes were reported by these runs. Differences in role instructions, chosen response language and retrieval strategy also affect counters.

| Route | Input | Cached input | Output | Reasoning output |
|---|---:|---:|---:|---:|
| Sol Medium | 360627 | 302848 | 4020 | 195 |
| Sol High | 674857 | 610944 | 5367 | 827 |
| Sol XHigh | 524087 | 460800 | 6311 | 2660 |
| Sol Max | 1285855 | 1217152 | 11586 | 6454 |
| Astra Low | 297295 | 248192 | 3550 | 10 |
| Astra Medium | 348725 | 295936 | 3704 | 96 |
| Sol XHigh Reviewer | 591338 | 522752 | 9723 | 4880 |

## Routing implications

- Luna XHigh is a reasonable candidate for the narrowed low-risk role; this comparison does not justify requiring Max for every Luna task. The installed profile was not silently changed by this evaluation.
- Correct snapshot judgments do not certify autonomous high-risk implementation. Keep independent consequential changes with capable Sol or Lead until task-relevant delivery evidence supports broader delegation.
- Retain Sol Medium for clear scoped work. This sample did not justify using XHigh/Max or Astra universally. It also did not locate their capability ceiling.
- Reuse capable context and select effort from actual task fit. Do not add per-task benchmarks, switch an ongoing capable agent for a small price difference, or turn these cases into an automatic routing gate.

## Reproducibility and limits

Local evidence: `C:/Users/Administrator/.codex/routing-evals/2026-10-15-repo-judgment/` contains TASK.md, snapshot/SNAPSHOT.json and original source bytes, judge/RUBRIC.md, nine raw JSON responses and responses/measurements.json with runtime session IDs. The preceding isolated implementation/protocol exercises remain recorded separately in 2026-10-15-routing.md.

No business implementation, actual GUI launch, production-data recovery, remote-platform operation or release installer was executed in this round. No global model ranking, whole-project reliability rate, exhaustive safety proof or universal best effort follows from one correlated set of questions. There was no third-party blind grader. No routing configuration or remote Git release was changed in this round.
