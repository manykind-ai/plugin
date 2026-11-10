---
type: llm
focus: trace
---

PASS if all of these hold:
- intent.md describes what the workflow does today (screening leads per campaign, pushing passing leads to outreach), with a Trigger (a `workflow.start` per batch) and checkable Done when items; open questions are listed under one `Open questions` heading (or left out) rather than invented or stubbed as TBD.
- design.md lists the steps in order with their kinds (code, cubbyQuery, agent, cubbyExec, action, output) and the gated push branch.
- The Data section names `campaign_setup` (read) and `lead_verdict` keyed by campaign and lead, and notes that the verdict row is upserted (not append-only).
- Parameters say where values live: the pass mark and profile per campaign in `campaign_setup`; it does not invent workflow-level parameters, and it does not claim the SDK can declare them.
- The hard-coded connection id is noted as an open point, not presented as a configurable parameter.
FAIL if it describes steps or tables that are not in the code, or rewrites the workflow instead of documenting it.
