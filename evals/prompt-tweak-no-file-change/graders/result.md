---
type: llm
focus: trace
---

PASS if all of these hold:
- It edits the screener's instructions (./screener-prompt.md) to be stricter about seniority.
- It says, or clearly acts on, that neither intent.md nor design.md changes for a prompt tweak.
- It suggests checking the change with the workflow's dataset or a run before shipping.
FAIL if it rewrites intent.md or design.md, or adds a new step or parameter for this.
