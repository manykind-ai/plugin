---
type: llm
focus: trace
---

PASS if all of these hold:
- It proposes a new, separate workflow (a consumer) with its own intent.md and a schedule trigger, rather than adding a daily step to the per-batch workflow.
- The new workflow reads the verdict rows already stored, by campaign key, instead of being called per item.
- The existing workflow's design.md only gains a "Read by" line (plus any data the summary needs that isn't stored yet).
- If the reader lives in another agent service, it notes the rows need a workspace table; if not, it reads the cubby. It does not route the data through the memory bank.
FAIL if it bolts a daily schedule onto the per-batch workflow, or chains workflows per lead.
