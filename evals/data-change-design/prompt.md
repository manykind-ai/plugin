---
name: data-change-design
description: A change to stored data updates design.md, not intent.md.
tags: [design]
max_turns: 20
allowed_tools: [Read, Write, Edit, Glob, Grep, Skill]
---

In our ticket triage workflow we want to keep the classifier's reason for
every label, and keep every past label when a ticket is re-classified, so we
can audit it later. Migrations `001-init.sql` and `002-add-run-id.sql` have
shipped. The code isn't checked out here; this is our design.md. Write it to
./design.md and update it.

```markdown
# Ticket triage: design

## Steps

1. trigger: new helpdesk ticket.
2. classify (model): bug / billing / other.
3. save (cubbyExec): upsert `ticket_label`.
4. label (action): set the label in the helpdesk.
5. result (output): `{ label }`.

## Data

| Table / destination | Where | Key | Columns that matter | Append-only? |
|---|---|---|---|---|
| `ticket_label` | workflow cubby | `ticket_id` | `label`, `run_id` | No, upsert |

## Parameters

None.

## Composes with

- Reads: none
- Read by: the weekly support report, by `ticket_id`
```
