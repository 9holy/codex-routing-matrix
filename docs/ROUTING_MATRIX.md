# 路由矩阵

模型与提示词依据：[OpenAI GPT-6 指南](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra)、[Astra 技能与规则建议](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra)。模型能力由任务判断，公开评测不替代实际验收。

Lead 指当前 Astra 或 Sol 主控。Luna 明确不支持或无访问权限时，主控将原工作包和进度转给能可靠完成的 Sol 路线，并选择最低可靠档位；容量错误先由原代理在原上下文重试一次。质量失败由主控重新判断。

## 核心原则

当前 `gpt-6-astra` / `gpt-6-sol` 是唯一主控，负责理解、拆解、分派、整合、验收和兜底。插件保留任务启动时已经选择的主控推理档位，不在运行中替用户切换根档位。

已有能胜任且有相关上下文的代理优先继续处理；对需要新路线的工作单元，按下面的顺序判断：

1. 短任务或强耦合工作留给当前 Lead。
2. 目标明确、上下文充分且 Luna Max 能可靠完成的边界工作可交给 Luna，包括本地分析、实现、调试和测试；不把 Luna 当试错路线，也不依赖 Lead 事后救回不合适的结果。
3. `sol_medium_worker` 保留兼容的代理名；常规独立工作默认使用 High，边界清楚的轻量工作使用 Medium，复杂独立工作可选择 XHigh，且下派须有净收益。
4. Astra Low 仅在预期相对合适的 Sol 档位或当前 Lead 有明确质量或总成本收益时使用；不预设它强于 Sol XHigh，也不走自动升级梯子。
5. 耦合、顺序执行或下派没有净收益的工作留给当前 Lead。
6. 关键高风险改动需要独立性时，增加一次 Sol Reviewer 只读复审。
7. 所有结果都由当前 Lead 检查实际改动、重跑必要验证并最终裁决。

## 主控档位

| 根档位 | 合理用途 |
|---|---|
| `low` | 边界清楚、不需要深入推理的工作 |
| `medium` | 常规规划、拆解、整合和边界清楚的直接工作 |
| `high` | 需要更细致检查，但不需要复杂推理升级的工作 |
| `xhigh` | 复杂规划、跨模块整合和严格验收 |
| `max` | 疑难、高风险、架构和关键裁决 |
| `ultra` | 仅在 Codex 宿主提供时使用，不是通用 API 档位，也不是日常默认 |

## Worker 选择

| 代理 | 模型 | 档位 | 使用条件 |
|---|---|---|---|
| `luna_worker` | `gpt-6-luna` | `max` | 目标明确、上下文充分且能可靠完成的边界工作，包括本地分析、实现、调试和测试 |
| `sol_medium_worker` | `gpt-6-sol` | 默认 `high`，可选 `medium` 或 `xhigh` | 常规独立工作使用 High；边界清楚的轻量工作使用 Medium；复杂独立单元使用 XHigh |
| `astra_low_worker` | `gpt-6-astra` | `low` | 相对合适的 Sol 档位或当前 Lead 有明确预期质量或总成本收益的边界清楚执行；不预设强于 Sol XHigh |
| `sol_reviewer` | `gpt-6-sol` | `xhigh` | 关键高风险变更的一次独立只读复审 |

Worker 必须留在工作包范围内，不做无关修改。普通模式下 Worker 不再下派；Super mode 下只有工作包包含 `burst_delegate=yes` 且 `burst_depth=d1`、`d2` 或 `d3` 才能继续拆分；`d4` 和 Reviewer 永不下派。共享文件始终只有一个写入者。

## 质量与成本

- 质量门槛先决定“哪些路线能可靠完成”，价格只在合格路线之间比较。
- Luna 能在上下文充分时可靠完成边界工作，就直接选择，不读取外部评测数据，也不把它当试错路线。
- Sol 和 Astra 合格路线都能胜任且确实难选时，一个根任务最多读取一次本地 Radar 摘要；Radar 只提供参考证据，不自动按 IQ 差选择路线。
- 优先复用有相关上下文的可靠代理；比较总成本时同时考虑执行、缓存、交接、复审和返工成本，绝不假设一定命中缓存。
- 路由确定后冻结，不为微小价格差反复切换。只有工作单元、边界、可用性或结果变化时才重判。

## 并行与等待

工作单元互不依赖、写入不冲突且并行收益高于协调成本时并行执行。并发规模按有益工作决定，不为填满槽位增加 Worker；相关后续工作优先复用同一个能胜任的 Worker。

Super mode 支持 `d1-d4` 和最多 25 个子线程，`d4` 不再下派。25 是插件允许的上限，不保证宿主同时提供 25 个槽位。Worker 运行时使用一次长阻塞等待，由结果提前唤醒，不主动短轮询。

## 调用契约

```text
luna_worker: agent_type + task_name(luna_max__unit) + fork_turns
sol_medium_worker: agent_type + reasoning_effort(medium|high|xhigh) + task_name(sol_medium__unit|sol_high__unit|sol_xhigh__unit) + fork_turns
astra_low_worker: agent_type + task_name(astra_low__unit) + fork_turns
sol_reviewer: agent_type + task_name(sol_reviewer_xhigh__unit) + fork_turns
```

具名代理不传 `model`。默认 `fork_turns:"none"`，只有确实需要少量历史时才使用正整数字符串。每个工作包必须包含目标、范围与所有权、可观察验收标准，以及“失败回当前 Lead、保留已完成工作”的兜底说明。

## 容量恢复

子代理精确返回选定模型容量错误时，在同一上下文续交一次；Luna 第二次仍失败且 Sol 能以最低可靠档位完成时，Lead 将同一冻结工作包交给 `sol_medium_worker`，否则当前 Lead 接管。其他子代理第二次容量失败交回当前 Lead。不得重启整个任务、重做已完成工作，也不得把能力或质量失败按容量错误处理。当前 Hook 只能处理 `SubagentStop`，不能替主控自动恢复容量通知。
