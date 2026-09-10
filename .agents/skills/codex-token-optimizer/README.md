# Codex Token Optimizer

A lightweight Codex Skill for reducing token waste during software development.

It does not make Codex “do less work.” It helps Codex **avoid irrelevant context, noisy commands, and verbose explanations so the token budget is spent on reasoning, implementation, and verification that actually matter**.

## When To Use It

Use this Skill when:

- Codex token / usage consumption feels too high
- a development task is becoming long and polluted with old logs, failed attempts, or stale assumptions
- Codex keeps reading unrelated files or searching too broadly
- terminal output is noisy, such as full `git diff`, `git log`, `npm install`, build logs, or test logs
- many MCP servers, connectors, plugins, or tools are enabled and tool definitions may be bloating context
- you want Codex to plan first, then implement, then verify
- you need a handoff summary before compacting, clearing, or starting a new thread
- you want recurring workflow preferences captured in `AGENTS.md` or a reusable Skill

## How To Trigger It

After installation, trigger it with prompts like:

```text
Use codex-token-optimizer to reduce token waste for this development task.
```

```text
This task may get long. Plan it in a token-efficient way before editing.
```

```text
Keep context tight: avoid unrelated files and long terminal logs.
```

```text
This thread is getting long. Create a handoff summary and continue with minimal context.
```

You can also start a task with:

```text
Before coding, run a token-efficient preflight: confirm the goal, minimal files, minimal commands, and verification path.
```

## What It Helps Achieve

The Skill guides Codex through a source-level token-saving workflow:

1. **Reduce task scope**: define the goal, boundary, and acceptance criteria before exploration.
2. **Control context**: use fresh threads, compacting, or handoffs to avoid stale assumptions.
3. **Reduce tool noise**: expose only the MCP servers, connectors, and tools needed for the current task.
4. **Read files precisely**: prefer `rg`, exact paths, line ranges, and targeted inspection over broad repo reads.
5. **Compress terminal output**: prefer `git diff --stat`, failure summaries, tail logs, and filtered errors over full logs.
6. **Reduce response verbosity**: default to engineering facts, changed files, commands, and verification results.
7. **Keep reliability**: do not skip tests, validation, or high-risk analysis just to save tokens.

In short: **it moves Codex from “wander and infer” to “scope, inspect, execute, verify.”**

## Demo

### Scenario

You want Codex to fix a login page bug, but you do not want it to read the whole repository or flood the context with test logs.

### User Prompt

```text
Use codex-token-optimizer.

Goal: Fix the issue where the login page loading state does not reset after submit.

Requirements:
- Do not edit code yet
- Find the most likely relevant files first
- Read only necessary files
- Keep command output under 80 lines
- Give me a minimal edit plan and verification commands
```

### Expected Codex Behavior

```text
1. Search for login / submit / loading / isLoading with rg
2. Return 2-5 likely relevant files
3. Read only relevant snippets from those files
4. Propose a minimal edit plan
5. Edit only after enough context is available
6. Run targeted tests
7. If tests fail, return only the failure summary and key error lines
```

### Token-Efficient Commands

```bash
rg -n "login|submit|loading|isLoading" src
git diff --stat
npm test -- --runInBand 2>&1 | tail -n 80
```

### Handoff Example

When the task is done or the thread becomes long:

```text
Use codex-token-optimizer to create a handoff with goal, relevant files, changed files, commands, test results, risks, and the exact next task.
```

Expected output:

```markdown
# Handoff

Goal: Fix login submit loading state not resetting.
Current state: Root cause found in login submit error branch.
Relevant files:
- src/pages/Login.tsx
- src/hooks/useLogin.ts
Files changed:
- src/hooks/useLogin.ts
Commands run:
- rg -n "loading|isLoading|submit" src
- npm test -- Login
Tests passed:
- Login.test.tsx
Known risks:
- OAuth login path not covered by this test.
Exact next task:
- Add one regression test for OAuth error path.
```

## Installation

Clone this repository into your Codex skills directory:

```bash
mkdir -p ~/.codex/skills
git clone https://github.com/zhangyiling108-code/codex-token-optimizer.git ~/.codex/skills/codex-token-optimizer
```

Restart or refresh Codex, then use the trigger prompts above.

## Repository Structure

```text
codex-token-optimizer/
├── SKILL.md
├── README.md
├── README.en.md
└── agents/
    └── openai.yaml
```

## Note

Saving tokens does not mean skipping verification.

This Skill is designed to reduce irrelevant context and noisy output, not to make Codex guess without evidence. For architecture, migrations, security work, or complex debugging, use stronger reasoning and deeper verification.
