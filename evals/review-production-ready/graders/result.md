---
type: llm
focus: trace
---

PASS if all of these hold:
- The answer is a ranked findings list, most severe first. Each finding names a file and line (`file:line`), what breaks, how it was checked (executed, for example SQL replayed or a command run, versus read-only), and the fix.
- It finds that a rerun of the same week inserts a second `weekly_digest` row (no unique key on `week_start`) and proposes an idempotency key (a unique constraint plus `ON CONFLICT`, in a new migration rather than editing 001).
- It finds that `ticket_label` lives in the triage workflow's `triage` cubby, not in `reports`, so the query reads the wrong store (needs a workspace table or a shared store).
- It notes that the `recall` step only sees accepted memory-bank records, not the triage workflow's cubby rows.
- Claims about expression support (`JSON.stringify` inside `={{ }}`, `$json.weekStart` on a schedule trigger) are either checked against `mk schema` / docs / SDK types or marked as unverified, not asserted from memory.
FAIL if it writes or edits an `intent.md` or `design.md`, or answers with documentation instead of findings.
