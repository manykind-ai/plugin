---
name: goal-change-define
description: A change to what a workflow is for updates intent.md in place.
tags: [define]
max_turns: 20
allowed_tools: [Read, Write, Edit, Glob, Grep, Skill]
---

Our ticket triage workflow has this intent.md (write it to ./intent.md first if
it isn't there):

```markdown
# Ticket triage

## Goal

Sort incoming support tickets so the right team picks each one up.

## Outcome

Each ticket is labelled bug, billing or other in the helpdesk.

## Trigger

A new ticket in the helpdesk. Tickets from internal staff are ignored.

## Done when

- Every new ticket has exactly one label within 5 minutes.

## Examples

| Input | Expected outcome |
|---|---|
| "I was charged twice" | billing |

## Notes

Ask Dana before changing labels.
```

We've changed our minds: refund requests should now go straight to finance
with a Slack message to #finance, not just get the billing label. Update
whatever needs updating.
