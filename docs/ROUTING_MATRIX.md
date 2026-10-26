# 路由矩阵

模型与提示词依据：[OpenAI GPT-6 指南](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra)、[Astra 技能与规则建议](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra)。模型能力由任务判断，公开评测不替代实际验收。

官方参考：[GPT-6.1 Terra 模型](https://developers.openai.com/api/docs/models/gpt-6.1-terra) · [模型选择指南](https://developers.openai.com/api/docs/guides/model-selection)。Terra 的 API 档位为 none/low/medium/high/xhigh/max；本插件按当前定位只路由 xhigh/max，不把 none、low、medium、high 或 ultra 作为 Terra 路由档位。

Lead 指当前 Astra 或 Sol 主控。Luna 明确不支持或无访问权限时，主控将原工作包和进度转给能可靠完成的 Sol 路线，并选择最低可靠档位；容量错误先由原代理在原上下文重试一次。质量失败由主控重新判断。

## 核心原则

当前 `gpt-6-astra` / `gpt-6.1-sol` 是首选主控，已启动的 `gpt-6-sol` 仍受支持；主控负责理解、拆解、分派、整合、验收和兜底。插件保留任务启动时已经选择的主控推理档位，不在运行中替用户切换根档位。

已有能胜任且有相关上下文的代理优先继续处理；对需要新路线的工作单元，按下面的顺序判断：

1. 短任务或强耦合工作留给当前 Lead。
2. Luna 固定使用 Max，只接步骤已定、风险低且下派有净收益的工作：只读提取、格式整理、指定检查，或按 Lead 批准步骤进行的低风险代码编辑。独立诊断、设计或改共享状态留给 Sol/Lead；短代码或现成测试本身不足以选择 Luna。
3. `sol_medium_worker` 保留兼容的代理名；常规独立工作默认使用 High，范围清楚的单元使用 Medium（不限于琐碎或几乎不需推理的工作），复杂独立工作用 XHigh。涉及跨源身份、计费口径或持久化决策时优先 XHigh 或 Lead；困难边界工作仅预计 XHigh 不足且下派有净收益时才预先选择 Max。
4. Terra worker 使用 `gpt-6.1-terra`，直接使用 XHigh/Max，任务名前缀为 `terra_<effort>`。专注屏幕内容理解、提供材料写作和屏幕驱动的范围明确修复；不承担通用复杂推理。复杂编码、诊断、成本口径、架构和持久化决策交给 Sol/Lead，也不是自动 fallback。
5. Astra Low 仅在预期相对合适的 Sol 档位或当前 Lead 有明确质量或总成本收益时使用；不预设它强于 Sol XHigh，也不走自动升级梯子。
6. 耦合、顺序执行或下派没有净收益的工作留给当前 Lead。
7. 关键高风险改动需要独立性时，增加一次 Astra Reviewer 只读复审。
8. 所有结果都由当前 Lead 检查实际改动、重跑必要验证并最终裁决。

## 主控档位

| 根档位 | 合理用途 |
|---|---|
| `low` | 边界清楚、不需要深入推理的工作 |
| `medium` | 常规规划、拆解、整合和边界清楚的直接工作 |
| `high` | 需要更细致检查，但不需要复杂推理升级的工作 |
| `xhigh` | 复杂规划、跨模块整合和严格验收 |
| `max` | 疑难、高风险、架构和关键裁决 |

## Worker 选择

| 代理 | 模型 | 档位 | 使用条件 |
|---|---|---|---|
| `luna_worker` | `gpt-6-luna` | 固定 `max` | 只做低风险只读提取、格式整理、指定检查，或按 Lead 批准步骤进行的低风险代码编辑；不做独立诊断、设计或共享状态修改 |
| `sol_medium_worker` | `gpt-6.1-sol` | 默认 `high`，可选 `medium`、`xhigh` 或 `max` | High 用于常规独立工作；Medium 用于范围清楚的工作，不限于琐碎任务；XHigh 用于复杂独立工作；Max 仅用于困难边界工作，且仅预计 XHigh 不足并有下派净收益时选用 |
| `astra_low_worker` | `gpt-6-astra` | `low` | 相对合适的 Sol 档位或当前 Lead 有明确预期质量或总成本收益的边界清楚执行；不预设强于 Sol XHigh |
| `terra_worker` | `gpt-6.1-terra` | 直接 `xhigh`/`max` | 屏幕内容理解、提供材料写作和屏幕驱动的范围明确修复；不是通用复杂推理或自动 fallback，不替代复杂 Sol/Astra |
| `sol_reviewer` | `gpt-6-astra` | 固定 `xhigh` | 关键高风险变更的一次独立只读复审 |

Worker 必须留在工作包范围内，不做无关修改。普通模式下 Worker 不再下派；Super mode 下只有工作包包含 `burst_delegate=yes` 且 `burst_depth=d1`、`d2` 或 `d3` 才能继续拆分；`d4` 和 Reviewer 永不下派。共享文件始终只有一个写入者。

## 质量与成本

- 质量优先；在能胜任的路线间，再优化总成本与端到端时间，计入上下文、交接、复审和返工。
- Luna 适用性由可比任务的实际结果判断；不把它当试错路线，也不依赖 Lead 救回不合适的结果。
- 可选的公开基准/Radar 资料每个根任务合计最多查阅一次，且只作辅助证据；不按 IQ 或基准排名自动选择胜者。Radar 只在合格的 Sol/Astra 路线确实难选时读取。
- 优先复用有相关上下文的可靠代理，只并行互不依赖且写入安全的工作单元；不因小幅价格差或基准切换或重做。一次只读样本中 XHigh 胜出；实现样本中 Max 的实耗时间和 token 更低，且两档都漏过工具链边界，因此没有普遍适用的档位胜负。
- 路由确定后冻结。只有工作单元、边界、可用性或结果变化时才重判。
- 工作包包含相关需求、已确认参考和后续变更。Lead 按真实结果验收：数据核对身份，区分配额周期与日历窗口，并保持同一快照的外推比例和金额成对；UI 以实际渲染结果对照参考核查布局与交互。关键复审覆盖受影响的调用和状态切换，安排在最终集成检查前；不扩大为全库审计，小改动不加门槛。
- Terra 尚无本插件的比较性评测证据；不得从现有 Luna、Sol 或 Astra 结果推断其更快、更便宜或更优。
- 执行目标或环境不清时先由 Lead 核实；工具重复失败且没有新证据时交回 Lead，不轮换模型碰运气。时间、Token、缓存和返工只记录已有实测，不新增调用或重做任务来凑指标。

## 并行与等待

工作单元互不依赖、写入不冲突且并行收益高于协调成本时并行执行。并发规模按有益工作决定，不为填满槽位增加 Worker；相关后续工作优先复用同一个能胜任的 Worker。

Super mode 支持 `d1-d4` 和最多 25 个子线程，`d4` 不再下派。25 是插件允许的上限，不保证宿主同时提供 25 个槽位。Worker 运行时使用一次长阻塞等待，由结果提前唤醒，不主动短轮询。

## 调用契约

```text
luna_worker: agent_type + task_name(luna_max__unit) + fork_turns
sol_medium_worker: agent_type + reasoning_effort(medium|high|xhigh|max) + task_name(sol_medium__unit|sol_high__unit|sol_xhigh__unit|sol_max__unit) + fork_turns
terra_worker: agent_type + reasoning_effort(xhigh|max) + task_name(terra_xhigh__unit|terra_max__unit) + fork_turns
astra_low_worker: agent_type + task_name(astra_low__unit) + fork_turns
sol_reviewer: agent_type + task_name(sol_reviewer_xhigh__unit) + fork_turns
```

Sol-effort is chosen for the packet before dispatch; do not automatically escalate or move a running unit into a warm context at another effort.

具名代理不传 `model`。默认 `fork_turns:"none"`，只有确实需要少量历史时才使用正整数字符串。每个工作包必须包含目标、范围与所有权、可观察验收标准，以及“失败回当前 Lead、保留已完成工作”的兜底说明。

## 容量恢复

子代理精确返回选定模型容量错误时，在同一上下文续交一次；Luna 第二次仍失败且 Sol 能以最低可靠档位完成时，Lead 将同一冻结工作包交给 `sol_medium_worker`，否则当前 Lead 接管。其他子代理第二次容量失败交回当前 Lead。不得重启整个任务、重做已完成工作，也不得把能力或质量失败按容量错误处理。当前 Hook 只能处理 `SubagentStop`，不能替主控自动恢复容量通知。
