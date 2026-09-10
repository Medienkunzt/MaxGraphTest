---
name: codex-token-optimizer
description: Reduce token waste during Codex software development work. Use when the user asks to save/reduce/optimize Codex token usage, lower AI coding costs, manage context, compact/clear long sessions, avoid noisy terminal output, tune MCP/tool usage, create handoff summaries, or make an implementation workflow more token-efficient without sacrificing correctness.
---

# Codex Token Optimizer

Use this skill as a preflight and operating checklist for coding tasks where token budget, context quality, or long-session drift matters.

## Core Principle

Minimize tokens in this order:

1. Scope: make the task smaller before coding.
2. Context: keep only current, relevant facts.
3. Tools: expose only tools needed now.
4. I/O: read targeted files and cap noisy command output.
5. Replies: be concise unless explanation is the deliverable.

Do not save tokens by skipping verification or guessing about code.

## Preflight

Before reading many files or editing:

- Restate the exact outcome in one sentence.
- Identify whether the task is `planning`, `implementation`, `debugging`, `review`, or `research`.
- If the task is broad or ambiguous, ask for the smallest useful slice or propose one.
- Prefer a short plan before tool-heavy work.
- If repo state is unknown, inspect with targeted commands first.
- If the input material is large, preprocess it outside the coding loop into a brief, outline, or execution prompt before asking Codex to implement.

Useful opening prompt:

```text
Inspect the repo. Do not edit files yet. Identify the minimal files, commands, and verification path needed for this task.
```

## File Reading

- Use `rg` or `rg --files` before opening files.
- Open exact files when paths are known.
- Avoid reading generated assets, lockfiles, build outputs, huge logs, and unrelated docs unless required.
- For large files, read narrow line ranges around matches.
- For messy document/project folders, create an index first: file map, important-file summaries, timestamps, and retrieval rules. Do not read every file body up front.
- If the same local pattern will recur, write it into `AGENTS.md` or a skill instead of re-explaining it in chat.

## Terminal Output

Treat terminal output as context that will be paid for repeatedly.

Prefer:

```bash
git diff --stat
git diff --name-only
git diff -- path/to/file
rg -n "pattern" path
command | tail -n 80
command 2>&1 | rg -n "error|failed|warning"
```

Avoid dumping:

- full `git diff` for large changes
- full `git log`
- full `npm install` / build logs
- entire test suites when only failures matter
- long JSON blobs without filtering

When output is needed, request or produce a short summary plus the exact failing lines.

## Tool And MCP Surface

- Disable unrelated connectors/MCP servers for focused work when the environment allows it.
- Prefer tool search or dynamic discovery over loading every tool definition.
- Use scoped tool groups when a server exposes many tools.
- Do not install or enable broad tools just because they might be useful.
- Use subagents only for isolated research, independent review, or bounded exploration; they add their own context cost.

## Context Hygiene

Use a fresh thread or compact/handoff when:

- switching to a new unrelated task
- the thread contains failed theories or contradictory corrections
- the agent has missed the same issue two or three times
- the conversation is dominated by old logs, broad exploration, or stale plans

Prefer one task per conversation. At task completion, create a handoff summary, then start the next task with only the relevant carryover facts.

Handoff summary template:

```markdown
# Handoff

Goal:
Current state:
Relevant files:
Decisions made:
Files changed:
Commands run:
Tests passed:
Tests failed:
Known risks:
Exact next task:
```

## Reasoning And Model Effort

- Use higher reasoning for architecture, migrations, security, unclear bugs, and multi-step debugging.
- Use lower effort for mechanical edits, formatting, known-file changes, and repeatable maintenance.
- Ask Codex to recommend mode/tools/checkpoints before expensive multi-file work.
- The cheapest path is the cheapest reliable path, not the smallest immediate model call.

## Response Style

Default to concise engineering output:

- State what changed.
- Mention only important files and verification.
- Avoid explaining obvious code.
- Do not paste large logs or generated content unless requested.

Use fuller explanations only for teaching, analysis, design tradeoffs, or high-risk decisions.

## Token Tracking

When a project repeatedly burns budget, add measurement:

- Record which commands, files, prompts, or tools produced the largest outputs.
- Compare before/after when adding `AGENTS.md` rules, output filters, or workflow changes.
- Optimize the largest recurring waste first, not the most visible annoyance.

## Stop Conditions

Stop and re-scope instead of continuing when:

- file searches keep expanding without finding the target
- command output is mostly noise
- the task has drifted from the original goal
- two attempts fail for the same reason
- the needed context is missing and cannot be discovered locally

At that point, summarize the useful facts and propose the next smallest action.
