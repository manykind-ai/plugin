---
type: llm
focus: trace
---

PASS if all of these hold:
- design.md's Data section gains a reason column and an append-only history (a new table or an append-only design) keyed by `ticket_id`, with `run_id`, version and a timestamp.
- It names a new migration numbered after the shipped ones (003-…) and says shipped migrations are not edited.
FAIL if it edits 001 or 002, changes intent.md's Goal/Outcome, or keeps only an overwritten row with no history.
