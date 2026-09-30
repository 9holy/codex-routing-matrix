from __future__ import annotations

import json
import pathlib
import re
import tomllib


ROOT = pathlib.Path(__file__).resolve().parent.parent
policy = json.loads((ROOT / "routing-policy.json").read_text(encoding="utf-8"))
manifest = json.loads((ROOT / ".codex-plugin" / "plugin.json").read_text(encoding="utf-8"))
hooks = json.loads((ROOT / "hooks" / "hooks.json").read_text(encoding="utf-8"))
rule = (ROOT / "references" / "ROUTING_MATRIX.md").read_text(encoding="utf-8")
maintenance = (ROOT / "skills" / "codex-routing-matrix" / "SKILL.md").read_text(encoding="utf-8")
routing = (ROOT / "skills" / "codex-quality-routing-team" / "SKILL.md").read_text(encoding="utf-8")

base_version = manifest["version"].partition("+codex.")[0]
assert manifest["name"] == "codex-routing-matrix"
assert base_version == policy["policyVersion"] == "0.9.1"
assert policy["schemaVersion"] == 9
assert set(policy) == {
    "schemaVersion", "policyVersion", "toolNames", "workPacket",
    "capacityRecovery", "radarEvidence", "namedAgents", "retiredProfiles", "burstMode",
    "contextWindowMode", "forkTurns",
}
assert "team" not in policy and "sol" not in policy
assert "allowedFallbacks" not in json.dumps(policy)
assert "maxWorkerAttempts" not in json.dumps(policy)
assert policy["workPacket"] == {
    "hostVisibleTaskNamePattern": "^(luna_max|sol_medium|sol_high|sol_xhigh|sol_max|astra_low|sol_reviewer_xhigh)__([a-z0-9][a-z0-9_]{1,47})$",
    "hostVisibleTaskNameExample": "luna_max__unit_name",
}
assert policy["capacityRecovery"] == {
    "message": "Selected model is at capacity. Please try a different model.",
    "automaticContinuationPrompt": "继续",
}
expected_roles = {
    "luna_worker": ("gpt-6-luna", "max"),
    "sol_medium_worker": ("gpt-6.1-sol", "medium"),
    "astra_low_worker": ("gpt-6-astra", "low"),
    "sol_reviewer": ("gpt-6.1-sol", "xhigh"),
}
assert set(policy["namedAgents"]) == set(expected_roles)
assert policy["retiredProfiles"] == [{
    "agentType": "terra_worker",
    "profileFile": "terra-worker.toml",
    "templateSha256": "5f158c2e3f8a65c34165ee1f4d3ac7a580f0a5eaf78392fa6c034329521e6488",
    "previousTemplateSha256": ["57abdf330f7acca36948b25799cadc0a8e23c330f0f38f78e7dae7224f74f073"],
}]
assert not (ROOT / "templates" / "agents" / "terra-worker.toml").exists()
assert set(hooks["hooks"]) == {"SessionStart", "UserPromptSubmit", "PreToolUse", "SubagentStop"}
assert "SubagentStart" not in hooks["hooks"]

for agent_type, config in policy["namedAgents"].items():
    profile_path = ROOT / "templates" / "agents" / config["profileFile"]
    profile = tomllib.loads(profile_path.read_text(encoding="utf-8"))
    assert profile["name"] == agent_type
    assert profile["model"] == config["model"]
    assert config["model"] == expected_roles[agent_type][0]
    if agent_type == "sol_medium_worker":
        assert config["effortMode"] == "required"
        assert config["allowedEfforts"] == ["medium", "high", "xhigh", "max"]
        assert "model_reasoning_effort" not in profile
    else:
        assert config["effortMode"] == "fixed"
        assert profile["model_reasoning_effort"] == config["fixedEffort"] == expected_roles[agent_type][1]
    assert not re.search(r"gpt-5(?:\.\d+|-[a-z])[\w.-]*", profile_path.read_text(encoding="utf-8"), re.I)
    if agent_type == "sol_reviewer":
        assert profile["sandbox_mode"] == config["sandboxMode"] == "read-only"
    instructions = profile["developer_instructions"]
    if agent_type != "sol_reviewer":
        assert "delegate" in instructions
        assert "acceptance criterion" in instructions
        assert "instead of guessing" in instructions

assert "MUST choose `luna_worker`" in rule
assert "Never trial uncertain work on Luna" in rule
assert "local analysis, implementation, debugging and tests" in rule
assert "default to `high`; choose `medium` for clear, light-reasoning work or `xhigh` for complex independent work" in rule
assert "Select `astra_low_worker` only for a clear quality or total-cost benefit" in rule
assert "Use Radar once at most per root task" in rule
assert "Freeze each route" in rule
assert "Selected model is at capacity. Please try a different model." in rule
assert "Preserve the root model and reasoning effort" in rule
assert "Size concurrency to useful work, not host capacity" in rule
assert "Use one blocking wait; never poll" in rule
assert "No task-wide cumulative cap" in rule
assert "blocking completion wait" in routing
assert "Never poll `list_agents` or repeat short waits" in routing
assert "two or three" not in rule and "never exceed three" not in rule
assert "[CQO_WORK_PACKET_V1]" not in rule
assert "[CQO_WORK_PACKET_V1]" in routing
assert "fallback: current Lead; preserve completed work" in routing
assert "do not run it again" in routing
assert "sole semantic routing rule" in maintenance
for model_path in [
    ROOT / "routing-policy.json",
    ROOT / "skills" / "codex-routing-matrix" / "SKILL.md",
    ROOT / "skills" / "codex-quality-routing-team" / "SKILL.md",
]:
    assert model_path.read_bytes().isascii(), f"model-facing file is not ASCII: {model_path}"
for text in [rule, maintenance, routing, json.dumps(policy["namedAgents"])]:
    assert not re.search(r"gpt-5(?:\.\d+|-[a-z])[\w.-]*|terra_worker", text, re.I)
for removed in [
    ROOT / "hooks" / "routing-ledger.cjs",
    ROOT / "hooks" / "release-failed-dispatch.cjs",
    ROOT / "hooks" / "track-subagent-start.cjs",
    ROOT / "tests" / "routing-ledger.test.cjs",
]:
    assert not removed.exists(), removed
assert (ROOT / "scripts" / "radar-routing-evidence.cjs").is_file()
assert not (ROOT / "hooks" / "radar-routing-evidence.cjs").exists()

for path in ROOT.rglob("*"):
    if path.is_file() and path.suffix.lower() in {".md", ".json", ".toml", ".cjs", ".ps1"}:
        assert "[TODO:" not in path.read_text(encoding="utf-8"), path

assert policy["burstMode"]["maxChildThreads"] == 25
assert policy["burstMode"]["depths"] == [1, 2, 3, 4]
assert policy["burstMode"]["enabledByExactCommandEnglish"] == "enable super mode"
assert policy["burstMode"]["disabledByExactCommandEnglish"] == "disable super mode"
assert policy["contextWindowMode"] == {
    "enabledByExactCommand": "开启1M上下文",
    "disabledByExactCommand": "关闭1M上下文",
    "enabledByExactCommandEnglish": "enable 1M context",
    "disabledByExactCommandEnglish": "disable 1M context",
    "modelContextWindow": 1000000,
    "autoCompactTokenLimit": 900000,
}
print("PASS minimal policy, burst contract, and concise agent contracts")
