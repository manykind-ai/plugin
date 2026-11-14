---
name: examples-near-miss
description: Testing a workflow on intent.md's examples loads evaluate and seeds a dataset.
tags: [evaluate, triggers]
max_turns: 20
allowed_tools: [Read, Write, Edit, Glob, Grep, Skill]
---

Test our ticket-triage workflow on the examples in its intent.md before we
release it. The workflow code isn't checked out here and you can't run
commands in this session: prepare what you can and tell me what you will run.
Write this to ./intent.md first if it isn't there:

```markdown
# Ticket triage

## Goal

Route each support ticket to the team that handles it.

## Outcome

Each ticket is labelled bug, billing or other.

## Trigger

A new ticket in the helpdesk.

## Done when

- Every new ticket has exactly one label within 5 minutes.

## Examples

| Input | Expected outcome |
|---|---|
| "The export button throws an error" | bug |
| "Please resend last month's invoice" | billing |
| "Do you have a office in Berlin?" | other |
```
