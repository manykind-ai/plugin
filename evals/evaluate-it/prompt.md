---
name: evaluate-it
description: Evaluating a workflow turns intent.md Examples into a dataset.
tags: [evaluate]
max_turns: 20
allowed_tools: [Read, Write, Edit, Glob, Grep, Skill]
---

Evaluate it. Our ticket triage workflow's intent.md has these examples:

| Input | Expected outcome |
|---|---|
| "I was charged twice" | label: billing |
| "The export button crashes the app" | label: bug |
| "Do you have an office in Berlin?" | label: other |

The workflow's Result has a `label` field and its trigger payload is
`{ "text": "…" }`. The repo isn't here and I'll run the CLI myself: write
the dataset files and tell me the commands.
