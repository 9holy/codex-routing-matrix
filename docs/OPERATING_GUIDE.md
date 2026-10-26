# 操作指南

Lead 指当前 Astra 或 Sol 主控。Luna 明确不支持或无访问权限时，主控将原工作包和进度转给能可靠完成的 Sol 路线，并选择最低可靠档位；容量错误先由原代理在原上下文重试一次。质量失败由主控重新判断。

## 一次任务怎样运行

当前 `gpt-6-astra` / `gpt-6.1-sol` 是首选主控，已启动的 `gpt-6-sol` 仍保持主控。插件不会替换已经启动任务的根模型或推理档位，而是给 Lead 一套简洁的分工规则和五个具名代理；Sol worker 常规使用 High，范围清楚的单元用 Medium（不限于琐碎或几乎不需推理的工作），复杂独立工作用 XHigh；涉及跨源身份、计费口径或持久化决策时优先 XHigh 或 Lead。困难边界工作仅预计 XHigh 不足且下派有净收益时才预先选择 Max。Terra worker 使用 `gpt-6.1-terra`，直接 XHigh/Max，专注屏幕内容理解、提供材料写作和屏幕驱动的范围明确修复；不承担通用复杂推理。复杂编码、诊断、成本口径、架构和持久化决策交给 Sol/Lead。档位按单元预先选择，不自动升级或切换运行中的预热上下文。

已有能胜任且有相关上下文的代理优先继续处理；若代理已完成且需要它继续工作，使用 `followup_task` 激活，而 `send_message` 只传递消息、不触发执行。只有需要新路线的单元才进入下面的判断。
1. Lead 先判断任务是否值得拆分。短任务、强耦合工作和顺序执行更合适的工作由 Lead 直接完成。
2. 拆分前，Lead 写清目标、范围、唯一写入者、依赖、验收和集成顺序，并附相关需求、已确认参考及后续变更。不能把“测试通过”当成需求已经完整实现。
3. Luna 固定使用 Max，只接步骤已定、风险低且下派有净收益的工作：只读提取、格式整理、指定检查，或按 Lead 批准步骤进行的低风险代码编辑。独立诊断、设计或改共享状态留给 Sol/Lead；不把 Luna 当试错路线，也不依赖 Lead 救回不合适结果。
4. `sol_medium_worker` 保留兼容的代理名；常规独立工作默认使用 High，范围清楚的单元使用 Medium（不限于琐碎或几乎不需推理的工作），复杂独立工作用 XHigh。困难边界工作仅预计 XHigh 不足且下派有净收益时才预先选择 Max。
5. Terra worker 使用 `gpt-6.1-terra`，直接 XHigh/Max，任务名前缀为 `terra_<effort>`；专注屏幕内容理解、提供材料写作和屏幕驱动的范围明确修复，不承担通用复杂推理，也不自动 fallback。复杂 Sol/Astra 工作留在对应路线。
6. Astra Low 仅在预期相对合适的 Sol 档位或当前 Lead 有明确质量或总成本收益时使用；不预设它强于 Sol XHigh，也不走自动升级梯子。
7. 架构、安全、公共接口、生产数据、不可逆操作和模糊需求由 Lead 决定。执行目标或环境不清时先核实；工具反复失败且没有新证据时交回 Lead，不靠轮换模型继续试。
8. Lead 对照已确认参考及后续变更验收：数据核对身份，区分配额周期与日历窗口，并保持同一快照的外推比例和金额成对；UI 以实际渲染结果对照参考核查布局与交互。关键复审覆盖受影响的调用和状态切换，安排在最终集成检查前；不扩大为全库审计，也不为每个小改动加门槛。复用有效检查，只补缺失或失效部分；局部缺陷退回一次，能力、范围或质量问题由 Lead 接管。

这套流程把质量裁决留在 Lead；在能胜任的路线间，再比较总成本与端到端耗时，计入执行、上下文、缓存、交接、复审和返工，不假设命中缓存。优先复用已有相关上下文的可靠代理，只并行互不依赖且写入安全的单元；不因小幅价格差或基准而切换或重做。路由在当前根任务内冻结，只有工作单元、边界、可用性或结果变化时才重判。

时间、Token、缓存和返工只记录已经取得的数据；缺少测量就明确未测，不额外调用模型或重做任务来凑指标。

Astra Reviewer 的“只读”是职责指令，不是每代理单独写入沙箱；自定义代理继承宿主/父会话权限，profile 中的 `sandbox_mode` 不会覆盖它。安装或 profile 检查的 `installed`、`verified`、`PASS` 仅代表配置状态。`reviewerWriteIsolation`（PowerShell `ReviewerWriteIsolation`）保持 `NOT_VERIFIED`，直到有实际宿主级写入隔离证据；需要强制只读时由宿主/会话权限边界实现。兼容代理 ID `sol_reviewer`、profile 文件名 `sol-reviewer.toml` 和任务名前缀 `sol_reviewer_xhigh` 现绑定到 `gpt-6-astra`/固定 XHigh。详见[安全说明](../SECURITY.md)。

## 普通模式

普通模式适合日常任务：

- 简单工作不创建子代理。
- 非短任务只有在下派或并行确实有净收益时才创建 Worker，默认从一个开始。
- 互不依赖、不会同时写同一文件的单元才并行。
- 大量同类工作先验收一个代表性单元，再按有益工作逐步补充 Worker，不为填满槽位增加并发。
- Worker 运行时使用一次长等待，由完成事件提前唤醒，不做短间隔轮询。

## Super mode

