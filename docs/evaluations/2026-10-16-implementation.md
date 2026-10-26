# Real implementation comparison and final routing

Started 2026-10-15; completed 2026-10-16, Asia/Taipei. This adds the missing same-task code comparison to the earlier isolated examples and read-only judgments. It supersedes the earlier suggestion that Luna XHigh might replace Max generally.

## Fixed batch

Eight execution routes received identical files, requirements and fresh contexts. All used the default role with an explicitly selected model/effort, so the Luna pair did not differ by role instructions. Each delivered once after its own permitted debugging. No hidden-test feedback or Lead repair was supplied before grading.

- A: repair real Node and PowerShell plugin installers so genuine released profiles upgrade, compatible customizations survive, incompatible conflicts do not partially change state, and forced replacement/uninstall retain the original recovery record. Exact historical bytes came from commits ad519d8 and 9848f93.
- B: repair the real project's historical host-binding startup failure across the authority plan, shared build cache and UI preparation. Preserve locking, source/toolchain checks, check-only behavior, cleanup, cache reuse and unchanged-file behavior. Historical pre-fix scripts came from the project's recorded 2026-10-15 recovery snapshot, not invented function puzzles.

Execution stayed in isolated Git worktrees. The business application, live data and production sources were not modified. Compiler boundaries were stubbed; no real app or GUI build was claimed. PLAN.md and TASK.md were frozen before dispatch. Existing and independent behavior checks were supplemented only to reproduce a concrete blind-review finding under the original toolchain-preservation requirement.

## Functional results

| Route | A: raw fixed checks | B: fixed behavior checks | Original B regressions | Toolchain change during preparation |
|---|---|---|---|---|
| Luna XHigh | 14/16 | 6/6 | Pass | Missed: run accepted |
| Luna Max | 14/16 | 6/6 | Pass | Missed: run accepted |
| Sol Medium | 14/16 | 6/6 | Pass | Correctly rejected |
| Sol High | 14/16 | 6/6 | Pass | Correctly rejected |
| Sol XHigh | 14/16 | 6/6 | Pass | Correctly rejected |
| Sol Max | 14/16 | 6/6 | Pass | Correctly rejected |
| Astra Low | 14/16 | 6/6 | Pass | Correctly rejected |
| Astra Medium | 14/16 | 6/6 | Pass | Correctly rejected |

All changed JavaScript syntax checks passed. Both actual installer entry points were exercised in temporary homes. The frozen original project regression source was run against each delivered implementation, independently of agents' edited tests.

The two A failures are the same pre-existing synthetic-history exception tested through both backends, not two independent failures. Every delivery retained policy hash `89e77b1e2170ec0dba1f2cfb9fd61245f80d52c95b4e565038a08b5c603f5435`, which allows an unreleased pinned-medium GPT-6.1 file to be treated as history. Blind review found the task wording prohibited newly invented history but did not explicitly require purging all existing exceptions. Accordingly, retain the raw failed checks and record the existing risk, but do not use this ambiguous boundary to rank models or claim every A repair failed its stated core request. The delivered code did meet the other 14 checks. No production fix for this separate legacy exception was merged here.

The meaningful B difference was independently reproduced: change `node_modules/esbuild/lib/main.js` while the preparation callback is awaiting. Both Luna implementations took the first toolchain snapshot afterward and accepted the changed compiler as their baseline. All six Sol/Astra implementations froze tools before preparation and rejected the run with `AUTHORITY_BUILD_TOOLCHAIN_CHANGED`. Source snapshots omit node_modules, so source equality does not compensate for this. Loaded compiler code can otherwise be older than the recorded on-disk identity. This is a concrete incomplete integration boundary, not a style score or a hypothetical added feature.

Two first B harness results were invalid because the VM stub assumed one helper location and omitted Node's Buffer global. Legitimate solutions placed preparation in reusable helpers. The harness was corrected to execute those helpers and stub only the compiler boundary; only affected checks were rerun. Original harness results remain preserved and are not counted as model errors. No candidate code was changed during this correction.

## Code quality

Sol XHigh Reviewer audited anonymous snapshots R02/R05 (the Luna pair) and R04 (Sol Medium) without identities or usage figures. The Lead inspected the other deliveries and adjudicated findings against the original requirements.

- Both Luna solutions preserve the common startup behavior and use the existing lock. Neither is complete on the toolchain boundary; increasing effort to Max did not remove that miss.
- Luna Max changed fewer production files and lines than XHigh in this batch. XHigh's shared UI staging helper is legitimate reuse between preparation and packaging, not automatically redundant code. Exporting its write-if-changed helper solely for testing is optional simplification territory.
- Reviewer also flagged omission of the generated host-loader TS file from some UI input lists. The Lead records this as an inherited declaration/coverage concern, not a demonstrated failure of the requested startup behavior: the generated loader remains covered by the full-source snapshots, and no accepted-wrong-output sequence for that omission was established in this batch.
- Minimal code is judged after functionality. The six Sol/Astra deliveries passed the reproduced boundary; fewer lines from a solution that misses it cannot win solely on size. Test counts and explanation length are not quality scores.

