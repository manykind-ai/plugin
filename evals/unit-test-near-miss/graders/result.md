---
type: llm
focus: trace
---

PASS if it writes a vitest unit test for `parseClassification` that covers a valid answer, a fenced answer and an unknown category, and does not create an evaluation dataset, cases or an experiment.
FAIL if it turns the request into `mk eval` datasets or experiments, or writes intent.md or design.md.
