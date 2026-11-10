---
type: llm
focus: trace
---

PASS if all of these hold:
- It writes exactly one set-level intent.md and one set-level design.md in a parent folder, and no intent.md or design.md inside the per-workflow folders.
- intent.md is written before design.md: the problem (Goal, Outcome, the workflows with their triggers, Done when) comes first.
- The set-level design.md has one Data table with, per shared table: store, written by, read by, key, append-only; and one section per workflow (steps, its own tables) inside the same file.
- It checks the links: every table read has a writer, same key and store, and the writer stores what the reader needs (for example the post text, not only an id).
- It says workflows write the cubby and don't write the memory bank, and that a workflow using `recall` won't see another workflow's cubby rows until a curator proposes them and a person accepts; the content workflow should read briefs from the cubby.
- The weekly analytics keeps history (append-only) and a rerun of the same week doesn't add a second copy (an idempotency key such as the week plus the post id).
- Nothing is stubbed as `TBD`; unknowns are left out or listed under one `Open questions` heading.
FAIL if it creates per-workflow intent.md/design.md copies, writes TBD stub sections, or has content read briefs via the memory bank without noting the acceptance gap.