Super mode 是大并行模式，不是降低质量标准的模式。它适合大量互不依赖、写入不冲突的工作，支持 `d1-d4` 四层拆分和最多 25 个子线程；`d4` 不能继续下派。实际同时运行数量仍由当前 Codex 宿主的可用槽位决定。

开启或关闭当前会话：

```text
开启爆种模式
关闭爆种模式
enable super mode
disable super mode
```

无论并行多少，Lead 仍负责文件所有权、依赖顺序、实际差异检查、必要验证和最终验收。

## 1M 上下文

1M 上下文是全局、可逆、默认关闭的配置开关：

```text
开启1M上下文
关闭1M上下文
enable 1M context
disable 1M context
```

开启时，插件把下面两项数字配置写入全局 `~/.codex/config.toml`；关闭时恢复开启前的原值：

```toml
model_context_window = 1000000
model_auto_compact_token_limit = 900000
```

配置不会热切换正在运行的线程。执行命令后重启 Codex，再重新打开同一个任务即可继续原历史并使用新配置。普通任务不应开启该模式。

## 失败怎样处理

子代理精确返回下面的容量提示时，插件会在原上下文自动继续一次，不重启整个任务，也不重做已经完成的工作：

```text
Selected model is at capacity. Please try a different model.
```

Luna 第二次仍因容量失败时，如果 Sol 能以最低可靠档位完成同一工作包，Lead 会把原工作包转给 `sol_medium_worker`，不重做已经完成的工作；否则由当前 Lead 接管。其他子代理第二次容量失败也交回 Lead。能力不足、越界或质量问题不会伪装成容量问题，也不会沿机械模型梯子逐级尝试。当前 Codex Hook 不能恢复主控自身的容量通知，因此插件只承诺子代理续交。

## 安装与升级

插件通过独立 Git Marketplace 分发，尚未进入 OpenAI 公共插件商城：

```powershell
codex plugin marketplace add 9holy/codex-routing-matrix --ref main
codex plugin add codex-routing-matrix@codex-routing-matrix
```

首次安装或升级后运行初始化：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$HOME\.codex\.tmp\marketplaces\codex-routing-matrix\plugins\codex-routing-matrix\scripts\install.ps1"
```

macOS、Linux 桌面或 Linux 服务器上的 Codex CLI 直接运行：

```bash
node "$HOME/.codex/.tmp/marketplaces/codex-routing-matrix/plugins/codex-routing-matrix/scripts/portable-setup.cjs" install
```

初始化会安装 Luna、Sol（Medium/High/XHigh/Max）、Astra Low、Terra（XHigh/Max）和 Astra Reviewer 五个具名代理，维护无编号的 `Codex Routing Matrix`，并在首次安装时把英文 `Meta Rule - Conflict Resolution` 和 `Implementation` 放到 `AGENTS.md` 顶部。后两条不是守护内容，以后不会被安装器自动恢复或覆盖。

升级命令：

```powershell
codex plugin marketplace upgrade codex-routing-matrix
codex plugin add codex-routing-matrix@codex-routing-matrix
powershell -NoProfile -ExecutionPolicy Bypass -File "$HOME\.codex\.tmp\marketplaces\codex-routing-matrix\plugins\codex-routing-matrix\scripts\install.ps1"
```

macOS 或 Linux 升级时，前两条 `codex` 命令不变，最后运行上面的 Node 初始化命令。

从旧版 `codex-quality-orchestrator` 迁移时，先执行新的 Marketplace 安装命令并运行初始化脚本。确认新插件和四个新 Hook 正常后，再执行：

```powershell
codex plugin remove codex-quality-orchestrator@codex-quality-orchestrator
```

新安装器会读取旧版 `.codex-quality-orchestrator.install-state.json`，迁移代理安装状态，不会重复覆盖代理配置。

## Hook 与配置守护

在 `/hooks` 中检查并信任四个 Hook：

| Hook | 作用 |
|---|---|
| `SessionStart` | 当前上下文缺少路由规则时补充规则 |
| `UserPromptSubmit` | 识别中英文 Super mode 和 1M 上下文精确命令 |
| `PreToolUse` | 检查 CQO 具名代理调用是否符合机械配置 |
| `SubagentStop` | 处理一次子代理容量续交 |

Hook 内容升级后必须重新检查并信任，插件不会绕过信任机制。

如果 Cockpit Tools、CC Switch 等工具会替换 `config.toml`，启用配置守护：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$HOME\.codex\.tmp\marketplaces\codex-routing-matrix\plugins\codex-routing-matrix\scripts\config-guard.ps1" -Mode Install
```

配置守护只恢复插件注册和已经批准的当前 Hook，不修改认证、Provider、端点、模型或其他工具设置。

配置守护目前只支持 Windows。macOS 或 Linux 不运行 `config-guard.ps1 -Mode Install`；核心路由和五个 Worker profile 仍可正常使用。

## 验证

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "$HOME\.codex\.tmp\marketplaces\codex-routing-matrix\plugins\codex-routing-matrix\scripts\verify.ps1"
codex plugin list --json
```

macOS 或 Linux 使用跨平台状态检查：

```bash
node "$HOME/.codex/.tmp/marketplaces/codex-routing-matrix/plugins/codex-routing-matrix/scripts/portable-setup.cjs" status
codex plugin list --json
```

macOS 或 Linux 卸载插件管理的代理配置：

```bash
node "$HOME/.codex/.tmp/marketplaces/codex-routing-matrix/plugins/codex-routing-matrix/scripts/portable-setup.cjs" uninstall
```

只有插件已安装并启用、五个代理配置各自唯一、四个 Hook 都已信任，才算安装完成。升级后新建任务，让新规则和代理配置进入上下文。
