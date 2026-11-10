---
type: llm
focus: trace
---

PASS if all of these hold:
- It turns each example into a case file under `datasets/<dataset>/cases/<caseId>.json` with `input` (the trigger payload) and `expected` keyed by Result field (`label`).
- It describes pushing the dataset and running an experiment with `mk eval push` / `mk eval run`, and asks before those outward-facing steps.
- It mentions comparing against a baseline, or `--workflow-version` for a version that isn't live.
FAIL if it uses `mk eval migrate`, `--access-key`/`--secret` S3 credentials, or `--version` for the workflow version.