Production diff counts include the policy JSON but exclude tests, fixtures and reports; line counts do not capture all complexity.

| Route | Production files | Added lines | Removed lines |
|---|---:|---:|---:|
| Luna XHigh | 7 | 54 | 29 |
| Luna Max | 6 | 39 | 16 |
| Sol Medium | 6 | 40 | 19 |
| Sol High | 6 | 39 | 20 |
| Sol XHigh | 7 | 44 | 23 |
| Sol Max | 6 | 40 | 20 |
| Astra Low | 7 | 44 | 21 |
| Astra Medium | 6 | 32 | 19 |

## Measured usage and time

Runtime records confirm each actual model and effort. Counters cover the first completed implementation turn, including self-tests, rereads and self-repair. Later documentation work is excluded. Cached input is part of input; reasoning output is part of output. Times include tools and scheduling. No invoice or account-credit billing was accessed, so these are actual token/time measurements, not actual dollar charges.

| Route | Seconds | Input | Cached input | Output | Reasoning output |
|---|---:|---:|---:|---:|---:|
| Luna XHigh | 890.44 | 10418113 | 10203904 | 72658 | 48632 |
| Luna Max | 810.53 | 5628999 | 5460992 | 67650 | 46709 |
| Sol Medium | 371.39 | 1472639 | 1378432 | 14723 | 3587 |
| Sol High | 403.51 | 1840030 | 1736320 | 17465 | 4443 |
| Sol XHigh | 639.72 | 2084970 | 1966720 | 25537 | 10174 |
| Sol Max | 848.69 | 3108801 | 2968576 | 34970 | 17557 |
| Astra Low | 489.14 | 1353902 | 1272320 | 13397 | 2174 |
| Astra Medium | 346.76 | 958969 | 900352 | 10072 | 1594 |

The separate anonymous Sol XHigh review took 243.24 seconds, with 2097746 input tokens (2003840 cached), 7759 output tokens and 4519 reasoning output tokens. Its raw response and usage are retained in judge/blind-review.md and judge/reviewer-usage.json. Lead orchestration and the final installation probe are not included in the worker table; it is not a complete provider invoice for this conversation.

Luna Max finished about 9.0% sooner than XHigh and used less cached input, uncached input (168007 versus 214209) and output. This reverses the read-only sample, where XHigh was faster and used fewer tokens. Neither effort is universally superior from these data. Long cached contexts still create real input processing; cache-hit percentage alone is not the optimization target.

Sol Medium delivered the tested boundary correctly with less worker time and token use than the deeper Sol efforts. Astra Medium was fastest in this batch, but raw tokens across different models do not establish monetary savings. This supports selecting by task, relevant warm context and end-to-end coordination/review/rework time rather than always escalating effort.

## Final roles

| Identity | Operational positioning |
|---|---|
| Current Lead | Planning, ambiguity, architecture, coupled integration, final acceptance and takeover. Preserve the user's root model/effort; Astra Medium is a tested controller choice, not a newly added mandatory worker. |
| Luna Max | Fixed effort. Settled, low-risk extraction, formatting, prescribed checks and approved-pattern edits. No independent diagnosis, migration design or shared-state changes. No extra daily XHigh branch based on one read-only win. |
| Sol Medium | Clear scoped analysis and implementation, not limited to trivial edits. Select when the packet and relevant evidence support reliable completion. |
| Sol High | Normal independent execution/debugging default when more judgment is needed. Medium remains available upfront; no mandatory escalation ladder. |
| Sol XHigh | Complex independent reasoning and integration when the task needs it. |
| Sol Max | Only when XHigh is expected insufficient and delegation is worthwhile; this batch did not justify routine Max. |
| Sol Reviewer XHigh | Independent read-only critical review. Findings require concrete evidence and Lead adjudication; review is not an automatic second execution pass. |
| Astra Low | Selective expert execution only for a clear quality or total-cost benefit over capable Sol or the current Lead; no assumed speed/quality superiority. |

Quality is the constraint; optimize total cost and end-to-end time within it. Use existing valid results, context reuse and beneficial independent parallelism. Avoid repeated model trials, redundant review and benchmark-driven switching. Existing capacity continuation, Super mode, 1M context, root selection and host-default concurrency behavior remain intact.

## Evidence and limits

Local evidence root: `C:/Users/Administrator/.codex/routing-evals/2026-10-15-implementation/`. It contains the frozen plan/task/base, final per-route deliveries, judge outputs, original invalid harness outputs, toolchain counterexample, anonymous review inputs and runtime measurements. Full source snapshots and patches are retained as evidence, not injected on each task.

One two-task batch is not a global reliability estimate or a guarantee of highest quality on every large project. No full Vite build, real Electron launch, production-data migration or provider operation was performed. Test repairs were not merged into the business project. Routing documents and local profile guidance were updated separately; remote publishing was not part of this request.
