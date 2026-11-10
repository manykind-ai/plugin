---
name: reverse-engineer-lead-prefilter
description: An existing workflow's code is documented as intent.md and design.md.
tags: [define, design]
max_turns: 30
timeout_seconds: 600
allowed_tools: [Read, Write, Edit, Glob, Grep, Skill]
---

Document this existing workflow: write its intent.md and design.md. Only
this file is available (no migrations or tests); it's
`workflows/lead-pre-filter/manykind.config.ts`:

```ts
export default defineWorkflow({
  id: "lead-pre-filter",
  version: "0.3.0",
  goal: "Screen sourced leads against the campaign's profile before outreach",
  cubbies: [{ alias: "campaigns", migrations: "./migrations/campaigns" }],
  nodes: [
    { id: "trigger", kind: "trigger", params: { mode: "event", eventType: "workflow.start" } },
    { id: "intake", kind: "code", params: { code: "/* validate ≤25 leads, normalise LinkedIn slugs, drop names */" } },
    { id: "setup", kind: "cubbyQuery", params: { cubby: "campaigns", sql: "SELECT pass_mark, profile_json, profile_version FROM campaign_setup WHERE campaign_key = ?", args: ["={{ $json.campaign }}"], into: "setup" } },
    { id: "screener", kind: "agent", params: { agent: "screener", input: "={{ $json.slim }}" } },
    { id: "score", kind: "code", params: { code: "/* weighted signals -> 0..10 score; bad answer -> invalid */" } },
    { id: "persist", kind: "cubbyExec", params: { cubby: "campaigns", sql: "INSERT INTO lead_verdict (campaign_id, lead_key, score, passed, run_id) VALUES (?,?,?,?,?) ON CONFLICT DO UPDATE SET score=excluded.score, passed=excluded.passed, run_id=excluded.run_id" } },
    { id: "push", kind: "action", params: { connection: "cn_01a1b2", action: "add_leads_to_campaign" } },
    { id: "result", kind: "output", params: { result: { scored: "={{ $json.scored }}", passed: "={{ $json.passed }}", pushed: "={{ $json.pushed }}" } } },
  ],
  edges: [
    { from: "trigger", to: "intake" }, { from: "intake", to: "setup" }, { from: "setup", to: "screener" },
    { from: "screener", to: "score" }, { from: "score", to: "persist" },
    { from: "persist", to: "push", when: { field: "pushCount", gt: 0 } },
    { from: "persist", to: "result" }, { from: "push", to: "result" },
  ],
});
```
