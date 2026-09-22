# 需求基线

Lead 指当前 Astra 或 Sol 主控。Luna 明确不支持或无访问权限时，主控将原工作包和进度转给能可靠完成的 Sol 路线，并选择最低可靠档位；容量错误先由原代理在原上下文重试一次。质量失败由主控重新判断。

本文件用于维护和回归追踪，不注入模型上下文。`references/ROUTING_MATRIX.md` 中的无编号 `Codex Routing Matrix` 是唯一语义路由规则，Routing Skill 只实现该规则，Hook 只校验机械字段。

## 目标与路由

| 编号 | 不可丢失的要求 | 落点 |
|---|---|---|
| Q01 | 质量门槛优先；只在能可靠胜任的候选中综合执行、上下文、缓存、交接、复审和返工成本优化总成本 | Codex Routing Matrix、Routing Skill |
| Q02 | 当前 Lead 保持根模型和档位，负责规划、拆解、所有权、整合、验收、裁决和兜底 | Codex Routing Matrix |
| Q03 | 清晰、低风险、可直接验证的短任务由当前主代理处理 | Codex Routing Matrix |
| Q04 | 目标明确、上下文充分且 Luna Max 能可靠完成的边界单元，包括本地分析、实现、调试和测试；下派有净收益时优先 | Codex Routing Matrix、Policy |
| Q05 | 不把 Luna 用作试错路线，不依赖 Lead 救回不合适的结果，也不为调用 Luna 强拆模糊、耦合或高风险决策 | Codex Routing Matrix |
| Q06 | 高风险决策留给 Lead；边界和验收冻结后，其中安全的证据或执行单元仍可下派 | Codex Routing Matrix |
| Q07 | Luna 不适用后，`sol_medium_worker` 保留兼容名且默认 High；边界清楚的轻量单元可选 Medium，复杂独立单元可选 XHigh；Astra Low 仅相对合适的 Sol 档位或当前 Lead 有明确预期收益时可选，不预设强于 Sol XHigh | Codex Routing Matrix、Routing Skill |
| Q08 | Luna 使用 Max；Sol effort 显式选择 High（默认）、Medium（轻量边界工作）或 XHigh（复杂独立工作）；Astra Low 使用 Low；Sol Reviewer 固定 XHigh 且只读 | Policy、代理模板 |
| Q09 | 保持当前 Lead 根档位；Medium、High、XHigh、Max、Ultra 的用途只作选择任务档位或下一任务建议，不在运行中改写根档位 | 路由矩阵 |
| Q10 | 仅当合格 Sol/Astra 路线难选时，每个根任务最多读取一次 Radar；Radar 只作参考证据，不按 IQ 差自动选择路线 | Codex Routing Matrix、Radar |
| Q11 | 优先复用有相关上下文的可靠代理，绝不假设缓存命中；路由冻结至工作单元、边界、可用性或结果变化，并综合交接、复审和返工成本 | Codex Routing Matrix、Routing Skill |

## 团队执行

| 编号 | 不可丢失的要求 | 落点 |
|---|---|---|
| T01 | 非短任务先形成轻量内存计划：单元、目标、路径所有权、依赖、验收和集成顺序 | Routing Skill |
| T02 | 单个足够大的单元也可下派；通常一个 Worker，只有独立、写入不冲突且净收益为正时并行 | Routing Skill |
| T03 | 同质批量先验收一个代表单元，再按有净收益的独立工作增加并发，不为填满槽位创建代理；无任务累计上限 | Codex Routing Matrix、Routing Skill |
| T04 | 共享文件单写者；普通模式 Worker 不下派；爆种模式仅在工作包包含 `burst_delegate=yes` 且 `burst_depth=d1`、`d2` 或 `d3` 时下派；d4 和 Reviewer 永不下派 | Codex Routing Matrix、代理模板 |
| T05 | Worker 运行时使用一次长阻塞等待，由结果被动唤醒；禁止轮询 | Codex Routing Matrix、Routing Skill |
| T06 | Lead 检查实际结果或差异并复跑必要验证，按计划顺序整合 | Codex Routing Matrix、Routing Skill |
| T07 | 明确局部缺陷最多续交原 Worker 一次；能力、越界或质量失败立即交回 Lead | Codex Routing Matrix |

## 调用、失败与环境

| 编号 | 不可丢失的要求 | 落点 |
|---|---|---|
| M01 | Luna 固定 Max；`sol_medium_worker` 显式使用 High（默认）、Medium 或 XHigh，task label 对应 `sol_medium__unit` / `sol_high__unit` / `sol_xhigh__unit`；Astra Low 固定 Low；具名代理不传 `model` | Policy、Hook |
| M02 | `task_name` 明文显示预期代理和档位，`fork_turns` 显式为 `none` 或正整数字符串 | Policy、Hook |
| M03 | 工作包冻结目标、范围、路径所有权、验收和回到当前 Lead 的接管方式 | Routing Skill |
| M04 | 精确容量消息只让同一代理在原上下文继续一次；Luna 第二次失败时，若 Sol 能以最低可靠档位完成则转交同一冻结工作包，否则由 Lead 接管；不重启或重做 | Codex Routing Matrix、SubagentStop Hook |
| M05 | 禁止静默降级；任务名、工作包和代理自述不能单独证明实际后台模型 | 维护 Skill、README |
| M06 | 只保留 SessionStart、UserPromptSubmit、PreToolUse、SubagentStop 四个 Hook；普通提示保持静默 | Hook、Policy |
| M07 | 配置守护只恢复插件注册和已批准 Hook 哈希，保留 Cockpit、CC Switch 写入的认证、Provider、端点和模型配置 | Config Guard |
| M08 | 只允许声明的具名执行型 Worker（`luna_worker`、`sol_medium_worker`、`astra_low_worker`）和关键高风险只读 `sol_reviewer` 作为 Lead 子代理 | Codex Routing Matrix、Policy |
| M09 | Super mode 支持中英文精确开关，保留 d1-d4、最多 25 个子线程和 d4 禁止下派；质量门槛与 Lead 最终审计不变 | Codex Routing Matrix、Hook、Policy |
| M10 | 主控容量通知不进入当前可续交 Hook；插件不得宣称主控已自动恢复 | README、操作指南 |
| M11 | 首次安装只初始化一次无编号英文 `Meta Rule - Conflict Resolution` 和 `Implementation`；升级与配置守护不恢复、不覆盖 | Installer、README |
| M12 | 独立 Git Marketplace 必须先添加；未进入公共 curated Marketplace 时不得宣称可直接公共搜索安装 | README、操作指南 |
| M13 | 1M 上下文默认关闭；中英文精确命令只修改全局配置，使用无引号数字值，关闭时恢复原值，并明确要求重启后重新打开同一任务 | UserPromptSubmit Hook、Policy、README |

## 明确排除

- 不自动修改已经启动任务的根模型或推理档位。
- 不使用关键词、文件数量或代码规则替代 Lead 的能力和风险判断。
- 不把 Astra Low 当作自动升级梯子；必须基于预期收益选择路线。
- 不自动路由到 GPT-5 系列、`codex-auto-review` 或未声明代理。
- 不恢复普通模式固定并发、八次调用、每任务累计上限、波次 Ledger 或自动 fallback 链。
- 不把预期任务名当作实际模型调用证据。
