# Focused Codex workflow

Use the smallest reliable scope. For a local change, start with the named file
and its direct references; expand only when concrete evidence requires it. Do
not survey the repository, architecture, or unrelated files by default.

- Locate code with a targeted `rg` search or a known path. Read only relevant
  ranges of large files; avoid generated files, lockfiles, build output, and
  full JSON or log dumps unless necessary.
- Reuse file content and verified facts already present in the conversation.
  Do not reread unchanged files or repeat an already unsuccessful broad search.
- Keep terminal output compact: prefer `rg -n`, `git diff --stat`,
  `git diff -- <paths>`, and filtered error lines or a short log tail. Do not
  use verbose modes or dump full diffs, logs, or test output without need.
- Make only task-related changes. Avoid precautionary edits and unrelated
  refactors.
- Validate incrementally: run the smallest relevant check first, and widen
  testing only when the change, risk, or a failure justifies it. Do not start a
  full test suite for a trivial, localized edit.
- Use MCP servers only when their current task-specific capability is needed;
  they are disabled by default in `.codex/config.toml`. Use subagents only for
  independent, bounded work where their extra context cost is justified.
- Stop once the request is implemented and proportionately validated. Report
  changed files and validation concisely; do not add exploratory analysis or
  large logs unless requested.

For complex, cross-cutting, migration, security, or unclear debugging work,
increase investigation and validation deliberately rather than guessing.
